export default defineEventHandler(async (event) => {
  const member = await datasetMinViewerPermission(event);
  const { userId } = member;

  const { datasetId } = event.context.params as { datasetId: string };

  // Get the study from the database
  const dataset = await prisma.dataset.findUnique({
    include: {
      DatasetManagingOrganization: true,
      StudyCentralContact: true,
      StudyCollaborators: true,
      StudyOverallOfficials: true,
      StudySponsors: true,
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
  };
});
