// Throws a 423 if the dataset has been locked for publishing.
// A missing dataset passes so the route can return its own 404.
export const assertDatasetUnlocked = async (datasetId: string) => {
  const dataset = await prisma.dataset.findUnique({
    select: { lockedAt: true },
    where: { id: datasetId },
  });

  if (dataset?.lockedAt) {
    throw createError({
      statusCode: 423,
      statusMessage: "Dataset is locked for publishing",
    });
  }
};
