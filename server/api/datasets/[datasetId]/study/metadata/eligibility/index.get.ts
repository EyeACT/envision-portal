export default defineEventHandler(async (event) => {
  const member = await datasetMinViewerPermission(event)

  const userId = member.userId

  const { datasetId } = event.context.params as { datasetId: string };

  // Get the study from the database
  const dataset = await prisma.dataset.findUnique({
    include: {
      StudyDesign: true,
      StudyEligibility: true,
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
    ...dataset,
    studyType: dataset.StudyDesign?.studyType,
  };
});
