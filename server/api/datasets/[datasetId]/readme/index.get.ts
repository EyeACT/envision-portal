export default defineEventHandler(async (event) => {
  const member = await datasetMinViewerPermission(event);

  const { datasetId, userId } = member;

  // Get the dataset from the database
  const dataset = await prisma.dataset.findUnique({
    where: {
      id: datasetId,
      DatasetMember: {
        some: {
          userId,
        },
      },
    },
  });

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  return {
    ...dataset,
  };
});
