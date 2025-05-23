import { z } from "zod";

const StudyMetadataOversightSchema = z.object({
  humanSubjectReviewStatus: z.string().optional(),
  isFDARegulatedDevice: z.string().optional(),
  isFDARegulatedDrug: z.string().optional(),
  oversightHasDMC: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const { studyId } = event.context.params as { studyId: string };

  if (!studyId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing studyId",
    });
  }

  const body = await readValidatedBody(event, (b) =>
    StudyMetadataOversightSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid study oversight data",
    });
  }

  const {
    humanSubjectReviewStatus,
    isFDARegulatedDevice,
    isFDARegulatedDrug,
    oversightHasDMC,
  } = body.data;

  const data = {
    fdaRegulatedDevice: isFDARegulatedDevice ?? null,
    fdaRegulatedDrug: isFDARegulatedDrug ?? null,
    hasDmc: oversightHasDMC ?? null,
    humanSubjectReviewStatus: humanSubjectReviewStatus ?? null,
  };

  const result = await prisma.studyOversight.upsert({
    create: { studyId, ...data },
    update: data,
    where: { studyId },
  });

  return result;
});
