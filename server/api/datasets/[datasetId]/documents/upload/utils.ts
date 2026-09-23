import { BlobServiceClient } from "@azure/storage-blob";
import { fileTypeFromBuffer } from 'file-type';
import { DOCUMENT_TYPES, ACCEPTED_DOCUMENT_EXTENSIONS, ACCEPTED_DOCUMENT_MIMETYPES } from "#shared/constants/documents"
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


export function validateDocument(fileExtension: string, fileType: string | undefined, mimeType: string, sizeInBytes: number) {
  const validExtension = ACCEPTED_DOCUMENT_EXTENSIONS.find((extension) => extension === fileExtension)
  if (!validExtension) {
    throw createError({
      statusCode: 400,
      statusMessage: `File must be one of: ${ACCEPTED_DOCUMENT_EXTENSIONS.toString()}`
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


  const isValidMimetype = ACCEPTED_DOCUMENT_MIMETYPES.includes(mimeType)
  if (!isValidMimetype) {
    throw createError({
      statusCode: 400,
      statusMessage: `File mime type is invalid.`
    })
  }

  const maxBytes = 15 * 1024 * 1024
  if (sizeInBytes > maxBytes) {
    throw createError({
      statusCode: 400,
      statusMessage: `File size is larger than 15MB.`
    })
  }

}
interface DocumentUploadForm {
  file: MultiPartData,
  fileType?: string,
}

export async function parseDocumentUploadForm(formData: MultiPartData[]): Promise<DocumentUploadForm> {
  const file = formData.find((part) => part.name === "file")
  const fileType = formData.find((part) => part.name === "fileType")?.data.toString()


  if (!file) {
    throw createError({
      statusCode: 400,
      statusMessage: "No file included in the form data"
    })
  }

  if (!file.filename) {
    throw createError({
      statusCode: 400,
      statusMessage: "No file name included in the form data"
    })
  }

  if (!file.type) {
    throw createError({
      statusCode: 400,
      statusMessage: "No mimetype included in the form data"
    })
  }


  return { file, fileType }
}


export const getMimeType = async (fileData: ArrayBuffer | Buffer<ArrayBufferLike>) => {
  const fileInfo = await fileTypeFromBuffer(fileData)

  let mimeType = fileInfo?.mime ?? ""

  return mimeType
}


export const parseBigInt = (key: string, value: any) => (typeof value === "bigint" ? value.toString() : value)
