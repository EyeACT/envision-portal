import { z } from "zod";
import FORM_JSON from "@/assets/data/form.json";

const nameTypeOptions = FORM_JSON.datasetNameTypeOptions.map(
  (opt) => opt.value,
);

const contribTypeOptions = FORM_JSON.datasetContributorTypeOptions.map(
  (opt) => opt.value,
);

// Define the common validation function
const validateNameIdentifier = (data: any, ctx: z.RefinementCtx) => {
  if (
    (data.nameIdentifier && !data.nameIdentifierScheme) ||
    (!data.nameIdentifier && data.nameIdentifierScheme)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Both nameIdentifierScheme and nameIdentifier must be provided together",
    });
  }
};

// Create base schema for creators and contributors
const baseCreatorObjectSchema = z
  .object({
    id: z.string().optional(),
    affiliations: z
      .array(
        z.object({
          affiliation: z.string(),
          identifier: z.string().optional(),
          identifierScheme: z.string().optional(),
          identifierSchemeUri: z.string().optional(),
        }),
      )
      .optional(),
    deleted: z.boolean().optional(),
    familyName: z.string(),
    givenName: z.string(),
    local: z.boolean().optional(),
    nameIdentifier: z.string().optional(),
    nameIdentifierScheme: z.string().optional(),
    nameIdentifierSchemeUri: z.string().optional(),
    nameType: z
      .string()
      .trim()
      .min(1, "Name type is required")
      .refine((v) => nameTypeOptions.includes(v), {
        message: `Name type must be one of: ${nameTypeOptions.join(", ")}`,
      }),
  })
  .strict();

// Add the nameIdentifier validation to the creator schema
const creatorSchema = baseCreatorObjectSchema.superRefine(
  validateNameIdentifier,
);

// Contributor schema is the same as creator schema but with an additional contributorType field
const contributorSchema = baseCreatorObjectSchema
  .extend({
    contributorType: z
      .string()
      .trim()
      .min(1, "Contributor type is required")
      .refine((v) => contribTypeOptions.includes(v), {
        message: `Contributor type must be one of: ${contribTypeOptions.join(", ")}`,
      }),
  })
  .superRefine(validateNameIdentifier);

const funderSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    awardNumber: z.string().trim().optional(),
    awardTitle: z.string().trim().optional(),
    awardUri: z.string().trim().optional(),
    deleted: z.boolean().optional(),
    identifier: z.string().trim().optional(),
    identifierSchemeUri: z.string().trim().optional(),
    identifierType: z.string().trim().optional(),
    local: z.boolean().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      (data.identifierType && !data.identifier) ||
      (!data.identifierType && data.identifier)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Both identifierType and identifier must be provided together",
      });
    }
  });

const managingOrgSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    identifier: z.string().trim().optional(),
    identifierScheme: z.string().trim().optional(),
    identifierSchemeUri: z.string().trim().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      (data.identifierScheme && !data.identifier) ||
      (!data.identifierScheme && data.identifier)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Both identifierType and identifier must be provided together",
      });
    }
  });

const DatasetMetadataTeamSchema = z
  .object({
    contributors: z.array(contributorSchema),
    creators: z.array(creatorSchema),
    funders: z.array(funderSchema),
    managingOrganization: managingOrgSchema,
  })
  .strict();

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    DatasetMetadataTeamSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: body.error.format(),
      statusCode: 400,
      statusMessage: "Invalid data",
    });
  }

  const { contributors, creators, funders, managingOrganization } = body.data;

  // get the creators that already have an id and update them
  const creatorsToUpdate = creators.filter((creator) => creator.id);

  for (const creator of creatorsToUpdate) {
    await prisma.datasetContributor.update({
      data: {
        affiliations: JSON.stringify(creator.affiliations),
        familyName: creator.familyName,
        givenName: creator.givenName,
        nameIdentifier: creator.nameIdentifier,
        nameIdentifierScheme: creator.nameIdentifierScheme,
        nameIdentifierSchemeUri: creator.nameIdentifierSchemeUri,
        nameType: creator.nameType,
      },
      where: { id: creator.id, creator: true },
    });
  }

  // get the creators that don't have an id and create them
  const creatorsToCreate = creators.filter((creator) => !creator.id);

  for (const creator of creatorsToCreate) {
    await prisma.datasetContributor.create({
      data: {
        affiliations: JSON.stringify(creator.affiliations),
        contributorType: null,
        creator: true,
        datasetId,
        familyName: creator.familyName,
        givenName: creator.givenName,
        nameIdentifier: creator.nameIdentifier || "",
        nameIdentifierScheme: creator.nameIdentifierScheme || "",
        nameIdentifierSchemeUri: creator.nameIdentifierSchemeUri || "",
        nameType: creator.nameType,
      },
    });
  }

  // get the creators that are deleted and delete them
  const creatorsToDelete = creators.filter((creator) => creator.deleted);

  for (const creator of creatorsToDelete) {
    await prisma.datasetContributor.delete({
      where: { id: creator.id, creator: true },
    });
  }

  // get the contributors that already have an id and update them
  const contributorsToUpdate = contributors.filter(
    (contributor) => contributor.id,
  );

  for (const contributor of contributorsToUpdate) {
    await prisma.datasetContributor.update({
      data: {
        affiliations: JSON.stringify(contributor.affiliations),
        contributorType: contributor.contributorType,
        datasetId,
        familyName: contributor.familyName,
        givenName: contributor.givenName,
        nameIdentifier: contributor.nameIdentifier,
        nameIdentifierScheme: contributor.nameIdentifierScheme,
        nameIdentifierSchemeUri: contributor.nameIdentifierSchemeUri,
        nameType: contributor.nameType,
      },
      where: { id: contributor.id, creator: false },
    });
  }

  // get the contributors that don't have an id and create them
  const contributorsToCreate = contributors.filter(
    (contributor) => !contributor.id,
  );

  for (const contributor of contributorsToCreate) {
    await prisma.datasetContributor.create({
      data: {
        affiliations: JSON.stringify(contributor.affiliations),
        contributorType: contributor.contributorType,
        creator: false,
        datasetId,
        familyName: contributor.familyName,
        givenName: contributor.givenName,
        nameIdentifier: contributor.nameIdentifier || "",
        nameIdentifierScheme: contributor.nameIdentifierScheme || "",
        nameIdentifierSchemeUri: contributor.nameIdentifierSchemeUri || "",
        nameType: contributor.nameType,
      },
    });
  }

  // get the contributors that are deleted and delete them
  const contributorsToDelete = contributors.filter(
    (contributor) => contributor.deleted,
  );

  for (const contributor of contributorsToDelete) {
    await prisma.datasetContributor.delete({
      where: { id: contributor.id, creator: false },
    });
  }

  // get the funders that already have an id and update them
  const fundersToUpdate = funders.filter((funder) => funder.id);

  for (const funder of fundersToUpdate) {
    await prisma.datasetFunder.update({
      data: {
        name: funder.name,
        identifier: funder.identifier,
        identifierSchemeUri: funder.identifierSchemeUri,
        identifierType: funder.identifierType,
      },
      where: { id: funder.id },
    });
  }

  // get the funders that don't have an id and create them
  const fundersToCreate = funders.filter((funder) => !funder.id);

  for (const funder of fundersToCreate) {
    await prisma.datasetFunder.create({
      data: {
        name: funder.name,
        awardNumber: funder.awardNumber || "",
        awardTitle: funder.awardTitle || "",
        awardUri: funder.awardUri || "",
        datasetId,
        identifier: funder.identifier || "",
        identifierSchemeUri: funder.identifierSchemeUri || "",
        identifierType: funder.identifierType || "",
      },
    });
  }

  // get the funders that are deleted and delete them
  const fundersToDelete = funders.filter((funder) => funder.deleted);

  for (const funder of fundersToDelete) {
    await prisma.datasetFunder.delete({
      where: { id: funder.id },
    });
  }

  // update the managing organization
  await prisma.datasetManagingOrganization.update({
    data: {
      name: managingOrganization.name,
      identifier: managingOrganization.identifier,
      identifierScheme: managingOrganization.identifierScheme,
      identifierSchemeUri: managingOrganization.identifierSchemeUri,
    },
    where: { datasetId },
  });

  return {
    success: true,
  };
});
