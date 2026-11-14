import { computeSnapshot } from "~~/server/utils/computeMetrics"
import { MetricsSnapshotPayloadSchema } from "~~/shared/types/metrics"

// TODO: Github action that computes in advance with queries as fallback if no results
export default defineEventHandler(async (event) => {
  // check for latest snapshot
  let metricsData = await prisma.metricsSnapshot.findFirst({
    orderBy: {
      generatedAt: "desc"
    }
  })
    
  // ensure data in correct format
  let parsed = MetricsSnapshotPayloadSchema.safeParse(metricsData?.snaphsot ?? {})

  if(!parsed.success || (metricsData && Date.now() - metricsData.generatedAt.getTime() >= 24 * 60 * 60 * 1000)) {
    let metricsSnapshot = await computeSnapshot()
    await prisma.metricsSnapshot.create({
      data: {
        snapshot: metricsSnapshot
      }
    })
    return metricsSnapshot
  }


  return parsed.data
})


