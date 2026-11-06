import { StudyMetadataTeamContactsSchema } from "#shared/utils/study_schemas";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  await datasetMinEditorPermission(event);

  const { datasetId } = event.context.params as { datasetId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataTeamContactsSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: z.treeifyError(body.error),
      statusCode: 400,
      statusMessage: "Validation failed",
    });
  }

  const {
    collaborators = [],
    studyContacts,
    studyOverallOfficials,
    ...sponsors
  } = body.data;

  const sponsorData = {
    datasetId,
    leadSponsorIdentifier: sponsors.leadSponsorIdentifier ?? null,
    leadSponsorIdentifierScheme: sponsors.leadSponsorIdentifierScheme ?? null,
    leadSponsorIdentifierSchemeUri:
      sponsors.leadSponsorIdentifierSchemeUri ?? null,
    leadSponsorName: sponsors.leadSponsorName ?? null,
    responsiblePartyInvestigatorAffiliationIdentifier:
      sponsors.responsiblePartyInvestigatorAffiliationIdentifier ?? null,
    responsiblePartyInvestigatorAffiliationIdentifierScheme:
      sponsors.responsiblePartyInvestigatorAffiliationIdentifierScheme ?? null,
    responsiblePartyInvestigatorAffiliationIdentifierSchemeUri:
      sponsors.responsiblePartyInvestigatorAffiliationIdentifierSchemeUri ??
      null,
    responsiblePartyInvestigatorAffiliationName:
      sponsors.responsiblePartyInvestigatorAffiliationName ?? null,
    responsiblePartyInvestigatorFamilyName:
      sponsors.responsiblePartyInvestigatorFamilyName ?? null,
    responsiblePartyInvestigatorGivenName:
      sponsors.responsiblePartyInvestigatorGivenName ?? null,
    responsiblePartyInvestigatorIdentifierScheme:
      sponsors.responsiblePartyInvestigatorIdentifierScheme ?? null,
    responsiblePartyInvestigatorIdentifierValue:
      sponsors.responsiblePartyInvestigatorIdentifierValue ?? null,
    responsiblePartyInvestigatorTitle:
      sponsors.responsiblePartyInvestigatorTitle ?? null,
    responsiblePartyType: sponsors.responsiblePartyType ?? null,
  };

  const contacts = splitRows(studyContacts);
  const officials = splitRows(studyOverallOfficials);

  // Save every section together so that a failure doesn't leave only some of them updated
  await prisma.$transaction([
    prisma.studySponsors.upsert({
      create: sponsorData,
      update: sponsorData,
      where: { datasetId },
    }),

    // Collaborators are replaced as a whole on each save
    prisma.studyCollaborators.deleteMany({
      where: { datasetId },
    }),
    prisma.studyCollaborators.createMany({
      data: collaborators
        .filter((collaborator) => !collaborator.deleted)
        .map((collaborator) => ({
          name: collaborator.name,
          datasetId,
          identifier: collaborator.identifier || "",
          scheme: collaborator.scheme || "",
          schemeUri: collaborator.schemeUri || "",
        })),
    }),

    ...contacts.toUpdate.map((contact) =>
      prisma.studyCentralContact.update({
        data: {
          affiliation: contact.affiliation,
          affiliationIdentifier: contact.affiliationIdentifier,
          affiliationIdentifierScheme: contact.affiliationIdentifierScheme,
          affiliationIdentifierSchemeUri:
            contact.affiliationIdentifierSchemeUri,
          degree: contact.degree,
          emailAddress: contact.emailAddress,
          familyName: contact.familyName,
          givenName: contact.givenName,
          identifier: contact.identifier,
          identifierScheme: contact.identifierScheme,
          identifierSchemeUri: contact.identifierSchemeUri,
          phone: contact.phone,
          phoneExt: contact.phoneExt,
        },
        where: { id: contact.id, datasetId },
      }),
    ),
    ...contacts.toCreate.map((contact) =>
      prisma.studyCentralContact.create({
        data: {
          affiliation: contact.affiliation,
          affiliationIdentifier: contact.affiliationIdentifier,
          affiliationIdentifierScheme: contact.affiliationIdentifierScheme,
          affiliationIdentifierSchemeUri:
            contact.affiliationIdentifierSchemeUri,
          datasetId,
          degree: contact.degree,
          emailAddress: contact.emailAddress,
          familyName: contact.familyName,
          givenName: contact.givenName,
          identifier: contact.identifier,
          identifierScheme: contact.identifierScheme,
          identifierSchemeUri: contact.identifierSchemeUri,
          phone: contact.phone,
          phoneExt: contact.phoneExt,
        },
      }),
    ),
    ...contacts.toDelete.map((contact) =>
      prisma.studyCentralContact.delete({
        where: { id: contact.id, datasetId },
      }),
    ),

    ...officials.toUpdate.map((official) =>
      prisma.studyOverallOfficials.update({
        data: {
          affiliation: official.affiliation,
          affiliationIdentifier: official.affiliationIdentifier,
          affiliationIdentifierScheme: official.affiliationIdentifierScheme,
          affiliationIdentifierSchemeUri:
            official.affiliationIdentifierSchemeUri,
          degree: official.degree,
          familyName: official.familyName,
          givenName: official.givenName,
          identifier: official.identifier,
          identifierScheme: official.identifierScheme,
          identifierSchemeUri: official.identifierSchemeUri,
          role: official.role,
        },
        where: { id: official.id, datasetId },
      }),
    ),
    ...officials.toCreate.map((official) =>
      prisma.studyOverallOfficials.create({
        data: {
          affiliation: official.affiliation,
          affiliationIdentifier: official.affiliationIdentifier,
          affiliationIdentifierScheme: official.affiliationIdentifierScheme,
          affiliationIdentifierSchemeUri:
            official.affiliationIdentifierSchemeUri,
          datasetId,
          degree: official.degree,
          familyName: official.familyName,
          givenName: official.givenName,
          identifier: official.identifier,
          identifierScheme: official.identifierScheme,
          identifierSchemeUri: official.identifierSchemeUri,
          role: official.role,
        },
      }),
    ),
    ...officials.toDelete.map((official) =>
      prisma.studyOverallOfficials.delete({
        where: { id: official.id, datasetId },
      }),
    ),
  ]);

  return { success: true };
});
