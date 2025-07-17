import { z } from "zod";
import FORM_JSON from "~/assets/data/form.json";

const validStatuses = FORM_JSON.studyMetadataStatusOptions.map(
  (opt) => opt.value,
);

const dateTypes = FORM_JSON.studyMetadataEnrollmentTypeOptions.map(
  (opt) => opt.value,
);
const conditionalStatuses = ["Suspended", "Terminated", "Withdrawn"];

const StudyMetadataStatusSchema = z
  .object({
    completionDate: z
      .string({
        invalid_type_error: "Completion date is required",
        required_error: "Completion date is required",
      })
      .date("Date must be in YYYY-MM-DD format")
      .trim(),
    completionDateType: z
      .string({
        invalid_type_error: "Completion date type is required",
        required_error: "Completion date type is required",
      })
      .trim()
      .refine((v) => dateTypes.includes(v), {
        message: `Completion date type must be one of: ${dateTypes.join(", ")}`,
      }),
    overallStatus: z
      .string({
        invalid_type_error: "Overall status is required",
        required_error: "Overall status is required",
      })
      .trim()
      .refine((v) => validStatuses.includes(v), {
        message: `Overall status must be one of: ${validStatuses.join(", ")}`,
      }),
    startDate: z
      .string({
        invalid_type_error: "Start date is required",
        required_error: "Start date is required",
      })
      .date("Date must be in YYYY-MM-DD format")
      .trim(),
    startDateType: z
      .string({
        invalid_type_error: "Start date type is required",
        required_error: "Start date type is required",
      })
      .trim()
      .refine((v) => dateTypes.includes(v), {
        message: `Start date type must be one of: ${dateTypes.join(", ")}`,
      }),
    whyStopped: z.string().trim().optional(),
  })
  .strict()
  .superRefine((data, context) => {
    if (conditionalStatuses.includes(data.overallStatus) && !data.whyStopped) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "A valid reason is required when the study is suspended, terminated or withdrawn",
        path: ["whyStopped"],
      });
    }
  });

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
