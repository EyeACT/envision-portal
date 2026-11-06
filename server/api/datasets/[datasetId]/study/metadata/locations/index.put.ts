import { StudyMetadataLocationsSchema } from "#shared/utils/study_schemas";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  await datasetMinEditorPermission(event);

  const { datasetId } = event.context.params as { datasetId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataLocationsSchema.safeParse(b),
  );

  if (!body.success) {
    console.log(body.error);

    throw createError({
      data: z.treeifyError(body.error),
      statusCode: 400,
      statusMessage: "Validation failed",
    });
  }

  const { studyLocations } = body.data;

  const studyLocationsToUpdate = splitRows(studyLocations).toUpdate;

  for (const location of studyLocationsToUpdate) {
    await prisma.studyLocation.update({
      data: {
        city: location.city,
        country: location.country,
        facility: location.facility,
        identifier: location.identifier,
        identifierScheme: location.identifierScheme,
        identifierSchemeUri: location.identifierSchemeUri,
        state: location.state,
        status: location.status,
        zip: location.zip,
      },
      where: { id: location.id, datasetId },
    });
  }

  const studyLocationsToCreate = splitRows(studyLocations).toCreate;

  for (const location of studyLocationsToCreate) {
    await prisma.studyLocation.create({
      data: {
        city: location.city,
        country: location.country,
        datasetId,
        facility: location.facility,
        identifier: location.identifier,
        identifierScheme: location.identifierScheme,
        identifierSchemeUri: location.identifierSchemeUri,
        state: location.state ?? "",
        status: location.status,
        zip: location.zip,
      },
    });
  }

  const studyLocationsToDelete = splitRows(studyLocations).toDelete;

  for (const location of studyLocationsToDelete) {
    await prisma.studyLocation.delete({
      where: { id: location.id, datasetId },
    });
  }

  return {
    studyLocations: studyLocations.filter((item) => !item.deleted),
  };
});
