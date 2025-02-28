<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  title: { default: "Card Title", type: String },
  collapse: { default: true, type: Boolean },
});

const contentCollapsed = ref(props.collapse);
</script>

<template>
  <UCard
    :ui="{
      root: 'shadow-md rounded-lg border border-gray-200 transition-all duration-200 select-none',
      header:
        (contentCollapsed ? 'border-none' : 'bg-gray-100') +
        ' transition-colors duration-300 px-5 py-4 cursor-pointer hover:bg-gray-200 rounded-t-lg',
      body:
        (contentCollapsed
          ? 'opacity-0 -y-3 max-h-0 !p-0'
          : 'opacity-100 y-0 max-h-[500px] !p-5') +
        ' transition-all origin-top duration-200 ease-in-out',
    }"
  >
    <!-- Card Header -->
    <template #header>
      <div
        class="flex items-center justify-between"
        @click="contentCollapsed = !contentCollapsed"
      >
        <h3 class="text-lg font-semibold text-sky-600">{{ title }}</h3>

        <UButton
          color="primary"
          variant="ghost"
          square
          :icon="contentCollapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'"
        />
      </div>
    </template>

    <!-- Card Body -->
    <div>
      <slot />
    </div>
  </UCard>
</template>
