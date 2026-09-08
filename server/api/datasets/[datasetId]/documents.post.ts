import { BlobServiceClient } from "@azure/storage-blob";


export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const { AZURE_DRAFT_CONNECTION_STRING } = useRuntimeConfig();
  const { datasetId } = event.context.params as { datasetId: string };



  // create the documents container if it does not exist
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_DRAFT_CONNECTION_STRING);
    const documentsContainer = blobServiceClient.getContainerClient("documents");
    await documentsContainer.createIfNotExists()


    const formData = await readMultipartFormData(event)
    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing form data"
      })
    }


    const file = formData.find((part) => part.name === "file")
    const fileName = formData.find((part) => part.name === "fileName")?.data.toString()
    const fileType = formData.find((part) => part.name === "fileType")?.data.toString()
    const fileExtension = formData.find((part) => part.name === "fileExtension")?.data.toString()

    if (!file) {
      throw createError({
        statusCode: 400,
        statusMessage: "No file included in the form data"
      })
    }


    // TODO: Add basic validation 
    // TODO: Add authentication
    // TODO: Add check for datasetId exists (though it should)
    // TODO: Eventually add permissions (if not already in place elsewhere)
    // TODO: Create the documents container via access that is maybe in the env? or maybe i can use the Storage Explorer
    // TODO: Automated tests?

    const blobName = `${datasetId}/${fileName}`

    const blobClient = documentsContainer.getBlockBlobClient(blobName)


    await blobClient.uploadData(file.data, {
      blobHTTPHeaders: {
        blobContentType: file.type || "application/octet-stream"
      }
    })

  } catch (e) {
    console.error("Azure Error:", e);
    return { uploadedDocuments: 0 }
  }

  return { uploadedDocuments: 1 }


})