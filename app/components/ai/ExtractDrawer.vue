<script setup lang="ts">
import { useDocuments } from "@/composables/useDocuments";

export interface ExtractField {
  key: string;
  label: string;
  description: string;
  type: "text" | "textarea" | "date" | "array";
  mandatory?: boolean;
}

// Keyed by field.key → extracted string value
export type ExtractedValues = Record<string, string>;

const props = defineProps<{
  fields: ExtractField[];
  pageLabel?: string;
}>();

const emit = defineEmits<{
  apply: [values: ExtractedValues];
}>();

const open = defineModel<boolean>("open", { default: false });

const { documents, docTypeLabel, fileIcon } = useDocuments();

const selectedDocIds = ref<Set<string>>(new Set());
const extractLoading = ref(false);
const extractedValues = ref<ExtractedValues | null>(null);

const toggleDoc = (id: string) => {
  if (selectedDocIds.value.has(id)) {
    selectedDocIds.value.delete(id);
  } else {
    selectedDocIds.value.add(id);
  }
};

// Mock extracted values keyed by field type — replace body with real LLM call
const MOCK_BY_TYPE: Record<ExtractField["type"], (label: string) => string> = {
  text: (label) => `Extracted ${label}`,
  textarea: (label) =>
    `This is a placeholder extracted value for "${label}". The AI will populate this with actual content parsed from the selected documents.`,
  date: () => new Date().toISOString().slice(0, 10),
  array: (label) => `${label} item 1, ${label} item 2`,
};

const onExtract = async () => {
  extractLoading.value = true;
  extractedValues.value = null;

  // Mock extraction delay — replace with real LLM API call
  await new Promise((resolve) => setTimeout(resolve, 1800));

  const result: ExtractedValues = {};
  for (const field of props.fields) {
    result[field.key] = MOCK_BY_TYPE[field.type](field.label);
  }
  extractedValues.value = result;
  extractLoading.value = false;
};

const onApply = () => {
  if (!extractedValues.value) return;
  emit("apply", { ...extractedValues.value });
  onClose();
};

const onClose = () => {
  open.value = false;
  extractedValues.value = null;
  selectedDocIds.value.clear();
};
</script>

<template>
  <UDrawer
    v-model:open="open"
    direction="right"
    :ui="{ content: 'w-[480px] max-w-full' }"
  >
    <template #content>
      <div class="flex h-full flex-col">
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700"
        >
          <div class="flex items-center gap-2">
            <Icon
              name="material-symbols:auto-awesome"
              size="20"
              class="text-primary-500"
            />
            <div>
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                Extract from Documents
              </h2>
              <p
                v-if="pageLabel"
                class="text-xs text-gray-400 dark:text-gray-500"
              >
                {{ pageLabel }}
              </p>
            </div>
          </div>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="onClose"
          />
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-5 py-4">
          <!-- Select documents -->
          <div v-if="!extractedValues" class="space-y-3">
            <p
              class="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500"
            >
              Select documents
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Choose which documents to analyse. The AI will extract values for
              the fields on this page.
            </p>

            <div
              v-if="documents.length === 0"
              class="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-8 dark:border-gray-700"
            >
              <Icon
                name="material-symbols:folder-open-outline-rounded"
                size="36"
                class="text-gray-300 dark:text-gray-600"
              />
              <p class="mt-3 text-sm text-gray-400">No documents uploaded yet.</p>
              <UButton
                class="mt-3"
                size="sm"
                variant="outline"
                label="Go to Documents"
                to="documents"
              />
            </div>

            <ul v-else class="space-y-2">
              <li
                v-for="doc in documents"
                :key="doc.id"
                class="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition"
                :class="
                  selectedDocIds.has(doc.id)
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 dark:border-primary-400'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                "
                @click="toggleDoc(doc.id)"
              >
                <UCheckbox
                  :model-value="selectedDocIds.has(doc.id)"
                  class="shrink-0"
                  @click.stop
                  @update:model-value="toggleDoc(doc.id)"
                />
                <Icon
                  :name="fileIcon(doc.fileExtension).name"
                  size="26"
                  class="shrink-0"
                  :class="fileIcon(doc.fileExtension).color"
                />
                <div class="min-w-0 flex-1">
                  <p
                    class="truncate text-sm font-medium text-gray-900 dark:text-white"
                    :title="doc.name"
                  >
                    {{ doc.name }}
                  </p>
                  <p v-if="docTypeLabel(doc.type)" class="mt-0.5 text-xs text-gray-400">
                    {{ docTypeLabel(doc.type) }}
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <!-- Extracted results -->
          <div v-else class="space-y-3">
            <p
              class="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500"
            >
              Extracted fields
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Review the values below. Applying will replace existing field
              values and append to any lists.
            </p>
            <ul class="space-y-2">
              <li
                v-for="field in fields"
                :key="field.key"
                class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-800"
              >
                <div class="flex items-center justify-between gap-2">
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {{ field.label }}
                    <span v-if="field.mandatory" class="ml-0.5 text-red-500">*</span>
                  </p>
                  <UBadge
                    :label="field.type"
                    variant="soft"
                    color="neutral"
                    size="xs"
                    class="shrink-0 capitalize"
                  />
                </div>
                <p class="mt-1.5 text-xs text-gray-600 dark:text-gray-300">
                  {{ extractedValues[field.key] }}
                </p>
              </li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="space-y-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700"
        >
          <template v-if="!extractedValues">
            <UButton
              icon="material-symbols:auto-awesome"
              label="Extract & Generate"
              class="w-full"
              size="lg"
              :loading="extractLoading"
              :disabled="selectedDocIds.size === 0 || extractLoading"
              @click="onExtract"
            />
            <p v-if="selectedDocIds.size === 0" class="text-center text-xs text-gray-400">
              Select at least one document to continue
            </p>
          </template>
          <template v-else>
            <UButton
              icon="i-lucide-check"
              label="Apply to Form"
              class="w-full"
              size="lg"
              color="success"
              @click="onApply"
            />
            <UButton
              label="Re-extract"
              class="w-full"
              size="lg"
              color="neutral"
              variant="ghost"
              @click="extractedValues = null"
            />
          </template>
        </div>
      </div>
    </template>
  </UDrawer>
</template>
