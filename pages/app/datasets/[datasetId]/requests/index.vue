<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

useSeoMeta({
  title: "Dataset Requests",
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as { datasetId: string };

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/requests`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching study",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  // await navigateTo("/");
}
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: 'My Datasets', to: '/app/dashboard/datasets' },
        { label: data?.title, to: `/app/datasets/${datasetId}` },
        {
          label: 'Dataset Requests',
          to: `/app/datasets/${datasetId}/requests`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6">
      <div
        class="flex flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Requests for Datasets
            </h1>

            <p class="text-lg font-normal">Manage your dataset requests</p>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <NuxtLink
          v-for="datasetRequest in data?.DatasetRequest"
          :key="datasetRequest.id"
          :to="`/app/datasets/${datasetId}/requests/${datasetRequest.id}`"
          class="tranistion-all hover:shadow-md"
        >
          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <h2 class="text-lg font-medium">
                  {{ data?.title }}
                </h2>

                <UBadge variant="subtle"> Version {{ data?.version }} </UBadge>
              </div>
            </template>

            <p>
              {{ datasetRequest.givenName }} {{ datasetRequest.familyName }} [{{
                datasetRequest.affiliation
              }}]
              <br />
              {{ datasetRequest.reasonForAccess }}
            </p>

            <USeparator class="my-3" />

            <div class="flex items-center justify-between gap-2 text-sm">
              <div class="flex items-center gap-2">
                <p>
                  Submitted:
                  {{ displayDateDifference(datasetRequest.created) }} ago
                </p>

                <USeparator orientation="vertical" class="h-3" />

                <p>
                  Updated:
                  {{ displayDateDifference(datasetRequest.updated) }} ago
                </p>
              </div>

              <div class="flex items-center gap-2">
                <UButton
                  label="View dataset access request"
                  icon="material-symbols:arrow-right"
                  size="sm"
                  color="primary"
                />

                <UButton
                  label="Reject request"
                  icon="material-symbols:close"
                  size="sm"
                  color="error"
                />
              </div>
            </div>
          </UCard>
        </NuxtLink>

        <pre>{{ data }}</pre>
      </div>
    </div>
  </div>
</template>
