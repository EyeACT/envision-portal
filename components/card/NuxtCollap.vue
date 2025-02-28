<script lang="ts" setup>
const props = defineProps<{
  title: string;
  collapse: boolean;
}>();
</script>

<template>
  <UCollapsible class="flex w-48 flex-col gap-2">
    <UButton
      class="group"
      label="Open"
      color="neutral"
      variant="subtle"
      trailing-icon="i-lucide-chevron-down"
      :ui="{
        trailingIcon:
          'group-data-[state=open]:rotate-180 transition-transform duration-200',
      }"
      block
    />

    <template #content>
      <Placeholder class="h-48" />
    </template>
  </UCollapsible>
</template>
