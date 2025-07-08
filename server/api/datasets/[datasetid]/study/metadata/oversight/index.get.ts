export default defineEventHandler(async (event) => {
  const { datasetId } = event.context.params as { datasetId: string };

  if (!datasetId) {
    throw createError({ statusCode: 400, statusMessage: "Missing datasetId" });
  }

  const oversight = await prisma.studyOversight.findUnique({
    include: {
      dataset: true,
    },
    where: { datasetId },
  });

  return {
    title: oversight?.dataset?.title,
    created: oversight?.created,
    fdaRegulatedDevice: oversight?.fdaRegulatedDevice,
    fdaRegulatedDrug: oversight?.fdaRegulatedDrug,
    hasDmc: oversight?.hasDmc,
    humanSubjectReviewStatus: oversight?.humanSubjectReviewStatus,
    updated: oversight?.updated,
  };
});
