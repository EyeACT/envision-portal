import { z } from "zod";

const DatasetMetadataAboutSchema = z.object({
  acknowledgement: z.string(),
  format: z.array(z.string()),
  labelingMethod: z.string(),
  language: z.string(),
  resourceType: z.string(),
  resourceTypeName: z.string(),
  size: z.array(z.string()),
  standardsFollowed: z.string(),
  validationInfo: z.string(),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId, studyId } = event.context.params as {
    datasetId: string;
    studyId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    DatasetMetadataAboutSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
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
