export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { studyId } = event.context.params as { studyId: string };

  // Get the study from the database
  const study = await prisma.study.findUnique({
    include: {
      StudyArm: true,
      StudyDesign: true,
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

  // Check if the study exists
  if (!study) {
    throw createError({
      statusCode: 404,
      statusMessage: "Study not found",
    });
  }

  return {
    ...study,
    studyType: study.StudyDesign?.studyType,
  };
});
