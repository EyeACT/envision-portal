import z from "zod"

export const MetricsSnapshotPayloadSchema = z.object({
  manual: z.number(),
  autoIndex: z.number(),
  datasetsPerModality: z.record(z.string(), z.number()),
  datasetsPerSource: z.record(z.string(), z.number()),
  datasetsPublicationYearData: z.array(
  z.object({ year: z.string(), datasets: z.number() }),
  ),
})

export type MetricsSnapshotPayload = z.infer<typeof MetricsSnapshotPayloadSchema>