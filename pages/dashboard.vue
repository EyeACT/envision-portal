<script setup>
definePageMeta({
  middleware: ["auth"],
});

useSeoMeta({
  title: "Dashboard",
});
</script>

<template>
  <div class="flex flex-col gap-10 px-4">
    <UCard>
      <template #header>
        <AppPlaceholder class="h-8" />
      </template>

      <AppPlaceholder class="h-32" />

      <template #footer>
        <AppPlaceholder class="h-8" />
      </template>
    </UCard>

    <UCard>
      <template #header>
        <AppPlaceholder class="h-8" />
      </template>

      <AppPlaceholder class="h-32" />

      <template #footer>
        <AppPlaceholder class="h-8" />
      </template>
    </UCard>

    <UCard>
      <template #header>
        <AppPlaceholder class="h-8" />
      </template>

      <AppPlaceholder class="h-32" />

      <template #footer>
        <AppPlaceholder class="h-8" />
      </template>
    </UCard>

    <UCard>
      <template #header>
        <AppPlaceholder class="h-8" />
      </template>

      <AppPlaceholder class="h-32" />

      <template #footer>
        <AppPlaceholder class="h-8" />
      </template>
    </UCard>

    <UCard>
      <template #header>
        <AppPlaceholder class="h-8" />
      </template>

      <AppPlaceholder class="h-32" />

      <template #footer>
        <AppPlaceholder class="h-8" />
      </template>
    </UCard>
  </div>
</template>
