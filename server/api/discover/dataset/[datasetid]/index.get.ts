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

  // get all the versions for this dataset
  const relatedDatasets = await prisma.publishedDataset.findMany({
    orderBy: {
      created: "desc",
    },
    where: {
      canonicalId: publishedDataset.canonicalId,
    },
  });

  const versions: VersionArray = relatedDatasets.map((relatedDataset) => {
    return {
      id: Number(relatedDataset.id).toString(),
      title: relatedDataset.versionTitle,
      createdAt: Number(BigInt(relatedDataset.created.getTime())),
      doi: relatedDataset.doi,
    };
  });

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
    license: "Unknown",
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
    versions,
    versionTitle: publishedDataset.versionTitle,
  };

  return dataset;
});
