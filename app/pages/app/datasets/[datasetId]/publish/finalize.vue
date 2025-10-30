<script setup lang="ts">
import type { TimelineItem, TableColumn } from "@nuxt/ui";
import { UIcon, UButton } from "#components";
import DatasetPublishingStatus from "~/assets/data/publishing-status.json";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const publishLoading = ref(false);
const pollingInterval = ref<NodeJS.Timeout | null>(null);
const modalOpen = ref(false);
const publishedId = ref<number | null>(null);

const { datasetId } = route.params as {
  datasetId: string;
};

const data = ref<any>(null);

const fetchData = async () => {
  await $fetch(`/api/datasets/${datasetId}/publish`, {})
    .then((d) => {
      useSeoMeta({
        title: d.title,
      });

      data.value = d;

      publishedId.value =
        parseInt(d.doi?.split("envision.")[1] || "") || d.publishedId || null;

      return d;
    })
    .catch((error) => {
      console.error(error);

      toast.add({
        title: "Error fetching details",
        description: "Please try again later",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {});
};

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

const tableData = ref(
  (
    Object.keys(DatasetPublishingStatus) as Array<
      keyof typeof DatasetPublishingStatus
    >
  ).map((key, index) => ({
    id: key,
    index,
    step: DatasetPublishingStatus[key].title,
  })),
);

const currentStatus = computed(() => {
  return (
    data.value?.DatasetPublishingStatus || {
      comment: "",
      currentFileNumber: 0,
      fileCount: 0,
      status: -1,
    }
  );
});

const columns: TableColumn<{
  id: string;
  index: number;
  step: string;
}>[] = [
  {
    accessorKey: "task",
    cell: ({ row }) =>
      h(
        "div",
        {
          class: "flex flex-col gap-1",
        },
        [
          h("p", { class: "text-base text-black" }, [row.original.step]),
          (currentStatus.value.status === 4 && row.original.index === 4) ||
          (currentStatus.value.status === 5 && row.original.index === 5)
            ? h("p", { class: "text-sm text-gray-500" }, [
                currentStatus.value.comment,
              ])
            : null,
        ],
      ),
    header: "Task",
  },
  {
    accessorKey: "status",
    cell: ({ row }) =>
      row.original.index === currentStatus.value.status
        ? h("div", { class: "flex flex-col gap-1" }, [
            h(UIcon, {
              name: "line-md:loading-loop",
              class: "text-primary-500",
              size: "2xl",
            }),
            row.original.index === 5 &&
            currentStatus.value.status === 5 &&
            currentStatus.value.fileCount > 0
              ? h(
                  "span",
                  {
                    class: "text-sm text-gray-500",
                  },
                  `${currentStatus.value.currentFileNumber}/${currentStatus.value.fileCount} (${((currentStatus.value.currentFileNumber / currentStatus.value.fileCount) * 100).toFixed(2)}%)`,
                )
              : null,
          ])
        : row.original.index < currentStatus.value.status
          ? h(
              UIcon,
              {
                name: "fluent-mdl2:completed",
                class: "text-green-500",
                size: "2xl",
              },
              [row.original.index],
            )
          : h(UIcon, {
              name: "eos-icons:hourglass",
              class: "text-gray-300",
              size: "xl",
            }),
    header: () =>
      h("div", { class: "flex items-center gap-2" }, [
        h("p", { class: "text-sm text-gray-500" }, ["Status"]),
        publishLoading.value &&
          h(UIcon, {
            name: "line-md:loading-loop",
            class: "text-primary-500 hidden",
            size: "2xl",
          }),
      ]),
  },
];

const publishDataset = async () => {
  publishLoading.value = true;

  pollingInterval.value = setInterval(async () => {
    await fetchData();
  }, 500);

  await $fetch(`/api/datasets/${datasetId}/publish/finalize`, {
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
    .finally(async () => {
      publishLoading.value = false;

      // One last check to see if the dataset is published
      await fetchData();

      if (publishedId.value) {
        modalOpen.value = true;
      }

      if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
      }
    });
};

// Clean up polling on component unmount
onUnmounted(() => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
  }
});
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
      <UStepper
        :default-value="4"
        :items="timelineItems"
        class="mx-5 w-full pt-5"
      />

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <UTable
          :data="tableData"
          :columns="columns"
          class="flex-1"
          :loading="publishLoading"
        />
      </div>

      <UModal
        v-model:open="modalOpen"
        title="Your dataset was published"
        description="You can now view your dataset on the discover page."
      >
        <template #body>
          <div class="flex flex-col gap-4">
            <p class="text-sm text-gray-500">
              If your dataset contains large amounts of data, it may take a
              while to index and move all files to the new location.
            </p>

            <UButton
              label="View dataset"
              :to="`/datasets/${publishedId}`"
              target="_blank"
              :disabled="!publishedId"
              icon="i-lucide-arrow-right"
              @click="navigateTo(`/app/dashboard`)"
            />
          </div>
        </template>
      </UModal>

      <div class="flex justify-end gap-5">
        <UButton
          class="w-full"
          size="lg"
          :loading="publishLoading"
          label="Start the publishing process"
          icon="i-lucide-arrow-right"
          @click="publishDataset"
        />
      </div>

      <pre class="hidden">{{ data }}</pre>
    </div>
  </div>
</template>
