
import { parseDocumentUploadForm, validateDocument, getMimeType, uploadDocument, parseBigInt } from "./upload/utils"
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

  const { file, fileType } = await parseDocumentUploadForm(formData)

  let mimeType = await getMimeType(file.data)

  // could not detect mimetype from binary or is text based
  if (!mimeType) {
    // use provided mimetype for now
    mimeType = file.type!
  }

  const sanitizedName = sanitizeFileName(file.filename!).toLocaleLowerCase()

  const sanitziedExtension = sanitizedName.split(".").pop()

  if (!sanitziedExtension) {
    throw createError({
      statusCode: 400,
      statusMessage: `File missing an extension.`
    })
  }

  validateDocument(sanitziedExtension, fileType, mimeType)

  const storagePath = `${datasetId}/${sanitizedName}`

  await uploadDocument(file.data, storagePath, mimeType)

  const document = await prisma.document.create({
    data: {
      originalName: file.filename,
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
    parseBigInt
  )

  return parsedDocument
})


