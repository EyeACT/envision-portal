
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  // todo: add permissions check
  const emailAddress = session.user.emailAddress
  const userId = session.user.id

  const invitations = await prisma.datasetInvitation.findMany({
    where: {
      OR: [
        { emailAddress: emailAddress },
        { userId: userId }
      ]
    },
    include: {
      dataset: {
        select: {
          title: true
        }
      }
    },
  });

  const activeInvitations = invitations.filter(invitation => {
    return (
      invitation.invitationExpires > new Date() &&
      !invitation.invitationAccepted
    )
  })


  return activeInvitations || [];
});