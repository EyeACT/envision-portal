import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

const main = async () => {
  const { DATABASE_URL } = process.env;

  if (!DATABASE_URL) {
    return;
  }

  const pds = await prisma.publishedDataset.findMany({
    where: {
      external: true,
    },
  });

  for (const pd of pds) {
    await prisma.publishedDatasetRegistrationDetails.create({
      data: {
        datasetSource: "manual-registration",
        publishedDatasetId: pd.id,
        datasetSource: "Unknown",
        extractionMethod: "Manual Registration",
        extractionVersion: "0.0.0",
      },
    });
  }

  console.log("Created external datasets");
};

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
