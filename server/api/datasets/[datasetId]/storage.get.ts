export default defineEventHandler(async (event) => {
  await datasetMinViewerPermission(event)
  const { datasetId } = event.context.params as { datasetId: string };

  const dataset = await prisma.dataset.findUnique({
    select: { canonicalId: true, id: true, lockedAt: true },
    where: { id: datasetId },
  });

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  try {
    const files = await listDatasetDataFiles(dataset);

    const fileCount = files.length;
    const totalSizeBytes = files.reduce((total, { size }) => total + size, 0);

    return {
      fileCount,
      totalSizeBytes,
      displaySize: formatBytes(totalSizeBytes)
    };
  } catch (e) {
    console.error("Azure Error:", e);
    return { fileCount: 0, totalSizeBytes: 0, displaySize: '0 Bytes' };
  }
});

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}
