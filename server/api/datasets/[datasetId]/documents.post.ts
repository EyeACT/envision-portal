import { BlobServiceClient } from "@azure/storage-blob";
import type { H3Event, MultiPartData } from "h3"

// TODO: Decide return object schema [wip]
// TODO: file extension validation on backend [done]
// TODO: file type validation [wip]
// TODO: Raise specific errors for not being able to connect to Azure [wip]
// TODO: Add Database call to check the dataset id exists [wip]
// TODO: Create database entry for the uploaded file in new table [wip]
// TODO: Add guards for undefined values [wip]
// TODO: Eventually add permissions (if not already in place elsewhere) RBAC perhaps [?]
// TODO: Automated tests? [?]

const acceptedDocumentExtensions = [
  "pdf",
  "md",
  "txt",
  "docx",
  "xlsx",
  "csv"
]


export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const { datasetId } = event.context.params as { datasetId: string };

  const { file, fileName, fileType, fileExtension } = await parseDocumentUploadForm(event)

  validateDocument(fileExtension, fileType)

  const blobName = `${datasetId}/${fileName}`

  await uploadDocumentsBlob(file.data, blobName, file.type)

  return { uploadedDocuments: 1 }

})


async function uploadDocumentsBlob(fileData: Buffer | Uint8Array, blobName: string, mimeType?: string) {
  const { AZURE_DRAFT_CONNECTION_STRING } = useRuntimeConfig();

  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_DRAFT_CONNECTION_STRING);
  const documentsContainer = blobServiceClient.getContainerClient("documents");
  await documentsContainer.createIfNotExists()

  const blobClient = documentsContainer.getBlockBlobClient(blobName)
  await blobClient.uploadData(fileData, {
    blobHTTPHeaders: {
      blobContentType: mimeType || "application/octet-stream"
    }
  })

}

interface DocumentUploadForm {
  file: MultiPartData,
  fileName: string,
  fileType?: string,
  fileExtension: string
}


async function parseDocumentUploadForm(event: H3Event): Promise<DocumentUploadForm> {
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

  if (!fileName) {
    throw createError({
      statusCode: 400,
      statusMessage: "Form is missing file name"
    })
  }

  if (!fileExtension) {
    throw createError({
      statusCode: 400,
      statusMessage: "Form is missing file extension"
    })
  }

  return { file, fileName, fileType, fileExtension }
}


function validateDocument(fileExtension: string, fileType: string | undefined) {
  const validExtension = acceptedDocumentExtensions.find((extension) => extension === fileExtension)
  if (!validExtension) {
    throw createError({
      statusCode: 400,
      statusMessage: `File must be one of: ${acceptedDocumentExtensions.toString()}`
    })
  }
}
