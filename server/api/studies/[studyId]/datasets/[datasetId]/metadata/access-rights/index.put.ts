import { z } from "zod";

const StudyMetadataAccessRightsSchema = z.object({
  access: z.object({
    description: z.string(),
    type: z.string(),
    url: z.string(),
    urlLastChecked: z.string(),
  }),
  rights: z.object({
    identifier: z.string(),
    identifierScheme: z.string(),
    identifierSchemeUri: z.string(),
    licenseText: z.string(),
    rights: z.string(),
    uri: z.string(),
  }),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId, studyId } = event.context.params as {
    datasetId: string;
    studyId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataAccessRightsSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid  data",
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
