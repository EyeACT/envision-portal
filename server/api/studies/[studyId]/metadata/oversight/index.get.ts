export default defineEventHandler(async (event) => {
  const { studyId } = event.context.params as { studyId: string }

  if (!studyId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing studyId' })
  }

  const oversight = await prisma.studyOversight.findUnique({
    where: { studyId },
  })

  return oversight ?? {
    studyId,
    fdaRegulatedDrug: null,
    fdaRegulatedDevice: null,
    humanSubjectReviewStatus: null,
    hasDmc: null,
    created: null,
    updated: null,
  }
})
