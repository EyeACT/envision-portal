<script setup lang="ts">
import { validateCMDS } from "#shared/utils/cmdsValidator";
import type {
  Issue,
  ScannedFile,
  ValidationResult,
} from "#shared/utils/validatorTypes";

definePageMeta({
  middleware: ["auth"],
});

type BrowserFile = File & { webkitRelativePath?: string };

const route = useRoute();
const toast = useToast();
const { datasetId } = route.params as { datasetId: string };

const folderInput = ref<HTMLInputElement | null>(null);
const requireParticipantsTsv = ref(true);
const isValidating = ref(false);
const folderName = ref("");
const result = ref<ValidationResult | null>(null);
const issueFilter = ref<"all" | "ERROR" | "WARNING">("all");

const { data, error } = await useFetch(`/api/datasets/${datasetId}`);

if (error.value) {
  toast.add({
    title: "Error fetching dataset",
    description: "Please try again later",
    icon: "material-symbols:error",
  });
  await navigateTo(`/app/datasets/${datasetId}`);
}

if (data.value) {
  useSeoMeta({
    title: `${data.value.title} | CMDS Validator`,
  });
}

onMounted(() => {
  if (!folderInput.value) return;
  folderInput.value.setAttribute("webkitdirectory", "");
  folderInput.value.setAttribute("directory", "");
});

const errorCount = computed(
  () => result.value?.issues.filter((issue) => issue.severity === "ERROR").length ?? 0,
);
const warningCount = computed(
  () =>
    result.value?.issues.filter((issue) => issue.severity === "WARNING").length ??
    0,
);

const filteredIssues = computed<Issue[]>(() => {
  const issues = result.value?.issues ?? [];
  if (issueFilter.value === "all") return issues;
  return issues.filter((issue) => issue.severity === issueFilter.value);
});

const sortedParticipants = computed(() => {
  const ids = result.value?.summary.participants ?? [];
  return [...ids].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
  );
});

const openFolderPicker = () => {
  folderInput.value?.click();
};

const resetValidation = () => {
  result.value = null;
  folderName.value = "";
  issueFilter.value = "all";
  if (folderInput.value) {
    folderInput.value.value = "";
  }
};

const relativePathOf = (file: BrowserFile) =>
  (file.webkitRelativePath || file.name).replace(/\\/g, "/");

const findRootParticipantsTsv = (files: BrowserFile[]) => {
  const matches = files
    .map((file) => ({
      file,
      parts: relativePathOf(file).split("/").filter(Boolean),
    }))
    .filter(
      ({ parts }) => parts[parts.length - 1]?.toLowerCase() === "participants.tsv",
    )
    .sort((a, b) => a.parts.length - b.parts.length);

  return matches[0]?.file;
};

const onFolderSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []) as BrowserFile[];

  if (files.length === 0) return;

  isValidating.value = true;
  result.value = null;
  issueFilter.value = "all";

  try {
    const firstPath = relativePathOf(files[0]!);
    folderName.value = firstPath.split("/").filter(Boolean)[0] ?? "Selected folder";

    const scanned: ScannedFile[] = files.map((file) => ({
      relativePath: relativePathOf(file),
    }));

    const tsvFile = findRootParticipantsTsv(files);
    const tsvContent = tsvFile ? await tsvFile.text() : undefined;

    result.value = validateCMDS(scanned, tsvContent, {
      requireParticipantsTsv: requireParticipantsTsv.value,
    });
  } catch (err) {
    console.error("CMDS validation failed:", err);
    toast.add({
      title: "Validation failed",
      description: "Could not read the selected folder. Please try again.",
      icon: "material-symbols:error",
    });
  } finally {
    isValidating.value = false;
    if (folderInput.value) {
      folderInput.value.value = "";
    }
  }
};
</script>

<template>
  <div>
    <input
      ref="folderInput"
      type="file"
      class="hidden"
      multiple
      @change="onFolderSelected"
    />

    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: data?.title, to: `/app/datasets/${datasetId}` },
        { label: 'CMDS Validator', to: `/app/datasets/${datasetId}/validator` },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-8">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              CMDS Validator
            </h1>

            <p class="text-lg font-normal">
              Select a local CMDS dataset folder to check that names and paths
              follow the
              <a
                href="https://cds-specification.readthedocs.io/en/latest/"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary hover:underline"
              >
                CMDS specification
              </a>
              before you upload.
            </p>
          </div>
        </div>
      </div>

      <OverlayLoader :loading="isValidating" overlay size="lg">
        <div
          v-if="!result"
          class="flex min-h-[28rem] w-full flex-col items-center justify-center gap-6 rounded-lg bg-white p-10 text-center shadow-sm dark:bg-gray-900"
        >
          <p class="text-lg text-gray-600 dark:text-gray-300">
            Select a
            <span class="text-primary font-medium">CMDS dataset</span>
            to validate.
          </p>

          <UButton
            size="xl"
            color="primary"
            icon="mdi:folder-open-outline"
            label="Select Dataset Folder"
            @click="openFolderPicker"
          />

          <UCollapsible class="flex w-full max-w-md flex-col items-center gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              trailing-icon="i-lucide-chevron-down"
            >
              Advanced options
            </UButton>

            <template #content>
              <div
                class="w-full rounded-lg bg-gray-50 p-4 text-left dark:bg-gray-800"
              >
                <UFormField
                  label="Require participants.tsv"
                  description="When enabled, a missing participants.tsv is treated as an error."
                >
                  <USwitch
                    v-model="requireParticipantsTsv"
                    :label="requireParticipantsTsv ? 'Required' : 'Optional'"
                  />
                </UFormField>
              </div>
            </template>
          </UCollapsible>

          <div class="max-w-lg space-y-1 text-sm text-gray-500">
            <p>Path and filename validation.</p>
            <p>Selecting a dataset only performs validation. Files are never uploaded.</p>
          </div>
        </div>

        <div v-else class="flex w-full flex-col gap-6">
          <div
            class="flex w-full flex-col gap-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="text-sm text-gray-500">Selected folder</p>
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                  {{ folderName }}
                </h2>
              </div>

              <div class="flex flex-wrap gap-2">
                <UButton
                  color="neutral"
                  variant="soft"
                  icon="mdi:folder-open-outline"
                  label="Select another folder"
                  @click="openFolderPicker"
                />
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-x"
                  label="Clear"
                  @click="resetValidation"
                />
              </div>
            </div>

            <UAlert
              :color="result.isValid ? 'success' : 'error'"
              :icon="
                result.isValid
                  ? 'i-lucide-circle-check'
                  : 'i-lucide-circle-alert'
              "
              :title="
                result.isValid
                  ? 'This folder matches the CMDS path structure.'
                  : 'This folder does not fully match the CMDS path structure.'
              "
              :description="
                result.isValid
                  ? warningCount
                    ? `${warningCount} warning${warningCount === 1 ? '' : 's'} found. Review them before upload.`
                    : 'No path or filename errors were found.'
                  : `${errorCount} error${errorCount === 1 ? '' : 's'} and ${warningCount} warning${warningCount === 1 ? '' : 's'} found.`
              "
              variant="soft"
            />

            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div
                class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
              >
                <p class="text-sm text-gray-500">Files</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ result.summary.totalFiles }}
                </p>
              </div>
              <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p class="text-sm text-gray-500">Participants</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ result.summary.participants.length }}
                </p>
              </div>
              <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p class="text-sm text-gray-500">Datatypes</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ result.summary.datatypes.length }}
                </p>
              </div>
              <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p class="text-sm text-gray-500">Issues</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ result.issues.length }}
                </p>
              </div>
            </div>
          </div>

          <div
            class="flex w-full flex-col gap-5 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
          >
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              Dataset summary
            </h2>

            <div class="space-y-3">
              <div>
                <p class="mb-2 text-sm text-gray-500">Datatypes</p>
                <div class="flex flex-wrap gap-2">
                  <UBadge
                    v-for="item in result.summary.datatypes"
                    :key="item"
                    color="primary"
                    variant="soft"
                  >
                    {{ item }}
                  </UBadge>
                  <span
                    v-if="!result.summary.datatypes.length"
                    class="text-sm text-gray-400"
                  >
                    None found
                  </span>
                </div>
              </div>

              <div>
                <p class="mb-2 text-sm text-gray-500">Modalities</p>
                <div class="flex flex-wrap gap-2">
                  <UBadge
                    v-for="item in result.summary.modalities"
                    :key="item"
                    color="neutral"
                    variant="soft"
                  >
                    {{ item }}
                  </UBadge>
                  <span
                    v-if="!result.summary.modalities.length"
                    class="text-sm text-gray-400"
                  >
                    None found
                  </span>
                </div>
              </div>

              <div>
                <p class="mb-2 text-sm text-gray-500">Devices</p>
                <div class="flex flex-wrap gap-2">
                  <UBadge
                    v-for="item in result.summary.devices"
                    :key="item"
                    color="neutral"
                    variant="soft"
                  >
                    {{ item }}
                  </UBadge>
                  <span
                    v-if="!result.summary.devices.length"
                    class="text-sm text-gray-400"
                  >
                    None found
                  </span>
                </div>
              </div>

              <div>
                <p class="mb-2 text-sm text-gray-500">
                  Participants ({{ result.summary.participants.length }})
                </p>
                <div class="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                  <UBadge
                    v-for="item in sortedParticipants"
                    :key="item"
                    color="neutral"
                    variant="outline"
                  >
                    {{ item }}
                  </UBadge>
                  <span
                    v-if="!result.summary.participants.length"
                    class="text-sm text-gray-400"
                  >
                    None found
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            class="flex w-full flex-col gap-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Issues
              </h2>

              <div class="flex gap-2">
                <UButton
                  size="sm"
                  :color="issueFilter === 'all' ? 'primary' : 'neutral'"
                  :variant="issueFilter === 'all' ? 'solid' : 'soft'"
                  :label="`All (${result.issues.length})`"
                  @click="issueFilter = 'all'"
                />
                <UButton
                  size="sm"
                  :color="issueFilter === 'ERROR' ? 'error' : 'neutral'"
                  :variant="issueFilter === 'ERROR' ? 'solid' : 'soft'"
                  :label="`Errors (${errorCount})`"
                  @click="issueFilter = 'ERROR'"
                />
                <UButton
                  size="sm"
                  :color="issueFilter === 'WARNING' ? 'warning' : 'neutral'"
                  :variant="issueFilter === 'WARNING' ? 'solid' : 'soft'"
                  :label="`Warnings (${warningCount})`"
                  @click="issueFilter = 'WARNING'"
                />
              </div>
            </div>

            <p
              v-if="filteredIssues.length === 0"
              class="text-sm text-gray-500"
            >
              No issues in this view.
            </p>

            <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
              <li
                v-for="(issue, index) in filteredIssues"
                :key="`${issue.code}-${issue.path}-${index}`"
                class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4"
              >
                <div class="sm:w-28">
                  <UBadge
                    :color="issue.severity === 'ERROR' ? 'error' : 'warning'"
                    variant="soft"
                    class="uppercase"
                  >
                    {{ issue.severity }}
                  </UBadge>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ issue.code }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    {{ issue.message }}
                  </p>
                  <p class="mt-1 font-mono text-xs break-all text-gray-400">
                    {{ issue.path }}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </OverlayLoader>
    </div>
  </div>
</template>
