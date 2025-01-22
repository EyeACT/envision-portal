<script setup>
definePageMeta({
  middleware: ["auth"],
});

useSeoMeta({
  title: "Dashboard",
});
</script>

<template>
  <UContainer> dashboard </UContainer>
</template>
