import { z } from "zod";
import FORM_JSON from "@/assets/data/form.json";
const typeOptions = FORM_JSON.studyMetadataArmsTypeOptions.map(
  (opt) => opt.value,
);

const StudyMetadataArmsSchema = z
  .object({
    studyArms: z
      .array(
        z
          .object({
            id: z.string().trim().optional(),
            deleted: z.boolean().optional(),
            description: z
              .string()
              .trim()
              .min(1, { message: "Description is required" }),
            interventionList: z.array(z.string()),
            label: z.string().trim().min(1, { message: "Label is required" }),
            local: z.boolean().optional(),
            type: z.preprocess(
              (val) => {
                // if incoming value is a string that’s just empty/whitespace, treat it as undefined
                if (typeof val === "string" && val.trim() === "") {
                  return undefined;
                }

                return val;
              },
              z
                .string()
                .trim()
                .refine((val) => typeOptions.includes(val), {
                  message: `Type must be one of: ${typeOptions.join(", ")}`,
                })
                .optional(),
            ),
          })
          .strict(),
      )
      .min(1, { message: "At least one study arm is required" }),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as { datasetId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataArmsSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: body.error.format(),
      statusCode: 400,
      statusMessage: "Validation failed",
    });
  }

  const { studyArms } = body.data;

  const studyArmsToUpdate = studyArms.filter((arm) => arm.id);

  for (const arm of studyArmsToUpdate) {
    await prisma.studyArm.update({
      data: {
        description: arm.description,
        interventionList: arm.interventionList,
        label: arm.label,
        type: arm.type || "",
      },
      where: { id: arm.id },
    });
  }

  const studyArmsToCreate = studyArms.filter((arm) => !arm.id);

  for (const arm of studyArmsToCreate) {
    await prisma.studyArm.create({
      data: {
        datasetId,
        description: arm.description,
        interventionList: arm.interventionList,
        label: arm.label,
        type: arm.type || "",
      },
    });
  }

  const studyArmsToDelete = studyArms.filter((arm) => arm.deleted);

  for (const arm of studyArmsToDelete) {
    await prisma.studyArm.delete({
      where: { id: arm.id },
    });
  }

  return {
    studyArms: studyArms.filter((item) => !item.deleted),
  };
});
