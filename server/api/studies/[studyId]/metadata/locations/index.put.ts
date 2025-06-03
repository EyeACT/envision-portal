import { z } from "zod";

const StudyMetadataLocationsSchema = z.object({
  studyLocations: z.array(
    z.object({
      id: z.string().optional(),
      city: z.string(),
      country: z.string(),
      deleted: z.boolean().optional(),
      facility: z.string(),
      identifier: z.string(),
      identifierScheme: z.string(),
      identifierSchemeUri: z.string(),
      state: z.string(),
      status: z.string(),
      zip: z.string(),
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
    StudyMetadataLocationsSchema.safeParse(b),
  );

  if (!body.success) {
    console.log(body.error);

    throw createError({
      statusCode: 400,
      statusMessage: "Invalid  data",
    });
  }

  const { studyLocations } = body.data;

  const studyLocationsToUpdate = studyLocations.filter(
    (location) => location.id,
  );

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
      where: { id: location.id },
    });
  }

  const studyLocationsToCreate = studyLocations.filter(
    (location) => !location.id,
  );

  for (const location of studyLocationsToCreate) {
    await prisma.studyLocation.create({
      data: {
        city: location.city,
        country: location.country,
        facility: location.facility,
        identifier: location.identifier,
        identifierScheme: location.identifierScheme,
        identifierSchemeUri: location.identifierSchemeUri,
        state: location.state,
        status: location.status,
        studyId,
        zip: location.zip,
      },
    });
  }

  const studyLocationsToDelete = studyLocations.filter(
    (location) => location.deleted,
  );

  for (const location of studyLocationsToDelete) {
    await prisma.studyLocation.delete({
      where: { id: location.id },
    });
  }

  return {
    studyLocations: studyLocations.filter((item) => !item.deleted),
  };
});
