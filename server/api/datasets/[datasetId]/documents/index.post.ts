
import { parseDocumentUploadForm, validateDocument, getMimeType, uploadDocument } from "./upload/utils"
// import { DocumentUploadForm } from "./upload/schema"
import { sanitizeFileName } from "#shared/utils/documents"


export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const { datasetId } = event.context.params as { datasetId: string };

  const formData = await readMultipartFormData(event)

  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing form data",
    });
  }

  const { file, fileExtension, fileName, fileType } = await parseDocumentUploadForm(formData)

  validateDocument(fileExtension, fileType ?? "")

  const mimeType = await getMimeType(file.data)

  const sanitizedName = sanitizeFileName(fileName).toLocaleLowerCase()

  const storagePath = `${datasetId}/${sanitizedName}`

  await uploadDocument(file.data, storagePath, mimeType)

  const document = await prisma.document.create({
    data: {
      originalName: fileName,
      sanitizedName: sanitizedName,
      documentType: fileType ?? "",
      storagePath,
      mimeType: mimeType,
      datasetId: datasetId,
      size: BigInt(file.data.byteLength)
    }
  })

  let parsedDocument = JSON.stringify(
    document,
    (key, value) => (typeof value === "bigint" ? value.toString() : value), // return everything else unchange
  )

  return parsedDocument
})


