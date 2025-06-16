import { DatasetHealthsheetRecords } from "~/types/dataset";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId, studyId } = event.context.params as {
    datasetId: string;
    studyId: string;
  };

  // Get the dataset from the database
  const dataset = await prisma.dataset.findUnique({
    include: {
      DatasetHealthsheet: true,
      study: true,
    },
    where: {
      id: datasetId,
      study: {
        StudyMember: {
          some: {
            userId,
          },
        },
      },
      studyId,
    },
  });

  // Check if the dataset exists
  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  const parsedComposition = dataset.DatasetHealthsheet?.composition
    ? JSON.parse(dataset.DatasetHealthsheet?.composition as string)
    : {
        records: [],
        version: 1,
      };

  const composition = parsedComposition as DatasetHealthsheetRecords;

  return {
    ...dataset,
    composition,
  };
});
