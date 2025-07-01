import { z } from "zod";

const StudyMetadataArmsSchema = z.object({
  studyArms: z
    .array(
      z.object({
        id: z.string().optional(),
        deleted: z.boolean().optional(),
        description: z
          .string()
          .trim()
          .min(1, { message: "Description is required" }),
        interventionList: z.array(z.string()),
        label: z.string().trim().min(1, { message: "Label is required" }),
        type: z.string().trim().min(1, { message: "Type is required" }),
      }),
    )
    .min(1, { message: "At least one study arm is required" }),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { studyId } = event.context.params as { studyId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataArmsSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid  data",
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
        type: arm.type,
      },
      where: { id: arm.id },
    });
  }

  const studyArmsToCreate = studyArms.filter((arm) => !arm.id);

  for (const arm of studyArmsToCreate) {
    await prisma.studyArm.create({
      data: {
        description: arm.description,
        interventionList: arm.interventionList,
        label: arm.label,
        studyId,
        type: arm.type,
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
