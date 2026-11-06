import { StudyMetadataArmsInterventionsSchema } from "#shared/utils/study_schemas";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  await datasetMinEditorPermission(event);

  const { datasetId } = event.context.params as { datasetId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataArmsInterventionsSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: z.treeifyError(body.error),
      statusCode: 400,
      statusMessage: "Validation failed",
    });
  }

  const { studyArms, studyInterventions } = body.data;

  const arms = splitRows(studyArms);
  const interventions = splitRows(studyInterventions);

  // Save every section together so that a failure doesn't leave only some of them updated
  await prisma.$transaction([
    ...arms.toUpdate.map((arm) =>
      prisma.studyArm.update({
        data: {
          description: arm.description,
          interventionList: arm.interventionList,
          label: arm.label,
          type: arm.type || "",
        },
        where: { id: arm.id, datasetId },
      }),
    ),
    ...arms.toCreate.map((arm) =>
      prisma.studyArm.create({
        data: {
          datasetId,
          description: arm.description,
          interventionList: arm.interventionList,
          label: arm.label,
          type: arm.type || "",
        },
      }),
    ),
    ...arms.toDelete.map((arm) =>
      prisma.studyArm.delete({
        where: { id: arm.id, datasetId },
      }),
    ),

    ...interventions.toUpdate.map((intervention) =>
      prisma.studyIntervention.update({
        data: {
          name: intervention.name,
          description: intervention.description,
          otherNameList: intervention.otherNameList,
          type: intervention.type,
        },
        where: { id: intervention.id, datasetId },
      }),
    ),
    ...interventions.toCreate.map((intervention) =>
      prisma.studyIntervention.create({
        data: {
          name: intervention.name,
          datasetId,
          description: intervention.description,
          otherNameList: intervention.otherNameList,
          type: intervention.type,
        },
      }),
    ),
    ...interventions.toDelete.map((intervention) =>
      prisma.studyIntervention.delete({
        where: { id: intervention.id, datasetId },
      }),
    ),
  ]);

  return { success: true };
});
