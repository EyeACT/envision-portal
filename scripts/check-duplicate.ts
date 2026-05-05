import "dotenv/config";
import { PrismaClient } from "../shared/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

const normalizeUrl = (url: string) => {
  try {
    const u = new URL(url.trim());
    // Strip trailing slash and ignore protocol differences (http vs https)
    return u.host + u.pathname.replace(/\/$/, "") + u.search;
  } catch {
    return url.trim().toLowerCase();
  }
};

const main = async () => {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const datasets = await prisma.publishedDataset.findMany({
    where: { external: true },
    select: { id: true, title: true, externalUrl: true, doi: true },
    orderBy: { id: "asc" },
  });

  console.log(
    `Checking ${datasets.length} external dataset(s) for duplicates...\n`,
  );

  // Group by normalized URL
  const byUrl = new Map<string, typeof datasets>();
  for (const ds of datasets) {
    if (!ds.externalUrl) continue;
    const key = normalizeUrl(ds.externalUrl);
    if (!byUrl.has(key)) byUrl.set(key, []);
    byUrl.get(key)!.push(ds);
  }

  // Group by normalized DOI
  const byDoi = new Map<string, typeof datasets>();
  for (const ds of datasets) {
    if (!ds.doi) continue;
    const key = normalize(ds.doi);
    if (!byDoi.has(key)) byDoi.set(key, []);
    byDoi.get(key)!.push(ds);
  }

  let found = 0;

  const urlDupes = [...byUrl.entries()].filter(([, group]) => group.length > 1);
  if (urlDupes.length > 0) {
    console.log("=== Duplicate URLs ===");
    for (const [key, group] of urlDupes) {
      console.log(`\n  URL: "${key}"`);
      for (const ds of group) {
        console.log(`    ID ${ds.id}  title: "${ds.title}"`);
      }
      found += group.length;
    }
    console.log();
  }

  const doiDupes = [...byDoi.entries()].filter(([, group]) => group.length > 1);
  if (doiDupes.length > 0) {
    console.log("=== Duplicate DOIs ===");
    for (const [key, group] of doiDupes) {
      console.log(`\n  DOI: "${key}"`);
      for (const ds of group) {
        console.log(`    ID ${ds.id}  title: "${ds.title}"`);
      }
      found += group.length;
    }
    console.log();
  }

  if (found === 0) {
    console.log("No duplicates found.");
  } else {
    console.log(
      `Found ${urlDupes.length} duplicate URL group(s) and ${doiDupes.length} duplicate DOI group(s).`,
    );
    process.exit(1);
  }
};

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
