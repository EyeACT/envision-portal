<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId, studyId } = route.params as {
  datasetId: string;
  studyId: string;
};

const { data, error } = await useFetch(
  `/api/studies/${studyId}/datasets/${datasetId}`,
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

if (data.value) {
  useSeoMeta({
    title: data.value.title,
  });
}
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Home', to: '/' },
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: data?.title, to: `/app/study/${studyId}` },
        {
          label: 'Datasets',
          to: `/app/study/${studyId}/datasets`,
        },
        {
          label: data?.title,
          to: `/app/study/${studyId}/datasets/${datasetId}`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ data?.title || "Untitled" }}
            </h1>

            <p class="text-lg font-normal">
              {{ data?.description }}
            </p>
          </div>
        </div>
      </div>

      <div>
        <pre>{{ data }}</pre>
      </div>
    </div>
  </div>
</template>
