export default defineEventHandler(async (event) => {
  await datasetMinEditorPermission(event)

  // todo: add permissions check
  // only allow users with the role of data-curator or higher

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Get the dataset from the database
  const dataset = await prisma.dataset.findUnique({
    where: {
      id: datasetId,
    },
  });

  // Check if the dataset exists
  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  // Only an open draft gets upload access. Publishing locks the dataset and
  // renames `data/`, which also cuts off tokens issued before the lock
  if (dataset.status !== "draft") {
    throw createError({
      statusCode: 423,
      statusMessage: "Dataset is not a draft",
    });
  }

  await assertDatasetUnlocked(dataset.id);

  // Scoped to the dataset's `data/` folder so it can't access anything else
  const { expiresOn, sasUrl } = await getOwnerUploadSasUrl(dataset.canonicalId);

  return {
    ...dataset,
    expiration: expiresOn.toISOString(),
    sasUrl,
  };
});
