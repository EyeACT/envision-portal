import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CollaboratorSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  identifier: z.string(),
  scheme: z.string(),
  schemeUri: z.string(),
  deleted: z.boolean().optional(),
});

const StudyMetadataSponsorsSchema = z.object({
  responsiblePartyType: z.string().optional(),
  responsiblePartyInvestigatorGivenName: z.string().optional(),
  responsiblePartyInvestigatorFamilyName: z.string().optional(),
  responsiblePartyInvestigatorTitle: z.string().optional(),
  responsiblePartyInvestigatorIdentifierScheme: z.string().optional(),
  responsiblePartyInvestigatorIdentifierValue: z.string().optional(),
  responsiblePartyInvestigatorAffiliationName: z.string().optional(),
  responsiblePartyInvestigatorAffiliationIdentifier: z.string().optional(),
  responsiblePartyInvestigatorAffiliationIdentifierScheme: z.string().optional(),
  responsiblePartyInvestigatorAffiliationIdentifierSchemeUri: z.string().optional(),
  leadSponsorName: z.string().optional(),
  leadSponsorIdentifier: z.string().optional(),
  leadSponsorIdentifierScheme: z.string().optional(),
  leadSponsorIdentifierSchemeUri: z.string().optional(),
  collaborators: z.array(CollaboratorSchema).optional(),
});

export default defineEventHandler(async (event) => {
  const { studyId } = event.context.params as { studyId: string };

  if (!studyId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing studyId",
    });
  }

  const body = await readValidatedBody(event, (b) =>
    StudyMetadataSponsorsSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid study sponsor data",
    });
  }

  const data = {
    studyId,
    responsiblePartyType: body.data.responsiblePartyType ?? null,
    responsiblePartyInvestigatorGivenName: body.data.responsiblePartyInvestigatorGivenName ?? null,
    responsiblePartyInvestigatorFamilyName: body.data.responsiblePartyInvestigatorFamilyName ?? null,
    responsiblePartyInvestigatorTitle: body.data.responsiblePartyInvestigatorTitle ?? null,
    responsiblePartyInvestigatorIdentifierScheme: body.data.responsiblePartyInvestigatorIdentifierScheme ?? null,
    responsiblePartyInvestigatorIdentifierValue: body.data.responsiblePartyInvestigatorIdentifierValue ?? null,
    responsiblePartyInvestigatorAffiliationName: body.data.responsiblePartyInvestigatorAffiliationName ?? null,
    responsiblePartyInvestigatorAffiliationIdentifier: body.data.responsiblePartyInvestigatorAffiliationIdentifier ?? null,
    responsiblePartyInvestigatorAffiliationIdentifierScheme: body.data.responsiblePartyInvestigatorAffiliationIdentifierScheme ?? null,
    responsiblePartyInvestigatorAffiliationIdentifierSchemeUri: body.data.responsiblePartyInvestigatorAffiliationIdentifierSchemeUri ?? null,
    leadSponsorName: body.data.leadSponsorName ?? null,
    leadSponsorIdentifier: body.data.leadSponsorIdentifier ?? null,
    leadSponsorIdentifierScheme: body.data.leadSponsorIdentifierScheme ?? null,
    leadSponsorIdentifierSchemeUri: body.data.leadSponsorIdentifierSchemeUri ?? null,
  };

  const result = await prisma.studySponsors.upsert({
    create: data,
    update: data,
    where: { studyId },
  });

  // Handle collaborators
  if (Array.isArray(body.data.collaborators)) {
    const collaboratorsToSave = body.data.collaborators.filter(c => !c.deleted);

    await prisma.studyCollaborators.deleteMany({
      where: { studyId },
    });

    if (collaboratorsToSave.length > 0) {
      await prisma.studyCollaborators.createMany({
        data: collaboratorsToSave.map((c) => ({
          studyId,
          name: c.name,
          identifier: c.identifier,
          scheme: c.scheme,
          schemeUri: c.schemeUri,
        })),
      });
    }
  }

  return { success: true };
});
