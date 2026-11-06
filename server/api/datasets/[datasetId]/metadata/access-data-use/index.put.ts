import { DatasetMetadataAccessDataUseSchema } from "#shared/utils/dataset_schemas";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  await datasetMinEditorPermission(event);

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    DatasetMetadataAccessDataUseSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: z.treeifyError(body.error),
      statusCode: 400,
      statusMessage: "Invalid data",
    });
  }

  const { access, consent, deidentLevel, rights } = body.data;

  // Save every section together so that a failure doesn't leave only some of them updated
  await prisma.$transaction([
    prisma.datasetAccess.update({
      data: {
        description: access.description,
        type: access.type,
        url: access.url,
        urlLastChecked: access.urlLastChecked
          ? new Date(access.urlLastChecked)
          : null,
      },
      where: { datasetId },
    }),
    prisma.datasetRights.update({
      data: {
        identifier: rights.identifier,
        identifierScheme: rights.identifierScheme,
        identifierSchemeUri: rights.identifierSchemeUri,
        licenseText: rights.licenseText,
        rights: rights.rights,
        uri: rights.uri,
      },
      where: { datasetId },
    }),
    prisma.datasetConsent.update({
      data: {
        details: consent.details,
        geneticOnly: consent.geneticOnly,
        geogRestrict: consent.geogRestrict,
        noMethods: consent.noMethods,
        noncommercial: consent.noncommercial,
        researchType: consent.researchType,
        type: consent.type,
      },
      where: { datasetId },
    }),
    prisma.datasetDeIdentLevel.update({
      data: {
        dates: deidentLevel.dates,
        details: deidentLevel.details,
        direct: deidentLevel.direct,
        hipaa: deidentLevel.hipaa,
        kAnon: deidentLevel.kAnon,
        nonarr: deidentLevel.nonarr,
        type: deidentLevel.type,
      },
      where: { datasetId },
    }),
  ]);

  return {
    success: true,
  };
});
