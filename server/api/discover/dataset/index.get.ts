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

  const datasets = await prisma.publishedDataset.findMany({
    where: {
      id: { in: latestIds },
    },
    orderBy: {
      created: "desc",
    },
  });

  return datasets;
});
