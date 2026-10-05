

export default defineEventHandler(async (event) => {
  await datasetMinAdminPermission(event)

  const { datasetId, invitationId } = event.context.params as { datasetId: string, invitationId: string };

  await prisma.datasetInvitation.delete({
    where: {
      datasetId: datasetId,
      id: invitationId
    }
  })


  return { statusCode: 200 }

})