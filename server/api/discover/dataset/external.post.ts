import { z } from "zod";

const fileSchema: z.ZodType = z.lazy(() =>
  z.array(
    z.union([
      z.object({
        label: z.string(),
        children: z.array(fileSchema),
      }),
      z.object({
        name: z.string(),
      }),
    ]),
  ),
);

const modalitySchema = z.object({
  modality: z.string(),
  label: z.string(),
  fileCount: z.number().int().nonnegative().nullable(),
  fileExtensions: z.array(z.string()).default([]),
  detectionMethod: z.string(),
  fileCountComplete: z.boolean().default(true),
});

const datasetSchema = z.object({
  title: z.string(),
  created: z.string(),
  data: z.any(),
  datasetId: z.string(),
  canonicalId: z.string(),
  description: z.string(),
  doi: z.string().optional(),
  externalUrl: z.string(),
  files: fileSchema,
  publishedMetadata: z.any(),
  studyTitle: z.string(),
  updated: z.string(),
  versionTitle: z.string(),
  PublishedDatasetRegistrationDetails: z.object({
    datasetSource: z.string(),
    extractionMethod: z.string(),
    extractionVersion: z.string(),
    requiresAccessRequest: z.boolean().nullish(),
    accessRequestUrl: z.string().nullish(),
    accessConditions: z.string().nullish(),
    embargoUntil: z.string().nullish(),
  }),
  modalities: z.array(modalitySchema).optional(),
});

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default defineEventHandler(async (event) => {
  // Verify the authentication key from the headers and return a 401 error if it is invalid

  const expectedKey = process.env.EXTERNAL_API_KEY;
  const AuthenticationKey = getRequestHeader(event, "x-api-key");

  // Reject when the key is not configured, otherwise a missing header would match `undefined`
  if (!expectedKey || AuthenticationKey !== expectedKey) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readValidatedBody(event, (b) =>
    datasetSchema.safeParse(b),
  );

  if (!body.success) {
    console.log("Validation error:", body.error);
    throw createError({
      statusCode: 400,
      statusMessage: JSON.stringify(body.error.issues),
    });
  }

  const externalUrl = body.data.externalUrl.toLowerCase();

  const details = body.data.PublishedDatasetRegistrationDetails;
  const registrationDetails = {
    datasetSource: details.datasetSource,
    extractionMethod: details.extractionMethod,
    extractionVersion: details.extractionVersion,
    requiresAccessRequest: details.requiresAccessRequest ?? null,
    accessRequestUrl: details.accessRequestUrl ?? null,
    accessConditions: details.accessConditions ?? null,
    embargoUntil: parseDate(details.embargoUntil),
  };

  const modalities = body.data.modalities
    ? [
        ...new Map(body.data.modalities.map((m) => [m.modality, m])).values(),
      ].map((m) => ({
        modality: m.modality,
        label: m.label,
        fileCount: m.fileCount,
        fileCountComplete: m.fileCountComplete,
        fileExtensions: m.fileExtensions,
        detectionMethod: m.detectionMethod,
      }))
    : null;

  // check if the dataset with the same externalUrl or DOI already exists in the database
  const existingDataset = await prisma.publishedDataset.findFirst({
    where: {
      OR: [
        { externalUrl },
        ...(body.data.doi ? [{ doi: body.data.doi, external: true }] : []),
      ],
    },
  });

  if (existingDataset) {
    // Update the existing dataset in place
    await prisma.publishedDataset.update({
      where: { id: existingDataset.id },
      data: {
        title: body.data.title,
        automated: true,
        created: new Date(parseInt(body.data.created) * 1000),
        data: body.data.data,
        description: body.data.description,
        doi: body.data.doi || null,
        external: true,
        externalUrl,
        files: body.data.files as any,
        publishedMetadata: body.data.publishedMetadata,
        studyTitle: body.data.studyTitle,
        updated: new Date(parseInt(body.data.updated) * 1000),
        versionTitle: body.data.versionTitle,
        PublishedDatasetRegistrationDetails: {
          upsert: {
            create: registrationDetails,
            update: registrationDetails,
          },
        },
        ...(modalities
          ? {
              PublishedDatasetModality: {
                deleteMany: {},
                create: modalities,
              },
            }
          : {}),
      },
    });

    return {
      statusCode: 200,
      statusMessage: "Dataset updated",
    };
  }

  // Create a new dataset in the database. We will get the generated id and use it to create the canonicalId in the format "external-{id}"
  const newDataset = await prisma.publishedDataset.create({
    data: {
      title: body.data.title,
      automated: true,
      created: new Date(parseInt(body.data.created) * 1000),
      data: body.data.data,
      description: body.data.description,
      doi: body.data.doi || null,
      external: true,
      externalUrl,
      files: body.data.files as any,
      publishedMetadata: body.data.publishedMetadata,
      studyTitle: body.data.studyTitle,
      updated: new Date(parseInt(body.data.updated) * 1000),
      versionTitle: body.data.versionTitle,
      PublishedDatasetRegistrationDetails: {
        create: registrationDetails,
      },
      ...(modalities && modalities.length > 0
        ? { PublishedDatasetModality: { create: modalities } }
        : {}),
    },
  });

  // Update the canonicalId of the dataset to be in the format "external-{id}"
  await prisma.publishedDataset.update({
    where: { id: newDataset.id },
    data: {
      canonicalId: `external-${newDataset.id.toString()}`,
      datasetId: `external-${newDataset.id.toString()}`,
    },
  });

  return {
    statusCode: 201,
    statusMessage: "Request submitted",
  };
});
