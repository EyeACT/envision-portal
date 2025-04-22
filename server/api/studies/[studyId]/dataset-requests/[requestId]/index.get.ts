export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;

  const { requestId, studyId } = event.context.params as {
    requestId: string;
    studyId: string;
  };

  const datasetRequest = await prisma.datasetRequest.findUnique({
    include: {
      dataset: true,
      DatasetRequestDetails: true,
    },
    where: {
      id: requestId,
      studyId,
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
