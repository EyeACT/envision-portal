export interface ScannedFile {
  relativePath: string;
}

export interface ValidatorOptions {
  requireParticipantsTsv?: boolean;
}

export type ValidationStage = "path" | "metadata";

export interface Issue {
  severity: "ERROR" | "WARNING";
  code: string;
  path: string;
  message: string;
  stage: ValidationStage;
}

export interface Summary {
  totalFiles: number;
  datatypes: string[];
  modalities: string[];
  devices: string[];
  participants: string[];
}

export interface ValidationResult {
  isValid: boolean;
  issues: Issue[];
  summary: Summary;
}
