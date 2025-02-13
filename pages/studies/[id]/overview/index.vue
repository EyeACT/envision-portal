<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref } from "vue";
import type { Study } from "@/types/study";

const route = useRoute();
const studyId = route.params.id;
const study = ref<Study | null>(null);

// TODO: Fetch the study details from the API
try {
  await $fetch(`/api/studies/${studyId}`, {
    method: "GET",
  }).then((response) => {
    study.value = response;
  });
} catch (error) {
  console.error("Error fetching study details:", error);
}

// Tabs Management
const activeTab = ref("Overview");

const tabs = ["Overview", "Metadata", "Files", "Datasets", "Collaborators"];
</script>

<template>
  <div class="w-full">
    <!-- Study Banner -->
    <div v-if="study" class="relative">
      <img
        :src="study.image"
        alt="Study Banner"
        class="h-64 w-full rounded-lg object-cover shadow-md"
      />
    </div>

    <!-- Header Section -->
    <div class="mt-6 mb-8 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-semibold text-gray-900 dark:text-white">
            {{ study?.title || "Study Not Found" }}
          </h1>

          <p class="mt-2 text-gray-500 dark:text-gray-400">
            {{ study?.description }}
          </p>
        </div>

        <!-- Manage Study Button (Only for Owners [Editors too?]) -->
        <button
          v-if="study?.role === 'Owner'"
          class="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white shadow-md transition hover:bg-blue-700"
        >
          Manage Study
        </button>
      </div>

      <!-- Study Info -->
      <div class="mt-4 text-gray-600 dark:text-gray-300">
        <p><strong>Owner:</strong> {{ study?.userName }}</p>

        <p><strong>Created:</strong> {{ study?.createdOn }}</p>

        <p><strong>Last Updated:</strong> {{ study?.updatedOn }}</p>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="mb-6 flex border-b border-gray-200 dark:border-gray-700">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="px-4 py-2 text-gray-700 transition hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
        :class="{
          'border-b-2 border-blue-600 text-blue-600': activeTab === tab,
        }"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
      <div v-if="activeTab === 'Overview'">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Overview
        </h2>

        <p class="mt-2 text-gray-600 dark:text-gray-300">
          {{ study?.description }}
        </p>
      </div>

      <div v-if="activeTab === 'Metadata'">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Metadata
        </h2>

        <p class="mt-2 text-gray-600 dark:text-gray-300">
          Metadata details will be displayed here.
        </p>
      </div>

      <div v-if="activeTab === 'Files'">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Files
        </h2>

        <p class="mt-2 text-gray-600 dark:text-gray-300">
          File management and uploads will be shown here.
        </p>
      </div>

      <div v-if="activeTab === 'Datasets'">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Datasets
        </h2>

        <p class="mt-2 text-gray-600 dark:text-gray-300">
          Dataset information will be displayed here.
        </p>
      </div>

      <div v-if="activeTab === 'Collaborators'">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Collaborators
        </h2>

        <p class="mt-2 text-gray-600 dark:text-gray-300">
          List of collaborators will be shown here.
        </p>
      </div>
    </div>
  </div>
</template>
