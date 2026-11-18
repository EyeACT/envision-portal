import { InvitationStatuses } from "~~/shared/generated/client";
import dayjs from "dayjs";
import prisma from "#server/utils/prisma";
import { defineEventHandler, readBody } from "h3";
import { datasetMinAdminPermission } from "#server/utils/datasetMinAdminPermission";

export default defineEventHandler(async (event) => {
  await datasetMinAdminPermission(event);

  const { datasetId, invitationId } = event.context.params as {
    datasetId: string;
    invitationId: string;
  };

  const body = await readBody(event);

  const updateStatus = body.status;

  if (updateStatus === InvitationStatuses.RESCINDED) {
    await prisma.datasetInvitation.update({
      where: {
        datasetId: datasetId,
        id: invitationId,
      },
      data: {
        status: InvitationStatuses.RESCINDED,
      },
    });
  }

  return { statusCode: 200 };
});
