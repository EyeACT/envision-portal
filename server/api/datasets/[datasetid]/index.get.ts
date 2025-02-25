export default defineEventHandler(async (event) => {
  const { datasetid } = event.context.params as { datasetid: string };

  const datasetId = parseInt(datasetid);

  const dataset = await prisma.publishedDataset.findUnique({
    where: {
      id: datasetId,
    },
  });

  if (!dataset) {
    throw createError({
      message: `Dataset ${datasetid} not found`,
      statusCode: 404,
    });
  }

  return dataset;
});
