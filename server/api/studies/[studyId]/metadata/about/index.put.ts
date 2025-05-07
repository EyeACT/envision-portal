import { z } from "zod";

const StudyMetadataAboutSchema = z.object({
  briefSummary: z.string().min(1),
  conditions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      classificationCode: z.string(),
      conditionUri: z.string(),
      scheme: z.string(),
      schemeUri: z.string(),
    }),
  ),
  detailedDescription: z.string().min(1),
  keywords: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      classificationCode: z.string(),
      keywordUri: z.string(),
      scheme: z.string(),
      schemeUri: z.string(),
    }),
  ),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { studyId } = event.context.params as { studyId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataAboutSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid  data",
    });
  }

  const { briefSummary, conditions, detailedDescription, keywords } = body.data;

  const updatedStudyDescription = await prisma.studyDescription.update({
    data: {
      briefSummary,
      detailedDescription,
    },
    where: {
      studyId,
    },
  });

  const updatedStudyKeywords = await prisma.studyKeywords.createMany({
    data: keywords.map((keyword) => ({ keyword })),
  });

  const updatedStudyConditions = await prisma.studyConditions.createMany({
    data: conditions.map((condition) => ({ condition })),
  });

  return {
    updatedStudyConditions,
    updatedStudyDescription,
    updatedStudyKeywords,
  };
});
