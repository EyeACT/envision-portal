<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as {
  datasetId: string;
};

const { data, error } = await useFetch(`/api/datasets/${datasetId}/files`, {});

if (error.value) {
  toast.add({
    title: "Error fetching study",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  await navigateTo(`/app/datasets/${datasetId}`);
}

// const f2 = [
//   {
//     icon: "i-heroicons-document-text",
//     label: "README.md",
//   },
//   {
//     icon: "i-vscode-icons-file-type-csv",
//     label: "participants.tsv",
//   },
//   {
//     icon: "i-vscode-icons-file-type-json",
//     label: "participants.json",
//   },
//   {
//     icon: "i-vscode-icons-file-type-json",
//     label: "dataset_structure_description.json",
//   },
//   {
//     children: [
//       {
//         icon: "i-vscode-icons-file-type-excel",
//         label: "analysis_results.xlsx",
//       },
//       {
//         icon: "i-vscode-icons-file-type-csv",
//         label: "summary_stats.csv",
//       },
//     ],
//     icon: "i-heroicons-cog-6-tooth",
//     label: "processed/",
//   },
// ];

if (data.value) {
  useSeoMeta({
    title: "Files - " + data.value.title,
  });
}
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: data?.title, to: `/app/datasets/${datasetId}` },
        {
          label: 'Files',
          to: `/app/datasets/${datasetId}/files`,
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

      <div class="rounded-lg bg-white p-6 pb-5 shadow-sm dark:bg-gray-900">
        <UTree
          v-if="data?.files && data?.files.length > 0"
          :items="data?.files || []"
        />

        <p v-else>
          No files found. Please
          <NuxtLink
            :to="`/app/datasets/${datasetId}/upload`"
            class="text-blue-500"
            >upload files</NuxtLink
          >
          to get started.
        </p>
      </div>

      <pre class="hidden"> {{ data }}</pre>
    </div>
  </div>
</template>
