export default defineEventHandler(async (event) => {
  const member = await datasetMinViewerPermission(event)

  const datasetId = member.datasetId

  const datasetMembers = await prisma.datasetMember.findMany({
    where: {
      datasetId: datasetId,
    },
    include: {
      user: {
        select: {
          emailAddress: true,
          givenName: true,
          familyName: true
        }
      }
    },
  });

  return datasetMembers || []
});
