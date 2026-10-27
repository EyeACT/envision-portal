import "dotenv/config";
import { BlobServiceClient, type ContainerClient } from "@azure/storage-blob";
import {
  DataLakeServiceClient,
  DirectorySASPermissions,
  StorageSharedKeyCredential,
  generateDataLakeSASQueryParameters,
} from "@azure/storage-file-datalake";
import { PrismaPg } from "@prisma/adapter-pg";
import PublishingStatus from "../app/assets/data/publishing-status.json";
import { getFileIcon } from "../server/utils/getFileIcon";
import { STUDY_FILE_SYSTEM, studyPaths } from "../server/utils/studyStorage";
import { PrismaClient, type Task } from "../shared/generated/client";
import type {
  PublishDatasetPayload,
  PublishManifest,
} from "../shared/types/tasks";

// Runs every due task in the Task table, then exits.

const {
  AZURE_DRAFT_ACCOUNT_KEY,
  AZURE_DRAFT_CONNECTION_STRING,
  AZURE_PUBLISHED_CONNECTION_STRING,
  DATABASE_URL,
} = process.env;

if (
  !DATABASE_URL ||
  !AZURE_DRAFT_ACCOUNT_KEY ||
  !AZURE_DRAFT_CONNECTION_STRING ||
  !AZURE_PUBLISHED_CONNECTION_STRING
) {
  console.error(
    "DATABASE_URL, AZURE_DRAFT_ACCOUNT_KEY, AZURE_DRAFT_CONNECTION_STRING and AZURE_PUBLISHED_CONNECTION_STRING must be set",
  );
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// The source SAS is backend-only and read-only on one folder of one dataset.
// It is refreshed during long copies so a copy never starts close to its expiry.
const SOURCE_SAS_LIFETIME_HOURS = 24;
const SOURCE_SAS_REFRESH_HOURS = 12;

// Number of server-side copies (and legal hold requests) in flight at once
const COPY_CONCURRENCY = 8;

// beginCopyFromURL polls every 15s (slow for small files)
const COPY_POLL_INTERVAL_MS = 1000;

const getPublishingStatusIndex = (status: keyof typeof PublishingStatus) =>
  PublishingStatus[status].index;

const updatePublishingStatus = (
  datasetId: string,
  data: {
    comment?: string;
    currentFileNumber?: number;
    fileCount?: number;
    status?: number;
  },
) =>
  prisma.datasetPublishingStatus.update({
    data,
    where: {
      datasetId,
    },
  });

const convertPathsToTree = (paths: string[]) => {
  const tree: any[] = [];

  // Sort paths to ensure directories come before their files
  const sortedPaths = [...paths].sort((a, b) => {
    const aDepth = (a.match(/\//g) || []).length;
    const bDepth = (b.match(/\//g) || []).length;

    if (aDepth !== bDepth) return aDepth - bDepth;

    return a.localeCompare(b);
  });

  for (const path of sortedPaths) {
    const pathParts = path.split("/");
    let currentLevel = tree;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]!;
      const isDirectory = i < pathParts.length - 1;

      // Check if this level already exists
      let existingNode = currentLevel.find((node) => node.label === part);

      if (!existingNode) {
        existingNode = {
          children: isDirectory ? [] : undefined,
          icon: isDirectory ? "i-heroicons-folder" : getFileIcon(part),
          label: part,
        };

        // Add defaultExpanded for root level directories
        if (i === 0 && isDirectory) {
          existingNode.defaultExpanded = false;
        }

        currentLevel.push(existingNode);
      }

      // Move to next level if it's a directory
      if (isDirectory) {
        currentLevel = existingNode.children;
      }
    }
  }

  return tree;
};

interface SourceFile {
  // Path in the published container, e.g. `data/a/b.csv`
  destinationPath: string;
  md5?: string;
  size: number;
  // Folder the file is copied from, e.g. `{canonicalId}/data-{datasetId}`
  sourceFolder: string;
  sourcePath: string;
}

const draftContainerClient = BlobServiceClient.fromConnectionString(
  AZURE_DRAFT_CONNECTION_STRING,
).getContainerClient(STUDY_FILE_SYSTEM);

/**
 * Every file under a study account folder, mapped into `destinationFolder` of the
 * published container. Uses the blob API since the Data Lake API has no Content-MD5.
 */
const listSourceFiles = async (
  datasetId: string,
  sourceFolder: string,
  destinationFolder: string,
) => {
  const files: SourceFile[] = [];

  for await (const blob of draftContainerClient.listBlobsFlat({
    includeMetadata: true,
    prefix: `${sourceFolder}/`,
  })) {
    // HNS lists directories as empty blobs marked with hdi_isfolder
    if (blob.metadata?.hdi_isfolder === "true") continue;

    const { contentLength, contentMD5 } = blob.properties;

    files.push({
      destinationPath: `${destinationFolder}/${blob.name.slice(sourceFolder.length + 1)}`,
      md5: contentMD5 ? Buffer.from(contentMD5).toString("base64") : undefined,
      size: contentLength ?? 0,
      sourceFolder,
      sourcePath: blob.name,
    });

    if (files.length % 1000 === 0) {
      await updatePublishingStatus(datasetId, {
        comment: `Discovered ${files.length} files in ${destinationFolder}/...`,
      });
    }
  }

  return files;
};

// Read-only SAS per source folder so the published account can read the files
const createSourceSASProvider = () => {
  const credential = new StorageSharedKeyCredential(
    draftContainerClient.accountName,
    AZURE_DRAFT_ACCOUNT_KEY,
  );
  const cache = new Map<string, { refreshAt: number; sas: string }>();

  return (folderPath: string) => {
    const cached = cache.get(folderPath);

    if (cached && Date.now() < cached.refreshAt) return cached.sas;

    const startsOn = new Date();
    const expiresOn = new Date(startsOn);

    expiresOn.setHours(startsOn.getHours() + SOURCE_SAS_LIFETIME_HOURS);

    const sas = generateDataLakeSASQueryParameters(
      {
        expiresOn,
        fileSystemName: STUDY_FILE_SYSTEM,
        isDirectory: true,
        pathName: folderPath,
        permissions: DirectorySASPermissions.parse("r"),
        startsOn,
      },
      credential,
    ).toString();

    cache.set(folderPath, {
      refreshAt: startsOn.getTime() + SOURCE_SAS_REFRESH_HOURS * 60 * 60 * 1000,
      sas,
    });

    return sas;
  };
};

// Names of blobs in the published container that already have a legal hold
const listHeldBlobs = async (containerClient: ContainerClient) => {
  const held = new Set<string>();

  for await (const blob of containerClient.listBlobsFlat({
    includeLegalHold: true,
  })) {
    if (blob.properties.legalHold) held.add(blob.name);
  }

  return held;
};

/**
 * Server-side copy of the source files into the published container. File data
 * never passes through this process. Files already under a legal hold were
 * copied by an earlier attempt and can't be overwritten, so they are skipped.
 */
const copyFilesToPublished = async (
  datasetId: string,
  containerClient: ContainerClient,
  sourceFiles: SourceFile[],
  heldBlobs: Set<string>,
) => {
  const { accountName } = draftContainerClient;
  const getSourceSAS = createSourceSASProvider();

  await updatePublishingStatus(datasetId, {
    comment: `Copying ${sourceFiles.length} files`,
    currentFileNumber: 0,
    fileCount: sourceFiles.length,
    status: getPublishingStatusIndex("moving-dataset-to-published-storage"),
  });

  const copyFile = async (file: SourceFile) => {
    if (heldBlobs.has(file.destinationPath)) return;

    const encodedSourcePath = file.sourcePath
      .split("/")
      .map(encodeURIComponent)
      .join("/");
    const sourceUrl = `https://${accountName}.blob.core.windows.net/${STUDY_FILE_SYSTEM}/${encodedSourcePath}?${getSourceSAS(file.sourceFolder)}`;

    const poller = await containerClient
      .getBlobClient(file.destinationPath)
      .beginCopyFromURL(sourceUrl, { intervalInMs: COPY_POLL_INTERVAL_MS });
    const result = await poller.pollUntilDone();

    if (result.copyStatus !== "success") {
      throw new Error(
        `Failed to copy ${file.sourcePath}: ${result.copyStatus}`,
      );
    }
  };

  for (let i = 0; i < sourceFiles.length; i += COPY_CONCURRENCY) {
    const batch = sourceFiles.slice(i, i + COPY_CONCURRENCY);

    await Promise.all(batch.map(copyFile));

    await updatePublishingStatus(datasetId, {
      comment: `Copied ${batch.at(-1)!.destinationPath}`,
      currentFileNumber: i + batch.length,
    });
  }
};

// Compare `data/` and `documents/` of the published container against the manifest
const verifyAgainstManifest = async (
  containerClient: ContainerClient,
  manifest: PublishManifest,
) => {
  const published = new Map<string, { md5?: string; size: number }>();

  for await (const blob of containerClient.listBlobsFlat()) {
    if (!blob.name.startsWith("data/") && !blob.name.startsWith("documents/")) {
      continue;
    }

    const { contentLength, contentMD5 } = blob.properties;

    published.set(blob.name, {
      md5: contentMD5 ? Buffer.from(contentMD5).toString("base64") : undefined,
      size: contentLength ?? 0,
    });
  }

  const problems: string[] = [];

  for (const file of manifest.files) {
    const publishedFile = published.get(file.path);

    if (!publishedFile) {
      problems.push(`${file.path} is missing`);
    } else if (publishedFile.size !== file.size) {
      problems.push(
        `${file.path} is ${publishedFile.size} bytes, expected ${file.size}`,
      );
    } else if (file.md5 && publishedFile.md5 !== file.md5) {
      problems.push(`${file.path} has a different MD5`);
    }

    published.delete(file.path);
  }

  for (const path of published.keys()) {
    problems.push(`${path} is not in the manifest`);
  }

  if (problems.length > 0) {
    const shown = problems.slice(0, 5).join("; ");
    const more = problems.length > 5 ? ` and ${problems.length - 5} more` : "";

    throw new Error(
      `Published copy does not match the manifest: ${shown}${more}`,
    );
  }
};

/**
 * Put a legal hold on every blob in the published container so it can't be
 * modified or deleted. Needs version-level immutability on the published account.
 */
const applyImmutability = async (containerClient: ContainerClient) => {
  const pending: string[] = [];

  for await (const blob of containerClient.listBlobsFlat({
    includeLegalHold: true,
  })) {
    if (!blob.properties.legalHold) pending.push(blob.name);
  }

  for (let i = 0; i < pending.length; i += COPY_CONCURRENCY) {
    await Promise.all(
      pending
        .slice(i, i + COPY_CONCURRENCY)
        .map((name) => containerClient.getBlobClient(name).setLegalHold(true)),
    );
  }
};

/**
 * Copy a locked dataset's frozen `data-{datasetId}/` folder, its documents, and
 * its metadata into the `{datasetId}` container of the published account and
 * register the published dataset. Safe to re-run after a failure: the source
 * is frozen, copies overwrite (or are skipped once held), and the database
 * records are only written at the end.
 */
const publishDataset = async (task: Task) => {
  const { datasetId } = task;
  const { metadataFiles, publishedDataset } =
    task.payload as unknown as PublishDatasetPayload;

  const dataset = await prisma.dataset.findUnique({
    where: {
      id: datasetId,
    },
  });

  if (!dataset) {
    throw new Error(`Dataset ${datasetId} not found`);
  }

  // The lock is what guarantees no edits since the payload was generated
  if (!dataset.lockedAt) {
    throw new Error(`Dataset ${datasetId} is not locked`);
  }

  const { canonicalId } = dataset;

  // 1. Write the manifest, covering the frozen data and the documents
  await updatePublishingStatus(datasetId, {
    comment: "Listing files",
    status: getPublishingStatusIndex("indexing-dataset"),
  });

  const sourceFiles = [
    ...(await listSourceFiles(
      datasetId,
      studyPaths.frozenData(canonicalId, datasetId),
      "data",
    )),
    ...(await listSourceFiles(
      datasetId,
      studyPaths.documents(canonicalId),
      "documents",
    )),
  ];

  const manifest: PublishManifest = {
    canonicalId,
    createdAt: new Date().toISOString(),
    datasetId,
    files: sourceFiles.map(({ destinationPath, md5, size }) => ({
      md5,
      path: destinationPath,
      size,
    })),
    version: publishedDataset.versionTitle,
  };
  const manifestData = Buffer.from(JSON.stringify(manifest, null, 2));

  await draftContainerClient
    .getBlockBlobClient(studyPaths.manifest(canonicalId, datasetId))
    .upload(manifestData, manifestData.length, {
      blobHTTPHeaders: { blobContentType: "application/json" },
    });

  // 2. Create the published container, one per version
  const containerClient = BlobServiceClient.fromConnectionString(
    AZURE_PUBLISHED_CONNECTION_STRING,
  ).getContainerClient(datasetId);

  await containerClient.createIfNotExists();

  const heldBlobs = await listHeldBlobs(containerClient);

  // 3. Copy `data-{datasetId}/` into `data/` and `documents/` into `documents/`
  await copyFilesToPublished(
    datasetId,
    containerClient,
    sourceFiles,
    heldBlobs,
  );

  // 4. Upload the metadata files generated when the dataset was locked, and the manifest
  await updatePublishingStatus(datasetId, {
    comment: "",
    status: getPublishingStatusIndex("generating-uploading-metadata-files"),
  });

  const rootFiles: Record<string, Buffer> = {
    ...Object.fromEntries(
      Object.entries(metadataFiles).map(([name, content]) => [
        name,
        Buffer.from(content),
      ]),
    ),
    "manifest.json": manifestData,
  };

  for (const [name, data] of Object.entries(rootFiles)) {
    if (heldBlobs.has(name)) continue;

    await updatePublishingStatus(datasetId, {
      comment: `Uploading ${name}`,
    });

    await containerClient.getBlockBlobClient(name).upload(data, data.length);
  }

  // 5. Verify the copy against the manifest
  await updatePublishingStatus(datasetId, {
    comment: "Verifying the published files",
  });

  await verifyAgainstManifest(containerClient, manifest);

  // 6. Apply the immutability policy
  await updatePublishingStatus(datasetId, {
    comment: "Locking the published files",
  });

  await applyImmutability(containerClient);

  // 7. Register the published dataset
  await updatePublishingStatus(datasetId, {
    comment: "",
    status: getPublishingStatusIndex("registering-doi"),
  });

  const dataFiles = sourceFiles.filter(({ destinationPath }) =>
    destinationPath.startsWith("data/"),
  );

  const fileTree = convertPathsToTree([
    ...sourceFiles.map(({ destinationPath }) => destinationPath),
    ...Object.keys(rootFiles),
  ]);

  await updatePublishingStatus(datasetId, {
    status: getPublishingStatusIndex("registering-dataset"),
  });

  await prisma.$transaction(async (tx) => {
    const created = await tx.publishedDataset.create({
      data: {
        ...publishedDataset,
        containerId: datasetId,
        data: {
          size: dataFiles.reduce((total, { size }) => total + size, 0),
          fileCount: dataFiles.length,
          viewCount: 0,
          labelingMethod: "",
          validationInfo: "",
        },
        datasetId,
        external: false,
        externalUrl: null,
        files: JSON.stringify(fileTree),
        public: true,
        status: "ready",
      },
    });

    // TODO: Replace DOI prefix with real registered prefix
    const doi = `10.1000/envision.${created.id}`;

    await tx.publishedDataset.update({
      data: {
        doi,
      },
      where: {
        id: created.id,
      },
    });

    // The dataset stays locked: published versions are not edited.
    // `data-{datasetId}/` stays in the study account for the next version
    await tx.dataset.update({
      data: {
        doi,
        publishedId: created.id,
        status: "published",
      },
      where: {
        id: datasetId,
      },
    });

    await tx.datasetPublishingStatus.update({
      data: {
        comment: "Publishing workflow completed",
        currentFileNumber: 0,
        fileCount: 0,
        status: getPublishingStatusIndex("completed"),
      },
      where: {
        datasetId,
      },
    });
  });
};

const TASK_HANDLERS: Record<string, (task: Task) => Promise<void>> = {
  "publish-dataset": publishDataset,
};

// Claims the oldest due task, or returns null when none are due
const claimNextTask = async (): Promise<Task | null> => {
  const next = await prisma.task.findFirst({
    orderBy: {
      runAfter: "asc",
    },
    where: {
      runAfter: {
        lte: new Date(),
      },
      status: "pending",
    },
  });

  if (!next) return null;

  // Only claim it if another runner hasn't already
  const { count } = await prisma.task.updateMany({
    data: {
      attempts: {
        increment: 1,
      },
      startedAt: new Date(),
      status: "running",
    },
    where: {
      id: next.id,
      status: "pending",
    },
  });

  return count === 1 ? next : claimNextTask();
};

const main = async () => {
  let task: Task | null;

  while ((task = await claimNextTask())) {
    console.log(
      `Running ${task.type} task ${task.id} for dataset ${task.datasetId}`,
    );

    try {
      const handler = TASK_HANDLERS[task.type];

      if (!handler) {
        throw new Error(`Unknown task type ${task.type}`);
      }

      await handler(task);

      await prisma.task.update({
        data: {
          completedAt: new Date(),
          error: "",
          status: "completed",
        },
        where: {
          id: task.id,
        },
      });

      console.log(`Completed task ${task.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.error(`Task ${task.id} failed: ${message}`);

      // Failed tasks are not retried automatically. Set status back to
      // "pending" to retry once the cause is fixed.
      await prisma.task.update({
        data: {
          error: message,
          status: "failed",
        },
        where: {
          id: task.id,
        },
      });

      if (task.type === "publish-dataset") {
        await prisma.datasetPublishingStatus.updateMany({
          data: {
            comment: `Publishing failed: ${message}`,
            status: -1,
          },
          where: {
            datasetId: task.datasetId,
          },
        });
      }
    }
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
