import {
  DataLakeServiceClient,
  DirectorySASPermissions,
  StorageSharedKeyCredential,
  generateDataLakeSASQueryParameters,
} from "@azure/storage-file-datalake";

// Layout of the study account (see dev/storage-rework.md). Folders are keyed by
// `canonicalId`, which is shared by every version of a dataset. Only the frozen
// data folder and the manifest are keyed by the version's `datasetId`.

// Every dataset lives in this one container. It is created once during storage setup
export const STUDY_FILE_SYSTEM = "datasets";

export const studyPaths = {
  // Live draft uploads. The only path owners can access
  draftData: (canonicalId: string) => `${canonicalId}/data`,
  // Data for a version being published or last published
  frozenData: (canonicalId: string, datasetId: string) =>
    `${canonicalId}/data-${datasetId}`,
  documents: (canonicalId: string) => `${canonicalId}/documents`,
  manifest: (canonicalId: string, datasetId: string) =>
    `${canonicalId}/manifests/${datasetId}.json`,
};

const DATASET_SUBFOLDERS = [
  "data",
  "documents",
  "manifests",
  "previews",
  "exports",
];

// Owner upload links are valid for 8 hours. Publishing cuts them off by
// renaming `data/`, so this doesn't need to be short
const OWNER_SAS_LIFETIME_HOURS = 8;

const getStudyFileSystemClient = () => {
  const { AZURE_DRAFT_CONNECTION_STRING } = useRuntimeConfig();

  return DataLakeServiceClient.fromConnectionString(
    AZURE_DRAFT_CONNECTION_STRING,
  ).getFileSystemClient(STUDY_FILE_SYSTEM);
};

// Create `{canonicalId}/` and its subfolders when a dataset is created
export async function createStudyDatasetFolders(canonicalId: string) {
  const fileSystemClient = getStudyFileSystemClient();

  // createIfNotExists creates the intermediate `{canonicalId}/` folder as well
  for (const folder of DATASET_SUBFOLDERS) {
    await fileSystemClient
      .getDirectoryClient(`${canonicalId}/${folder}`)
      .createIfNotExists();
  }
}

/**
 * The only function that issues study account SAS tokens. The scope is
 * hardcoded to `{canonicalId}/data`: a token one level higher would let owners
 * modify manifests, documents, previews, and frozen `data-{datasetId}/` folders.
 */
export async function getOwnerUploadSasUrl(canonicalId: string) {
  const { AZURE_DRAFT_ACCOUNT_KEY } = useRuntimeConfig();

  const fileSystemClient = getStudyFileSystemClient();
  const { accountName } = fileSystemClient;
  const pathName = studyPaths.draftData(canonicalId);

  // The owner can delete `data/` itself through Storage Explorer
  await fileSystemClient.getDirectoryClient(pathName).createIfNotExists();

  const now = new Date();
  const expiresOn = new Date(now);

  expiresOn.setHours(now.getHours() + OWNER_SAS_LIFETIME_HOURS);

  const directorySAS = generateDataLakeSASQueryParameters(
    {
      expiresOn,
      fileSystemName: STUDY_FILE_SYSTEM,
      isDirectory: true,
      pathName,
      permissions: DirectorySASPermissions.parse("racwdl"), // read, add, create, write, delete, list
      startsOn: now,
    },
    new StorageSharedKeyCredential(accountName, AZURE_DRAFT_ACCOUNT_KEY),
  ).toString();

  return {
    expiresOn,
    sasUrl: `https://${accountName}.dfs.core.windows.net/${STUDY_FILE_SYSTEM}/${pathName}?${directorySAS}`,
  };
}

/**
 * Rename `data/` to `data-{datasetId}/` when publishing. A directory SAS is bound
 * to the path, so this cuts off every outstanding owner SAS immediately.
 */
export async function freezeDraftData(canonicalId: string, datasetId: string) {
  const fileSystemClient = getStudyFileSystemClient();
  const frozenPath = studyPaths.frozenData(canonicalId, datasetId);

  try {
    await fileSystemClient
      .getDirectoryClient(studyPaths.draftData(canonicalId))
      .move(frozenPath, { destinationConditions: { ifNoneMatch: "*" } });
  } catch (error: any) {
    if (error.statusCode !== 404) throw error;

    // The owner deleted `data/`, so the version has no files
    await fileSystemClient.getDirectoryClient(frozenPath).createIfNotExists();
  }
}

/**
 * Rename `data-{datasetId}/` back to `data/`, either to start a new version
 * from it or to undo an abandoned publish.
 */
export async function unfreezeData(canonicalId: string, datasetId: string) {
  const fileSystemClient = getStudyFileSystemClient();
  const draftDirectoryClient = fileSystemClient.getDirectoryClient(
    studyPaths.draftData(canonicalId),
  );

  // An unexpired owner SAS can recreate `data/` after the publish rename.
  // Nothing in it was published, and the rename fails if the target exists
  await draftDirectoryClient.deleteIfExists(true);

  try {
    await fileSystemClient
      .getDirectoryClient(studyPaths.frozenData(canonicalId, datasetId))
      .move(studyPaths.draftData(canonicalId), {
        destinationConditions: { ifNoneMatch: "*" },
      });
  } catch (error: any) {
    if (error.statusCode !== 404) throw error;

    // No frozen folder (published before the storage rework), so start empty
    console.warn(
      `No frozen data folder for ${datasetId}, starting ${canonicalId} with an empty data folder`,
    );
    await draftDirectoryClient.createIfNotExists();
  }
}

// Files under a study folder relative to it, or null if the folder doesn't exist
const listStudyFiles = async (folderPath: string) => {
  const files: { path: string; size: number }[] = [];

  try {
    for await (const path of getStudyFileSystemClient().listPaths({
      path: folderPath,
      recursive: true,
    })) {
      if (path.isDirectory || !path.name) continue;

      files.push({
        path: path.name.slice(folderPath.length + 1),
        size: path.contentLength ?? 0,
      });
    }
  } catch (error: any) {
    if (error.statusCode === 404) return null;
    throw error;
  }

  return files;
};

/**
 * The data files of one version, relative to its data folder. A draft reads
 * `data/` and a locked version reads `data-{datasetId}/`. Once a newer version
 * has taken over the frozen folder, the files are read from the published container.
 */
export async function listDatasetDataFiles(dataset: {
  canonicalId: string;
  id: string;
  lockedAt: Date | null;
}) {
  if (!dataset.lockedAt) {
    return (
      (await listStudyFiles(studyPaths.draftData(dataset.canonicalId))) ?? []
    );
  }

  const frozenFiles = await listStudyFiles(
    studyPaths.frozenData(dataset.canonicalId, dataset.id),
  );

  return frozenFiles ?? (await listPublishedDataFiles(dataset.id));
}
