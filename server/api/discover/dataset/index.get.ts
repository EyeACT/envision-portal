import type { DiscoveryDatasetList } from "#shared/types/dataset";
// Returns a list of published datasets
export default defineEventHandler(async (_event) => {
  const datasets: DiscoveryDatasetList[] = [];

  const publishedDatasets = await prisma.publishedDataset.findMany({
    distinct: ["canonicalId"],
    orderBy: {
      created: "desc",
    },
    include: {
      PublishedDatasetRegistrationDetails: true,
    },
  });

  const dIds = publishedDatasets.map(
    (publishedDataset) => publishedDataset.canonicalId,
  );

  publishedDatasets.forEach(async (publishedDataset) => {
    const pd = publishedDataset as any;
    const publishedMetadata = pd.publishedMetadata as any;

    const creators = publishedMetadata.datasetDescription?.creator || [];
    const keywords =
      publishedMetadata.datasetDescription?.subject.map(
        (subject: { subjectValue: string }) => subject.subjectValue,
      ) || [];

    const rights =
      publishedMetadata.datasetDescription?.rights.map(
        (right: { rightsName: string }) => right.rightsName,
      ) || [];

    const versionCount = await prisma.publishedDataset.count({
      where: {
        canonicalId: publishedDataset.canonicalId,
      },
    });
    const registrationSource =
      publishedDataset.PublishedDatasetRegistrationDetails?.extractionMethod ||
      "";

    datasets.push({
      id: publishedDataset.id,
      canonicalId: publishedDataset.canonicalId,
      datasetId: publishedDataset.datasetId,
      doi: publishedDataset.doi,
      title: publishedDataset.title,
      description: publishedDataset.description,
      versionTitle: publishedDataset.versionTitle,
      creators,
      keywords,
      created: publishedDataset.created,
      external: publishedDataset.external,
      labelingMethod: "",
      validationInfo: "",
      versionCount: versionCount - 1,
      rights,
      registrationSource,
    });
  });

  /// For each dataset, count how many versions there are
  for (const dId of dIds) {
    const versionCount = await prisma.publishedDataset.count({
      where: {
        canonicalId: dId,
      },
    });
  }

  return datasets || [];
});
