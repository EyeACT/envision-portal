import { DatasetMetadataAboutSchema } from "#shared/utils/dataset_schemas";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    DatasetMetadataAboutSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: body.error.format(),
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
