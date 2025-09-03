import { z } from "zod";

const requestSchema = z.object({
  affiliation: z.string().min(1, "Must be at least 1 character"),
  email: z.string().email("Invalid email"),
  familyName: z.string().min(1, "Must be at least 1 character"),
  givenName: z.string().min(1, "Must be at least 1 character"),
  reasonForAccess: z.string().min(1, "Must be at least 1 character"),
});

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  const { user } = session;
  const userId = user?.id;

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
      statusMessage: "Public dataset not found",
    });
  }

  // Check if the dataset exists in the management side
  const dataset = await prisma.dataset.findUnique({
    where: {
      id: publicDataset?.datasetId,
    },
  });

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  // Add the request to the database
  const request = await prisma.datasetRequest.create({
    data: {
      affiliation: body.data.affiliation,
      controlledDatasetRequestId: null,
      datasetId: publicDataset?.datasetId,
      emailAddress: body.data.email,
      familyName: body.data.familyName,
      givenName: body.data.givenName,
      isControlledDatasetRequest: false,
      reasonForAccess: body.data.reasonForAccess,
      status: "approved",
      userId: userId ?? null,
    },
  });

  return {
    id: request.id,
    statusCode: 201,
    statusMessage: "Request saved",
  };
});
