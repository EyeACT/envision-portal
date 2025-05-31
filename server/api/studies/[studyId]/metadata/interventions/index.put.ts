import { z } from "zod";

const StudyMetadataInterventionsSchema = z.object({
  studyInterventions: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      deleted: z.boolean().optional(),
      description: z.string(),
      otherNameList: z.array(z.string()),
      type: z.string(),
    }),
  ),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { studyId } = event.context.params as { studyId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataInterventionsSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid  data",
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
        description: intervention.description,
        otherNameList: intervention.otherNameList,
        studyId,
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
