import { z } from "zod";
import FORM_JSON from "@/assets/data/form.json";

const partyTypeOptions =
  FORM_JSON.studyMetadataSponsorsResponsiblePartyTypeOptions.map(
    (opt) => opt.value,
  );

const CollaboratorSchema = z
  .object({
    id: z.string().optional(),
    name: z.string(),
    deleted: z.boolean().optional(),
    identifier: z.string(),
    scheme: z.string(),
    schemeUri: z.string(),
  })
  .strict()
  .superRefine((data, ctx) => {
    // If scheme is provided, schemeUri must also be provided
    if (
      (data.scheme && !data.identifier) ||
      (!data.scheme && data.identifier)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "If scheme is provided, schemeUri must also be provided",
      });
    }
  });

const StudyMetadataSponsorsSchema = z
  .object({
    collaborators: z.array(CollaboratorSchema).optional(),
    leadSponsorIdentifier: z.string().trim().optional(),
    leadSponsorIdentifierScheme: z.string().trim().optional(),
    leadSponsorIdentifierSchemeUri: z.string().trim().optional(),
    leadSponsorName: z.string().trim().optional(),
    responsiblePartyInvestigatorAffiliationIdentifier: z
      .string()
      .trim()
      .optional(),
    responsiblePartyInvestigatorAffiliationIdentifierScheme: z
      .string()
      .trim()
      .optional(),
    responsiblePartyInvestigatorAffiliationIdentifierSchemeUri: z
      .string()
      .trim()
      .optional(),
    responsiblePartyInvestigatorAffiliationName: z.string().trim().optional(),
    responsiblePartyInvestigatorFamilyName: z.string().trim().optional(),
    responsiblePartyInvestigatorGivenName: z.string().trim().optional(),
    responsiblePartyInvestigatorIdentifierScheme: z.string().trim().optional(),
    responsiblePartyInvestigatorIdentifierValue: z.string().trim().optional(),
    responsiblePartyInvestigatorTitle: z.string().trim().optional(),
    responsiblePartyType: z
      .string()
      .trim()
      .optional()
      .refine(
        (v) =>
          partyTypeOptions.includes(v as (typeof partyTypeOptions)[number]),
        {
          message: `Responsible party type must be one of: ${partyTypeOptions.join(", ")}`,
        },
      ),
  })
  .strict()
  .superRefine((data, ctx) => {
    // If identifierscheme is provided, identifierSchemeUri must also be provided
    if (
      (data.leadSponsorIdentifier && !data.leadSponsorIdentifierScheme) ||
      (!data.leadSponsorIdentifier && data.leadSponsorIdentifierScheme)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "If lead sponsor identifier scheme is provided, identifier scheme URI must also be provided",
      });
    }

    if (
      (data.responsiblePartyInvestigatorAffiliationIdentifier &&
        !data.responsiblePartyInvestigatorAffiliationIdentifierScheme) ||
      (!data.responsiblePartyInvestigatorAffiliationIdentifier &&
        data.responsiblePartyInvestigatorAffiliationIdentifierScheme)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "If responsible party investigator affiliation identifier scheme is provided, identifier scheme URI must also be provided",
      });
    }
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
      data: body.error.format(),
      statusCode: 400,
      statusMessage: "Invalid study sponsor data",
    });
  }

  const data = {
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
    studyId,
  };

  await prisma.studySponsors.upsert({
    create: data,
    update: data,
    where: { studyId },
  });

  // Handle collaborators
  if (Array.isArray(body.data.collaborators)) {
    const collaboratorsToSave = body.data.collaborators.filter(
      (c) => !c.deleted,
    );

    await prisma.studyCollaborators.deleteMany({
      where: { studyId },
    });

    if (collaboratorsToSave.length > 0) {
      await prisma.studyCollaborators.createMany({
        data: collaboratorsToSave.map((c) => ({
          name: c.name,
          identifier: c.identifier,
          scheme: c.scheme,
          schemeUri: c.schemeUri,
          studyId,
        })),
      });
    }
  }

  return { success: true };
});
