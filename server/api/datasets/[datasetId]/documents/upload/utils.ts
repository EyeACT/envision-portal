import { BlobServiceClient } from "@azure/storage-blob";
import { fileTypeFromBuffer } from 'file-type';
import { DOCUMENT_TYPES, acceptedDocumentExtensions } from "#shared/constants/documents"


export async function uploadDocument(fileData: Buffer | Uint8Array, blobName: string, mimeType: string) {
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


export function validateDocument(fileExtension: string, fileType: string | undefined) {
  const validExtension = acceptedDocumentExtensions.find((extension) => extension === fileExtension)
  if (!validExtension) {
    throw createError({
      statusCode: 400,
      statusMessage: `File must be one of: ${acceptedDocumentExtensions.toString()}`
    })
  }


  const validDocumentTypes = DOCUMENT_TYPES.map(entry => entry.value)
  const isValidDocumentType = !fileType || validDocumentTypes.find(docType => docType === fileType)
  if (!isValidDocumentType) {
    throw createError({
      statusCode: 400,
      statusMessage: `File must be one of: ${DOCUMENT_TYPES.map(entry => entry.value).toString()}`
    })
  }

}


export const getMimeType = async (fileData: Uint8Array | Buffer) => {
  const fileInfo = await fileTypeFromBuffer(fileData)

  let mimeType = fileInfo?.mime ?? ""

  return mimeType
}
