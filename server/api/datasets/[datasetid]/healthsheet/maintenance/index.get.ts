import { DatasetHealthsheetRecords } from "~/types/dataset";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Get the dataset from the database
  const dataset = await prisma.dataset.findUnique({
    include: {
      DatasetHealthsheet: true,
    },
    where: {
      id: datasetId,
      DatasetMember: {
        some: {
          userId,
        },
      },
    },
  });

  // Check if the dataset exists
  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  const parsedMaintenance = dataset.DatasetHealthsheet?.maintenance
    ? JSON.parse(dataset.DatasetHealthsheet?.maintenance as string)
    : {
        records: [],
        version: 1,
      };

  const maintenance = parsedMaintenance as DatasetHealthsheetRecords;

  return {
    ...dataset,
    maintenance,
  };
});
