
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
    select: {
      id: true,
      emailAddress: true,
      userId: true,
      role: true
    }
  });


  return invitations || [];
});