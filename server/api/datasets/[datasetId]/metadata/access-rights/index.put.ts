import { DatasetMetadataAccessRightsSchema } from "#shared/utils/dataset_schemas";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  await datasetMinEditorPermission(event)


  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    DatasetMetadataAccessRightsSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: z.treeifyError(body.error),
      statusCode: 400,
      statusMessage: "Invalid data",
    });
  }

  const { access, rights } = body.data;

  await prisma.datasetAccess.update({
    data: {
      description: access.description,
      type: access.type,
      url: access.url,
      urlLastChecked: access.urlLastChecked
        ? new Date(access.urlLastChecked)
        : null,
    },
    where: { datasetId },
  });

  await prisma.datasetRights.update({
    data: {
      identifier: rights.identifier,
      identifierScheme: rights.identifierScheme,
      identifierSchemeUri: rights.identifierSchemeUri,
      licenseText: rights.licenseText,
      rights: rights.rights,
      uri: rights.uri,
    },
    where: { datasetId },
  });

  return {
    success: true,
  };
});
