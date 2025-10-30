import { StudyMetadataStatusSchema } from "#shared/utils/study_schemas";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as { datasetId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataStatusSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: body.error.format(),
      statusCode: 400,
      statusMessage: "Validation failed",
    });
  }

  const {
    completionDate,
    completionDateType,
    overallStatus,
    startDate,
    startDateType,
    whyStopped,
  } = body.data;

  const updatedStudyStatus = await prisma.studyStatus.update({
    data: {
      completionDate: completionDate ? new Date(completionDate) : null,
      completionDateType,
      overallStatus,
      startDate: startDate ? new Date(startDate) : null,
      startDateType,
      whyStopped,
    },
    where: { datasetId },
  });

  return {
    updatedStudyStatus,
  };
});
