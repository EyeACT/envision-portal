export default defineEventHandler(async (event) => {
  await datasetMinAdminPermission(event)

  const { datasetId, userId } = event.context.params as {
    datasetId: string;
    userId: string;
  };

  await prisma.datasetMember.delete({
    where: {
      datasetId_userId: { datasetId, userId },
    }
  });

  setResponseStatus(event, 204);
});
