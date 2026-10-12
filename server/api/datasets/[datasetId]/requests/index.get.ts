export default defineEventHandler(async (event) => {
  const member = await datasetMinViewerPermission(event)

  const { datasetId } = event.context.params as { datasetId: string };

  const dataset = await prisma.dataset.findUnique({
    include: {
      DatasetRequest: true,
    },
    where: {
      id: datasetId,
      DatasetMember: {
        some: {
          userId: member.userId,
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

  return dataset;
});
