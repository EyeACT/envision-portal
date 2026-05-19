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

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Overview
          </h1>
        </div>
        <p class="text-base text-gray-500 dark:text-gray-400">
          General summary and storage status of the selected dataset.
        </p>
      </div>

      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full flex-col gap-5">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            Dataset
          </h2>

          <div class="space-y-1">
            <span class="text-base text-gray-900 dark:text-gray-500">Title</span>
            <p class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {{ dataset?.title || 'Untitled Dataset' }}
            </p>
          </div>

          <div class="space-y-1">
            <span class="text-base text-gray-900 dark:text-gray-500">Description</span>
            <p class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {{ dataset?.description || 'No description provided.' }}
            </p>
          </div>

          <div class="space-y-2">
            <span class="text-base text-gray-900 dark:text-gray-500">Creators</span>
            <div class="flex flex-wrap gap-2">
              <template v-if="dataset?.DatasetContributor?.length">
                <div 
                  v-for="person in dataset.DatasetContributor" 
                  :key="person.id"
                >
                  <p class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {{ person.givenName }} {{ person.familyName }}
                  </p>
                </div>
              </template>
              <p v-else class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">No creators listed.</p>
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full flex-col gap-5">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            Publishing
          </h2>

          <div class="space-y-1">
            <span class="text-base text-gray-900 dark:text-gray-500">Digital Object Identifier (DOI)</span>
            <p class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {{ dataset?.doi || 'Pending Publication' }}
            </p>
          </div>

          <div class="space-y-1">
            <span class="text-base text-gray-900 dark:text-gray-500">Publication Status</span>
            <div class="pt-0.5">
              <UBadge 
                :color="dataset?.status === 'published' ? 'primary' : 'neutral'" 
                variant="soft" 
                size="md"
                class="uppercase font-bold"
              >
                {{ dataset?.status || 'Draft' }}
              </UBadge>
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full flex-col gap-5">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            Azure Storage
          </h2>

          <div class="space-y-1">
            <span class="text-base text-gray-900 dark:text-gray-500">Total Dataset Size</span>
            <div v-if="storageLoading" class="h-5 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <p v-else class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {{ storage?.displaySize || '0 Bytes' }}
            </p>
          </div>

          <div class="space-y-1">
            <span class="text-base text-gray-900 dark:text-gray-500">Total File Count</span>
            <div v-if="storageLoading" class="h-5 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <p v-else class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {{ storage?.fileCount || 0 }}
            </p>
          </div>

          <UButton
            :to="`/app/datasets/${datasetId}/upload`"
            color="primary"
            variant="outline"
            icon="i-lucide-upload"
            label="Upload More Files"
            class="w-fit mt-1"
          />
        </div>
      </div>

      <div
        class="mb-6 flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full flex-col gap-5">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            Study Details
          </h2>

          <div class="space-y-1">
            <span class="text-base text-gray-900 dark:text-gray-500">Brief Summary</span>
            <p class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {{ dataset?.StudyDescription?.briefSummary || 'No summary available.' }}
            </p>
          </div>

          <div class="space-y-1">
            <span class="text-base text-gray-900 dark:text-gray-500">Overall Status</span>
            <p class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {{ dataset?.StudyStatus?.overallStatus || 'Unknown' }}
            </p>
          </div>

          <div class="space-y-1">
            <span class="text-base text-gray-900 dark:text-gray-500">Start Date</span>
            <p class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {{ dataset?.StudyStatus?.startDate ? new Date(dataset.StudyStatus.startDate).toLocaleDateString() : 'N/A' }}
            </p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>