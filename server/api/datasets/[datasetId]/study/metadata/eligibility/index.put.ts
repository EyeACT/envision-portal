import { StudyMetadataEligibilitySchema } from "@/server/utils/study_schemas";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as { datasetId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataEligibilitySchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: body.error.format(),
      statusCode: 400,
      statusMessage: "Validation failed",
    });
  }

  const {
    exclusionCriteria,
    genderBased,
    genderDescription,
    healthyVolunteers,
    inclusionCriteria,
    maximumAgeUnit,
    maximumAgeValue,
    minimumAgeUnit,
    minimumAgeValue,
    samplingMethod,
    sex,
    studyPopulation,
  } = body.data;

  const updatedStudyEligibility = await prisma.studyEligibility.update({
    data: {
      exclusionCriteria: exclusionCriteria.filter((item) => item.trim() !== ""),
      genderBased,
      genderDescription,
      healthyVolunteers,
      inclusionCriteria: inclusionCriteria.filter((item) => item.trim() !== ""),
      maximumAgeUnit,
      maximumAgeValue,
      minimumAgeUnit,
      minimumAgeValue,
      samplingMethod,
      sex,
      studyPopulation,
    },
    where: { datasetId },
  });

  return {
    updatedStudyEligibility,
  };
});
