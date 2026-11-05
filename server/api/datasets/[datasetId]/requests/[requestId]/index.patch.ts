import { z } from "zod";

const bodySchema = z.object({
  action: z.enum(["approve", "reject", "revoke"]),
  comment: z.string().trim().max(5000).optional(),
});

// Which status each action moves from, and to
const TRANSITIONS = {
  approve: { from: "pending", to: "approved" },
  reject: { from: "pending", to: "rejected" },
  revoke: { from: "approved", to: "revoked" },
} as const;

const REQUESTER_MESSAGES = {
  approve: {
    title: "Data request approved",
    body: "Your request for {title} was approved. You can now download the dataset.",
    type: "success",
  },
  reject: {
    title: "Data request rejected",
    body: "Your request for {title} was rejected.",
    type: "error",
  },
  revoke: {
    title: "Data access revoked",
    body: "Your access to {title} was revoked by the dataset team.",
    type: "warning",
  },
} as const;

export default defineEventHandler(async (event) => {
  await datasetMinAdminPermission(event);

  const { datasetId, requestId } = event.context.params as {
    datasetId: string;
    requestId: string;
  };

  const body = await readValidatedBody(event, (b) => bodySchema.safeParse(b));

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid action",
    });
  }

  const { action, comment } = body.data;
  const transition = TRANSITIONS[action];

  const datasetRequest = await prisma.datasetRequest.findFirst({
    include: { DatasetRequestDetails: true, PublishedDataset: true },
    where: { id: requestId, datasetId },
  });

  if (!datasetRequest) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset request not found",
    });
  }

  if (datasetRequest.status !== transition.from) {
    throw createError({
      statusCode: 409,
      statusMessage: `Only ${transition.from} requests can be ${transition.to}`,
    });
  }

  const details = await getOrCreateRequestDetails(datasetRequest);

  if (action === "approve") {
    const blocker = getApprovalBlocker(details);

    if (blocker) {
      throw createError({ statusCode: 409, statusMessage: blocker });
    }
  }

  // Guard on the current status so two reviewers can't both act on the request
  const { count } = await prisma.datasetRequest.updateMany({
    data: {
      status: transition.to,
      ...(comment !== undefined && { comment }),
    },
    where: { id: requestId, status: transition.from },
  });

  if (count === 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "This request was updated by someone else. Refresh and try again.",
    });
  }

  await prisma.datasetRequestDetails.update({
    data: {
      status: transition.to,
      ...(action === "revoke" && { invalidatedOn: new Date() }),
    },
    where: { id: details.id },
  });

  const message = REQUESTER_MESSAGES[action];

  await notifyRequester(datasetRequest.userId, {
    body: message.body.replace("{title}", datasetRequest.PublishedDataset.title),
    title: message.title,
    type: message.type,
    url: `/app/requests/${requestId}`,
  });

  return { status: transition.to };
});
