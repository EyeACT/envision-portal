export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  // todo: add permissions check

  const { datasetid, studyId } = event.context.params as {
    datasetid: string;
    studyId: string;
  };

  // Get the dataset from the database
  const dataset = await prisma.dataset.findUnique({
    include: {
      study: true,
    },
    where: {
      id: datasetid,
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

  return dataset;
});
