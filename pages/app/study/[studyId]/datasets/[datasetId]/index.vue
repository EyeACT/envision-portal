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
      :dropdown-items="[
        { label: 'Home', to: '/' },
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: 'My Studies', to: '/app/dashboard/studies' },
        {
          label: 'My Datasets',
          to: `/app/dashboard/studies/${studyId}/datasets`,
        },
        {
          label: data?.title,
          to: `/app/study/${studyId}/datasets/${datasetId}`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6">
      <div
        class="flex flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <h1>{{ data?.title || "Untitled" }}</h1>

            <p>{{ data?.description }}</p>
          </div>
        </div>
      </div>

      <div>
        <pre>{{ data }}</pre>
      </div>
    </div>
  </div>
</template>
