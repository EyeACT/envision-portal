import "dotenv/config";
import { DataLakeServiceClient } from "@azure/storage-file-datalake";
import { PrismaPg } from "@prisma/adapter-pg";
import { STUDY_FILE_SYSTEM, studyPaths } from "../server/utils/studyStorage";
import { PrismaClient } from "../shared/generated/client";

// Restores a draft version deleted in the UI, before its purge task runs.
// Restoring is an admin task and is not available from the UI.
//
// Usage: pnpm scripts:restore:draft <datasetId>

const { AZURE_DRAFT_CONNECTION_STRING, DATABASE_URL } = process.env;

if (!DATABASE_URL || !AZURE_DRAFT_CONNECTION_STRING) {
  console.error("DATABASE_URL and AZURE_DRAFT_CONNECTION_STRING must be set");
  process.exit(1);
}

const datasetId = process.argv[2];

if (!datasetId) {
  console.error("Usage: pnpm scripts:restore:draft <datasetId>");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const fileSystemClient = DataLakeServiceClient.fromConnectionString(
  AZURE_DRAFT_CONNECTION_STRING,
).getFileSystemClient(STUDY_FILE_SYSTEM);

const main = async () => {
  const dataset = await prisma.dataset.findUnique({
    where: {
      id: datasetId,
    },
  });

  if (!dataset?.deletedAt) {
    throw new Error(`Dataset ${datasetId} is not a deleted draft`);
  }

  if (dataset.purgedAt) {
    throw new Error(`Dataset ${datasetId} was purged and cannot be restored`);
  }

  const { canonicalId } = dataset;

  // Only one draft may own `data/`. A version created after the delete has it
  const newerVersions = await prisma.dataset.count({
    where: {
      canonicalId,
      created: {
        gt: dataset.created,
      },
      deletedAt: null,
    },
  });

  if (newerVersions > 0) {
    throw new Error(
      `A newer version of ${canonicalId} was created after the delete`,
    );
  }

  // The version the draft was created from, whose frozen folder was rebuilt
  const previousVersion = await prisma.dataset.findFirst({
    orderBy: {
      created: "desc",
    },
    where: {
      canonicalId,
      created: {
        lt: dataset.created,
      },
      deletedAt: null,
      status: "published",
    },
  });

  if (!previousVersion) {
    throw new Error(`No published version found before ${datasetId}`);
  }

  // The rebuild writes into `data-{previousDatasetId}/`, which is removed below
  const runningRebuild = await prisma.task.findFirst({
    where: {
      datasetId: previousVersion.id,
      status: "running",
      type: "rebuild-frozen-data",
    },
  });

  if (runningRebuild) {
    throw new Error(
      `The rebuild task for ${previousVersion.id} is running. Wait for it to finish and try again`,
    );
  }

  // Cancel the purge before touching storage so it can't run mid-restore
  const { count } = await prisma.task.deleteMany({
    where: {
      datasetId,
      status: "pending",
      type: "purge-draft",
    },
  });

  if (count === 0) {
    throw new Error(`No pending purge task for ${datasetId}`);
  }

  await prisma.task.deleteMany({
    where: {
      datasetId: previousVersion.id,
      status: {
        in: ["pending", "failed"],
      },
      type: "rebuild-frozen-data",
    },
  });

  // An unexpired owner SAS can recreate `data/` after the delete. Nothing in
  // it belongs to the draft, and the rename fails if the target exists
  await fileSystemClient
    .getDirectoryClient(studyPaths.draftData(canonicalId))
    .deleteIfExists(true);

  await fileSystemClient
    .getDirectoryClient(studyPaths.frozenData(canonicalId, datasetId))
    .move(studyPaths.draftData(canonicalId), {
      destinationConditions: { ifNoneMatch: "*" },
    });

  // A copy of the published container, so it can be rebuilt again if needed
  await fileSystemClient
    .getDirectoryClient(studyPaths.frozenData(canonicalId, previousVersion.id))
    .deleteIfExists(true);

  await prisma.dataset.update({
    data: {
      deletedAt: null,
    },
    where: {
      id: datasetId,
    },
  });

  console.log(`Restored ${datasetId}`);
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
