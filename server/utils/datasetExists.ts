import type { H3Event } from "h3";

// Throws a 404 if the dataset in the route params does not exist
export const datasetExists = async (event: H3Event) => {
  const { datasetId } = event.context.params as { datasetId: string };

  const dataset = await prisma.dataset.findUnique({
    select: { id: true },
    where: { id: datasetId },
  });

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  return dataset.id;
};
