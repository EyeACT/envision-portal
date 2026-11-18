import { parseBigInt } from "./upload/utils";
import prisma from "#server/utils/prisma";
import { defineEventHandler, createError } from "h3";
import { datasetMinViewerPermission } from "#server/utils/datasetMinViewerPermission";

export default defineEventHandler(async (event) => {
  await datasetMinViewerPermission(event);

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

  const documents = await prisma.datasetSupportingDocument.findMany({
    where: {
      datasetId: datasetId,
    },
  });

  let parsedDocuments = JSON.stringify(documents, parseBigInt);

  return parsedDocuments || "";
});
