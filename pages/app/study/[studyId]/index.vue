<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { studyId } = route.params as { studyId: string };

const { data, error } = await useFetch(`/api/studies/${studyId}`, {});

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
              {{ data?.StudyDescription[0].briefSummary }}
            </p>
          </div>

          <div class="relative">
            <img
              :src="data?.imageUrl"
              alt="Study Image"
              class="h-24 w-24 rounded-xl object-cover"
            />
          </div>
        </div>
      </div>

      <div>
        <pre>{{ data }}</pre>
      </div>
    </div>
  </div>
</template>
