import "dotenv/config";
import DatasetRecords from "../dev/datasetRecords.json";

import { PrismaClient } from "../shared/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const main = async () => {
  const { DATABASE_URL } = process.env;

  if (!DATABASE_URL) {
    return;
  }

  // Get all external datasets
  const externalDatasets =
    await prisma.publishedDatasetRegistrationDetails.findMany({
      where: {
        extractionMethod: "Manual Registration",
      },
    });

  // Delete the records from the database
  const totalExternal = externalDatasets.length;
  console.log(`Deleting ${totalExternal} external dataset(s)...`);
  for (let i = 0; i < externalDatasets.length; i++) {
    const externalDataset = externalDatasets[i];
    await prisma.publishedDatasetRegistrationDetails.delete({
      where: {
        id: externalDataset.id,
      },
    });

    await prisma.publishedDataset.delete({
      where: {
        id: externalDataset.publishedDatasetId,
      },
    });
    const done = i + 1;
    const pct = totalExternal ? Math.round((done / totalExternal) * 100) : 0;
    process.stdout.write(`\r  ${done}/${totalExternal} (${pct}%)`);
  }
  console.log("\n\nDone. Deleted all external datasets.");

  // Verify no PublishedDataset records remain before proceeding
  const remainingCount = await prisma.publishedDataset.count();
  if (remainingCount > 0) {
    console.error(
      `\nAborting: ${remainingCount} PublishedDataset record(s) still exist after cleanup.`,
    );
    return;
  }

  // Reset the autoincrement sequence to 1 (fresh start)
  await prisma.$executeRaw`ALTER SEQUENCE "PublishedDataset_id_seq" RESTART WITH 1`;
  console.log("Reset PublishedDataset id sequence to 1.");

  const totalRecords = (DatasetRecords as unknown[]).length;
  console.log(`\nCreating ${totalRecords} record(s)...`);
  for (let i = 0; i < (DatasetRecords as unknown[]).length; i++) {
    const DatasetRecord = (DatasetRecords as unknown[])[
      i
    ] as (typeof DatasetRecords)[number];
    await prisma.publishedDataset.deleteMany({
      where: {
        id: DatasetRecord.id,
      },
    });

    await prisma.publishedDataset.create({
      data: {
        id: DatasetRecord.id,
        title: DatasetRecord.title,
        canonicalId: DatasetRecord.canonicalId,
        created: new Date(parseInt(DatasetRecord.created) * 1000),
        data: DatasetRecord.data,
        datasetId: DatasetRecord.datasetId,
        description: DatasetRecord.description,
        doi: DatasetRecord.doi,
        external: DatasetRecord.external,
        externalUrl: DatasetRecord.externalUrl,
        files: DatasetRecord.files,
        publishedMetadata: DatasetRecord.publishedMetadata,
        studyTitle: DatasetRecord.studyTitle,
        updated: new Date(parseInt(DatasetRecord.created) * 1000),
        versionTitle: DatasetRecord.versionTitle,
        PublishedDatasetRegistrationDetails: {
          create: {
            datasetSource:
              DatasetRecord.PublishedDatasetRegistrationDetails.datasetSource,
            extractionMethod:
              DatasetRecord.PublishedDatasetRegistrationDetails
                .extractionMethod,
            extractionVersion:
              DatasetRecord.PublishedDatasetRegistrationDetails
                .extractionVersion,
          },
        },
      },
    });
    const done = i + 1;
    const pct = totalRecords ? Math.round((done / totalRecords) * 100) : 0;
    process.stdout.write(`\r  ${done}/${totalRecords} (${pct}%)`);
  }

  console.log("\n\nDone. Created all records.");

  // Reset the autoincrement sequence to avoid conflicts with the inserted IDs
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"PublishedDataset"', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM "PublishedDataset"`;
  console.log("Reset PublishedDataset id sequence.");
};

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
