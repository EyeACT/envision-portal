<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();

const { datasetId } = route.params as {
  datasetId: string;
};

await navigateTo(`/app/datasets/${datasetId}/publish/study-metadata`);
</script>

<template>
  <div></div>
</template>
