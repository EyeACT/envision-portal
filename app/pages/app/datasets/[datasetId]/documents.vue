<script setup lang="ts">
import { useDocuments, DOCUMENT_TYPES, type StudyDocument } from "@/composables/useDocuments";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as { datasetId: string };

useSeoMeta({ title: "Documents" });

const { documents, formatBytes, formatDate, docTypeLabel, fileIcon } = useDocuments();

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

const onUpload = async () => {
  if (!uploadFile.value) {
    toast.add({ title: "Please select a file", color: "error", icon: "material-symbols:error" });
    return;
  }
  uploadLoading.value = true;

  // Mock upload — replace with real Azure upload call
  await new Promise((resolve) => setTimeout(resolve, 800));

  const ext = uploadFile.value.name.split(".").pop()?.toLowerCase() ?? "file";
  documents.value.unshift({
    id: crypto.randomUUID(),
    name: uploadName.value || uploadFile.value.name,
    type: uploadType.value,
    size: uploadFile.value.size,
    uploadedAt: new Date().toISOString(),
    fileExtension: ext,
  });

  uploadLoading.value = false;
  showUploadModal.value = false;
  toast.add({ title: "Document uploaded", description: uploadName.value || uploadFile.value.name });
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

  // Mock delete — replace with real API call
  await new Promise((resolve) => setTimeout(resolve, 400));

  documents.value = documents.value.filter((d) => d.id !== deleteTarget.value!.id);
  deleteLoading.value = false;
  showDeleteModal.value = false;
  toast.add({ title: "Document deleted", description: deleteTarget.value.name });
  deleteTarget.value = null;
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
    <UModal v-model:open="showUploadModal" title="Upload Document" :prevent-close="uploadLoading">
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
          <UFormField label="Document name">
            <UInput
              v-model="uploadName"
              placeholder="e.g. BRIGHT-MOP-v2.pdf"
              :disabled="!uploadFile"
              class="w-full"
            />
          </UFormField>

          <!-- Document type (optional) -->
          <UFormField label="Document type (optional)">
            <USelect
              v-model="uploadType"
              :items="DOCUMENT_TYPES"
              value-key="value"
              placeholder="Select a type..."
              :disabled="!uploadFile"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-3 pt-1">
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancel"
              :disabled="uploadLoading"
              @click="showUploadModal = false"
            />
            <UButton
              label="Upload"
              icon="i-lucide-upload"
              :loading="uploadLoading"
              :disabled="!uploadFile || uploadLoading"
              @click="onUpload"
            />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal" title="Delete document" :prevent-close="deleteLoading">
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
