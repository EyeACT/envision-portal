export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  // todo: add permissions check

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  const dataset = await prisma.dataset.findUnique({
    where: {
      id: datasetId,
    },
    include: {
      StudyDescription: true,
      StudyStatus: true,
      DatasetContributor: true,
    },
  });

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  return dataset;
});