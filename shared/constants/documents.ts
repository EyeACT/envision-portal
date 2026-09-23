export const DOCUMENT_TYPES = [
  { label: "Manual of Procedures (MOP)", value: "mop" },
  { label: "Study Protocol", value: "study_protocol" },
  { label: "Informed Consent Form (ICF)", value: "icf" },
  { label: "HIPAA Authorization / Privacy Notice", value: "hipaa" },
  { label: "Data Dictionary", value: "data_dictionary" },
  { label: "Case Report Form (CRF)", value: "crf" },
  { label: "IRB / Ethics Approval Letter", value: "irb" },
  { label: "Data Use Agreement (DUA)", value: "dua" },
  { label: "Statistical Analysis Plan (SAP)", value: "sap" },
  { label: "Protocol Amendment", value: "amendment" },
  { label: "Training Materials", value: "training" },
  { label: "Site Agreement", value: "site_agreement" },
  { label: "Regulatory Correspondence", value: "regulatory" },
  { label: "Other", value: "other" },
] as const;

export const ACCEPTED_DOCUMENT_EXTENSIONS = [
  "pdf",
  "md",
  "txt",
  "docx",
  "xlsx",
  "xls",
  "csv",
  "doc"
]

export const ACCEPTED_DOCUMENT_MIMETYPES = [
  "application/pdf",
  "text/markdown",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/msword",
  "application/vnd.ms-excel"
]

