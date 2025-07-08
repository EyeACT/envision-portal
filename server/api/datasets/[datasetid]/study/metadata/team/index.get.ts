import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;
  const { studyId } = event.context.params as { studyId: string };

  if (!studyId) {
    throw createError({ statusCode: 400, statusMessage: "Study not found" });
  }

  const study = await prisma.study.findUnique({
    include: {
      StudyCollaborators: true,
      StudySponsors: true,
    },
    where: {
      id: studyId,
      StudyMember: {
        some: {
          userId,
        },
      },
    },
  });

  return {
    ...study,
  };
});
