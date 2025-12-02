<script setup lang="ts">
useSeoMeta({
  title: "Privacy Policy - Envision Portal",
  description:
    "How the Envision Portal collects, uses, and protects personal information related to the use of the platform.",
});

definePageMeta({
  layout: "public",
});

const { data: privacy } = await useAsyncData(() =>
  queryCollection("content").path("/privacy").first(),
);
</script>

<template>
  <UContainer class="py-12">
    <ContentRenderer v-if="privacy" :value="privacy" />
    <div v-else>Document not found</div>
  </UContainer>
</template>
