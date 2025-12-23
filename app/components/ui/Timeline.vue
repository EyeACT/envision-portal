<template>
  <div
    ref="timelineContainerRef"
    class="w-full bg-white font-sans md:px-10 dark:bg-neutral-950"
  >
    <div ref="timelineRef" class="relative z-0 mx-auto max-w-7xl pb-20">
      <div
        v-for="(item, index) in props.items"
        :key="item.id + index"
        class="flex justify-start pt-10 md:gap-10 md:pt-10"
      >
        <div
          class="sticky top-40 z-40 flex max-w-xs flex-col items-center self-start md:w-full md:flex-row lg:max-w-sm"
        >
          <div
            class="absolute left-3 flex size-10 items-center justify-center rounded-full border border-neutral-200/70 bg-white/70 backdrop-blur dark:border-neutral-800/60 dark:bg-black/40"
          >
            <div
              class="size-4 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 shadow-[0_0_0_6px_rgba(20,184,166,0.12)] dark:shadow-[0_0_0_6px_rgba(45,212,191,0.12)]"
            />
          </div>
          <h3
            class="bg-gradient-to-r from-teal-500 to-teal-600 bg-clip-text font-bold tracking-tight text-transparent md:inline-flex md:pl-14 md:text-4xl dark:from-teal-300 dark:to-blue-400"
          >
            {{ item.label }}
          </h3>
        </div>
        <slot :name="item.id"></slot>
      </div>
      <div
        :style="{
          height: height + 'px',
        }"
        class="absolute top-0 left-8 w-[2px] overflow-hidden bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-0% via-neutral-200 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] md:left-8 dark:via-neutral-700"
      >
        <Motion
          as="div"
          :style="{
            height: heightTransform,
            opacity: opacityTransform,
          }"
          class="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-blue-400 from-0% via-teal-500 via-10% to-transparent"
        >
        </Motion>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Motion, useScroll, useTransform } from "motion-v";
import type { HTMLAttributes } from "vue";

interface Props {
  containerClass?: HTMLAttributes["class"];
  class?: HTMLAttributes["class"];
  items?: {
    id: string;
    label: string;
  }[];
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
});

const timelineContainerRef = ref<HTMLElement | null>(null);
const timelineRef = ref<HTMLElement | null>(null);
const height = ref(0);

onMounted(async () => {
  await nextTick();
  if (timelineRef.value) {
    const rect = timelineRef.value.getBoundingClientRect();
    height.value = rect.height;
  }
});

const { scrollYProgress } = useScroll({
  target: timelineRef,
  offset: ["start 50%", "end 70%"],
});

const opacityTransform = useTransform(scrollYProgress as any, [0, 0.1], [0, 1]);
let heightTransform = useTransform(scrollYProgress as any, [0, 1], [0, 0]);

watch(height, (newHeight) => {
  heightTransform = useTransform(
    scrollYProgress as any,
    [0, 1],
    [0, newHeight],
  );
});
</script>
