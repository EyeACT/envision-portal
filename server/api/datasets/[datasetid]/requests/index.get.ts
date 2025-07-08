export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;

  const { datasetId } = event.context.params as { datasetId: string };

  const dataset = await prisma.dataset.findUnique({
    include: {
      DatasetRequest: true,
    },
    where: {
      id: datasetId,
      DatasetMember: {
        some: {
          userId: user.id,
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
