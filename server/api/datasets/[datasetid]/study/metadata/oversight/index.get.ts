export default defineEventHandler(async (event) => {
  const { studyId } = event.context.params as { studyId: string };

  if (!studyId) {
    throw createError({ statusCode: 400, statusMessage: "Missing studyId" });
  }

  const oversight = await prisma.studyOversight.findUnique({
    where: { studyId },
  });

  return (
    oversight ?? {
      created: null,
      fdaRegulatedDevice: null,
      fdaRegulatedDrug: null,
      hasDmc: null,
      humanSubjectReviewStatus: null,
      studyId,
      updated: null,
    }
  );
});
