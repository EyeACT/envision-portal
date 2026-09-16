import prettyBytes from "pretty-bytes";
import dayjs from "dayjs";
import { DOCUMENT_TYPES } from "#shared/constants/documents"
import type { document } from "~~/shared/types/document";

export interface StudyDocument {
  id: string;
  name: string;
  type: string | null;
  size: number;
  uploadedAt: string;
  fileExtension: string;
}



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

export function useDocuments(datasetId: string) {

  const error = ref(null)

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

  $fetch(`/api/datasets/${datasetId}/documents`)
    .then(docs => {
      let parsedDocs = JSON.parse(docs) as document[]
      // match docs to StudyDocument
      parsedDocs.forEach(doc => {
        documents.value.push({
          id: doc.id,
          name: doc.documentName,
          type: doc.documentType,
          size: Number(doc.size),
          uploadedAt: doc.created.toString(),
          fileExtension: doc.documentName.split(".").at(-1)!
        })
      })
    })
    .catch(err => error.value = err)


  return {
    documents,
    formatBytes,
    formatDate,
    docTypeLabel,
    fileIcon,
  };
}
