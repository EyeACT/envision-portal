import { uploadDocument, getMimeType, parseBigInt, parseDocumentUploadForm } from "../upload/utils"

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

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


  const targetDocument = await prisma.document.findUnique({
    where: {
      id: documentId
    }
  })

  if (!targetDocument) {
    throw createError({
      statusCode: 404,
      statusMessage: "Document not found",
    });
  }

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

  if (mimeType !== targetDocument.mimeType) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid file update",
    })
  }

  await uploadDocument(file.data, targetDocument.storagePath, mimeType)

  const document = await prisma.document.update({
    where: {
      id: documentId
    },
    data: {
      size: BigInt(file.data.byteLength),
      fileType: fileType != targetDocument.documentType ? fileType : targetDocument.documentType
    }
  })

  let parsedDocument = JSON.stringify(
    document,
    parseBigInt
  )

  return parsedDocument
})