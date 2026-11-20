import { z } from "zod";
import prisma from "#server/utils/prisma";
import { defineEventHandler, readValidatedBody, createError } from "h3";
import { datasetMinEditorPermission } from "#server/utils/datasetMinEditorPermission";

const DatasetHealthsheetUsesSchema = z.object({
  records: z.array(
    z.object({
      id: z.number(),
      question: z.string(),
      response: z.string(),
    }),
  ),
  version: z.number(),
});

export default defineEventHandler(async (event) => {
  await datasetMinEditorPermission(event);

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    DatasetHealthsheetUsesSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid  data",
    });
  }

  const { records, version } = body.data;

  const uses = await prisma.datasetHealthsheet.update({
    data: {
      uses: JSON.stringify({
        records,
        version,
      }),
    },
    where: {
      datasetId,
    },
  });

  return {
    success: true,
  };
});
