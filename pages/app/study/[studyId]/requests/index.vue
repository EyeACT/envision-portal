<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

useSeoMeta({
  title: "Dataset Requests",
});

const route = useRoute();
const toast = useToast();

const { studyId } = route.params as { studyId: string };

const { data, error } = await useFetch(
  `/api/studies/${studyId}/dataset-requests`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching study",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  await navigateTo("/");
}
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Home', to: '/' },
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: 'My Studies', to: '/app/dashboard/studies' },
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
          v-for="datasetRequest in data"
          :key="datasetRequest.id"
          :to="`/app/study/${studyId}/requests/${datasetRequest.id}`"
          class="tranistion-all hover:shadow-md"
        >
          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <h2 class="text-lg font-medium">
                  {{ datasetRequest.dataset.title }}
                </h2>

                <UBadge variant="subtle">
                  Version {{ datasetRequest.dataset.version }}
                </UBadge>
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
                <p>Submitted: {{ $dayjs(datasetRequest.created).fromNow() }}</p>

                <USeparator orientation="vertical" class="h-3" />

                <p>Updated: {{ $dayjs(datasetRequest.updated).fromNow() }}</p>
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
