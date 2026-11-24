import type { DiscoveryDatasetList } from "#shared/types/dataset";
import type { PublishedDatasetModality } from "~~/shared/generated/client";
import type {PublishedDataset} from "~~/shared/generated/client"
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

function getModalities(publishedDatasetModalities: PublishedDatasetModality[]): string[] {
  return publishedDatasetModalities.map(modalityRecord => modalityRecord.modality)
}

function matchesSearch(
  searchLower: string,
  title: string,
  description: string,
  keywords: string[],
  modalities: string[]
): boolean {
  const t = title?.toLowerCase() ?? "";
  const d = description?.toLowerCase() ?? "";
  if (t.includes(searchLower) || d.includes(searchLower)) return true;
  return keywords.some((k) => (k?.toLowerCase() ?? "").includes(searchLower)) || 
  modalities.some((m) => (m?.toLowerCase() ?? "").includes(searchLower))
}


const parseModalities = (modalities: any) : string[] => {
  if(typeof modalities === null) {
    return []
  }

  return (Array.isArray(modalities) ? modalities : [modalities])
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

const parseKeywords = (keywords: any) : string [] => {
  if(typeof keywords === null) {
    return []
  }

  return (Array.isArray(keywords) ? keywords : [keywords])
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}



// Returns a paginated list of published datasets (latest version of each)
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Math.max(1, parseInt(String(query.page || "1"), 10));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(String(query.limit || String(DEFAULT_LIMIT)), 10)),
  );
  const keywords = parseKeywords(query.keyword)
  console.log(keywords)
  const modalities = parseModalities(query.modality)
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
  const imageCountMin = typeof query.imageCountMin === "string" ? parseInt(query.imageCountMin) : null
  const imageCountMax = typeof query.imageCountMax === "string" ? parseInt(query.imageCountMax) : null
  const sortBy = typeof query.sortBy === "string" ? query.sortBy : null

  const offset = (page - 1) * limit;

  const hasKeyword = keywords.length > 0;
  const hasModality = modalities.length > 0;
  const hasDateFrom = dateFrom !== null && dateFrom !== "";
  const hasDateTo = dateTo !== null && dateTo !== "";
  const hasSearch = search.length > 0;
  const hasExternalFilter = externalOnly !== null;
  const searchLower = hasSearch ? search.toLowerCase() : "";
  const hasImageCountFilter = imageCountMin !== null || imageCountMax !== null
  const hasSortBy = sortBy !== null

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
      PublishedDatasetModality: true,
      PublishedDatasetFileSummary: true
    },
  });

  // 3. Filter in JS (search, keyword, modality, date range)
  let filtered = publishedDatasets;

  if (hasSearch) {
    filtered = filtered.filter((row) => {
      const keywords = getKeywords(row.publishedMetadata);
      const modalities = getModalities(row.PublishedDatasetModality)
      return matchesSearch(
        searchLower,
        row.title ?? "",
        row.description ?? "",
        keywords,
        modalities
      );
    });
  }

  if (hasKeyword) {
    filtered = filtered.filter((row) => {
      const currentKeywords = getKeywords(row.publishedMetadata);
      return currentKeywords.some((k) => keywords.includes(k.toLowerCase()));
    });
  } 

  if(hasModality){
    console.log("Filtering mby modality")
    filtered = filtered.filter((row) => {
      const currentDatasetModalities = getModalities(row.PublishedDatasetModality)
      return currentDatasetModalities.some((m) => {
        return modalities.includes(m.toLocaleLowerCase())
      })
    })
  }

  if(hasImageCountFilter) {
    filtered = filtered.filter((row) => {
      const count = row.PublishedDatasetFileSummary?.imageFileCount
      return count !== null 
        && count !== undefined
        && (imageCountMin == undefined || count >= imageCountMin)
        && (imageCountMax == undefined || count <= imageCountMax)
    })
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

  if(hasSortBy) {
    // order results based off user preferred order rather than default option (relevance)
    if(sortBy === "modality_count") {
      filtered.sort((a,b) => {
        return b.PublishedDatasetModality.reduce((total, modality) => total + (modality.fileCount ?? 0), 0) - a.PublishedDatasetModality.reduce((total, modality) => total + (modality.fileCount ?? 0), 0) 
      })
    }
  }

  // 3.5 Precompute filtered totals
  const modalityToTotalMap: Record<string, number> = {}
  const sourceToTotalMap: Record<string, number> = {}
  const repositoryToTotalMap: Record<string, number> = {}
  let totalImageFiles = 0
  filtered.forEach(d => {
    d.PublishedDatasetModality.forEach(m => {
      const modalityName = m.modality;
      if (!modalityToTotalMap[modalityName]) {
        modalityToTotalMap[modalityName] = 0
      }
      modalityToTotalMap[modalityName] += m.fileCount ?? 0
    })

    const extractionMethod = d.PublishedDatasetRegistrationDetails?.extractionMethod ?? ""
    sourceToTotalMap[extractionMethod] = (sourceToTotalMap[extractionMethod] ?? 0) + 1
    const datasetSource = d.PublishedDatasetRegistrationDetails?.datasetSource ?? ""
    repositoryToTotalMap[datasetSource] = (repositoryToTotalMap[datasetSource] ?? 0) + 1;
    totalImageFiles += d.PublishedDatasetFileSummary?.imageFileCount || 0
  })

  


  // 4. Paginate in JS
  const pageRows = filtered.slice(offset, offset + limit);
  const canonicalIds = pageRows
    .map((d) => d.canonicalId)
    .filter((id): id is string => id != null);

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
    const datasetSource = PublishedDatasetRegistrationDetails?.datasetSource ?? ""

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
      datasetSource,
      imageFileCount: row.PublishedDatasetFileSummary?.imageFileCount || 0,
      modalities: row.PublishedDatasetModality.map((row) => {
        return {
          modality: row.modality,
          fileCount: row.fileCount || 0
        }
      }),
      modalityFileCount: row.PublishedDatasetModality.reduce((total, modality) => total + (modality.fileCount ?? 0), 0)
    };
  });

  return { data: datasets, total, modalityToTotalMap, sourceToTotalMap, repositoryToTotalMap, totalImageFiles };
});
