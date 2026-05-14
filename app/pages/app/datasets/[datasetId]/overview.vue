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
        <p class="text-gray-500 dark:text-gray-400">
          General summary and storage status of the selected dataset.
        </p>
      </div>

      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full flex-col gap-4">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            Azure Storage
          </h2>

          <UFormField label="Total Dataset Size">
            <div v-if="storageLoading" class="h-9 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <UInput
              v-else
              :model-value="storage?.displaySize || '0 Bytes'"
              class="w-full"
              readonly
              disabled
            />
          </UFormField>

          <UFormField label="Total File Count">
            <div v-if="storageLoading" class="h-9 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <UInput
              v-else
              :model-value="String(storage?.fileCount || 0)"
              class="w-full"
              readonly
              disabled
            />
          </UFormField>

          <UButton
            :to="`/app/datasets/${datasetId}/upload`"
            color="primary"
            variant="outline"
            icon="i-lucide-upload"
            label="Upload More Files"
            class="w-fit"
          />
        </div>
      </div>

      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full flex-col gap-4">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            Dataset
          </h2>

          <UFormField label="Title">
            <UInput
              :model-value="dataset?.title || 'Untitled Dataset'"
              class="w-full"
              readonly
              disabled
            />
          </UFormField>

          <UFormField label="Description">
            <UTextarea
              :model-value="dataset?.description || 'No description provided.'"
              class="w-full"
              readonly
              disabled
              autoresize
            />
          </UFormField>

          <UFormField label="Creators">
            <div class="flex flex-wrap gap-2 min-h-[44px] p-2 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <template v-if="dataset?.DatasetContributor?.length">
                <div 
                  v-for="person in dataset.DatasetContributor" 
                  :key="person.id"
                  class="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-3 bg-white dark:bg-gray-900 dark:border-gray-700"
                >
                  <UAvatar :alt="person.givenName" size="xs" />
                  <span class="text-xs font-medium text-gray-700 dark:text-gray-200">
                    {{ person.givenName }} {{ person.familyName }}
                  </span>
                  <UBadge v-if="person.creator" color="primary" variant="soft" size="xs">Lead</UBadge>
                </div>
              </template>
              <p v-else class="text-sm text-gray-400 italic">No creators listed.</p>
            </div>
          </UFormField>
        </div>
      </div>

      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full flex-col gap-4">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            Publishing & Identification
          </h2>

          <UFormField label="Digital Object Identifier (DOI)">
            <UInput
              :model-value="dataset?.doi || 'Pending Publication'"
              class="w-full"
              readonly
              disabled
            />
          </UFormField>

          <UFormField label="Publication Status">
            <div class="flex items-center h-9">
              <UBadge 
                :color="dataset?.status === 'published' ? 'primary' : 'neutral'" 
                variant="soft" 
                size="md"
                class="uppercase font-bold"
              >
                {{ dataset?.status || 'Draft' }}
              </UBadge>
            </div>
          </UFormField>
        </div>
      </div>

      <div
        class="mb-6 flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full flex-col gap-4">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            Study Details
          </h2>

          <UFormField label="Brief Summary">
            <UTextarea
              :model-value="dataset?.StudyDescription?.briefSummary || 'No summary available.'"
              class="w-full"
              readonly
              disabled
              autoresize
            />
          </UFormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Overall Status">
              <UInput
                :model-value="dataset?.StudyStatus?.overallStatus || 'Unknown'"
                readonly
                disabled
              />
            </UFormField>

            <UFormField label="Start Date">
              <UInput
                :model-value="dataset?.StudyStatus?.startDate ? new Date(dataset.StudyStatus.startDate).toLocaleDateString() : 'N/A'"
                readonly
                disabled
              />
            </UFormField>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>