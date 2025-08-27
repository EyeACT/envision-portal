export default defineEventHandler(async (event) => {
  const { datasetid, requestid } = event.context.params as {
    datasetid: string;
    requestid: string;
  };

  const datasetId = parseInt(datasetid);

  const publishedDataset = await prisma.publishedDataset.findUnique({
    where: {
      id: datasetId,
    },
  });

  if (!publishedDataset) {
    throw createError({
      message: `Dataset ${datasetid} not found`,
      statusCode: 404,
    });
  }

  const request = await prisma.datasetRequest.findUnique({
    where: {
      id: requestid,
    },
  });

  if (!request) {
    throw createError({
      message: `Request ${requestid} not found`,
      statusCode: 404,
    });
  }

  if (request.isControlledDatasetRequest) {
    throw createError({
      message: `Request ${requestid} is a controlled dataset request`,
      statusCode: 403,
    });
  }

  const datasetMetadata =
    publishedDataset.publishedMetadata as unknown as Metadata;

  return {
    id: publishedDataset.id,
    datasetId: publishedDataset.datasetId,
    canonicalId: publishedDataset.canonicalId,
    title: publishedDataset.title,
    versionTitle: publishedDataset.versionTitle,
    description: publishedDataset.description,
    doi: publishedDataset.doi,
    external: publishedDataset.external,
    metadata: {
      datasetDescription: datasetMetadata.datasetDescription,
      studyDescription: datasetMetadata.studyDescription,
    },
    license: "Unknown",
    request,
  };
});
