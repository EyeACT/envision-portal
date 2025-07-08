// Returns a list of published datasets
export default defineEventHandler(async (_event) => {
  const datasets = await prisma.publishedDataset.findMany({
    distinct: ["datasetId"],
    orderBy: {
      created: "desc",
    },
  });

  return datasets || [];
});
