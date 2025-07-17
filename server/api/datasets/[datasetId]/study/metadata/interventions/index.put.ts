import { z } from "zod";
import FORM_JSON from "~/assets/data/form.json";

const validTypes = FORM_JSON.studyMetadataInterventionsTypeOptions.map(
  (opt) => opt.value,
);

const StudyMetadataInterventionsSchema = z
  .object({
    studyInterventions: z
      .array(
        z
          .object({
            id: z.string().optional(),
            name: z.string().trim().min(1, { message: "Name is required" }),
            deleted: z.boolean().optional(),
            description: z
              .string()
              .trim()
              .min(1, { message: "Description is required" }),
            local: z.boolean().optional(),
            otherNameList: z.array(z.string()),
            type: z
              .string({
                invalid_type_error: "Type is required",
                required_error: "Type is required",
              })
              .refine((v) => validTypes.includes(v), {
                message: "Type must be a valid option",
              }),
          })
          .strict(),
        {
          invalid_type_error: "`studyInterventions` must be an array",
          required_error: "`studyInterventions` array is required",
        },
      )
      .min(1, { message: "At least one study intervention is required" }),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as { datasetId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataInterventionsSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: body.error.format(),
      statusCode: 400,
      statusMessage: "Validation failed",
    });
  }

  const { studyInterventions } = body.data;

  const studyInterventionsToUpdate = studyInterventions.filter(
    (intervention) => intervention.id,
  );

  for (const intervention of studyInterventionsToUpdate) {
    await prisma.studyIntervention.update({
      data: {
        name: intervention.name,
        description: intervention.description,
        otherNameList: intervention.otherNameList,
        type: intervention.type,
      },
      where: { id: intervention.id },
    });
  }

  const studyInterventionsToCreate = studyInterventions.filter(
    (intervention) => !intervention.id,
  );

  for (const intervention of studyInterventionsToCreate) {
    await prisma.studyIntervention.create({
      data: {
        name: intervention.name,
        datasetId,
        description: intervention.description,
        otherNameList: intervention.otherNameList,
        type: intervention.type,
      },
    });
  }

  const studyInterventionsToDelete = studyInterventions.filter(
    (intervention) => intervention.deleted,
  );

  for (const intervention of studyInterventionsToDelete) {
    await prisma.studyIntervention.delete({
      where: { id: intervention.id },
    });
  }

  return {
    studyInterventions: studyInterventions.filter((item) => !item.deleted),
  };
});
