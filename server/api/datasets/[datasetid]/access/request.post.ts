import { z } from "zod";

const requestSchema = z.object({
  affiliation: z.string().min(1, "Must be at least 1 character"),
  familyName: z.string().min(1, "Must be at least 1 character"),
  givenName: z.string().min(1, "Must be at least 1 character"),
  reasonForAccess: z.string().min(1, "Must be at least 1 character"),
});

const DEV_ID = "cm880mrva00000cl20uo80c7e";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetid } = event.context.params as { datasetid: string };

  const publicDatasetId = parseInt(datasetid);

  const body = await readValidatedBody(event, (b) =>
    requestSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing required fields",
    });
  }

  // Get the dataset from the database
  const publicDataset = await prisma.publishedDataset.findUnique({
    where: {
      id: publicDatasetId,
    },
  });

  if (!publicDataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  // Check if the dataset exists in the study side
  const dataset = await prisma.dataset.findUnique({
    where: {
      id: publicDataset.datasetId,
      studyId: publicDataset.studyId,
      // versionId: publicDataset.versionId,
    },
  });

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  // Add the request to the database
  await prisma.datasetRequest.create({
    data: {
      affiliation: body.data.affiliation,
      datasetId: DEV_ID,
      emailAddress: user.emailAddress, // Might need to be removed since we are attaching the user to the dataset request
      familyName: body.data.familyName,
      givenName: body.data.givenName,
      reasonForAccess: body.data.reasonForAccess,
      status: "pending",
      studyId: DEV_ID,
      userId,
    },
  });

  return {
    statusCode: 201,
    statusMessage: "Request submitted",
  };
});
