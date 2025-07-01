import { z } from "zod";

import FORM_JSON from "~/assets/data/form.json";

const validHumanStatuses =
  FORM_JSON.studyMetadataHumanSubjectReviewStatusOptions.map(
    (opt) => opt.value,
  );
const validYesNo = ["Yes", "No"];

const StudyMetadataOversightSchema = z.object({
  humanSubjectReviewStatus: z
    .string({
      invalid_type_error: "Human Subject Review Status is required.",
      required_error: "Human Subject Review Status is required.",
    })
    .trim()
    .refine((v) => validHumanStatuses.includes(v), {
      message: "Invalid Human Subject Review Status.",
    }),

  isFDARegulatedDevice: z
    .string({
      invalid_type_error: "FDA Regulated Device selection is required.",
      required_error: "FDA Regulated Device selection is required.",
    })
    .trim()
    .refine((v) => validYesNo.includes(v), {
      message: "Invalid option for FDA Regulated Device.",
    }),

  isFDARegulatedDrug: z
    .string({
      invalid_type_error: "FDA Regulated Drug selection is required.",
      required_error: "FDA Regulated Drug selection is required.",
    })
    .trim()
    .refine((v) => validYesNo.includes(v), {
      message: "Invalid option for FDA Regulated Drug.",
    }),

  oversightHasDMC: z
    .string({
      invalid_type_error: "Has DMC selection is required.",
      required_error: "Has DMC selection is required.",
    })
    .trim()
    .refine((v) => validYesNo.includes(v), {
      message: "Invalid option for Has DMC.",
    }),
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
      data: body.error.format(),
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
    create: { studyId, ...data },
    update: data,
    where: { studyId },
  });

  return result;
});
