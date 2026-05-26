import { BlobServiceClient } from "@azure/storage-blob";

export default defineEventHandler(async (event) => {
  const { AZURE_DRAFT_CONNECTION_STRING } = useRuntimeConfig();
  const { datasetId } = event.context.params as { datasetId: string };

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_DRAFT_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(datasetId);
    
    let fileCount = 0;
    let totalSizeBytes = 0;

    for await (const blob of containerClient.listBlobsFlat()) {
      fileCount++;
      totalSizeBytes += blob.properties.contentLength || 0;
    }

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