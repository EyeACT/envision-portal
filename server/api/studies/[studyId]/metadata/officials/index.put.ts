import { z } from "zod";

const StudyMetadataOverallOfficialsSchema = z.object({
  studyOverallOfficials: z.array(
    z.object({
      id: z.string().optional(),
      affiliation: z.string(),
      affiliationIdentifier: z.string(),
      affiliationIdentifierScheme: z.string(),
      affiliationIdentifierSchemeUri: z.string(),
      degree: z.string(),
      deleted: z.boolean().optional(),
      familyName: z.string(),
      givenName: z.string(),
      identifier: z.string(),
      identifierScheme: z.string(),
      identifierSchemeUri: z.string(),
      role: z.string(),
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
    StudyMetadataOverallOfficialsSchema.safeParse(b),
  );

  if (!body.success) {
    console.log(body.error);

    throw createError({
      statusCode: 400,
      statusMessage: "Invalid  data",
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
        degree: official.degree,
        familyName: official.familyName,
        givenName: official.givenName,
        identifier: official.identifier,
        identifierScheme: official.identifierScheme,
        identifierSchemeUri: official.identifierSchemeUri,
        role: official.role,
        studyId,
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
