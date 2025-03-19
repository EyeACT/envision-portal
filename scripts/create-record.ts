import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import DatasetRecord from "../dev/datasetRecord.json";

const prisma = new PrismaClient();

const main = async () => {
  const { DATABASE_URL } = process.env;

  if (!DATABASE_URL) {
    return;
  }

  await prisma.publishedDataset.create({
    data: {
      id: 1,
      title: DatasetRecord.title,
      data: DatasetRecord.data,
      datasetId: DatasetRecord.datasetId,
      description: DatasetRecord.description,
      doi: DatasetRecord.doi,
      files: DatasetRecord.files,
      publishedMetadata: DatasetRecord.publishedMetadata,
      studyId: DatasetRecord.studyId,
      studyTitle: DatasetRecord.studyTitle,
      versionId: DatasetRecord.versionId,
      versionTitle: DatasetRecord.versionTitle,
    },
  });

  console.log("Created record");
};

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
