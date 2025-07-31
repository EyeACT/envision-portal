<script setup lang="ts">
import type { TimelineItem, TableColumn } from "@nuxt/ui";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const publishLoading = ref(false);

const { datasetId } = route.params as {
  datasetId: string;
};

const { data, error } = await useFetch(
  // TODO: Change this to the finalize endpoint
  `/api/datasets/${datasetId}/publish/readme`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching readme",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  // await navigateTo(`/app/study/${studyId}/datasets/${datasetId}`);
}

if (data.value) {
  useSeoMeta({
    title: data.value.title,
  });
}

const timelineItems = ref<TimelineItem[]>([
  {
    title: "Study Metadata",
    description: "Review added study metadata.",
    icon: "i-lucide-rocket",
  },
  {
    title: "Dataset Metadata",
    description: "Review added dataset metadata.",
    icon: "i-lucide-palette",
  },
  {
    title: "Changelog",
    description: "Add a changelog to the dataset.",
    icon: "i-lucide-code",
  },
  {
    title: "Readme",
    description: "Add a readme to the dataset.",
    icon: "i-lucide-file-text",
  },
  {
    title: "Publish",
    description: "Publish the dataset.",
    icon: "i-lucide-rocket",
  },
]);

const tableData = ref([
  {
    id: "0",
    icon: "i-lucide-rocket",
    step: "Preparing the workflow",
  },
]);

const columns: TableColumn<{
  id: string;
  icon: string;
  step: string;
}>[] = [
  {
    accessorKey: "step",
    cell: ({ row }) => row.original.step,
    header: "Step",
  },
  {
    accessorKey: "icon",
    cell: ({ row }) => row.original.icon,
    header: "Icon",
  },
];

const publishDataset = async () => {
  publishLoading.value = true;

  await $fetch(`/api/datasets/${datasetId}/publish`, {
    method: "POST",
  })
    .then(() => {
      toast.add({
        title: "Dataset published",
        description: "The dataset has been published.",
        icon: "i-lucide-rocket",
      });
    })
    .catch((error) => {
      console.error(error);

      toast.add({
        title: "Error publishing dataset",
        description: "Please try again later",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      publishLoading.value = false;
    });
};
</script>

<template>
  <div class="w-full">
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: data?.title, to: `/app/datasets/${datasetId}` },
        {
          label: 'Publish',
          to: `/app/datasets/${datasetId}/publish`,
        },
        {
          label: 'Finalize',
          to: `/app/datasets/${datasetId}/publish/finalize`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-16">
      <UTimeline
        orientation="horizontal"
        :default-value="4"
        :items="timelineItems"
        class="mx-5 w-full pt-5"
      />

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <UTable :data="tableData" :columns="columns" class="flex-1" />
      </div>

      <div class="flex justify-end gap-5">
        <UButton
          class="w-full"
          size="lg"
          :loading="publishLoading"
          label="Publish"
          icon="i-lucide-arrow-right"
          @click="publishDataset"
        />
      </div>

      <pre class="hidden">{{ data }}</pre>
    </div>
  </div>
</template>
