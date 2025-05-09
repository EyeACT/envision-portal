import { z } from "zod";

const StudyMetadataAboutSchema = z.object({
  briefSummary: z.string().min(1),
  conditions: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      classificationCode: z.string(),
      conditionUri: z.string(),
      deleted: z.boolean().optional(),
      scheme: z.string(),
      schemeUri: z.string(),
    }),
  ),
  detailedDescription: z.string().min(1),
  keywords: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      classificationCode: z.string(),
      deleted: z.boolean().optional(),
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

  // update the keywords
  // Get the keywords that already have an id and update them
  const keywordsToUpdate = keywords.filter((keyword) => keyword.id);

  for (const keyword of keywordsToUpdate) {
    await prisma.studyKeywords.update({
      data: {
        name: keyword.name,
        classificationCode: keyword.classificationCode,
        keywordUri: keyword.keywordUri,
        scheme: keyword.scheme,
        schemeUri: keyword.schemeUri,
      },
      where: { id: keyword.id },
    });
  }

  // Get the keywords that don't have an id and create them
  const keywordsToCreate = keywords.filter((keyword) => !keyword.id);

  for (const keyword of keywordsToCreate) {
    await prisma.studyKeywords.create({
      data: {
        name: keyword.name,
        classificationCode: keyword.classificationCode,
        keywordUri: keyword.keywordUri,
        scheme: keyword.scheme,
        schemeUri: keyword.schemeUri,
        studyId,
      },
    });
  }

  // Get the keywords that are deleted and delete them
  const keywordsToDelete = keywords.filter((keyword) => keyword.deleted);

  for (const keyword of keywordsToDelete) {
    await prisma.studyKeywords.delete({
      where: { id: keyword.id },
    });
  }

  // update the conditions
  // Get the conditions that already have an id and update them
  const conditionsToUpdate = conditions.filter((condition) => condition.id);

  for (const condition of conditionsToUpdate) {
    await prisma.studyConditions.update({
      data: {
        name: condition.name,
        classificationCode: condition.classificationCode,
        conditionUri: condition.conditionUri,
        scheme: condition.scheme,
        schemeUri: condition.schemeUri,
      },
      where: { id: condition.id },
    });
  }

  // Get the conditions that don't have an id and create them
  const conditionsToCreate = conditions.filter((condition) => !condition.id);

  for (const condition of conditionsToCreate) {
    await prisma.studyConditions.create({
      data: {
        name: condition.name,
        classificationCode: condition.classificationCode,
        conditionUri: condition.conditionUri,
        scheme: condition.scheme,
        schemeUri: condition.schemeUri,
        studyId,
      },
    });
  }

  // Get the conditions that are deleted and delete them
  const conditionsToDelete = conditions.filter(
    (condition) => condition.deleted,
  );

  for (const condition of conditionsToDelete) {
    await prisma.studyConditions.delete({
      where: { id: condition.id },
    });
  }

  return {
    updatedStudyDescription,
  };
});
