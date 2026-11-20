import prisma from "#server/utils/prisma";
import { defineEventHandler, createError } from "h3";
import { requireUserSession } from "#imports";
import {
  parseAgreementKind,
  sendRequestAgreement,
  getAgreementPath,
} from "#server/utils/datasetRequests";

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
