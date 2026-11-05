export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  const { requestId, kind } = event.context.params as {
    requestId: string;
    kind: string;
  };

  const agreementKind = parseAgreementKind(kind);

  const request = await prisma.datasetRequest.findFirst({
    include: { DatasetRequestDetails: true },
    where: { id: requestId, userId: user.id },
  });

  if (!request) {
    throw createError({
      statusCode: 404,
      statusMessage: "Request not found",
    });
  }

  return sendRequestAgreement(
    event,
    getAgreementPath(request.DatasetRequestDetails[0], agreementKind),
  );
});
