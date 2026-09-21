import { BlobServiceClient } from "@azure/storage-blob";
import { fileTypeFromBuffer } from 'file-type';
import { DOCUMENT_TYPES, acceptedDocumentExtensions } from "#shared/constants/documents"
import type { H3Event, MultiPartData } from "h3"


export async function uploadDocument(fileData: Buffer | Uint8Array | ArrayBuffer, blobName: string, mimeType: string) {
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
interface DocumentUploadForm {
  file: MultiPartData,
  fileName: string,
  fileType?: string,
  fileExtension: string
}

export async function parseDocumentUploadForm(formData: MultiPartData[]): Promise<DocumentUploadForm> {
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


export const getMimeType = async (fileData: ArrayBuffer | Buffer<ArrayBufferLike>) => {
  const fileInfo = await fileTypeFromBuffer(fileData)

  let mimeType = fileInfo?.mime ?? ""

  return mimeType
}


export const parseBigInt = (key: string, value: any) => (typeof value === "bigint" ? value.toString() : value)
