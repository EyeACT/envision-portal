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

  return (
    sponsor ?? {
      created: null,
      leadSponsorIdentifier: null,
      leadSponsorIdentifierScheme: null,
      leadSponsorIdentifierSchemeUri: null,
      leadSponsorName: null,
      responsiblePartyInvestigatorAffiliationIdentifier: null,
      responsiblePartyInvestigatorAffiliationIdentifierScheme: null,
      responsiblePartyInvestigatorAffiliationIdentifierSchemeUri: null,
      responsiblePartyInvestigatorAffiliationName: null,
      responsiblePartyInvestigatorFamilyName: null,
      responsiblePartyInvestigatorGivenName: null,
      responsiblePartyInvestigatorIdentifierScheme: null,
      responsiblePartyInvestigatorIdentifierValue: null,
      responsiblePartyInvestigatorTitle: null,
      responsiblePartyType: null,
      studyId,
      updated: null,
    }
  );
});
