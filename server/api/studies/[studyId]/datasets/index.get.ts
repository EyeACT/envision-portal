export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { studyId } = event.context.params as { studyId: string };

  const study = await prisma.study.findUnique({
    include: {
      Dataset: true,
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

  if (!study) {
    throw createError({
      statusCode: 404,
      statusMessage: "Study not found",
    });
  }

  const datasets = {
    datasets: study.Dataset,
    studyTitle: study.title,
  };

  return datasets || [];
});
