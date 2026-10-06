import type { H3Event } from "h3";

export const DATASET_ROLES = ["viewer", "editor", "admin", "owner"] as const;

export type DatasetRole = (typeof DATASET_ROLES)[number];

// Returns the current user's membership for the dataset in the route params.
// Throws if the user is not a member or their role is below `minRole`.
export const requireDatasetRole = async (
  event: H3Event,
  minRole: DatasetRole,
) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id as string;

  // Check if the dataset exists
  const datasetId = await datasetExists(event);

  // Check access table for the dataset
  const datasetMember = await prisma.datasetMember.findUnique({
    where: {
      datasetId_userId: {
        datasetId,
        userId,
      },
    },
  });

  // Check if the user is a member of the dataset
  if (!datasetMember) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  const role: DatasetRole = datasetMember.owner
    ? "owner"
    : (datasetMember.role as DatasetRole);

  // Check if the user has at least the required permission
  if (DATASET_ROLES.indexOf(role) < DATASET_ROLES.indexOf(minRole)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  return datasetMember;
};
