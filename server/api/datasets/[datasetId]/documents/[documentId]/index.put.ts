import { uploadDocument, getMimeType } from "../upload/utils"
import { z } from 'zod';

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

  const body = await readRawBody(event, false)


  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: "No body",
    })
  }

  const fileBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body)
  const fileData = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  )

  const parsedBody = DocumentUpdateBody.parse({ data: fileData })

  const newFileData = parsedBody.data

  const mimeType = await getMimeType(newFileData)

  if (mimeType !== targetDocument.mimeType) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid file update",
    })
  }

  await uploadDocument(newFileData, targetDocument.storagePath, mimeType)

  const document = await prisma.document.update({
    where: {
      id: documentId
    },
    data: {
      size: BigInt(newFileData.byteLength)
    }
  })

  let parsedDocument = JSON.stringify(
    document,
    (key, value) => (typeof value === "bigint" ? value.toString() : value), // return everything else unchange
  )

  return parsedDocument
})


const DocumentUpdateBody = z.object({
  data: z.instanceof(ArrayBuffer),
})