export interface RuleItem {
  name: string;
  severity: "ERROR" | "WARNING";
}

export interface CMDSConfig {
  allowedDatatypes: string[];
  requiredRootFiles: RuleItem[];
  allowedRootItems: string[];
  allowedRootDirectories: string[];
  requiredDatatypeFiles: RuleItem[];
  nestedLayoutSkipDatatypes: string[];
  namingRegex: RegExp;
}

export const defaultConfig: CMDSConfig = {
  allowedDatatypes: [
    "cardiac_ecg",
    "clinical_data",
    "environment",
    "retinal_flio",
    "retinal_oct",
    "retinal_octa",
    "retinal_photography",
    "wearable_activity_monitor",
    "wearable_blood_glucose",
  ],

  requiredRootFiles: [
    { name: "readme.md", severity: "ERROR" },
    { name: "license.txt", severity: "ERROR" },
    { name: "changelog.md", severity: "ERROR" },
    { name: "healthsheet.md", severity: "ERROR" },
    { name: "study_description.json", severity: "ERROR" },
    { name: "dataset_description.json", severity: "ERROR" },
    { name: "dataset_structure_description.json", severity: "ERROR" },
    { name: "participants.tsv", severity: "ERROR" },
    { name: "participants.json", severity: "ERROR" },
  ],

  allowedRootItems: [".gitignore", ".ds_store"],
  allowedRootDirectories: ["code"],
  requiredDatatypeFiles: [{ name: "manifest.tsv", severity: "WARNING" }],
  nestedLayoutSkipDatatypes: ["clinical_data"],
  namingRegex: /^[a-z0-9_]+$/,
};
