import { z } from "zod";

const DatasetMetadataAboutSchema = z.object({
  acknowledgement: z.string(),
  format: z.array(z.string()),
  labelingMethod: z.string(),
  language: z.string().min(2, "Language code is required"),
  resourceType: z.string().min(1, "Resource type is required"),
  resourceTypeName: z.string().min(1, "Resource type name is required"),
  size: z.array(z.string().min(1)).min(1, "At least one size is required"),
  standardsFollowed: z.string(),
  validationInfo: z.string(),
});

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
      statusMessage: "Invalid  data",
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
