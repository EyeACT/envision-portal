<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });

const route = useRoute();
const toast = useToast();
const { datasetId } = route.params as { datasetId: string };

const { data: dataset, error } = await useFetch(`/api/datasets/${datasetId}`);
const { data: storage, pending: storageLoading } = await useFetch(`/api/datasets/${datasetId}/storage`);

if (error.value) {
  toast.add({ title: "Error fetching study", icon: "material-symbols:error" });
  await navigateTo("/");
}

if (dataset.value) {
  useSeoMeta({ title: dataset.value.title });
}
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: dataset?.title, to: `/app/datasets/${datasetId}` },
        { label: 'Overview', to: `/app/datasets/${datasetId}/overview` },
      ]"
    />

    <div class="flex w-full flex-col gap-6">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ dataset?.title || "Untitled" }}
            </h1>
            <p class="text-lg font-normal">{{ dataset?.description }}</p>
          </div>
        </div>
      </div>

      <div
        class="mb-6 flex flex-col items-start gap-3 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Azure Storage</h2>
        <div class="p-6">
          <div>
            <h2 class="mb-2 text-xl font-semibold">File Count</h2>
            <p class="mb-4 text-gray-600">
              This is the total number of items currently stored in your study. It includes every
              image, record, and document you have uploaded so far.
            </p>
            <div class="flex gap-4">
              <div
                v-if="storageLoading"
                class="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
              />
              <div v-else class="text-2xl">
                {{ storage?.fileCount || 0 }}
              </div>
            </div>
          </div>
        </div>

        <USeparator />

        <div class="p-6">
          <div>
            <h2 class="mb-2 text-xl font-semibold">Total Dataset Size</h2>
            <p class="mb-4 text-gray-600">
              This shows the total amount of space your data is taking up in the cloud.
            </p>
            <div class="flex gap-4">
              <div
                v-if="storageLoading"
                class="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
              />
              <div v-else class="text-2xl">
                {{ storage?.displaySize || "0 Bytes" }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="mb-6 flex flex-col items-start gap-3 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Database</h2>

        <div class="p-6">
          <div>
            <h2 class="mb-2 text-xl font-semibold">Version & ID</h2>
            <div class="flex flex-col gap-1">
              <div>Version: {{ dataset?.version || "1.0.0" }}</div>
              <div>ID: {{ dataset?.canonicalId }}</div>
            </div>
          </div>
        </div>

        <USeparator />

        <div class="p-6">
          <div>
            <h2 class="mb-2 text-xl font-semibold">Publishing Status</h2>
            <div class="flex items-center gap-3">
              <UBadge :color="dataset?.status === 'published' ? 'green' : 'orange'" size="lg">
                {{ dataset?.status === "published" ? "Published" : "Draft" }}
              </UBadge>
              <span
                v-if="dataset?.DatasetPublishingStatus?.comment"
                class="text-sm text-gray-500 italic"
              >
                {{ dataset.DatasetPublishingStatus.comment }}
              </span>
            </div>
          </div>
        </div>

        <USeparator />

        <div class="p-6">
          <div>
            <h2 class="mb-2 text-xl font-semibold">DOI</h2>
            <div class="mt-1">
              <div v-if="dataset?.doi">
                {{ dataset.doi }}
              </div>
              <div v-else>Not assigned yet</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>