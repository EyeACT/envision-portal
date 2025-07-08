import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;
  const { datasetId } = event.context.params as { datasetId: string };

  if (!datasetId) {
    throw createError({ statusCode: 400, statusMessage: "Dataset not found" });
  }

  const dataset = await prisma.dataset.findUnique({
    include: {
      StudyCollaborators: true,
      StudySponsors: true,
    },
    where: {
      id: datasetId,
      DatasetMember: {
        some: {
          userId,
        },
      },
    },
  });

  return {
    ...dataset,
  };
});
