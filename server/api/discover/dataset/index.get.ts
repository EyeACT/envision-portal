import type { DiscoveryDatasetList } from "#shared/types/dataset";

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

function matchesSearch(
  searchLower: string,
  title: string,
  description: string,
  keywords: string[],
): boolean {
  const t = title?.toLowerCase() ?? "";
  const d = description?.toLowerCase() ?? "";
  if (t.includes(searchLower) || d.includes(searchLower)) return true;
  return keywords.some((k) => (k?.toLowerCase() ?? "").includes(searchLower));
}

// Returns a paginated list of published datasets (latest version of each)
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Math.max(1, parseInt(String(query.page || "1"), 10));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(String(query.limit || String(DEFAULT_LIMIT)), 10)),
  );
  const keyword = typeof query.keyword === "string" ? query.keyword.trim() : "";
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

  const offset = (page - 1) * limit;

  const hasKeyword = keyword.length > 0;
  const hasDateFrom = dateFrom !== null && dateFrom !== "";
  const hasDateTo = dateTo !== null && dateTo !== "";
  const hasSearch = search.length > 0;
  const hasExternalFilter = externalOnly !== null;
  const searchLower = hasSearch ? search.toLowerCase() : "";

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

  // 2. Fetch all latest datasets (single Prisma findMany)
  const publishedDatasets = await prisma.publishedDataset.findMany({
    where: { id: { in: latestIds } },
    orderBy: { created: "desc" },
    include: {
      PublishedDatasetRegistrationDetails: true,
    },
  });

  // 3. Filter in JS (search, keyword, date range)
  let filtered = publishedDatasets;

  if (hasSearch) {
    filtered = filtered.filter((row) => {
      const keywords = getKeywords(row.publishedMetadata);
      return matchesSearch(
        searchLower,
        row.title ?? "",
        row.description ?? "",
        keywords,
      );
    });
  }

  if (hasKeyword) {
    const kwLower = keyword.toLowerCase();
    filtered = filtered.filter((row) => {
      const keywords = getKeywords(row.publishedMetadata);
      return keywords.some((k) => (k?.toLowerCase() ?? "") === kwLower);
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

  // 4. Paginate in JS
  const pageRows = filtered.slice(offset, offset + limit);
  const canonicalIds = pageRows.map((d) => d.canonicalId);

  // 5. Version counts for this page's canonicalIds (Prisma groupBy)
  const versionCounts = await prisma.publishedDataset.groupBy({
    by: ["canonicalId"],
    where: { canonicalId: { in: canonicalIds } },
    _count: { id: true },
  });

  const versionCountMap = new Map(
    versionCounts.map((vc) => [vc.canonicalId, vc._count.id]),
  );

  const datasets: DiscoveryDatasetList[] = pageRows.map((row) => {
    const {
      publishedMetadata: meta,
      canonicalId,
      PublishedDatasetRegistrationDetails,
    } = row;
    const publishedMetadata = meta as PublishedMetadata;

    const creators = (publishedMetadata?.datasetDescription?.creator ??
      []) as DiscoveryDatasetList["creators"];
    const keywords = getKeywords(row.publishedMetadata);
    const rights =
      publishedMetadata?.datasetDescription?.rights?.map(
        (r: { rightsName: string }) => r.rightsName,
      ) ?? [];

    const versionCount = versionCountMap.get(canonicalId) ?? 1;
    const registrationSource =
      PublishedDatasetRegistrationDetails?.extractionMethod ?? "";

    return {
      id: row.id,
      canonicalId: row.canonicalId,
      datasetId: row.datasetId,
      doi: row.doi,
      title: row.title,
      description: row.description,
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
    };
  });

  return { data: datasets, total };
});
