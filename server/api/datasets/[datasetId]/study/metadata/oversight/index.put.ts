import { StudyMetadataOversightSchema } from "#shared/utils/study_schemas";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  const { datasetId } = event.context.params as { datasetId: string };

  if (!datasetId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing datasetId",
    });
  }

  const body = await readValidatedBody(event, (b) =>
    StudyMetadataOversightSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: z.treeifyError(body.error),
      statusCode: 400,
      statusMessage: "Validation failed",
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
    create: { datasetId, ...data },
    update: data,
    where: { datasetId },
  });

  return result;
});
