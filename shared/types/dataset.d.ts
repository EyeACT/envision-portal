export interface DatasetHealthsheetRecord {
  id: number;
  question: string;
  response: string;
}

export interface DatasetHealthsheetRecords {
  version: number;
  records: DatasetHealthsheetRecord[];
}

interface DiscoveryListDatasetCreator {
  creatorName: string;
  nameType: string;
  affiliation: {
    affiliationName: string;
  }[];
  nameIdentifier: {
    nameIdentifierValue: string;
    nameIdentifierScheme: string;
    schemeURI?: string;
  }[];
}

export interface DiscoveryDatasetList {
  id: number;
  canonicalId: string | null;
  datasetId: string | null;
  doi: string | null;
  external: boolean;
  title: string;
  description: string;
  versionTitle: string;
  rights: string[];
  registrationSource: string;
  creators: DiscoveryListDatasetCreator[];
  keywords: string[];
  created: Date;
  versionCount: number;
  labelingMethod: string;
  validationInfo: string;
  /** Source repository for external datasets, e.g. "zenodo" | "figshare". */
  repository?: string | null;
  /** Imaging modalities found by the image classifier. */
  modalities?: DiscoveryDatasetModality[];
  /** Total image files in the record, including images inside archives. */
  imageFileCount?: number | null;
  maskFileCount?: number | null;
}

export interface DiscoveryDatasetModality {
  modality: string;
  label: string;
  fileCount: number | null;
  /** false when fileCount is estimated from a sample of the images. */
  fileCountComplete: boolean;
}

export interface DiscoveryFacets {
  modality: Record<string, number>;
  origin: { envision: number; external: number };
  repository: Record<string, number>;
}

export interface DiscoverySummary {
  datasets: number;
  images: number;
  repositories: number;
}

export interface DiscoveryDatasetResponse {
  data: DiscoveryDatasetList[];
  total: number;
  facets?: DiscoveryFacets;
  summary?: DiscoverySummary;
}
