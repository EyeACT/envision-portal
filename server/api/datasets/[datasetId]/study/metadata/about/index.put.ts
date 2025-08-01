import { z } from "zod";
import FORM_JSON from "@/assets/data/form.json";
import { isValidORCIDValue, isValidRORValue } from "~/utils/validations";

const identTypeOptions =
  FORM_JSON.studyMetadataIdentificationPrimaryIdentifierTypeOptions.map(
    (opt) => opt.value,
  );

const conditionsSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    classificationCode: z.string().optional(),
    conditionUri: z.union([z.literal(""), z.string().trim().url()]),
    deleted: z.boolean().optional(),
    local: z.boolean().optional(),
    scheme: z.string().optional(),
    schemeUri: z.union([z.literal(""), z.string().trim().url()]),
  })
  .strict();

const keywordsSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    classificationCode: z.string().optional(),
    deleted: z.boolean().optional(),
    keywordUri: z.union([z.literal(""), z.string().trim().url()]),
    local: z.boolean().optional(),
    scheme: z.string().optional(),
    schemeUri: z.union([z.literal(""), z.string().trim().url()]),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      (data.classificationCode && !data.scheme) ||
      (!data.classificationCode && data.scheme)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Both classificationCode and scheme are required if either is provided",
      });
    }

    if (
      data.classificationCode &&
      data.scheme?.toUpperCase() === "ORCID" &&
      !isValidORCIDValue(data.classificationCode)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ORCID identifier must be a valid ORCID format",
      });
    }

    if (
      data.classificationCode &&
      data.scheme?.toUpperCase() === "ROR" &&
      !isValidRORValue(data.classificationCode)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ROR identifier must be a valid ROR format",
      });
    }
  });

const secondaryIdentifierSchema = z
  .object({
    id: z.string().optional(),
    deleted: z.boolean().optional(),
    domain: z.union([z.literal(""), z.string().trim().url()]),
    identifier: z.string(),
    link: z.union([z.literal(""), z.string().trim().url()]),
    local: z.boolean().optional(),
    type: z.string().refine((v) => identTypeOptions.includes(v), {
      message: `Identifier type must be one of: ${identTypeOptions.join(", ")}`,
    }),
  })
  .strict();

const StudyMetadataAboutSchema = z
  .object({
    briefSummary: z.string().min(1, "Brief summary is required"),
    conditions: z
      .array(conditionsSchema)
      .min(1, "At least one condition is required"),
    detailedDescription: z.string().min(1, "Detailed description is required"),
    keywords: z
      .array(keywordsSchema)
      .min(1, "At least one keyword is required"),
    primaryIdentifier: z.object({
      domain: z.union([z.literal(""), z.string().trim().url()]),
      identifier: z.string(),
      link: z.union([z.literal(""), z.string().trim().url()]),
      type: z.string().refine((v) => identTypeOptions.includes(v), {
        message: `Identifier type must be one of: ${identTypeOptions.join(", ")}`,
      }),
    }),
    secondaryIdentifiers: z
      .array(secondaryIdentifierSchema)
      .min(1, "At least one secondary identifier is required"),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as { datasetId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataAboutSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: body.error.format(),
      statusCode: 400,
      statusMessage: "Invalid data",
    });
  }

  const {
    briefSummary,
    conditions,
    detailedDescription,
    keywords,
    primaryIdentifier,
    secondaryIdentifiers,
  } = body.data;

  const updatedStudyDescription = await prisma.studyDescription.update({
    data: {
      briefSummary,
      detailedDescription,
    },
    where: {
      datasetId,
    },
  });

  // update the primary identifier
  // Get the id of the primary identifier
  const primaryIdentifierId = await prisma.studyIdentification.findFirst({
    where: {
      datasetId,
      isSecondary: false,
    },
  });

  if (primaryIdentifierId) {
    await prisma.studyIdentification.update({
      data: {
        identifier: primaryIdentifier.identifier,
        identifierDomain: primaryIdentifier.domain || "",
        identifierLink: primaryIdentifier.link || "",
        identifierType: primaryIdentifier.type,
      },
      where: { id: primaryIdentifierId.id },
    });
  } else {
    await prisma.studyIdentification.create({
      data: {
        datasetId,
        identifier: primaryIdentifier.identifier,
        identifierDomain: primaryIdentifier.domain || "",
        identifierLink: primaryIdentifier.link || "",
        identifierType: primaryIdentifier.type,
        isSecondary: false,
      },
    });
  }

  // update the secondary identifiers
  // Get the secondary identifiers that already have an id and update them
  const secondaryIdentifiersToUpdate = secondaryIdentifiers.filter(
    (identifier) => identifier.id,
  );

  for (const identifier of secondaryIdentifiersToUpdate) {
    await prisma.studyIdentification.update({
      data: {
        identifier: identifier.identifier,
        identifierDomain: identifier.domain || "",
        identifierLink: identifier.link || "",
        identifierType: identifier.type,
        isSecondary: true,
      },
      where: { id: identifier.id },
    });
  }

  // Get the secondary identifiers that don't have an id and create them
  const secondaryIdentifiersToCreate = secondaryIdentifiers.filter(
    (identifier) => !identifier.id,
  );

  for (const identifier of secondaryIdentifiersToCreate) {
    await prisma.studyIdentification.create({
      data: {
        datasetId,
        identifier: identifier.identifier,
        identifierDomain: identifier.domain || "",
        identifierLink: identifier.link || "",
        identifierType: identifier.type,
        isSecondary: true,
      },
    });
  }

  // Get the secondary identifiers that are deleted and delete them
  const secondaryIdentifiersToDelete = secondaryIdentifiers.filter(
    (identifier) => identifier.deleted,
  );

  for (const identifier of secondaryIdentifiersToDelete) {
    await prisma.studyIdentification.delete({
      where: { id: identifier.id },
    });
  }

  // update the keywords
  // Get the keywords that already have an id and update them
  const keywordsToUpdate = keywords.filter((keyword) => keyword.id);

  for (const keyword of keywordsToUpdate) {
    await prisma.studyKeywords.update({
      data: {
        name: keyword.name,
        classificationCode: keyword.classificationCode,
        keywordUri: keyword.keywordUri,
        scheme: keyword.scheme,
        schemeUri: keyword.schemeUri,
      },
      where: { id: keyword.id },
    });
  }

  // Get the keywords that don't have an id and create them
  const keywordsToCreate = keywords.filter((keyword) => !keyword.id);

  for (const keyword of keywordsToCreate) {
    await prisma.studyKeywords.create({
      data: {
        name: keyword.name,
        classificationCode: keyword.classificationCode || "",
        datasetId,
        keywordUri: keyword.keywordUri || "",
        scheme: keyword.scheme || "",
        schemeUri: keyword.schemeUri || "",
      },
    });
  }

  // Get the keywords that are deleted and delete them
  const keywordsToDelete = keywords.filter((keyword) => keyword.deleted);

  for (const keyword of keywordsToDelete) {
    await prisma.studyKeywords.delete({
      where: { id: keyword.id },
    });
  }

  // update the conditions
  // Get the conditions that already have an id and update them
  const conditionsToUpdate = conditions.filter((condition) => condition.id);

  for (const condition of conditionsToUpdate) {
    await prisma.studyConditions.update({
      data: {
        name: condition.name,
        classificationCode: condition.classificationCode,
        conditionUri: condition.conditionUri,
        scheme: condition.scheme,
        schemeUri: condition.schemeUri,
      },
      where: { id: condition.id },
    });
  }

  // Get the conditions that don't have an id and create them
  const conditionsToCreate = conditions.filter((condition) => !condition.id);

  for (const condition of conditionsToCreate) {
    await prisma.studyConditions.create({
      data: {
        name: condition.name,
        classificationCode: condition.classificationCode || "",
        conditionUri: condition.conditionUri || "",
        datasetId,
        scheme: condition.scheme || "",
        schemeUri: condition.schemeUri || "",
      },
    });
  }

  // Get the conditions that are deleted and delete them
  const conditionsToDelete = conditions.filter(
    (condition) => condition.deleted,
  );

  for (const condition of conditionsToDelete) {
    await prisma.studyConditions.delete({
      where: { id: condition.id },
    });
  }

  return {
    updatedStudyDescription,
  };
});
