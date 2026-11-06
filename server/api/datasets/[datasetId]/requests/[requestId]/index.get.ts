export default defineEventHandler(async (event) => {
  const member = await datasetMinViewerPermission(event);

  const { datasetId, requestId } = event.context.params as {
    datasetId: string;
    requestId: string;
  };

  const datasetRequest = await prisma.datasetRequest.findFirst({
    include: {
      Dataset: {
        select: { id: true, title: true, version: true },
      },
      DatasetRequestDetails: true,
      PublishedDataset: {
        select: {
          id: true,
          doi: true,
          public: true,
          versionTitle: true,
        },
      },
    },
    where: { id: requestId, datasetId },
  });

  if (!datasetRequest) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset request not found",
    });
  }

  return {
    ...serializeDatasetRequest(datasetRequest),
    approvalBlocker: getApprovalBlocker(datasetRequest.DatasetRequestDetails[0]),
    canManage: member.owner || ["owner", "admin"].includes(member.role),
  };
});
