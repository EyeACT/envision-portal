<script setup lang="ts">
const props = defineProps<{
  // The values of the fields inside. Fields stay visible while any of them is filled in,
  // so a value can't be hidden while it needs fixing.
  values: (string | null | undefined)[];
}>();

const expanded = ref(false);

const hasValues = computed(() => props.values.some(Boolean));
</script>

<template>
  <div class="flex flex-col gap-3">
    <UButton
      v-if="!hasValues"
      :icon="expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
      :label="expanded ? 'Hide optional fields' : 'Show optional fields'"
      color="neutral"
      variant="link"
      class="w-fit px-0"
      @click="expanded = !expanded"
    />

    <div v-if="expanded || hasValues" class="flex flex-col gap-3">
      <slot />
    </div>
  </div>
</template>
