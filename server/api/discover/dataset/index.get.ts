import type { DiscoveryDatasetList } from "#shared/types/dataset";
import type { PublishedDatasetModality } from "~~/shared/generated/client";
import type { PublishedDataset } from "~~/shared/generated/client";
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

type PublishedMetadata = {
  datasetDescription?: {
    creator?: unknown[];
    subject?: { subjectValue: string }[];
    rights?: { rightsName: string }[];
  };
};

function getKeywords(publishedMetadata: unknown): string[] {
  const meta = publishedMetadata as PublishedMetadata;
  return meta?.datasetDescription?.subject?.map((s) => s.subjectValue) ?? [];
}

function getModalities(
  publishedDatasetModalities: PublishedDatasetModality[],
): string[] {
  return publishedDatasetModalities.map(
    (modalityRecord) => modalityRecord.modality,
  );
}

function matchesSearch(
  searchLower: string,
  title: string,
  description: string,
  keywords: string[],
  modalities: string[],
): boolean {
  const t = title?.toLowerCase() ?? "";
  const d = description?.toLowerCase() ?? "";
  if (t.includes(searchLower) || d.includes(searchLower)) return true;
  return (
    keywords.some((k) => (k?.toLowerCase() ?? "").includes(searchLower)) ||
    modalities.some((m) => (m?.toLowerCase() ?? "").includes(searchLower))
  );
}

const parseModalities = (modalities: any): string[] => {
  if (typeof modalities === null) {
    return [];
  }

  return (Array.isArray(modalities) ? modalities : [modalities])
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
};

const parseKeywords = (keywords: any): string[] => {
  if (typeof keywords === null) {
    return [];
  }

  return (Array.isArray(keywords) ? keywords : [keywords])
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
};

// Returns a paginated list of published datasets (latest version of each)
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Math.max(1, parseInt(String(query.page || "1"), 10));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(String(query.limit || String(DEFAULT_LIMIT)), 10)),
  );
  const keywords = parseKeywords(query.keyword);
  console.log(keywords);
  const modalities = parseModalities(query.modality);
  const dateFrom = typeof query.dateFrom === "string" ? query.dateFrom : null;
  const dateTo = typeof query.dateTo === "string" ? query.dateTo : null;
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const externalParam = query.external;
  const externalOnly =
    externalParam === "true" || externalParam === true
      ? true
      : externalParam === "false" || externalParam === false
        ? false
        : null;
  const imageCountMin =
    typeof query.imageCountMin === "string"
      ? parseInt(query.imageCountMin)
      : null;
  const imageCountMax =
    typeof query.imageCountMax === "string"
      ? parseInt(query.imageCountMax)
      : null;
  const sortBy = typeof query.sortBy === "string" ? query.sortBy : null;

  const offset = (page - 1) * limit;

  const hasKeyword = keywords.length > 0;
  const hasModality = modalities.length > 0;
  const hasDateFrom = dateFrom !== null && dateFrom !== "";
  const hasDateTo = dateTo !== null && dateTo !== "";
  const hasSearch = search.length > 0;
  const hasExternalFilter = externalOnly !== null;
  const searchLower = hasSearch ? search.toLowerCase() : "";
  const hasImageCountFilter = imageCountMin !== null || imageCountMax !== null;

  // 1. Get latest id per canonicalId (Prisma groupBy)
  const latestPerCanonical = await prisma.publishedDataset.groupBy({
    by: ["canonicalId"],
    _max: { id: true },
  });

  const latestIds = latestPerCanonical
    .map((r) => r._max.id)
    .filter((id): id is number => id != null);

  if (latestIds.length === 0) {
    return { data: [], total: 0 };
  }

  // 2. Fetch all latest datasets. Skip the large JSON columns (publishedMetadata, files, data):
  const publishedDatasets = await prisma.publishedDataset.findMany({
    where: { id: { in: latestIds } },
    orderBy: { created: "desc" },
    select: {
      id: true,
      canonicalId: true,
      datasetId: true,
      doi: true,
      title: true,
      versionTitle: true,
      created: true,
      external: true,
      PublishedDatasetRegistrationDetails: {
        select: { extractionMethod: true, datasetSource: true },
      },
      PublishedDatasetModality: {
        select: { modality: true, fileCount: true },
      },
      PublishedDatasetFileSummary: {
        select: { imageFileCount: true, maskFileCount: true },
      },
    },
  });

  // Search and keyword filters need descriptions and keywords. Pull only the keywords' JSON path
  const keywordMap = new Map<number, string[]>();
  const descriptionMap = new Map<number, string>();
  if (hasSearch || hasKeyword) {
    const searchRows = await prisma.$queryRaw<
      { id: number; description: string; subject: unknown }[]
    >`
      SELECT id, description, "publishedMetadata" #> '{datasetDescription,subject}' AS subject
      FROM "PublishedDataset"
      WHERE id = ANY(${latestIds})
    `;
    for (const r of searchRows) {
      descriptionMap.set(r.id, r.description);
      keywordMap.set(
        r.id,
        getKeywords({ datasetDescription: { subject: r.subject } }),
      );
    }
  }

  // 3. Filter in JS (search, keyword, modality, date range)
  let filtered = publishedDatasets;

  if (hasSearch) {
    filtered = filtered.filter((row) => {
      const keywords = keywordMap.get(row.id) ?? [];
      const modalities = getModalities(row.PublishedDatasetModality);
      return matchesSearch(
        searchLower,
        row.title ?? "",
        descriptionMap.get(row.id) ?? "",
        keywords,
        modalities,
      );
    });
  }

  if (hasKeyword) {
    filtered = filtered.filter((row) => {
      const currentKeywords = keywordMap.get(row.id) ?? [];
      return currentKeywords.some((k) => keywords.includes(k.toLowerCase()));
    });
  }

  if (hasModality) {
    console.log("Filtering mby modality");
    filtered = filtered.filter((row) => {
      const currentDatasetModalities = getModalities(
        row.PublishedDatasetModality,
      );
      return currentDatasetModalities.some((m) => {
        return modalities.includes(m.toLocaleLowerCase());
      });
    });
  }

  if (hasImageCountFilter) {
    filtered = filtered.filter((row) => {
      const count = row.PublishedDatasetFileSummary?.imageFileCount;
      return (
        count !== null &&
        count !== undefined &&
        (imageCountMin == undefined || count >= imageCountMin) &&
        (imageCountMax == undefined || count <= imageCountMax)
      );
    });
  }

  if (hasDateFrom) {
    const from = new Date(dateFrom);
    filtered = filtered.filter((row) => row.created >= from);
  }

  if (hasDateTo) {
    const to = new Date(dateTo);
    filtered = filtered.filter((row) => row.created <= to);
  }

  if (hasExternalFilter) {
    filtered = filtered.filter((row) => row.external === externalOnly);
  }

  const total = filtered.length;

  if (total === 0) {
    return { data: [], total: 0 };
  }

  // Rows arrive newest first, so "newest" (and any unknown value) keeps that order
  type Row = (typeof filtered)[number];
  const modalityCount = (d: Row) =>
    d.PublishedDatasetModality.filter((m) => (m.fileCount ?? 0) > 0).length;
  const modalityFiles = (d: Row) =>
    d.PublishedDatasetModality.reduce(
      (total, m) => total + (m.fileCount ?? 0),
      0,
    );
  const imageCount = (d: Row) =>
    d.PublishedDatasetFileSummary?.imageFileCount ?? 0;

  const comparators: Record<string, (a: Row, b: Row) => number> = {
    // Most distinct modalities first, then most classified images
    relevance: (a, b) =>
      modalityCount(b) - modalityCount(a) ||
      modalityFiles(b) - modalityFiles(a),
    oldest: (a, b) => a.created.getTime() - b.created.getTime(),
    images: (a, b) => imageCount(b) - imageCount(a),
    title: (a, b) =>
      (a.title ?? "").localeCompare(b.title ?? "", undefined, {
        sensitivity: "base",
      }),
  };

  const comparator = sortBy ? comparators[sortBy] : undefined;
  if (comparator) {
    filtered.sort(comparator);
  }

  // 3.5 Precompute filtered totals
  const modalityToTotalMap: Record<string, number> = {};
  const sourceToTotalMap: Record<string, number> = {};
  const repositoryToTotalMap: Record<string, number> = {};
  let totalImageFiles = 0;
  filtered.forEach((d) => {
    d.PublishedDatasetModality.forEach((m) => {
      const modalityName = m.modality;
      if (!modalityToTotalMap[modalityName]) {
        modalityToTotalMap[modalityName] = 0;
      }
      modalityToTotalMap[modalityName] += m.fileCount ?? 0;
    });

    const extractionMethod =
      d.PublishedDatasetRegistrationDetails?.extractionMethod ?? "";
    sourceToTotalMap[extractionMethod] =
      (sourceToTotalMap[extractionMethod] ?? 0) + 1;
    const datasetSource =
      d.PublishedDatasetRegistrationDetails?.datasetSource ?? "";
    repositoryToTotalMap[datasetSource] =
      (repositoryToTotalMap[datasetSource] ?? 0) + 1;
    totalImageFiles += d.PublishedDatasetFileSummary?.imageFileCount || 0;
  });

  // 4. Paginate in JS
  const pageRows = filtered.slice(offset, offset + limit);
  const canonicalIds = pageRows
    .map((d) => d.canonicalId)
    .filter((id): id is string => id != null);

  // 5. Version counts and metadata for this page only
  const [versionCounts, pageMetadata] = await Promise.all([
    prisma.publishedDataset.groupBy({
      by: ["canonicalId"],
      where: { canonicalId: { in: canonicalIds } },
      _count: { id: true },
    }),
    prisma.publishedDataset.findMany({
      where: { id: { in: pageRows.map((d) => d.id) } },
      select: { id: true, description: true, publishedMetadata: true },
    }),
  ]);

  const versionCountMap = new Map(
    versionCounts.map((vc) => [vc.canonicalId, vc._count.id]),
  );
  const pageMetadataMap = new Map(pageMetadata.map((m) => [m.id, m]));

  const datasets: DiscoveryDatasetList[] = pageRows.map((row) => {
    const { canonicalId, PublishedDatasetRegistrationDetails } = row;
    const meta = pageMetadataMap.get(row.id)?.publishedMetadata;
    const publishedMetadata = meta as PublishedMetadata;

    const creators = (publishedMetadata?.datasetDescription?.creator ??
      []) as DiscoveryDatasetList["creators"];
    const keywords = getKeywords(meta);
    const rights =
      publishedMetadata?.datasetDescription?.rights?.map(
        (r: { rightsName: string }) => r.rightsName,
      ) ?? [];

    const versionCount = versionCountMap.get(canonicalId) ?? 1;
    const registrationSource =
      PublishedDatasetRegistrationDetails?.extractionMethod ?? "";
    const datasetSource =
      PublishedDatasetRegistrationDetails?.datasetSource ?? "";

    return {
      id: row.id,
      canonicalId: row.canonicalId,
      datasetId: row.datasetId,
      doi: row.doi,
      title: row.title,
      description: pageMetadataMap.get(row.id)?.description ?? "",
      versionTitle: row.versionTitle,
      creators,
      keywords,
      created: row.created,
      external: row.external,
      labelingMethod: "",
      validationInfo: "",
      versionCount: versionCount - 1,
      rights,
      registrationSource,
      datasetSource,
      imageFileCount: row.PublishedDatasetFileSummary?.imageFileCount || 0,
      maskFileCount: row.PublishedDatasetFileSummary?.maskFileCount || 0,
      modalities: row.PublishedDatasetModality.map((row) => {
        return {
          modality: row.modality,
          fileCount: row.fileCount || 0,
        };
      }),
      modalityFileCount: row.PublishedDatasetModality.reduce(
        (total, modality) => total + (modality.fileCount ?? 0),
        0,
      ),
    };
  });

  return {
    data: datasets,
    total,
    modalityToTotalMap,
    sourceToTotalMap,
    repositoryToTotalMap,
    totalImageFiles,
  };
});
