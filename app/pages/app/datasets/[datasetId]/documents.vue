<script setup lang="ts">
import { useDocuments, type StudyDocument } from "@/composables/useDocuments";
import {DOCUMENT_TYPES} from "#shared/constants/documents"
import type { document } from "~~/shared/types/document";
import { useConfirmDialog } from "~/composables/useConfirmDialog";

const confirm = useConfirmDialog()

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as { datasetId: string };

useSeoMeta({ title: "Documents" });

const { documents, formatBytes, formatDate, docTypeLabel, fileIcon } = useDocuments(datasetId);


// Upload modal
const showUploadModal = ref(false);
const uploadLoading = ref(false);
const uploadFile = ref<File | null>(null);
const uploadName = ref("");
const uploadType = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const dragOver = ref(false);

const openUploadModal = () => {
  uploadFile.value = null;
  uploadName.value = "";
  uploadType.value = null;
  showUploadModal.value = true;
};

const handleFileSelect = (file: File) => {
  uploadFile.value = file;
  uploadName.value = file.name;
};

const onFileInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files?.[0]) handleFileSelect(target.files[0]);
};

const onDrop = (e: DragEvent) => {
  dragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) handleFileSelect(file);
};


const documentWillBeReplaced = (documentName: string) => {
  return documents.value.some(document => {
    return document.name === documentName
  })
}

const getDocumentId = (documentName: string) => {
  const targetDocument = documents.value.find(document => {
    return document.name === documentName
  })

  return targetDocument!.id
}

const createDocument = async () => {

  if (!uploadFile.value) {
      toast.add({ title: "Please select a file", color: "error", icon: "material-symbols:error" });
      return;
  }

  uploadLoading.value = true;

  const formData = new FormData()
  formData.append("file", uploadFile.value)
  formData.append("fileName", uploadName.value)
  formData.append("fileType", uploadType.value ?? "")
  formData.append("fileExtension", uploadName.value.split(".").pop() ?? "")


  try {
    const documentResponse = await $fetch(`/api/datasets/${datasetId}/documents`, {
      body: formData, 
      method: "POST"
    })
    const documentReponseParsed = JSON.parse(documentResponse) as document
    const ext = uploadFile.value.name.split(".").pop()?.toLowerCase() ?? "file";
    documents.value.unshift({
      id: documentReponseParsed.id,
      name: documentReponseParsed.originalName,
      type: uploadType.value,
      size: Number(uploadFile.value.size),
      uploadedAt: documentReponseParsed.created,
      fileExtension: ext,
    });
    toast.add({ title: "Document uploaded", description: uploadName.value || uploadFile.value.name });
  } catch (e) {
    console.error(e)
    toast.add({title: "Document upload failed", description: uploadName.value,  color: "error", icon: "material-symbols:error"})
  } finally {
    uploadLoading.value = false;
    showUploadModal.value = false;
  }
}

const replaceDocument = async (documentId: string) => {
  if(!uploadFile.value) {
    return
  }

  const newData = await uploadFile.value.arrayBuffer()

  try {
    const documentResponse = await $fetch(`/api/datasets/${datasetId}/documents/${documentId}`, {
      body: newData,
      method: "PUT",
      headers: {
        'Content-Type': 'application/octet-stream',
    },
    })

    const documentReponseParsed = JSON.parse(documentResponse) as document
    documents.value.forEach(document => {
      if(document.id === documentId) {
        document.size = Number(documentReponseParsed.size);
      }  
    })
    toast.add({ title: "Document uploaded", description: uploadName.value || uploadFile.value.name });
  } catch (e) {
    console.error(e)
    toast.add({title: "Document upload failed", description: uploadName.value,  color: "error", icon: "material-symbols:error"})
  } finally {
    uploadLoading.value = false;
    showUploadModal.value = false;
  }
}

const onUpload = async () => {
  if (!uploadFile.value) {
      toast.add({ title: "Please select a file", color: "error", icon: "material-symbols:error" });
      return;
  }

  if (documentWillBeReplaced(uploadName.value) ) {
    let confirmed = await confirm({
      title: "Document Already Exists",
      description: `If you continue your current document will be replaced. Continue with the upload?`
    })

    if(!confirmed) {
      toast.add({ title: "Document Will Not Be Uploded", description: uploadName.value || uploadFile.value.name });
      uploadLoading.value = false;
      showUploadModal.value = false;
      return
    }

    console.log("Will replace")

    return replaceDocument(getDocumentId(uploadName.value))
  } 


  await createDocument()
};

// Delete
const deleteTarget = ref<StudyDocument | null>(null);
const showDeleteModal = ref(false);
const deleteLoading = ref(false);

const confirmDelete = (doc: StudyDocument) => {
  deleteTarget.value = doc;
  showDeleteModal.value = true;
};

const onDelete = async () => {
  if (!deleteTarget.value) return;
  deleteLoading.value = true;

  let doc = deleteTarget.value
  let documentId = doc.id

  try {
    await $fetch(`/api/datasets/${datasetId}/documents/${documentId}`, {
      method: "DELETE",
    })
    documents.value = documents.value.filter((d) => d.id !== deleteTarget.value!.id);
    toast.add({ title: "Document deleted", description: deleteTarget.value.name });
  } catch(e) {
    console.error(e)
    toast.add({title: "Could not delete document", color: "error", icon: "material-symbols:error"})
  } finally {
    deleteLoading.value = false
    showDeleteModal.value = false;
    deleteTarget.value = null;
  }


};
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: 'Dataset', to: `/app/datasets/${datasetId}` },
        { label: 'Documents', to: `/app/datasets/${datasetId}/documents` },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-6">
      <!-- Header -->
      <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <div class="flex w-full items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
            <p class="mt-1 text-base text-gray-500 dark:text-gray-400">
              Upload and manage study-related documents such as protocols, consent forms, and regulatory correspondence.
            </p>
          </div>

          <UButton
            icon="i-lucide-upload"
            label="Upload Document"
            @click="openUploadModal"
          />
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="documents.length === 0"
        class="flex flex-col items-center justify-center rounded-lg bg-white p-16 shadow-sm dark:bg-gray-900"
      >
        <Icon name="material-symbols:folder-open-outline-rounded" size="56" class="text-gray-300 dark:text-gray-600" />
        <p class="mt-4 text-lg font-medium text-gray-500 dark:text-gray-400">No documents uploaded yet</p>
        <p class="mt-1 text-sm text-gray-400 dark:text-gray-500">Upload study documents to get started.</p>
        <UButton class="mt-6" icon="i-lucide-upload" label="Upload Document" @click="openUploadModal" />
      </div>

      <!-- Card grid -->
      <div
        v-else
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="doc in documents"
          :key="doc.id"
          class="flex flex-col justify-between rounded-lg bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-gray-900"
        >
          <div class="flex items-start gap-3">
            <Icon
              :name="fileIcon(doc.fileExtension).name"
              size="36"
              class="mt-0.5 shrink-0"
              :class="fileIcon(doc.fileExtension).color"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-gray-900 dark:text-white" :title="doc.name">
                {{ doc.name }}
              </p>
              <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                {{ formatBytes(doc.size) }} &middot; {{ formatDate(doc.uploadedAt) }}
              </p>
            </div>
          </div>

          <div class="mt-4 flex items-center justify-between">
            <UBadge
              v-if="docTypeLabel(doc.type)"
              variant="soft"
              color="primary"
              size="sm"
              class="max-w-[160px] truncate"
            >
              {{ docTypeLabel(doc.type) }}
            </UBadge>
            <span v-else class="text-xs text-gray-400 italic">No type set</span>

            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="sm"
              aria-label="Delete document"
              @click="confirmDelete(doc)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <UModal v-model:open="showUploadModal" title="Upload Document" :prevent-close="uploadLoading" :ui="{ content: 'bg-gray-50 dark:bg-gray-900 dark:text-white', title: 'dark:text-white' }">
      <template #body>
        <div class="space-y-5">
          <!-- Drop zone -->
          <div
            class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition"
            :class="dragOver
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800'"
            @dragover.prevent="dragOver = true"
            @dragleave="dragOver = false"
            @drop.prevent="onDrop"
            @click="fileInputRef?.click()"
          >
            <input
              ref="fileInputRef"
              type="file"
              class="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              @change="onFileInputChange"
            />
            <Icon name="i-lucide-upload-cloud" size="32" class="text-gray-400" />
            <p class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ uploadFile ? uploadFile.name : "Click or drag a file here" }}
            </p>
            <p class="mt-1 text-xs text-gray-400">PDF, Word, Excel, PowerPoint, TXT, CSV</p>
          </div>

          <!-- Document name -->
          <UFormField label="Document name" :ui="{label: 'dark:text-white'}">
            <UInput
              v-model="uploadName"
              placeholder="e.g. BRIGHT-MOP-v2.pdf"
              :disabled="!uploadFile"
              class="w-full"
            />
          </UFormField>

          <!-- Document type (optional) -->
          <UFormField label="Document type (optional)" :ui="{label: 'dark:text-white'}">
            <USelect
              v-model="uploadType"
              :items="DOCUMENT_TYPES"
              value-key="value"
              placeholder="Select a type..."
              :disabled="!uploadFile"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-3 pt-1" >
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancel"
              :disabled="uploadLoading"
              @click="showUploadModal = false"
              class="dark:text-white dark:hover:bg-gray-800"
            />
            <UButton
              label="Upload"
              icon="i-lucide-upload"
              :loading="uploadLoading"
              :disabled="!uploadFile || uploadLoading"
              @click="onUpload"
              class="dark:text-white"
            />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal" title="Delete document" :prevent-close="deleteLoading" :ui="{ content: 'bg-gray-50 dark:bg-gray-900 dark:text-white', title: 'dark:text-white' }">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete
            <span class="font-semibold text-gray-900 dark:text-white">{{ deleteTarget?.name }}</span>?
            This action cannot be undone.
          </p>
          <div class="flex justify-end gap-3 pt-2">
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancel"
              :disabled="deleteLoading"
              @click="showDeleteModal = false"
              class="dark:text-white dark:hover:bg-gray-800"
            />
            <UButton
              color="error"
              label="Delete"
              icon="i-lucide-trash-2"
              :loading="deleteLoading"
              @click="onDelete"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
