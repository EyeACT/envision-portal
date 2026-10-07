import { InvitationStatuses } from "~~/shared/generated/client";

export default defineEventHandler(async (event) => {
  await datasetMinViewerPermission(event)
  const config = useRuntimeConfig()


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
      invitationAccepted: true,
      userId: true,
      status: true
    }
  });

  return datasetInvitations.map(invitation => (
    {
      ...invitation,
      url: invitation.userId ? `${config.emailVerificationDomain}/invitations` : `${config.emailVerificationDomain}/signup?datasetInvitation=${invitation.invitationToken}`
    }
  )
  ) || []
});
