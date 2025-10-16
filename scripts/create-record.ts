import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import DatasetRecords from "../dev/datasetRecords.json";

const prisma = new PrismaClient();

const main = async () => {
  const { DATABASE_URL } = process.env;

  if (!DATABASE_URL) {
    return;
  }

  for (const DatasetRecord of DatasetRecords) {
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
      },
    });
  }

  console.log("Created record");
};

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
