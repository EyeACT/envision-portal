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
      <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <div class="flex w-full items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Overview
            </h1>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-start gap-3 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Azure Storage
        </h2>

        <div class="p-6 w-full">
          <h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Total Dataset Size
          </h2>
          <p class="mb-4 text-gray-600 dark:text-gray-400">
            This shows the total amount of space your data is taking up in the cloud. 
            Ensure this matches your expected local directory size before finalizing metadata.
          </p>
          <div class="flex items-center gap-6">
            <div v-if="storageLoading" class="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div v-else class="text-2xl font-normal text-gray-900 dark:text-white">
              {{ storage?.displaySize || '0 Bytes' }}
            </div>
          </div>
          <p class="mt-2 text-sm text-gray-500">
            Calculated based on cumulative blob size
          </p>
        </div>

        <USeparator />

        <div class="p-6 w-full">
          <h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Total File Count
          </h2>
          <p class="mb-4 text-gray-600 dark:text-gray-400">
            This represents the total number of items currently stored in your study container. 
            It includes every image, record, and document you have uploaded so far.
          </p>
          <div class="flex items-center gap-6">
            <div v-if="storageLoading" class="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div v-else class="text-2xl font-normal text-gray-900 dark:text-white">
              {{ storage?.fileCount || 0 }}
            </div>
          </div>
          <p class="mt-2 text-sm text-gray-500">
            Updated in real-time from Azure Blob Storage
          </p>
          <UButton
            :to="`/app/datasets/${datasetId}/upload`"
            color="primary"
            variant="soft"
            icon="i-heroicons-arrow-up-tray"
            class="mt-4"
          >
            Upload More Files
          </UButton>
        </div>
      </div>

      <div class="flex flex-col items-start gap-3 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Dataset
        </h2>

        <div class="p-6 w-full">
          <h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Dataset Summary
          </h2>
          <p class="text-sm uppercase font-bold text-gray-400 mb-1">Dataset Title</p>
          <p class="mb-4 text-gray-900 dark:text-white font-medium text-lg">
            {{ dataset?.title || "Untitled Dataset" }}
          </p>
          <p class="text-sm uppercase font-bold text-gray-400 mb-1">Description</p>
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
            {{ dataset?.description || "No description provided for this dataset." }}
          </p>
        </div>

        <USeparator />

        <div class="p-6 w-full">
          <h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Dataset Creators
          </h2>
          <p class="mb-4 text-gray-600 dark:text-gray-400">
            The individuals responsible for the creation and maintenance of this specific dataset.
          </p>
          <div class="flex flex-wrap gap-3">
            <template v-if="dataset?.DatasetContributor?.length">
              <div 
                v-for="person in dataset.DatasetContributor" 
                :key="person.id"
                class="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-3 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
              >
                <UAvatar :alt="person.givenName" size="xs" />
                <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {{ person.givenName }} {{ person.familyName }}
                </span>
                <UBadge v-if="person.creator" color="primary" variant="soft" size="xs">Lead</UBadge>
              </div>
            </template>
            <p v-else class="text-sm text-gray-500 italic">No creators listed.</p>
          </div>
        </div>

        <USeparator />

        <div class="p-6 w-full">
          <h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Publishing & Identification
          </h2>
          <p class="mb-4 text-gray-600 dark:text-gray-400">
            Status of the dataset in the repository and its permanent citable identifier.
          </p>

          <div class="flex flex-col gap-6">
            <div class="flex items-center gap-3 text-sm font-bold text-gray-500 uppercase tracking-wide">
              Digital Object Identifier (DOI):
              <UBadge 
                v-if="dataset?.doi"
                color="primary" 
                variant="soft"
                size="lg"
                class="font-bold uppercase tracking-tight"
              >
                {{ dataset?.doi }}
              </UBadge>
              <span v-else class="text-xs font-normal italic text-gray-400 normal-case">Pending publication</span>
            </div>

            <div class="flex items-center gap-3 text-sm font-bold text-gray-500 uppercase tracking-wide">
              Publication Status:
              <UBadge 
                :color="dataset?.status === 'published' ? 'primary' : 'orange'" 
                variant="soft" 
                size="lg" 
                class="font-bold uppercase tracking-tight"
              >
                {{ dataset?.status || 'Draft' }}
              </UBadge>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-6 flex flex-col items-start gap-3 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Study
        </h2>

        <div class="p-6 w-full">
          <h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Study Description
          </h2>
          <p class="text-sm uppercase font-bold text-gray-400 mb-1">Brief Summary</p>
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
            {{ dataset?.StudyDescription?.briefSummary || "No scientific summary available." }}
          </p>
        </div>

        <USeparator />

        <div class="p-6 w-full">
          <h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Study Status
          </h2>
          <div class="flex items-center gap-4">
            <UBadge 
              variant="soft" 
              size="lg" 
              class="font-bold uppercase tracking-tight"
              :color="dataset?.StudyStatus?.overallStatus === 'Active' ? 'primary' : 'neutral'"
            >
              {{ dataset?.StudyStatus?.overallStatus || 'Unknown' }}
            </UBadge>
            <span v-if="dataset?.StudyStatus?.startDate" class="text-sm text-gray-500">
              Start Date: {{ new Date(dataset.StudyStatus.startDate).toLocaleDateString() }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>