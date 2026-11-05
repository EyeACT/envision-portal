export default defineEventHandler(async (event) => {
  await datasetMinViewerPermission(event);

  const { datasetId, requestId, kind } = event.context.params as {
    datasetId: string;
    requestId: string;
    kind: string;
  };

  const agreementKind = parseAgreementKind(kind);

  const datasetRequest = await prisma.datasetRequest.findFirst({
    include: { DatasetRequestDetails: true },
    where: { id: requestId, datasetId },
  });

  if (!datasetRequest) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset request not found",
    });
  }

  return sendRequestAgreement(
    event,
    getAgreementPath(datasetRequest.DatasetRequestDetails[0], agreementKind),
  );
});
