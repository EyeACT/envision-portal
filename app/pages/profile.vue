<script setup>
import { useUserSession } from "#imports";
import { definePageMeta } from "#app/composables/pages";
import { useSeoMeta } from "#app";
import { UContainer } from "#components";

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
