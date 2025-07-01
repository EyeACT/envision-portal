import { z } from "zod";
import FORM_JSON from "~/assets/data/form.json"; // where your enums live

const sexEnumValues = FORM_JSON.studyMetadataEligibilityGenderOptions.map(
  (o) => o.value,
);
const genderEnumValues =
  FORM_JSON.studyMetadataEligibilityGenderBasedOptions.map((o) => o.value);
const ageUnitEnumValues = FORM_JSON.studyMetadataEligibilityAgeUnitOptions.map(
  (o) => o.value,
);
const healthyVolunteersEnumValues =
  FORM_JSON.studyMetadataEligibilityHealthyVolunteersOptions.map(
    (o) => o.value,
  );

const StudyMetadataEligibilitySchema = z.object({
  exclusionCriteria: z
    .array(z.string().trim().min(1, { message: "Field cannot be empty" }))
    .min(1, { message: "At least one exclusion criteria is required" }),
  genderBased: z
    .string()
    .trim()
    .min(1, { message: "Gender based is required" })
    .refine((v) => genderEnumValues.includes(v), {
      message: `Gender based must be one of: ${genderEnumValues.join(", ")}`,
    }),
  genderDescription: z.string(),
  healthyVolunteers: z
    .string()
    .trim()
    .min(1, { message: "Healthy volunteers is required" })
    .refine((v) => healthyVolunteersEnumValues.includes(v), {
      message: `Healthy volunteers must be one of: ${healthyVolunteersEnumValues.join(
        ", ",
      )}`,
    }),
  inclusionCriteria: z
    .array(z.string().trim().min(1, { message: "Field cannot be empty" }))
    .min(1, { message: "At least one inclusion criteria is required" }),
  maximumAgeUnit: z
    .string()
    .trim()
    .min(1, { message: "Maximum age unit is required" })
    .refine((v) => ageUnitEnumValues.includes(v), {
      message: `Maximum age unit must be one of: ${ageUnitEnumValues.join(
        ", ",
      )}`,
    }),
  maximumAgeValue: z
    .number()
    .gt(0, { message: "Maximum age value must be greater than 0" }),
  minimumAgeUnit: z
    .string()
    .trim()
    .min(1, { message: "Minimum age unit is required" })
    .refine((v) => ageUnitEnumValues.includes(v), {
      message: `Minimum age unit must be one of: ${ageUnitEnumValues.join(
        ", ",
      )}`,
    }),
  minimumAgeValue: z
    .number()
    .gt(0, { message: "Minimum age value must be greater than 0" }),
  samplingMethod: z.string(),
  sex: z
    .string()
    .trim()
    .min(1, { message: "Sex is required" })
    .refine((v) => sexEnumValues.includes(v), {
      message: `Sex must be one of: ${sexEnumValues.join(", ")}`,
    }),
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
      data: body.error.format(),
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
