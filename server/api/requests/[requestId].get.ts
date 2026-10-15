export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  // todo: add permissions check

  const { requestId } = event.context.params as {
    requestId: string;
  };

  // Get the request from the database
  const request = await prisma.datasetRequest.findUnique({
    include: {
      Dataset: true,
      PublishedDataset: true,
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

  let sasUrl = "";
  let expiresOn = new Date();

  if (request.PublishedDataset.public && request.PublishedDataset.containerId) {
    ({ expiresOn, sasUrl } = getPublishedContainerSasUrl(request.PublishedDataset.containerId));
  } else {
    // read the predefined sas url
    // todo: add the predefined sas url
  }

  return {
    ...request,
    expiration: expiresOn.toISOString(),
    sasUrl,
  };
});
