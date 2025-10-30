import { StudyMetadataOverallOfficialsSchema } from "#shared/utils/study_schemas";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as { datasetId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataOverallOfficialsSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: body.error.format(),
      statusCode: 400,
      statusMessage: "Validation failed",
    });
  }

  const { studyOverallOfficials } = body.data;

  const studyOverallOfficialsToUpdate = studyOverallOfficials.filter(
    (official) => official.id,
  );

  for (const official of studyOverallOfficialsToUpdate) {
    await prisma.studyOverallOfficials.update({
      data: {
        affiliation: official.affiliation,
        affiliationIdentifier: official.affiliationIdentifier,
        affiliationIdentifierScheme: official.affiliationIdentifierScheme,
        affiliationIdentifierSchemeUri: official.affiliationIdentifierSchemeUri,
        degree: official.degree,
        familyName: official.familyName,
        givenName: official.givenName,
        identifier: official.identifier,
        identifierScheme: official.identifierScheme,
        identifierSchemeUri: official.identifierSchemeUri,
        role: official.role,
      },
      where: { id: official.id },
    });
  }

  const studyOverallOfficialsToCreate = studyOverallOfficials.filter(
    (official) => !official.id,
  );

  for (const official of studyOverallOfficialsToCreate) {
    await prisma.studyOverallOfficials.create({
      data: {
        affiliation: official.affiliation,
        affiliationIdentifier: official.affiliationIdentifier,
        affiliationIdentifierScheme: official.affiliationIdentifierScheme,
        affiliationIdentifierSchemeUri: official.affiliationIdentifierSchemeUri,
        datasetId,
        degree: official.degree,
        familyName: official.familyName,
        givenName: official.givenName,
        identifier: official.identifier,
        identifierScheme: official.identifierScheme,
        identifierSchemeUri: official.identifierSchemeUri,
        role: official.role,
      },
    });
  }

  const studyOverallOfficialsToDelete = studyOverallOfficials.filter(
    (official) => official.deleted,
  );

  for (const official of studyOverallOfficialsToDelete) {
    await prisma.studyOverallOfficials.delete({
      where: { id: official.id },
    });
  }

  return {
    studyOverallOfficials: studyOverallOfficials.filter(
      (item) => !item.deleted,
    ),
  };
});
