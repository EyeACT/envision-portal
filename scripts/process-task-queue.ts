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
import { PrismaClient, type Task } from "../shared/generated/client";
import type { PublishDatasetPayload } from "../shared/types/tasks";

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

// Owner uploads live in `{datasetId}/data` inside this container in the study account
const DRAFT_FILE_SYSTEM = "datasets";

// The source SAS is backend-only and read-only on one dataset's `data/` folder.
// It is refreshed during long copies so a copy never starts close to its expiry.
const SOURCE_SAS_LIFETIME_HOURS = 24;
const SOURCE_SAS_REFRESH_HOURS = 12;

// Number of server-side copies in flight at once
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

/**
 * Server-side copy of every file under `datasets/{datasetId}/data` in the study
 * account into `data/` of the published container. File data never passes
 * through this process. Draft files are left in place.
 *
 * Returns the copied paths relative to the container root and their total size.
 */
const copyDataToPublished = async (
  datasetId: string,
  containerClient: ContainerClient,
) => {
  const draftServiceClient = DataLakeServiceClient.fromConnectionString(
    AZURE_DRAFT_CONNECTION_STRING,
  );
  const { accountName } = draftServiceClient;
  const dataPath = `${datasetId}/data`;

  // 1. List the draft files
  const sourceFiles: { path: string; size: number }[] = [];

  try {
    for await (const path of draftServiceClient
      .getFileSystemClient(DRAFT_FILE_SYSTEM)
      .listPaths({ path: dataPath, recursive: true })) {
      if (path.isDirectory || !path.name) continue;

      sourceFiles.push({ path: path.name, size: path.contentLength ?? 0 });

      if (sourceFiles.length % 1000 === 0) {
        await updatePublishingStatus(datasetId, {
          comment: `Discovered ${sourceFiles.length} files...`,
        });
      }
    }
  } catch (error: any) {
    // The data folder doesn't exist, so there is nothing to copy
    if (error.statusCode !== 404) throw error;
  }

  await updatePublishingStatus(datasetId, {
    comment: `Copying ${sourceFiles.length} files`,
    currentFileNumber: 0,
    fileCount: sourceFiles.length,
    status: getPublishingStatusIndex("moving-dataset-to-published-storage"),
  });

  // 2. Read-only SAS on the data folder so the published account can read the source
  const credential = new StorageSharedKeyCredential(
    accountName,
    AZURE_DRAFT_ACCOUNT_KEY,
  );
  let sourceSAS = "";
  let sourceSASRefreshAt = 0;

  const getSourceSAS = () => {
    if (Date.now() < sourceSASRefreshAt) return sourceSAS;

    const startsOn = new Date();
    const expiresOn = new Date(startsOn);

    expiresOn.setHours(startsOn.getHours() + SOURCE_SAS_LIFETIME_HOURS);

    sourceSAS = generateDataLakeSASQueryParameters(
      {
        expiresOn,
        fileSystemName: DRAFT_FILE_SYSTEM,
        isDirectory: true,
        pathName: dataPath,
        permissions: DirectorySASPermissions.parse("r"),
        startsOn,
      },
      credential,
    ).toString();
    sourceSASRefreshAt =
      startsOn.getTime() + SOURCE_SAS_REFRESH_HOURS * 60 * 60 * 1000;

    return sourceSAS;
  };

  // 3. Copy each file into `data/` of the published container
  const copyFile = async (sourcePath: string) => {
    // `{datasetId}/data/a/b.csv` -> `data/a/b.csv`
    const destinationPath = `data/${sourcePath.slice(dataPath.length + 1)}`;
    const encodedSourcePath = sourcePath
      .split("/")
      .map(encodeURIComponent)
      .join("/");
    const sourceUrl = `https://${accountName}.blob.core.windows.net/${DRAFT_FILE_SYSTEM}/${encodedSourcePath}?${getSourceSAS()}`;

    const poller = await containerClient
      .getBlobClient(destinationPath)
      .beginCopyFromURL(sourceUrl, { intervalInMs: COPY_POLL_INTERVAL_MS });
    const result = await poller.pollUntilDone();

    if (result.copyStatus !== "success") {
      throw new Error(`Failed to copy ${sourcePath}: ${result.copyStatus}`);
    }

    return destinationPath;
  };

  const copiedPaths: string[] = [];

  for (let i = 0; i < sourceFiles.length; i += COPY_CONCURRENCY) {
    const batch = sourceFiles.slice(i, i + COPY_CONCURRENCY);

    copiedPaths.push(
      ...(await Promise.all(batch.map(({ path }) => copyFile(path)))),
    );

    await updatePublishingStatus(datasetId, {
      comment: `Copied ${copiedPaths.at(-1)}`,
      currentFileNumber: copiedPaths.length,
    });
  }

  return {
    paths: copiedPaths,
    size: sourceFiles.reduce((total, { size }) => total + size, 0),
  };
};

/**
 * Copy a locked dataset's files and metadata into the published account and
 * register the published dataset. Safe to re-run after a failure: copies and
 * uploads overwrite, and the database records are only written at the end.
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

  // 1. Create the published container. Named after the dataset ID for now (no version suffix)
  const containerClient = BlobServiceClient.fromConnectionString(
    AZURE_PUBLISHED_CONNECTION_STRING,
  ).getContainerClient(datasetId);

  await containerClient.createIfNotExists();

  // 2. Copy `data/`
  await updatePublishingStatus(datasetId, {
    comment: "Listing files",
    status: getPublishingStatusIndex("indexing-dataset"),
  });

  const copied = await copyDataToPublished(datasetId, containerClient);

  // 3. Upload the metadata files generated when the dataset was locked
  await updatePublishingStatus(datasetId, {
    comment: "",
    status: getPublishingStatusIndex("generating-uploading-metadata-files"),
  });

  for (const [name, content] of Object.entries(metadataFiles)) {
    await updatePublishingStatus(datasetId, {
      comment: `Uploading the ${name} metadata file`,
    });

    const data = Buffer.from(content);

    await containerClient.getBlockBlobClient(name).upload(data, data.length);
  }

  // 4. Register the published dataset
  await updatePublishingStatus(datasetId, {
    comment: "",
    status: getPublishingStatusIndex("registering-doi"),
  });

  const fileTree = convertPathsToTree([
    ...copied.paths,
    ...Object.keys(metadataFiles),
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
          size: copied.size,
          fileCount: copied.paths.length,
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

    // The dataset stays locked: published versions are not edited
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
