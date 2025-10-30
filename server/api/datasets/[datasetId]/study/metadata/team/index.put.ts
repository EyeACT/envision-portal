import { StudyMetadataSponsorsSchema } from "#shared/utils/study_schemas";

export default defineEventHandler(async (event) => {
  const { datasetId } = event.context.params as { datasetId: string };

  if (!datasetId) {
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
      data: body.error.format(),
      statusCode: 400,
      statusMessage: "Invalid study sponsor data",
    });
  }

  const data = {
    datasetId,
    leadSponsorIdentifier: body.data.leadSponsorIdentifier ?? null,
    leadSponsorIdentifierScheme: body.data.leadSponsorIdentifierScheme ?? null,
    leadSponsorIdentifierSchemeUri:
      body.data.leadSponsorIdentifierSchemeUri ?? null,
    leadSponsorName: body.data.leadSponsorName ?? null,
    responsiblePartyInvestigatorAffiliationIdentifier:
      body.data.responsiblePartyInvestigatorAffiliationIdentifier ?? null,
    responsiblePartyInvestigatorAffiliationIdentifierScheme:
      body.data.responsiblePartyInvestigatorAffiliationIdentifierScheme ?? null,
    responsiblePartyInvestigatorAffiliationIdentifierSchemeUri:
      body.data.responsiblePartyInvestigatorAffiliationIdentifierSchemeUri ??
      null,
    responsiblePartyInvestigatorAffiliationName:
      body.data.responsiblePartyInvestigatorAffiliationName ?? null,
    responsiblePartyInvestigatorFamilyName:
      body.data.responsiblePartyInvestigatorFamilyName ?? null,
    responsiblePartyInvestigatorGivenName:
      body.data.responsiblePartyInvestigatorGivenName ?? null,
    responsiblePartyInvestigatorIdentifierScheme:
      body.data.responsiblePartyInvestigatorIdentifierScheme ?? null,
    responsiblePartyInvestigatorIdentifierValue:
      body.data.responsiblePartyInvestigatorIdentifierValue ?? null,
    responsiblePartyInvestigatorTitle:
      body.data.responsiblePartyInvestigatorTitle ?? null,
    responsiblePartyType: body.data.responsiblePartyType ?? null,
  };

  await prisma.studySponsors.upsert({
    create: data,
    update: data,
    where: { datasetId },
  });

  // Handle collaborators
  if (Array.isArray(body.data.collaborators)) {
    const collaboratorsToSave = body.data.collaborators.filter(
      (c) => !c.deleted,
    );

    await prisma.studyCollaborators.deleteMany({
      where: { datasetId },
    });

    if (collaboratorsToSave.length > 0) {
      await prisma.studyCollaborators.createMany({
        data: collaboratorsToSave.map((c) => ({
          name: c.name,
          datasetId,
          identifier: c.identifier || "",
          scheme: c.scheme || "",
          schemeUri: c.schemeUri || "",
        })),
      });
    }
  }

  return { success: true };
});
