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

const { data, error } = await useFetch(
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
          label: 'Review Readme',
          to: `/app/datasets/${datasetId}/publish/readme`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-16">
      <UStepper
        orientation="horizontal"
        :default-value="3"
        :items="timelineItems"
        class="mx-5 w-full pt-5"
      />

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible title="Readme" bordered no-shadow>
          <div class="flex flex-col">
            <MarkdownRenderer :content="data?.readme || ''" />
          </div>
        </CardCollapsible>
      </div>

      <div class="flex justify-end gap-5">
        <UButton
          :to="`/app/datasets/${datasetId}/publish/changelog`"
          class="w-full"
          size="lg"
          variant="outline"
          label="Review Changelog"
          icon="i-lucide-arrow-left"
        />

        <UButton
          :to="`/app/datasets/${datasetId}/publish/finalize`"
          class="w-full"
          size="lg"
          label="Publish"
          icon="i-lucide-arrow-right"
        />
      </div>

      <pre class="hidden">{{ data }}</pre>
    </div>
  </div>
</template>
