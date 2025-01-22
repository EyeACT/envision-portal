<script setup>
const { user } = useUserSession();

definePageMeta({
  middleware: ["auth"],
});

useSeoMeta({
  title: "Profile",
});
</script>

<template>
  <UContainer> Current user: {{ user?.username }} </UContainer>
</template>
