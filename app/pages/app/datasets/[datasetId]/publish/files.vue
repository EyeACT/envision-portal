<script setup lang="ts">
import type { TimelineItem } from "@nuxt/ui";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as {
  datasetId: string;
};

// Fetch files from the Azure blob backend route
const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/files`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching dataset files",
    description: "Please try again later",
    icon: "material-symbols:error",
  });
}

if (data.value) {
  useSeoMeta({
    title: "Review Files - " + data.value.title,
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
    title: "Files",
    description: "Review dataset files.",
    icon: "i-lucide-folder-open",
  },
  {
    title: "Publish",
    description: "Publish the dataset.",
    icon: "i-lucide-rocket",
  },
]);
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
          label: 'Review Files',
          to: `/app/datasets/${datasetId}/publish/files`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-16">
      <UStepper
        orientation="horizontal"
        :default-value="4"
        :items="timelineItems"
        class="mx-5 w-full pt-5"
      />

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible title="Dataset Files" bordered no-shadow>
          <div class="flex flex-col">
            <UTree
              v-if="data?.files && data?.files.length > 0"
              :items="data?.files || []"
            />
            <p v-else class="text-gray-500 py-4 text-center">
              No files found in this dataset.
            </p>
          </div>
        </CardCollapsible>
      </div>

      <div class="flex justify-end gap-5">
        <UButton
          :to="`/app/datasets/${datasetId}/publish/readme`"
          class="w-full"
          size="lg"
          variant="outline"
          label="Review Readme"
          icon="i-lucide-arrow-left"
        />

        <UButton
          :to="`/app/datasets/${datasetId}/publish/finalize`"
          class="w-full"
          size="lg"
          label="Proceed to Publish"
          icon="i-lucide-arrow-right"
        />
      </div>

      <pre class="hidden">{{ data }}</pre>
    </div>
  </div>
</template>