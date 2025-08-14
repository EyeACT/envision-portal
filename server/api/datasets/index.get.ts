export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const datasets = await prisma.dataset.findMany({
    orderBy: {
      updated: "desc",
    },
    where: {
      DatasetMember: {
        some: {
          userId,
        },
      },
    },
  });

  if (!datasets) {
    throw createError({
      statusCode: 404,
      statusMessage: "Datasets not found",
    });
  }

  return datasets || [];
});
