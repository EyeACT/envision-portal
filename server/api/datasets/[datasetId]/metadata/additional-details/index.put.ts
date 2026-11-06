import { DatasetMetadataAdditionalDetailsSchema } from "#shared/utils/dataset_schemas";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  await datasetMinEditorPermission(event);

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    DatasetMetadataAdditionalDetailsSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: z.treeifyError(body.error),
      statusCode: 400,
      statusMessage: "Invalid data",
    });
  }

  const {
    DatasetAlternateIdentifier,
    DatasetDate,
    DatasetOther,
    DatasetRelatedIdentifier,
    DatasetSubject,
  } = body.data;

  const alternateIdentifiers = splitRows(DatasetAlternateIdentifier);
  const dates = splitRows(DatasetDate);
  const relatedIdentifiers = splitRows(DatasetRelatedIdentifier);
  const subjects = splitRows(DatasetSubject);

  // Save every section together so that a failure doesn't leave only some of them updated
  await prisma.$transaction([
    ...alternateIdentifiers.toUpdate.map((item) =>
      prisma.datasetAlternateIdentifier.update({
        data: {
          identifier: item.identifier,
          type: item.type,
        },
        where: { id: item.id, datasetId },
      }),
    ),
    ...alternateIdentifiers.toCreate.map((item) =>
      prisma.datasetAlternateIdentifier.create({
        data: {
          datasetId,
          identifier: item.identifier,
          type: item.type,
        },
      }),
    ),
    ...alternateIdentifiers.toDelete.map((item) =>
      prisma.datasetAlternateIdentifier.delete({
        where: { id: item.id, datasetId },
      }),
    ),

    ...relatedIdentifiers.toUpdate.map((item) =>
      prisma.datasetRelatedIdentifier.update({
        data: {
          identifier: item.identifier,
          identifierType: item.identifierType,
          relatedMetadataScheme: item.relatedMetadataScheme,
          relationType: item.relationType,
          resourceType: item.resourceType,
          schemeType: item.schemeType,
          schemeUri: item.schemeUri,
        },
        where: { id: item.id, datasetId },
      }),
    ),
    ...relatedIdentifiers.toCreate.map((item) =>
      prisma.datasetRelatedIdentifier.create({
        data: {
          datasetId,
          identifier: item.identifier,
          identifierType: item.identifierType,
          relatedMetadataScheme: item.relatedMetadataScheme || "",
          relationType: item.relationType,
          resourceType: item.resourceType || "",
          schemeType: item.schemeType || "",
          schemeUri: item.schemeUri,
        },
      }),
    ),
    ...relatedIdentifiers.toDelete.map((item) =>
      prisma.datasetRelatedIdentifier.delete({
        where: { id: item.id, datasetId },
      }),
    ),

    ...subjects.toUpdate.map((item) =>
      prisma.datasetSubject.update({
        data: {
          classificationCode: item.classificationCode,
          scheme: item.scheme,
          schemeUri: item.schemeUri,
          subject: item.subject,
          valueUri: item.valueUri,
        },
        where: { id: item.id, datasetId },
      }),
    ),
    ...subjects.toCreate.map((item) =>
      prisma.datasetSubject.create({
        data: {
          classificationCode: item.classificationCode || "",
          datasetId,
          scheme: item.scheme || "",
          schemeUri: item.schemeUri || "",
          subject: item.subject,
          valueUri: item.valueUri || "",
        },
      }),
    ),
    ...subjects.toDelete.map((item) =>
      prisma.datasetSubject.delete({
        where: { id: item.id, datasetId },
      }),
    ),

    ...dates.toUpdate.map((item) =>
      prisma.datasetDate.update({
        data: {
          date: item.date,
          information: item.information,
          type: item.type,
        },
        where: { id: item.id, datasetId },
      }),
    ),
    ...dates.toCreate.map((item) =>
      prisma.datasetDate.create({
        data: {
          datasetId,
          date: item.date,
          information: item.information,
          type: item.type,
        },
      }),
    ),
    ...dates.toDelete.map((item) =>
      prisma.datasetDate.delete({
        where: { id: item.id, datasetId },
      }),
    ),

    prisma.datasetOther.update({
      data: {
        acknowledgement: DatasetOther.acknowledgement,
        format: DatasetOther.format,
        size: DatasetOther.size,
        standardsFollowed: DatasetOther.standardsFollowed,
      },
      where: { datasetId },
    }),
  ]);

  return {
    success: true,
  };
});
