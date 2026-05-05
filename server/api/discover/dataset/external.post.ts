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
  }),
});

export default defineEventHandler(async (event) => {
  // Verify the authentication key from the headers and return a 401 error if it is invalid

  const AuthenticationKey = getRequestHeader(event, "x-api-key");

  if (AuthenticationKey !== process.env.EXTERNAL_API_KEY) {
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

  // check if the dataset with the same externalUrl already exists in the database and return a 400 error if it does
  const existingDataset = await prisma.publishedDataset.findFirst({
    where: {
      externalUrl,
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
        doi: body.data.doi,
        external: true,
        externalUrl: body.data.externalUrl,
        files: body.data.files as any,
        publishedMetadata: body.data.publishedMetadata,
        studyTitle: body.data.studyTitle,
        updated: new Date(parseInt(body.data.updated) * 1000),
        versionTitle: body.data.versionTitle,
        PublishedDatasetRegistrationDetails: {
          update: {
            datasetSource:
              body.data.PublishedDatasetRegistrationDetails.datasetSource,
            extractionMethod:
              body.data.PublishedDatasetRegistrationDetails.extractionMethod,
            extractionVersion:
              body.data.PublishedDatasetRegistrationDetails.extractionVersion,
          },
        },
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
      doi: body.data.doi,
      external: true,
      externalUrl: body.data.externalUrl,
      files: body.data.files as any,
      publishedMetadata: body.data.publishedMetadata,
      studyTitle: body.data.studyTitle,
      updated: new Date(parseInt(body.data.created) * 1000),
      versionTitle: body.data.versionTitle,
      PublishedDatasetRegistrationDetails: {
        create: {
          datasetSource:
            body.data.PublishedDatasetRegistrationDetails.datasetSource,
          extractionMethod:
            body.data.PublishedDatasetRegistrationDetails.extractionMethod,
          extractionVersion:
            body.data.PublishedDatasetRegistrationDetails.extractionVersion,
        },
      },
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
