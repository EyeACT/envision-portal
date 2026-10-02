
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  // todo: add permissions check
  const emailAddress = session.user.emailAddress

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  const invitations = await prisma.datasetInvitation.findMany({
    where: {
      id: datasetId,
      emailAddress: emailAddress
    },
  });



  return invitations || [];
});