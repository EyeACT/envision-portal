export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const requests = await prisma.datasetRequest.findMany({
    include: {
      Dataset: true,
      PublishedDataset: true,
    },
    orderBy: {
      updated: "desc",
    },
    where: {
      userId,
    },
  });

  if (!requests) {
    throw createError({
      statusCode: 404,
      statusMessage: "Datasets not found",
    });
  }

  return requests || [];
});
