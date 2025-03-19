export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;

  const { studyId } = event.context.params as { studyId: string };

  const datasetRequests = await prisma.datasetRequest.findMany({
    include: {
      dataset: true,
    },
    where: {
      studyId,
    },
  });

  return datasetRequests || [];
});
