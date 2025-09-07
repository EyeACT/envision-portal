import { StudyMetadataArmsSchema } from "@/server/utils/study_schemas";

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
