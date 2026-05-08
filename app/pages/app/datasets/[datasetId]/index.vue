<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });

// Redirect to overview page
const route = useRoute();
const { datasetId } = route.params as { datasetId: string };
await navigateTo(`/app/datasets/${datasetId}/overview`);
</script>

<template>
  <div class="p-4">redirecting to dataset overview</div>
</template>
