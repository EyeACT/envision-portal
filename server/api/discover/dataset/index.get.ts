import type { DiscoveryDatasetList } from "#shared/types/dataset";
// Returns a list of published datasets (latest version of each)
export default defineEventHandler(async (_event) => {
  // Get latest version of each dataset by finding the max id per canonicalId
  const latestVersions = await prisma.$queryRaw<
    { canonicalId: string; maxId: number }[]
  >`
    SELECT "canonicalId", MAX(id) as "maxId"
    FROM "PublishedDataset"
    GROUP BY "canonicalId"
  `;

  // List of latest dataset ids
  const latestIds = latestVersions.map((v) => v.maxId);

  if (latestIds.length === 0) {
    return [];
  }

  const publishedDatasets = await prisma.publishedDataset.findMany({
    where: {
      id: { in: latestIds },
    },
    orderBy: {
      created: "desc",
    },
    include: {
      PublishedDatasetRegistrationDetails: true,
    },
  });

  // Get version counts for all datasets in one query
  const versionCounts = await prisma.publishedDataset.groupBy({
    by: ["canonicalId"],
    _count: {
      id: true,
    },
  });

  // Create a map for quick lookup
  const versionCountMap = new Map(
    versionCounts.map((vc) => [vc.canonicalId, vc._count.id]),
  );

  const datasets: DiscoveryDatasetList[] = publishedDatasets.map(
    (publishedDataset) => {
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

      const versionCount = versionCountMap.get(publishedDataset.canonicalId) || 1;
      const registrationSource =
        publishedDataset.PublishedDatasetRegistrationDetails?.extractionMethod ||
        "";

      return {
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
      };
    },
  );

  return datasets;
});
