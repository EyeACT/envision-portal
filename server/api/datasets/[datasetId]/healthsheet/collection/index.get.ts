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

  const parsedCollection = dataset.DatasetHealthsheet?.collection
    ? JSON.parse(dataset.DatasetHealthsheet?.collection as string)
    : {
        records: [],
        version: 1,
      };

  const collection = parsedCollection as DatasetHealthsheetRecords;

  return {
    ...dataset,
    collection,
  };
});
