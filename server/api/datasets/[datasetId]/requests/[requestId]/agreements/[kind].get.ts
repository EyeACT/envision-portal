// Agreements are signed legal documents, so only dataset owners and admins can
// download them here. Requesters use /api/requests/[requestId]/agreements/[kind]
export default defineEventHandler(async (event) => {
  await datasetMinAdminPermission(event);

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
