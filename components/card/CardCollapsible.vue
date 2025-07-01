<script setup lang="ts">
const props = defineProps({
  title: {
    default: "Card Title",
    type: String,
  },
  bordered: {
    default: false,
    type: Boolean,
  },
  collapse: {
    default: false,
    type: Boolean,
  },
});

const slots = useSlots();

const contentCollapsed = ref(false);

const hasHeaderExtra = computed(() => {
  return !!slots["header-extra"];
});

const hasAction = computed(() => {
  return !!slots.action;
});

onBeforeMount(() => {
  contentCollapsed.value = props.collapse;
});

const toggleCollapse = () => {
  contentCollapsed.value = !contentCollapsed.value;
};
</script>

<template>
  <div
    class="rounded-lg shadow-lg"
    :class="{
      border: bordered,
      'border-slate-300': bordered,
    }"
  >
    <div
      class="flex items-center justify-between gap-4 rounded-lg px-6 py-4 transition-all"
      :class="{
        'bg-white': contentCollapsed,
        'bg-slate-50/50': !contentCollapsed,
      }"
    >
      <div class="text-xl font-semibold">{{ title }}</div>

      <div class="flex items-center">
        <slot name="header-extra"></slot>

        <USeparator
          v-if="hasHeaderExtra"
          orientation="vertical"
          class="!mx-3 h-5"
        />

        <UButton
          :icon="
            contentCollapsed
              ? 'fluent:arrow-maximize-vertical-24-filled'
              : 'fluent:arrow-minimize-vertical-24-filled'
          "
          variant="outline"
          color="primary"
          @click="toggleCollapse"
        />
      </div>
    </div>

    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0 max-h-0"
      enter-to-class="transform scale-100 opacity-100 max-h-[2000px]"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100 max-h-[2000px]"
      leave-to-class="transform scale-95 opacity-0 max-h-0"
    >
      <div
        v-show="!contentCollapsed"
        class="flex w-full flex-col overflow-hidden"
      >
        <USeparator vertical />

        <div class="px-6 py-4">
          <slot></slot>
        </div>
      </div>
    </Transition>

    <div
      v-if="hasAction"
      class="flex items-center justify-start rounded-lg bg-slate-50 px-6 py-4"
    >
      <slot name="action"></slot>
    </div>
  </div>
</template>
