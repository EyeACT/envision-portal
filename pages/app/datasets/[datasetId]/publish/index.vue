<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();

const { datasetId, studyId } = route.params as {
  datasetId: string;
  studyId: string;
};

await navigateTo(
  `/app/study/${studyId}/datasets/${datasetId}/publish/study-metadata`,
);
</script>

<template>
  <div></div>
</template>
