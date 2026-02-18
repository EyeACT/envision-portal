import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import DatasetRecords from "../dev/datasetRecords.json";

const prisma = new PrismaClient();

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
};

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
