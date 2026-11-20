/**
 * Import the image classifier / file census CSVs into external published datasets.
 *
 * Reads `<dir>/{figshare,zenodo}_v3full_eye_records_enriched.csv`, matches each
 * record to existing external datasets (DOI, URL or repository record id) and writes:
 *   - PublishedDatasetModality rows for each eye imaging class found
 *   - one PublishedDatasetFileSummary row with the image count and file types
 *
 * Records with no matching dataset, or flagged as not eye imaging, are reported and
 * skipped. Nothing is created for them and non-external datasets are never touched.
 *
 * Usage:
 *   pnpm scripts:import:image-analysis [dir] [-apply]
 * Without -apply it is a dry run that only prints what would change.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../shared/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DEFAULT_DIR = ".dev.local/extraction-csv";
const REPOSITORIES = ["figshare", "zenodo"] as const;
const DETECTION_METHOD = "image-classifier-v3full";

// Classifier class -> modality stored on PublishedDatasetModality
const MODALITIES = {
  CFP: {
    modality: "color_fundus_photography",
    label: "Color Fundus Photography",
  },
  IR: { modality: "infrared_reflectance", label: "Infrared Reflectance (IR)" },
  PSC: { modality: "pseudo_color_fundus", label: "Pseudo-color Fundus (UWF)" },
  FAF: {
    modality: "fundus_autofluorescence",
    label: "Fundus Autofluorescence (FAF)",
  },
  OCT: { modality: "oct", label: "Optical Coherence Tomography (OCT)" },
  OCTA: { modality: "octa", label: "OCT Angiography (OCTA)" },
} as const;
type EyeClass = keyof typeof MODALITIES;

// Extensions the classifier reads (videos are sampled as frames), used to fill fileExtensions on a modality
const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "tif",
  "tiff",
  "bmp",
  "gif",
  "dcm",
  "ppm",
  "mp4",
  "avi",
  "mov",
]);

type Row = Record<string, string>;

const parseCsv = (text: string): Row[] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows;
  if (!header) return [];
  return body.map((r) =>
    Object.fromEntries(header.map((k, i) => [k, r[i] ?? ""])),
  );
};

const int = (v: string | undefined) => {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isNaN(n) ? 0 : n;
};

const float = (v: string | undefined) => {
  const n = Number.parseFloat(v ?? "");
  return Number.isNaN(n) ? 0 : n;
};

// Keys that identify a record across DOI versions, URL forms and repository ids
const matchKeys = (doi?: string | null, url?: string | null): string[] => {
  const keys = new Set<string>();

  if (doi) {
    const d = doi
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
    keys.add(`doi:${d}`);
    // Figshare DOIs carry a version suffix (.v1), so they also match on the article id
    const zenodo = d.match(/^10\.5281\/zenodo\.(\d+)$/);
    if (zenodo) keys.add(`zenodo:${zenodo[1]}`);
    const figshare = d.match(/^10\.6084\/m9\.figshare\.(\d+)/);
    if (figshare) keys.add(`figshare:${figshare[1]}`);
  }

  if (url) {
    const u = url.trim().toLowerCase();
    const zenodo = u.match(/zenodo\.org\/records?\/(\d+)/);
    if (zenodo) keys.add(`zenodo:${zenodo[1]}`);
    const figshare = u.match(
      /figshare\.[^/]+\/articles\/(?:[^/]+\/)*?(\d+)(?:\/\d+)?\/?$/,
    );
    if (figshare) keys.add(`figshare:${figshare[1]}`);
  }

  return [...keys];
};

// "jpg:12; png:3" -> { jpg: 12, png: 3 }, dropping folder names and other items the census picked up
const parseFileTypeCounts = (value: string): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const part of value.split(";")) {
    const i = part.lastIndexOf(":");
    if (i < 0) continue;
    const ext = part.slice(0, i).trim().toLowerCase();
    const count = int(part.slice(i + 1));
    if (!/^[a-z][a-z0-9]{0,7}(\.[a-z0-9]{1,4})?$/.test(ext) || count <= 0)
      continue;
    counts[ext] = (counts[ext] ?? 0) + count;
  }
  return counts;
};

const buildRecord = (row: Row) => {
  const imageFileCount = int(row.n_image_files);
  const classifiedComplete = int(row.n_classified) >= imageFileCount;
  const partialDownload = row.status === "ok_partial_download";

  // When every image was classified the sample counts are exact, otherwise use the scaled estimate
  const count = (cls: string) => {
    const n = int(row[`n_${cls}`]);
    return classifiedComplete
      ? n
      : Math.max(n, Math.round(float(row[`est_${cls}`])));
  };

  const fileTypeCounts = parseFileTypeCounts(row.file_type_counts ?? "");
  const imageExtensions = Object.keys(fileTypeCounts)
    .filter((ext) => IMAGE_EXTENSIONS.has(ext))
    .sort();

  // present_eye_classes is the classifier's thresholded list, so stray single images are not counted as a modality
  const present = (row.present_eye_classes ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter((c): c is EyeClass => c in MODALITIES);

  const modalities = present.map((cls) => ({
    ...MODALITIES[cls],
    fileCount: count(cls),
    fileCountComplete: classifiedComplete && !partialDownload,
    // Extensions are only known per record, so they are only attributed when there is one modality
    fileExtensions: present.length === 1 ? imageExtensions : [],
    detectionMethod: DETECTION_METHOD,
  }));

  const summary = {
    itemType: row.item_type || null,
    imageFileCount,
    fileTypeCounts,
    maskFileCount: count("MASK"),
  };

  return { summary, modalities };
};

const main = async () => {
  const args = process.argv.slice(2);
  const apply = args.includes("-apply");
  const dir = args.find((a) => !a.startsWith("-")) ?? DEFAULT_DIR;

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const datasets = await prisma.publishedDataset.findMany({
      where: { external: true },
      select: { id: true, doi: true, externalUrl: true },
    });

    const index = new Map<string, Set<number>>();
    for (const ds of datasets) {
      for (const key of matchKeys(ds.doi, ds.externalUrl)) {
        if (!index.has(key)) index.set(key, new Set());
        index.get(key)!.add(ds.id);
      }
    }

    // datasetId -> record. Duplicate registrations of the same record (e.g. Figshare + Datacite) all get it
    const updates = new Map<
      number,
      ReturnType<typeof buildRecord> & { recordId: string }
    >();
    const unmatched: string[] = [];
    let rowCount = 0;

    for (const repository of REPOSITORIES) {
      const file = path.join(
        dir,
        `${repository}_v3full_eye_records_enriched.csv`,
      );
      const rows = parseCsv(readFileSync(file, "utf8"));
      rowCount += rows.length;

      for (const row of rows) {
        const recordKey = `${repository}:${row.record_id.replace(/^figshare-/, "")}`;
        const ids = new Set<number>();
        for (const key of [...matchKeys(row.doi, row.url), recordKey]) {
          for (const id of index.get(key) ?? []) ids.add(id);
        }

        if (ids.size === 0) {
          unmatched.push(
            `${repository} ${row.record_id}  ${row.doi || row.url}`,
          );
          continue;
        }

        if (row.excluded_non_ocular === "True") {
          console.log(
            `Skipping ${row.record_id}, matched datasets ${[...ids].join(", ")}: flagged non-ocular (${row.exclusion_reason})`,
          );
          continue;
        }

        const record = { ...buildRecord(row), recordId: row.record_id };
        for (const id of ids) {
          const existing = updates.get(id);
          if (existing && existing.recordId !== record.recordId) {
            console.warn(
              `Dataset ${id} matches both ${existing.recordId} and ${record.recordId}, keeping the later one`,
            );
          }
          updates.set(id, record);
        }
      }
    }

    const modalityCount = [...updates.values()].reduce(
      (n, u) => n + u.modalities.length,
      0,
    );

    console.log(`CSV records: ${rowCount}`);
    console.log(`External datasets matched: ${updates.size}`);
    console.log(`Modality rows to write: ${modalityCount}`);
    console.log(`Records with no external dataset: ${unmatched.length}`);

    if (!apply) {
      console.log("\nDry run. Pass -apply to write to the database.");
      return;
    }

    let done = 0;
    for (const [publishedDatasetId, { summary, modalities }] of updates) {
      await prisma.$transaction([
        prisma.publishedDatasetFileSummary.upsert({
          where: { publishedDatasetId },
          create: { publishedDatasetId, ...summary },
          update: summary,
        }),
        // Replace only modalities this classifier wrote, leaving other detection methods alone
        prisma.publishedDatasetModality.deleteMany({
          where: {
            publishedDatasetId,
            detectionMethod: DETECTION_METHOD,
            modality: { notIn: modalities.map((m) => m.modality) },
          },
        }),
        ...modalities.map((m) =>
          prisma.publishedDatasetModality.upsert({
            where: {
              publishedDatasetId_modality: {
                publishedDatasetId,
                modality: m.modality,
              },
            },
            create: { publishedDatasetId, ...m },
            update: m,
          }),
        ),
      ]);

      done++;
      if (done % 50 === 0 || done === updates.size) {
        console.log(`Updated ${done}/${updates.size}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
