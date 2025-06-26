import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const { studyId } = event.context.params as { studyId: string };

  if (!studyId) {
    throw createError({ statusCode: 400, statusMessage: "Missing studyId" });
  }

  const sponsor = await prisma.studySponsors.findUnique({
    where: { studyId },
  });

  const collaborators = await prisma.studyCollaborators.findMany({
    where: { studyId },
  });

  return {
    ...(sponsor ?? {
      studyId,
      responsiblePartyType: null,
      responsiblePartyInvestigatorGivenName: null,
      responsiblePartyInvestigatorFamilyName: null,
      responsiblePartyInvestigatorTitle: null,
      responsiblePartyInvestigatorIdentifierScheme: null,
      responsiblePartyInvestigatorIdentifierValue: null,
      responsiblePartyInvestigatorAffiliationName: null,
      responsiblePartyInvestigatorAffiliationIdentifier: null,
      responsiblePartyInvestigatorAffiliationIdentifierScheme: null,
      responsiblePartyInvestigatorAffiliationIdentifierSchemeUri: null,
      leadSponsorName: null,
      leadSponsorIdentifier: null,
      leadSponsorIdentifierScheme: null,
      leadSponsorIdentifierSchemeUri: null,
      created: null,
      updated: null,
    }),
    collaborators,
  };
});
