export default defineEventHandler(async (event) => {
  const member = await datasetMinViewerPermission(event)


  const { datasetId, requestId } = event.context.params as {
    datasetId: string;
    requestId: string;
  };

  const datasetRequest = await prisma.datasetRequest.findUnique({
    include: {
      dataset: true,
      DatasetRequestDetails: true,
    },
    where: {
      id: requestId,
      dataset: {
        DatasetMember: {
          some: {
            userId: member.userId,
          },
        },
      },
      datasetId,
    },
  });

  if (!datasetRequest) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset request not found",
    });
  }

  return datasetRequest;
});
