export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;

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
            userId: user.id,
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
