import prettyBytes from "pretty-bytes";
import dayjs from "dayjs";

export interface StudyDocument {
  id: string;
  name: string;
  type: string | null;
  size: number;
  uploadedAt: string;
  fileExtension: string;
}

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

// Module-level singleton so all composable callers share the same reactive list
const documents = ref<StudyDocument[]>([
  {
    id: "1",
    name: "BRIGHT-Study-MOP-v2.pdf",
    type: "mop",
    size: 2_450_000,
    uploadedAt: "2026-04-10T14:23:00Z",
    fileExtension: "pdf",
  },
  {
    id: "2",
    name: "Informed-Consent-Form-English.pdf",
    type: "icf",
    size: 380_000,
    uploadedAt: "2026-04-12T09:05:00Z",
    fileExtension: "pdf",
  },
  {
    id: "3",
    name: "IRB-Approval-Letter-2026.pdf",
    type: "irb",
    size: 145_000,
    uploadedAt: "2026-04-15T11:00:00Z",
    fileExtension: "pdf",
  },
  {
    id: "4",
    name: "Data-Dictionary-v1.3.xlsx",
    type: "data_dictionary",
    size: 92_000,
    uploadedAt: "2026-05-02T16:47:00Z",
    fileExtension: "xlsx",
  },
  {
    id: "5",
    name: "Statistical-Analysis-Plan.docx",
    type: "sap",
    size: 210_000,
    uploadedAt: "2026-05-20T08:30:00Z",
    fileExtension: "docx",
  },
]);

export function useDocuments() {
  const formatBytes = (bytes: number) => prettyBytes(bytes);

  const formatDate = (iso: string) => dayjs(iso).format("MMM D, YYYY");

  const docTypeLabel = (value: string | null) =>
    DOCUMENT_TYPES.find((t) => t.value === value)?.label ?? null;

  const fileIcon = (ext: string) => {
    if (ext === "pdf") return { name: "material-icon-theme:pdf", color: "" };
    if (["doc", "docx"].includes(ext))
      return { name: "vscode-icons:file-type-word", color: "" };
    if (["xls", "xlsx"].includes(ext))
      return { name: "vscode-icons:file-type-excel", color: "" };
    if (["ppt", "pptx"].includes(ext))
      return { name: "vscode-icons:file-type-powerpoint", color: "" };
    return { name: "material-symbols:description", color: "text-gray-400" };
  };

  return {
    documents,
    formatBytes,
    formatDate,
    docTypeLabel,
    fileIcon,
  };
}
