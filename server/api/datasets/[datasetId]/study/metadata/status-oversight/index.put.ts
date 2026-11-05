import { StudyMetadataStatusOversightSchema } from "#shared/utils/study_schemas";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  await datasetMinEditorPermission(event);

  const { datasetId } = event.context.params as { datasetId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataStatusOversightSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: z.treeifyError(body.error),
      statusCode: 400,
      statusMessage: "Validation failed",
    });
  }

  const { oversight, status } = body.data;

  const oversightData = {
    fdaRegulatedDevice: oversight.isFDARegulatedDevice ?? null,
    fdaRegulatedDrug: oversight.isFDARegulatedDrug ?? null,
    hasDmc: oversight.oversightHasDMC ?? null,
    humanSubjectReviewStatus: oversight.humanSubjectReviewStatus ?? null,
  };

  // Save both sections together so that a failure doesn't leave one of them updated
  const [updatedStudyStatus, updatedStudyOversight] = await prisma.$transaction(
    [
      prisma.studyStatus.update({
        data: {
          completionDate: status.completionDate
            ? new Date(status.completionDate)
            : null,
          completionDateType: status.completionDateType,
          overallStatus: status.overallStatus,
          startDate: status.startDate ? new Date(status.startDate) : null,
          startDateType: status.startDateType,
          whyStopped: status.whyStopped,
        },
        where: { datasetId },
      }),
      prisma.studyOversight.upsert({
        create: { datasetId, ...oversightData },
        update: oversightData,
        where: { datasetId },
      }),
    ],
  );

  return {
    updatedStudyOversight,
    updatedStudyStatus,
  };
});
