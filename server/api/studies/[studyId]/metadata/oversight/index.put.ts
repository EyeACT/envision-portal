import { z } from 'zod'

const StudyMetadataOversightSchema = z.object({
  isFDARegulatedDrug: z.string().optional(),
  isFDARegulatedDevice: z.string().optional(),
  humanSubjectReviewStatus: z.string().optional(),
  oversightHasDMC: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const { studyId } = event.context.params as { studyId: string }

  if (!studyId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing studyId',
    })
  }

  const body = await readValidatedBody(event, (b) =>
    StudyMetadataOversightSchema.safeParse(b),
  )

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid study oversight data',
    })
  }

  const {
    isFDARegulatedDrug,
    isFDARegulatedDevice,
    humanSubjectReviewStatus,
    oversightHasDMC,
  } = body.data

  const data = {
    fdaRegulatedDrug: isFDARegulatedDrug ?? null,
    fdaRegulatedDevice: isFDARegulatedDevice ?? null,
    humanSubjectReviewStatus: humanSubjectReviewStatus ?? null,
    hasDmc: oversightHasDMC ?? null,
  }

  const result = await prisma.studyOversight.upsert({
    where: { studyId },
    update: data,
    create: { studyId, ...data },
  })

  return result
})
