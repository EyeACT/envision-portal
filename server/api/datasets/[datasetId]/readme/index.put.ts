import { z } from "zod";
import prisma from "#server/utils/prisma";
import { defineEventHandler, readValidatedBody, createError } from "h3";
import { datasetMinEditorPermission } from "#server/utils/datasetMinEditorPermission";

const DatasetReadmeSchema = z.object({
  readme: z.string(),
});

export default defineEventHandler(async (event) => {
  await datasetMinEditorPermission(event);

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    DatasetReadmeSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid  data",
    });
  }

  const { readme } = body.data;

  await prisma.dataset.update({
    data: {
      readme,
    },
    where: {
      id: datasetId,
    },
  });

  return {
    success: true,
  };
});
