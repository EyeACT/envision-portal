import { z } from "zod";

const requestSchema = z.object({
  affiliation: z.string().trim().min(1, "Must be at least 1 character"),
  familyName: z.string().trim().min(1, "Must be at least 1 character"),
  givenName: z.string().trim().min(1, "Must be at least 1 character"),
  reasonForAccess: z.string().trim().min(1, "Must be at least 1 character"),
});

// Controlled datasets need an account so the requester can follow the review
// and exchange the data use agreement from My Requests
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  const { datasetid } = event.context.params as { datasetid: string };

  const publishedDatasetId = parseInt(datasetid);

  const body = await readValidatedBody(event, (b) =>
    requestSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing required fields",
    });
  }

  const publishedDataset = Number.isNaN(publishedDatasetId)
    ? null
    : await prisma.publishedDataset.findUnique({
        where: { id: publishedDatasetId },
      });

  if (!publishedDataset || publishedDataset.external) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  if (publishedDataset.public) {
    throw createError({
      statusCode: 400,
      statusMessage: "This dataset is public. Use the public access form instead.",
    });
  }

  // The source dataset holds the members who review the request
  const dataset = publishedDataset.datasetId
    ? await prisma.dataset.findUnique({
        select: { id: true },
        where: { id: publishedDataset.datasetId },
      })
    : null;

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  const existing = await prisma.datasetRequest.findFirst({
    select: { id: true, status: true },
    where: {
      publishedDatasetId,
      status: { in: ["pending", "approved"] },
      userId: user.id,
    },
  });

  if (existing) {
    throw createError({
      data: { requestId: existing.id },
      statusCode: 409,
      statusMessage: `You already have a ${existing.status} request for this dataset`,
    });
  }

  const request = await prisma.datasetRequest.create({
    data: {
      affiliation: body.data.affiliation,
      datasetId: dataset.id,
      DatasetRequestDetails: { create: { status: "pending" } },
      emailAddress: user.emailAddress,
      familyName: body.data.familyName,
      givenName: body.data.givenName,
      isControlledDatasetRequest: true,
      publishedDatasetId,
      reasonForAccess: body.data.reasonForAccess,
      status: "pending",
      userId: user.id,
    },
  });

  await notifyDatasetManagers(dataset.id, {
    body: `${body.data.givenName} ${body.data.familyName} (${body.data.affiliation}) requested access to ${publishedDataset.title}.`,
    title: "New data request",
    url: `/app/datasets/${dataset.id}/requests/${request.id}`,
  });

  return {
    id: request.id,
    statusCode: 201,
    statusMessage: "Request submitted",
  };
});
