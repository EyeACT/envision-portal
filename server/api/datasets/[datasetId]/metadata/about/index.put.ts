import { DatasetMetadataAboutSchema } from "#shared/utils/dataset_schemas";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  await datasetMinEditorPermission(event)

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    DatasetMetadataAboutSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: z.treeifyError(body.error),
      statusCode: 400,
      statusMessage: "Invalid data",
    });
  }

  const {
    acknowledgement,
    format,
    labelingMethod,
    language,
    resourceTypeName,
    size,
    standardsFollowed,
    validationInfo,
  } = body.data;

  await prisma.datasetOther.update({
    data: {
      acknowledgement,
      format,
      labelingMethod,
      language,
      resourceTypeName,
      size,
      standardsFollowed,
      validationInfo,
    },
    where: { datasetId },
  });

  return {
    success: true,
  };
});
