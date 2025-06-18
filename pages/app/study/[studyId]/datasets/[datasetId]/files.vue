<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId, studyId } = route.params as {
  datasetId: string;
  studyId: string;
};

const { data, error } = await useFetch(
  `/api/studies/${studyId}/datasets/${datasetId}`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching study",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  await navigateTo("/");
}

if (data.value) {
  useSeoMeta({
    title: data.value.title,
  });
}

const items = ref([
  {
    children: [
      {
        children: [
          {
            icon: "i-vscode-icons-file-type-csv",
            label: "participant_001.csv",
            trailingIcon: "i-heroicons-arrow-down-tray",
          },
          {
            icon: "i-vscode-icons-file-type-csv",
            label: "participant_002.csv",
            trailingIcon: "i-heroicons-arrow-down-tray",
          },
        ],
        icon: "i-heroicons-user-group",
        label: "participants/",
      },
      {
        children: [
          {
            icon: "i-vscode-icons-file-type-json",
            label: "baseline_survey.json",
            trailingIcon: "i-heroicons-arrow-down-tray",
          },
          {
            icon: "i-vscode-icons-file-type-json",
            label: "followup_survey.json",
            trailingIcon: "i-heroicons-arrow-down-tray",
          },
        ],
        defaultExpanded: true,
        icon: "i-heroicons-clipboard-document-list",
        label: "surveys/",
      },
    ],
    defaultExpanded: true,
    icon: "i-heroicons-folder",
    label: "raw_data/",
  },
  {
    children: [
      {
        icon: "i-vscode-icons-file-type-excel",
        label: "analysis_results.xlsx",
        trailingIcon: "i-heroicons-arrow-down-tray",
      },
      {
        icon: "i-vscode-icons-file-type-csv",
        label: "summary_stats.csv",
        trailingIcon: "i-heroicons-arrow-down-tray",
      },
    ],
    icon: "i-heroicons-cog-6-tooth",
    label: "processed/",
  },
  {
    icon: "i-heroicons-document-text",
    label: "README.md",
    trailingIcon: "i-heroicons-arrow-down-tray",
  },
  {
    icon: "i-heroicons-shield-check",
    label: "LICENSE.txt",
    trailingIcon: "i-heroicons-arrow-down-tray",
  },
  {
    icon: "i-heroicons-clock",
    label: "CHANGELOG.md",
    trailingIcon: "i-heroicons-arrow-down-tray",
  },
  {
    icon: "i-heroicons-heart",
    label: "healthsheet.md",
    trailingIcon: "i-heroicons-arrow-down-tray",
  },
  {
    icon: "i-vscode-icons-file-type-json",
    label: "study_description.json",
    trailingIcon: "i-heroicons-arrow-down-tray",
  },
  {
    icon: "i-vscode-icons-file-type-json",
    label: "dataset_description.json",
    trailingIcon: "i-heroicons-arrow-down-tray",
  },
  {
    icon: "i-vscode-icons-file-type-csv",
    label: "participants.tsv",
    trailingIcon: "i-heroicons-arrow-down-tray",
  },
  {
    icon: "i-vscode-icons-file-type-json",
    label: "participants.json",
    trailingIcon: "i-heroicons-arrow-down-tray",
  },
  {
    icon: "i-vscode-icons-file-type-json",
    label: "dataset_structure_description.json",
    trailingIcon: "i-heroicons-arrow-down-tray",
  },
]);
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: data?.title, to: `/app/study/${studyId}` },
        {
          label: 'Datasets',
          to: `/app/study/${studyId}/datasets`,
        },
        {
          label: data?.title,
          to: `/app/study/${studyId}/datasets/${datasetId}`,
        },
        {
          label: 'Files',
          to: `/app/study/${studyId}/datasets/${datasetId}/files`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Files
            </h1>

            <p class="text-lg font-normal">
              {{ data?.description }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <UTree :items="items" />
      </div>
    </div>
  </div>
</template>
