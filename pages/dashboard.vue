<script setup>
definePageMeta({
  middleware: ["auth"],
});

useSeoMeta({
  title: "Dashboard",
});
</script>

<template>
  <div class="px-4">
    <UBreadcrumb
      separator-icon="i-lucide-arrow-right"
      :items="[
        { label: 'Home', to: '/' },
        { label: 'Dashboard', to: '/dashboard' },
      ]"
    />

    <div class="flex flex-col gap-10 pt-5">
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
  </div>
</template>
