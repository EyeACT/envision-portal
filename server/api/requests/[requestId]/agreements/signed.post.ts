// Requester uploads their signed copy of the data use agreement
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  const { requestId } = event.context.params as { requestId: string };

  const request = await prisma.datasetRequest.findFirst({
    include: {
      Dataset: { select: { canonicalId: true } },
      DatasetRequestDetails: true,
      PublishedDataset: { select: { title: true } },
    },
    where: { id: requestId, userId: user.id },
  });

  if (!request?.Dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Request not found",
    });
  }

  if (request.status !== "pending") {
    throw createError({
      statusCode: 409,
      statusMessage: "This request is no longer pending",
    });
  }

  const details = request.DatasetRequestDetails[0];

  if (!getAgreementPath(details, "unsigned")) {
    throw createError({
      statusCode: 409,
      statusMessage: "No data use agreement has been sent for this request",
    });
  }

  if (getAgreementPath(details, "final")) {
    throw createError({
      statusCode: 409,
      statusMessage: "The agreement has already been countersigned",
    });
  }

  const storagePath = await uploadRequestAgreement(
    event,
    request.Dataset.canonicalId,
    requestId,
    "signed",
  );

  await prisma.datasetRequestDetails.update({
    data: { requesterSignedDataUseAgreement: storagePath },
    where: { id: details!.id },
  });

  await notifyDatasetManagers(request.datasetId, {
    body: `${request.givenName} ${request.familyName} uploaded a signed data use agreement for ${request.PublishedDataset.title}.`,
    title: "Signed data use agreement received",
    url: `/app/datasets/${request.datasetId}/requests/${requestId}`,
  });

  return { kind: "signed" };
});
