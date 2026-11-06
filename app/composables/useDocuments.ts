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
const documents = ref<StudyDocument[]>([]);
const loading = ref(false);

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

  // The list is shared, so clear the previous dataset's documents before loading
  documents.value = [];
  loading.value = true;

  $fetch(`/api/datasets/${datasetId}/documents`)
    .then(docs => {
      const parsedDocs = JSON.parse(docs) as document[]

      documents.value = parsedDocs.map(doc => ({
        id: doc.id,
        name: doc.originalName,
        type: doc.documentType,
        size: Number(doc.size),
        uploadedAt: doc.created.toString(),
        fileExtension: doc.sanitizedName.split(".").at(-1)!
      }))
    })
    .catch(err => error.value = err)
    .finally(() => loading.value = false)


  return {
    documents,
    loading,
    formatBytes,
    formatDate,
    docTypeLabel,
    fileIcon,
  };
}
