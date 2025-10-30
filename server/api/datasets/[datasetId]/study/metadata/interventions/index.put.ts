import { StudyMetadataInterventionsSchema } from "#shared/utils/study_schemas";

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
