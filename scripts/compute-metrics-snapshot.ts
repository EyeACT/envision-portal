import {computeSnapshot} from "../server/utils/computeMetrics"
import type { Prisma } from "../shared/generated/client";
import { PrismaClient } from "../shared/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const computeMetrics = async () => {
  let snapshot = await computeSnapshot(prisma)
  await prisma.metricsSnapshot.create({
    data: {
      snapshot: snapshot
    }
  })
}

try {
  await computeMetrics()
} catch (error) {
    console.error("Failed to compute metrics snapshot:", error);
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}

