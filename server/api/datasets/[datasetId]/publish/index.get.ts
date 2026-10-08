export default defineEventHandler(async (event) => {
  const member = await datasetMinViewerPermission(event)
  const userId = member.userId;

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Get the dataset from the database
  const dataset = await prisma.dataset.findUnique({
    include: {
      DatasetPublishingStatus: true,
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

  // Check if the dataset exists
  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  // Check if the dataset is already published
  const publishedDataset = await prisma.publishedDataset.findFirst({
    where: {
      datasetId,
    },
  });

  if (publishedDataset) {
    return {
      ...dataset,
      publishedId: publishedDataset.id,
    };
  }

  return {
    ...dataset,
    publishedId: null,
  };
});
