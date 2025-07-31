import { DatasetMetadataRelatedIdentifiersSchema } from "~/server/utils/dataset_schemas";

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
      data: body.error.format(),
      statusCode: 400,
      statusMessage: "Invalid data",
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
        relatedMetadataScheme: relatedIdentifier.relatedMetadataScheme || "",
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
