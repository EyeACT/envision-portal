import { z } from "zod";

const StudyMetadataEligibilitySchema = z.object({
  exclusionCriteria: z.array(z.string()),
  genderBased: z.string(),
  genderDescription: z.string(),
  healthyVolunteers: z.string(),
  inclusionCriteria: z.array(z.string()),
  maximumAgeUnit: z.string(),
  maximumAgeValue: z.number(),
  minimumAgeUnit: z.string(),
  minimumAgeValue: z.number(),
  samplingMethod: z.string(),
  sex: z.string(),
  studyPopulation: z.string(),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { studyId } = event.context.params as { studyId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataEligibilitySchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid  data",
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

  const updatedStudyEligibility = await prisma.studyEligibilty.update({
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
    where: { studyId },
  });

  return {
    updatedStudyEligibility,
  };
});
