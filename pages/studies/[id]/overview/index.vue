<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref, computed } from "vue";

const route = useRoute();
const studyId = route.params.id;

// Mock study data (Replace with API fetch)
const studies = ref([
  {
    id: 1,
    title: "Quantum Computing",
    banner:
      "https://images.unsplash.com/photo-1612521564135-31ae9a5a2a9b?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    created: "2025-04-01",
    description: "Research in quantum physics and computing.",
    owner: "Dr. Alice Johnson",
    role: "Owner",
    updated: "2025-04-05",
  },
  {
    id: 2,
    title: "Space Exploration",
    banner:
      "https://images.unsplash.com/photo-1612521564135-31ae9a5a2a9b?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    created: "2025-05-15",
    description: "Studying planetary and deep space exploration.",
    owner: "NASA Research Team",
    role: "Contributor",
    updated: "2025-05-20",
  },
  {
    id: 3,
    title: "Climate Change Study",
    banner:
      "https://images.unsplash.com/photo-1612521564135-31ae9a5a2a9b?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    created: "2025-06-20",
    description: "Assessing environmental impacts and solutions.",
    owner: "Green Earth Initiative",
    role: "Viewer",
    updated: "2025-06-25",
  },
  {
    id: 4,
    title: "Healthcare Data Analysis",
    banner:
      "https://images.unsplash.com/photo-1612521564135-31ae9a5a2a9b?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    created: "2025-07-05",
    description: "Analyzing trends in medical research and treatments.",
    owner: "Dr. Emily Roberts",
    role: "Owner",
    updated: "2025-07-10",
  },
  {
    id: 5,
    title: "Social Media Study",
    banner:
      "https://images.unsplash.com/photo-1612521564135-31ae9a5a2a9b?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    created: "2025-08-10",
    description: "Understanding social media behaviors and trends.",
    owner: "Digital Behavior Lab",
    role: "Contributor",
    updated: "2025-08-15",
  },
  {
    id: 6,
    title: "Cybersecurity Research",
    banner:
      "https://images.unsplash.com/photo-1612521564135-31ae9a5a2a9b?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    created: "2025-09-01",
    description: "Exploring security vulnerabilities and protections.",
    owner: "Cyber Defense Agency",
    role: "Viewer",
    updated: "2025-09-05",
  },
]);

// Find the study details (This will search through the database)
const study = computed(() =>
  studies.value.find((s) => String(s.id) === studyId),
);

// Tabs Management
const activeTab = ref("Overview");

const tabs = ["Overview", "Metadata", "Files", "Datasets", "Collaborators"];
</script>

<template>
  <div class="w-full">
    <!-- Study Banner -->
    <div v-if="study" class="relative">
      <img
        :src="study.banner"
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
        <p><strong>Owner:</strong> {{ study?.owner }}</p>

        <p><strong>Created:</strong> {{ study?.created }}</p>

        <p><strong>Last Updated:</strong> {{ study?.updated }}</p>
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
