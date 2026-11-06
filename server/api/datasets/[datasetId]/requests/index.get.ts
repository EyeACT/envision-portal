export default defineEventHandler(async (event) => {
  const member = await datasetMinViewerPermission(event);

  const { datasetId } = event.context.params as { datasetId: string };

  const dataset = await prisma.dataset.findUnique({
    select: {
      id: true,
      title: true,
      status: true,
      version: true,
    },
    where: { id: datasetId },
  });

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  // Requests are checked against the published record's access level
  const publishedDataset = await prisma.publishedDataset.findFirst({
    select: { public: true },
    where: { datasetId },
  });

  const requests = await prisma.datasetRequest.findMany({
    include: { DatasetRequestDetails: true },
    orderBy: { created: "desc" },
    where: { datasetId },
  });

  return {
    canManage: member.owner || ["owner", "admin"].includes(member.role),
    dataset: { ...dataset, public: publishedDataset?.public ?? null },
    requests: requests.map(serializeDatasetRequest),
  };
});
