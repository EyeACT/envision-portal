<script setup lang="ts">
useSeoMeta({
  title: "Terms of Use - Envision Portal",
  description:
    "Terms and conditions governing the use of the Envision Portal platform and associated services.",
});

definePageMeta({
  layout: "public",
});

const { data: terms } = await useAsyncData(() =>
  queryCollection("content").path("/terms").first(),
);
</script>

<template>
  <UContainer class="py-12">
    <ContentRenderer v-if="terms" :value="terms" />
    <div v-else>Document not found</div>
  </UContainer>
</template>
