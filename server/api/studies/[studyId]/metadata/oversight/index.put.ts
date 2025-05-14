export default defineEventHandler(async (event) => {
  const { studyId } = event.context.params as { studyId: string }

  if (!studyId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing studyId' })
  }

  const body = await readBody<{
    isFDARegulatedDrug?: string
    isFDARegulatedDevice?: string
    humanSubjectReviewStatus?: string
    oversightHasDMC?: string
  }>(event)

  const data = {
    fdaRegulatedDrug: body.isFDARegulatedDrug ?? null,
    fdaRegulatedDevice: body.isFDARegulatedDevice ?? null,
    humanSubjectReviewStatus: body.humanSubjectReviewStatus ?? null,
    hasDmc: body.oversightHasDMC ?? null,
  }

  const result = await prisma.studyOversight.upsert({
    where: { studyId },
    update: data,
    create: { studyId, ...data },
  })

  return result
})
