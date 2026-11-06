<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { studyId } = route.params as { studyId: string };
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: 'Data Processing', to: `/app/study/${studyId}/processing` },
      ]"
    />

    <div class="flex w-full flex-col gap-6">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Data Processing
            </h1>

            <p class="text-lg font-normal">
              Review how the data in this dataset has been processed.
            </p>
          </div>
        </div>
      </div>

      <div>
        <AppPlaceholder>
          <p>Data processing details will appear here.</p>
        </AppPlaceholder>
      </div>
    </div>
  </div>
</template>
