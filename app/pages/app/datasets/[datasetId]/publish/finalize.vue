<script setup lang="ts">
import type { TimelineItem, TableColumn } from "@nuxt/ui";
import { UIcon, UButton } from "#components";
import DatasetPublishingStatus from "~/assets/data/publishing-status.json";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();
const dayjs = useDayjs();

const publishLoading = ref(false);
const retryLoading = ref(false);
const pollingInterval = ref<NodeJS.Timeout | null>(null);
const modalOpen = ref(false);
const publishedId = ref<number | null>(null);

// The file copy runs in scripts/process-task-queue.ts after the finalize request
// returns, so the status is polled until the task completes or fails
const POLLING_INTERVAL_MS = 2000;

const COMPLETED_STATUS = DatasetPublishingStatus.completed.index;

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

const isPublished = computed(
  () => !!publishedId.value || currentStatus.value.status === COMPLETED_STATUS,
);

// The task queue sets the status to -1 when the publish task fails. The dataset
// stays locked until an admin retries the task
const isPublishingFailed = computed(
  () =>
    !!data.value?.DatasetPublishingStatus &&
    !!data.value?.lockedAt &&
    currentStatus.value.status === -1,
);

const isPublishingInProgress = computed(
  () =>
    !!data.value?.lockedAt &&
    !isPublished.value &&
    currentStatus.value.status >= 0 &&
    currentStatus.value.status < COMPLETED_STATUS,
);

// Set by finalize.post.ts and retry.post.ts until the task queue picks up the task
const isQueued = computed(
  () =>
    isPublishingInProgress.value &&
    currentStatus.value.status ===
      DatasetPublishingStatus["indexing-dataset"].index &&
    currentStatus.value.comment === "Queued for publishing",
);

// Recomputed on every poll, since each poll replaces `data`
const publishStartedAgo = computed(() =>
  data.value?.lockedAt ? dayjs(data.value.lockedAt).fromNow() : "",
);

const progressDescription = computed(() => {
  const started = `Publishing was started ${publishStartedAgo.value}.`;

  if (isQueued.value) {
    return `${started} It is waiting in the queue and will start shortly.`;
  }

  return `${started} The files are being copied to published storage, which can take several hours for large datasets. You can close this page, publishing keeps going in the background.`;
});

const showStatusTable = computed(
  () =>
    publishLoading.value ||
    isPublishingInProgress.value ||
    isPublishingFailed.value ||
    isPublished.value,
);

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
          row.original.index === currentStatus.value.status &&
          currentStatus.value.comment
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

const stopPolling = () => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
};

const checkPublishingStatus = async () => {
  await fetchData();

  if (isPublished.value) {
    stopPolling();
    modalOpen.value = true;
  } else if (isPublishingFailed.value) {
    stopPolling();

    toast.add({
      title: "Error publishing dataset",
      description: currentStatus.value.comment || "Please try again later",
      color: "error",
      icon: "material-symbols:error",
    });
  }
};

const startPolling = () => {
  stopPolling();

  pollingInterval.value = setInterval(
    checkPublishingStatus,
    POLLING_INTERVAL_MS,
  );
};

const publishDataset = async () => {
  publishLoading.value = true;

  startPolling();

  await $fetch(`/api/datasets/${datasetId}/publish/finalize`, {
    method: "POST",
  })
    .then(() => {
      toast.add({
        title: "Publishing started",
        description:
          "The dataset is locked and queued for publishing. Large datasets may take a while to copy.",
        icon: "i-lucide-rocket",
      });
    })
    .catch((error) => {
      console.error(error);

      stopPolling();

      toast.add({
        title: "Error publishing dataset",
        description: error.data?.statusMessage || "Please try again later",
        color: "error",
        icon: "material-symbols:error",
      });
    })
    .finally(async () => {
      publishLoading.value = false;

      await fetchData();
    });
};

const retryPublish = async () => {
  retryLoading.value = true;

  await $fetch(`/api/datasets/${datasetId}/publish/retry`, {
    method: "POST",
  })
    .then(async () => {
      toast.add({
        title: "Publishing restarted",
        description: "The dataset has been queued for publishing again.",
        icon: "i-lucide-rocket",
      });

      await fetchData();

      startPolling();
    })
    .catch((error) => {
      console.error(error);

      toast.add({
        title: "Error retrying the publish",
        description: error.data?.statusMessage || "Please try again later",
        color: "error",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      retryLoading.value = false;
    });
};

// Resume tracking a publish that was started before the page was opened
onMounted(async () => {
  await fetchData();

  if (isPublishingInProgress.value) {
    startPolling();
  }
});

// Clean up polling on component unmount
onUnmounted(() => {
  stopPolling();
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
        :default-value="5"
        :items="timelineItems"
        class="mx-5 w-full pt-5"
      />

      <UAlert
        v-if="isPublishingFailed"
        color="error"
        variant="subtle"
        icon="material-symbols:error"
        title="Publishing failed"
        :description="`${currentStatus.comment}. The dataset stays locked so it can be retried with the same files and metadata. If it keeps failing, contact an administrator.`"
        :actions="[
          {
            label: 'Retry publishing',
            icon: 'i-lucide-rotate-cw',
            color: 'error',
            loading: retryLoading,
            onClick: retryPublish,
          },
        ]"
      />

      <UAlert
        v-else-if="isPublishingInProgress && !publishLoading"
        color="info"
        variant="subtle"
        icon="i-lucide-hourglass"
        title="Publishing in progress"
        :description="progressDescription"
      />

      <UAlert
        v-else-if="!data?.lockedAt && !publishLoading"
        color="neutral"
        variant="subtle"
        icon="i-lucide-info"
        title="What to expect"
        description="Starting the publishing process locks the dataset, so its files and metadata can no longer be changed. The files are then copied to published storage in the background. This takes a few minutes for small datasets and can take several hours for large ones. You don't need to keep this page open, and you can come back here at any time to check the progress."
      />

      <div
        v-if="showStatusTable"
        class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <UTable
          :data="tableData"
          :columns="columns"
          class="flex-1"
          :loading="publishLoading || isPublishingInProgress"
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
              All files have been copied to published storage and verified. This
              version can no longer be changed. To make changes, create a new
              version of the dataset.
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
          v-if="!data?.lockedAt"
          :to="`/app/datasets/${datasetId}/publish/files`"
          class="w-full"
          size="lg"
          variant="outline"
          label="Review Files"
          icon="i-lucide-arrow-left"
        />

        <UButton
          v-if="isPublished"
          class="w-full"
          size="lg"
          label="View published dataset"
          :to="`/datasets/${publishedId}`"
          :disabled="!publishedId"
          target="_blank"
          icon="i-lucide-arrow-right"
        />

        <UButton
          v-else
          class="w-full"
          size="lg"
          :loading="publishLoading || isPublishingInProgress"
          :disabled="isPublishingInProgress || isPublishingFailed"
          label="Start the publishing process"
          icon="i-lucide-arrow-right"
          @click="publishDataset"
        />
      </div>

      <pre class="hidden">{{ data }}</pre>
    </div>
  </div>
</template>
