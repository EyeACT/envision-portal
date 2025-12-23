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
  canonicalId: string;
  datasetId: string;
  doi: string;
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
}
