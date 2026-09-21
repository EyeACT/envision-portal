import { BlobServiceClient, BlockBlobClient, BlobDeleteOptions, BlobDeleteResponse } from "@azure/storage-blob";




export default defineEventHandler(async (event) => {

  const session = await requireUserSession(event);

  const body = await readBody(event)

  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: "No body",
    })
  }

  const document = body.document

  const { datasetId, documentId } = event.context.params as {
    datasetId: string;
    documentId: string;
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


  const deletedDocument = await prisma.document.delete({
    where: {
      id: documentId
    }
  })

  await deleteBlob(deletedDocument.storagePath)

})


async function deleteBlob(
  blobName: string
): Promise<BlobDeleteResponse> {

  const { AZURE_DRAFT_CONNECTION_STRING } = useRuntimeConfig();

  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_DRAFT_CONNECTION_STRING);
  const documentsContainer = blobServiceClient.getContainerClient("documents");

  // Create blob client from container client
  const blockBlobClient: BlockBlobClient = documentsContainer.getBlockBlobClient(blobName);

  // include: Delete the base blob and all of its snapshots
  // only: Delete only the blob's snapshots and not the blob itself
  const options: BlobDeleteOptions = {
    deleteSnapshots: 'include'
  };
  const blobDeleteResponse: BlobDeleteResponse =
    await blockBlobClient.delete(options);

  return blobDeleteResponse
}