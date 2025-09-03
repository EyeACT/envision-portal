export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  // todo: add permissions check

  const { requestId } = event.context.params as {
    requestId: string;
  };

  // Get the request from the database
  const request = await prisma.datasetRequest.findUnique({
    include: {
      Dataset: true,
    },
    where: {
      id: requestId,
    },
  });

  // Check if the request exists
  if (!request) {
    throw createError({
      statusCode: 404,
      statusMessage: "Request not found",
    });
  }

  return request;
});
