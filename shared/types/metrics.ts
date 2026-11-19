import z from "zod"

export const MetricsSnapshotPayloadSchema = z.object({
  manual: z.number(),
  autoIndex: z.number(),
  modalityData: z.array(
    z.object({
      modality: z.string(),
      datasets: z.number()
    })
  ),
  datasetsPerSource: z.record(z.string(), z.number()),
  datasetsPublicationYearData: z.array(
  z.object({ year: z.string(), datasets: z.number() }),
  ),
  reach: z.object({
    dois: z.number(),
    licenseData: z.number().array(),
    publishers: 
      z.array(
        z.object({
          publisher: z.string(),
          datasets: z.number()
        })
      )
  })
})

export type MetricsSnapshotPayload = z.infer<typeof MetricsSnapshotPayloadSchema>