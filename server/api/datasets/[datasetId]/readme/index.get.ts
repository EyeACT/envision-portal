export default defineEventHandler(async (event) => {
  const member = await datasetMinViewerPermission(event)

  const datasetId = member.datasetId

  const userId = member.userId

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

  return {
    ...dataset,
  };
});
