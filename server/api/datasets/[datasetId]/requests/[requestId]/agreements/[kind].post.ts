// Owner side of the data use agreement exchange: send the unsigned agreement,
// then upload the countersigned copy once the requester has signed it
export default defineEventHandler(async (event) => {
  await datasetMinAdminPermission(event);

  const { datasetId, requestId, kind } = event.context.params as {
    datasetId: string;
    requestId: string;
    kind: string;
  };

  const agreementKind = parseAgreementKind(kind, ["unsigned", "final"]);

  const datasetRequest = await prisma.datasetRequest.findFirst({
    include: {
      Dataset: { select: { canonicalId: true } },
      DatasetRequestDetails: true,
      PublishedDataset: { select: { title: true } },
    },
    where: { id: requestId, datasetId },
  });

  if (!datasetRequest?.Dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset request not found",
    });
  }

  if (datasetRequest.status !== "pending") {
    throw createError({
      statusCode: 409,
      statusMessage: "Agreements can only be changed while the request is pending",
    });
  }

  const details = await getOrCreateRequestDetails(datasetRequest);
  const signedPath = getAgreementPath(details, "signed");

  // Replacing the unsigned copy after the requester signed it would orphan their signature
  if (agreementKind === "unsigned" && signedPath) {
    throw createError({
      statusCode: 409,
      statusMessage: "The requester has already signed the agreement",
    });
  }

  if (agreementKind === "final" && !signedPath) {
    throw createError({
      statusCode: 409,
      statusMessage: "The requester has not signed the agreement yet",
    });
  }

  const storagePath = await uploadRequestAgreement(
    event,
    datasetRequest.Dataset.canonicalId,
    requestId,
    agreementKind,
  );

  await prisma.datasetRequestDetails.update({
    data:
      agreementKind === "unsigned"
        ? { unsignedDataUseAgreement: storagePath }
        : { signedDataUseAgreement: storagePath },
    where: { id: details.id },
  });

  const title = datasetRequest.PublishedDataset.title;

  await notifyRequester(
    datasetRequest.userId,
    agreementKind === "unsigned"
      ? {
          body: `Please download, sign and upload the data use agreement for ${title}.`,
          title: "Data use agreement to sign",
          type: "warning",
          url: `/app/requests/${requestId}`,
        }
      : {
          body: `The dataset team countersigned the data use agreement for ${title}.`,
          title: "Data use agreement countersigned",
          url: `/app/requests/${requestId}`,
        },
  );

  return { kind: agreementKind };
});
