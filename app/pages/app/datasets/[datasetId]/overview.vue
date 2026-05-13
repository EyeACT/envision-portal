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
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Overview
            </h1>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-start rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Azure Storage
        </h2>

        <div class="p-6 w-full">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Total Dataset Size
          </h2>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            This shows the total amount of space your data is taking up in the cloud. 
            Ensure this matches your expected local directory size before finalizing metadata.
          </p>
          <div class="flex items-center gap-6">
            <div v-if="storageLoading" class="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div v-else class="text-xl font-normal text-gray-900 dark:text-white">
              {{ storage?.displaySize || '0 Bytes' }}
            </div>
          </div>
          <p class="text-sm text-gray-500">
            Calculated based on cumulative blob size
          </p>
        </div>

        <USeparator />

        <div class="p-6 w-full">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Total File Count
          </h2>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            This represents the total number of items currently stored in your study container. 
            It includes every image, record, and document you have uploaded so far.
          </p>
          <div class="flex items-center gap-6">
            <div v-if="storageLoading" class="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div v-else class="text-xl font-normal text-gray-900 dark:text-white">
              {{ storage?.fileCount || 0 }}
            </div>
          </div>
          <p class="text-sm text-gray-500">
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

      <div class="flex flex-col items-start rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <h2 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Dataset
        </h2>

        <div class="p-6 w-full">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Title
          </h2>
          <p class="mb-4 text-gray-600 dark:text-white">
            {{ dataset?.title || "Untitled Dataset" }}
          </p>
          <h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Description
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            {{ dataset?.description || "No description provided for this dataset." }}
          </p>
        </div>

        <USeparator />

        <div class="p-6 w-full">
          <h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Creators
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
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
          <p class="mb-2 text-gray-600 dark:text-gray-400">
            Status of the dataset in the repository and its permanent citable identifier.
          </p>

          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2 text-gray-600">
              Digital Object Identifier (DOI):
              <UBadge 
                :color="dataset?.doi ? 'primary' : 'neutral'"
                color="primary" 
                variant="soft"
                size="lg"
                class="font-bold uppercase tracking-tight"
              >
                {{ dataset?.doi || 'Pending publication'}}
              </UBadge>
            </div>

            <div class="flex items-center gap-2 text-gray-600">
              Publication Status:
              <UBadge 
                :color="dataset?.status === 'published' ? 'primary' : 'neutral'" 
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

      <div class="mb-6 flex flex-col items-start rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Study
        </h2>

        <div class="p-6 w-full">
          <h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Description
          </h2>
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
            {{ dataset?.StudyDescription?.briefSummary || "No description available." }}
          </p>
        </div>

        <USeparator />

        <div class="p-6 w-full">
          <h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Status
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