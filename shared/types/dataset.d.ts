export interface DatasetHealthsheetRecord {
  id: number;
  question: string;
  response: string;
}

export interface DatasetHealthsheetRecords {
  version: number;
  records: DatasetHealthsheetRecord[];
}
