
export default defineEventHandler(async (event) => {
  const member = await datasetMinViewerPermission(event)

  const userId = member.userId
  const { datasetId } = event.context.params as { datasetId: string };

  if (!datasetId) {
    throw createError({ statusCode: 400, statusMessage: "Dataset not found" });
  }

  const dataset = await prisma.dataset.findUnique({
    include: {
      StudyCollaborators: true,
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

  return {
    ...dataset,
  };
});
