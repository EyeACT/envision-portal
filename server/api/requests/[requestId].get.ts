export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  const { requestId } = event.context.params as {
    requestId: string;
  };

  // Requesters can only see their own requests
  const request = await prisma.datasetRequest.findFirst({
    include: {
      Dataset: {
        select: { id: true, title: true, description: true, version: true },
      },
      DatasetRequestDetails: true,
      PublishedDataset: {
        select: {
          id: true,
          title: true,
          containerId: true,
          description: true,
          doi: true,
          public: true,
          versionTitle: true,
        },
      },
    },
    where: { id: requestId, userId: user.id },
  });

  if (!request) {
    throw createError({
      statusCode: 404,
      statusMessage: "Request not found",
    });
  }

  let sasUrl = "";
  let expiration = "";

  // Download access is only handed out for approved requests
  if (request.status === "approved" && request.PublishedDataset.containerId) {
    const sas = getPublishedContainerSasUrl(
      request.PublishedDataset.containerId,
    );

    sasUrl = sas.sasUrl;
    expiration = sas.expiresOn.toISOString();
  }

  const { containerId: _containerId, ...publishedDataset } =
    request.PublishedDataset;

  return {
    ...serializeDatasetRequest(request),
    expiration,
    PublishedDataset: publishedDataset,
    sasUrl,
  };
});
