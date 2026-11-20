<script setup lang="ts">
import { definePageMeta } from "#app/composables/pages";
import { useRoute, navigateTo } from "#app";

definePageMeta({
  middleware: ["auth", "publish-started"],
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
