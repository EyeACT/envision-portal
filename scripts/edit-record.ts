import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import DatasetRecord from "../dev/datasetRecord.json";

const prisma = new PrismaClient();

const main = async () => {
  const { DATABASE_URL } = process.env;

  if (!DATABASE_URL) {
    return;
  }

  await prisma.publishedDataset.update({
    data: {
      title: DatasetRecord.title,
      canonicalId: DatasetRecord.canonicalId,
      data: DatasetRecord.data,
      datasetId: DatasetRecord.datasetId,
      description: DatasetRecord.description,
      doi: DatasetRecord.doi,
      files: DatasetRecord.files,
      publishedMetadata: DatasetRecord.publishedMetadata,
      studyTitle: DatasetRecord.studyTitle,
      versionTitle: DatasetRecord.versionTitle,
    },
    where: {
      id: 1,
    },
  });

  console.log("Updated record");
};

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
