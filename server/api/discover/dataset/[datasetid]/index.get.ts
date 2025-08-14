export default defineEventHandler(async (event) => {
  const { datasetid } = event.context.params as { datasetid: string };

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

  const datasetMetadata = publishedDataset.publishedMetadata as any;
  const datasetFiles = publishedDataset.files as any;
  const additionalData = publishedDataset.data as any;
  const datasetAdditionalData = additionalData;

  const dataset: Dataset = {
    id: datasetid,
    title: publishedDataset.title,
    created: publishedDataset.created,
    data: datasetAdditionalData,
    description: publishedDataset.description,
    doi: publishedDataset.doi,
    external: publishedDataset.external,
    externalUrl: publishedDataset.externalUrl,
    files:
      typeof datasetFiles === "string"
        ? JSON.parse(datasetFiles)
        : datasetFiles,
    labelingMethod: additionalData.labelingMethod,
    metadata: {
      contributors: datasetMetadata.contributors,
      datasetDescription: datasetMetadata.datasetDescription,
      datasetStructureDescription: datasetMetadata.datasetStructureDescription,
      healthsheet: datasetMetadata.healthsheet,
      keywords: datasetMetadata.keywords,
      readme: datasetMetadata.readme,
      studyDescription: datasetMetadata.studyDescription,
    },
    validationInfo: additionalData?.validationInfo,
    versionTitle: publishedDataset.versionTitle,
  };

  return dataset;
});
