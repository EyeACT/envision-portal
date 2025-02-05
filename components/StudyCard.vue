<script setup lang="ts">
import { defineProps } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// Define props
const props = defineProps<{
  study: {
    id: number;
    title: string;
    created: string;
    description: string;
    owner: string;
    role: string;
    updated: string;
  };
}>();

// Navigate to the study details page
const navigateToStudy = () => {
  router.push(`/studies/${props.study.id}/overview`);
};
</script>

<template>
  <div
    class="cursor-pointer overflow-hidden rounded-lg bg-white p-6 shadow-md transition-transform hover:scale-[1.02] hover:shadow-lg dark:bg-gray-900"
    @click="navigateToStudy"
  >
    <div class="flex items-center gap-4">
      <!-- Thumbnail (Can be readjusted depending on what the standard dimension of the banner images will be) -->
      <img
        :src="`https://api.dicebear.com/9.x/identicon/svg?seed=${study.id}&backgroundColor=ffffff&backgroundType=gradientLinear`"
        alt="Study Thumbnail"
        class="h-16 w-16 rounded-lg"
      />

      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ study.title }}
        </h2>

        <p class="text-gray-500 dark:text-gray-400">{{ study.description }}</p>
      </div>
    </div>

    <div class="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
      <p><strong>Owner:</strong> {{ study.owner }}</p>

      <p><strong>Permission:</strong> {{ study.role }}</p>

      <p><strong>Created:</strong> {{ study.created }}</p>

      <p><strong>Last Updated:</strong> {{ study.updated }}</p>
    </div>
  </div>
</template>
