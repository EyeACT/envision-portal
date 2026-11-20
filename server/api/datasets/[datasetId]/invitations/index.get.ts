import prisma from "#server/utils/prisma";
import { defineEventHandler } from "h3";
import { datasetMinViewerPermission } from "#server/utils/datasetMinViewerPermission";
import { useRuntimeConfig } from "nitropack/runtime";

export default defineEventHandler(async (event) => {
  await datasetMinViewerPermission(event);
  const config = useRuntimeConfig();

  const { datasetId } = event.context.params as { datasetId: string };

  const datasetInvitations = await prisma.datasetInvitation.findMany({
    where: {
      datasetId: datasetId,
    },
    select: {
      id: true,
      role: true,
      emailAddress: true,
      invitationExpires: true,
      invitationToken: true, // TODO: Remove once testing is finished
      userId: true,
      status: true,
    },
  });

  return (
    datasetInvitations.map((invitation) => ({
      ...invitation,
      url: invitation.userId
        ? `${config.emailVerificationDomain}/invitations`
        : `${config.emailVerificationDomain}/signup?datasetInvitation=${invitation.invitationToken}`,
    })) || []
  );
});
