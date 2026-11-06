export default defineEventHandler(async (event) => {
  const member = await datasetMinViewerPermission(event);

  const { userId } = member;

  const { datasetId } = event.context.params as { datasetId: string };

  // Get the study from the database
  const dataset = await prisma.dataset.findUnique({
    include: {
      StudyOversight: true,
      StudyStatus: true,
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

  // Check if the study exists
  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  return {
    title: dataset.title,
    StudyOversight: dataset.StudyOversight,
    StudyStatus: dataset.StudyStatus,
  };
});
