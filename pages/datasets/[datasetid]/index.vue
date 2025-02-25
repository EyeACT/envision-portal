<script setup lang="ts">
definePageMeta({
  layout: "public",
});

const route = useRoute();
const toast = useToast();

const { datasetid } = route.params as { datasetid: string };

const { data: dataset, error } = await useFetch(`/api/datasets/${datasetid}`);

if (error.value) {
  toast.add({
    title: "Error fetching dataset",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  await navigateTo("/datasets");
}
</script>

<template>
  <div>
    <UContainer>
      <UBreadcrumb
        class="mb-4"
        :items="[
          { label: 'Home', to: '/' },
          { label: 'All Datasets', to: '/datasets' },
        ]"
      />

      <div class="flex flex-col gap-6 pt-10"></div>
    </UContainer>

    {{ dataset }}
  </div>
</template>
