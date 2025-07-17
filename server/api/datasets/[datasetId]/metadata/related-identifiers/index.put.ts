import { z } from "zod";

const relatedIdentSchema = z
  .object({
    id: z.string().optional(),
    deleted: z.boolean(),
    identifier: z.string(),
    identifierType: z.string(),
    relatedMetadataScheme: z.string(),
    relationType: z.string(),
    resourceType: z.string(),
    schemeType: z.string(),
    schemeUri: z.union([z.literal(""), z.string().trim().url()]),
  })
  .superRefine((data, context) => {
    if (
      (data.relationType === "IsMetadataFor" ||
        data.relationType === "HasMetadata") &&
      !data.relatedMetadataScheme
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "relatedMetadataScheme is required when relationType is IsMetadataFor or HasMetadata",
        path: ["relatedMetadataScheme"],
      });
    }
  });

const DatasetMetadataRelatedIdentifiersSchema = z.object({
  relatedIdentifiers: z
    .array(relatedIdentSchema)
    .min(1, "At least one related identifier is required"),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    DatasetMetadataRelatedIdentifiersSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid  data",
    });
  }

  const { relatedIdentifiers } = body.data;

  // get the related identifiers that already have an id and update them
  const relatedIdentifiersToUpdate = relatedIdentifiers.filter(
    (relatedIdentifier) => relatedIdentifier.id,
  );

  for (const relatedIdentifier of relatedIdentifiersToUpdate) {
    await prisma.datasetRelatedIdentifier.update({
      data: {
        identifier: relatedIdentifier.identifier,
        identifierType: relatedIdentifier.identifierType,
        relatedMetadataScheme: relatedIdentifier.relatedMetadataScheme,
        relationType: relatedIdentifier.relationType,
        resourceType: relatedIdentifier.resourceType,
        schemeType: relatedIdentifier.schemeType,
        schemeUri: relatedIdentifier.schemeUri,
      },
      where: { id: relatedIdentifier.id },
    });
  }

  // get the related identifiers that don't have an id and create them
  const relatedIdentifiersToCreate = relatedIdentifiers.filter(
    (relatedIdentifier) => !relatedIdentifier.id,
  );

  for (const relatedIdentifier of relatedIdentifiersToCreate) {
    await prisma.datasetRelatedIdentifier.create({
      data: {
        datasetId,
        identifier: relatedIdentifier.identifier,
        identifierType: relatedIdentifier.identifierType,
        relatedMetadataScheme: relatedIdentifier.relatedMetadataScheme,
        relationType: relatedIdentifier.relationType,
        resourceType: relatedIdentifier.resourceType,
        schemeType: relatedIdentifier.schemeType,
        schemeUri: relatedIdentifier.schemeUri,
      },
    });
  }

  // get the alternate identifiers that are deleted and delete them
  const relatedIdentifiersToDelete = relatedIdentifiers.filter(
    (relatedIdentifier) => relatedIdentifier.deleted,
  );

  for (const relatedIdentifier of relatedIdentifiersToDelete) {
    await prisma.datasetRelatedIdentifier.delete({
      where: { id: relatedIdentifier.id },
    });
  }

  return {
    success: true,
  };
});
