
import { parseBigInt } from "./upload/utils"



export default defineEventHandler(async (event) => {

  const session = await requireUserSession(event);

  const { datasetId } = event.context.params as {
    datasetId: string;
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


  const documents = await prisma.document.findMany({
    where: {
      datasetId: datasetId
    }
  })


  let parsedDocuments = JSON.stringify(
    documents,
    parseBigInt
  )

  return parsedDocuments || ""
})