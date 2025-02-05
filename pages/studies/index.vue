<script setup lang="ts">
import { ref, computed } from "vue";
import { onClickOutside } from "@vueuse/core";
import StudyCard from "@/components/StudyCard.vue"; // Import StudyCard component

const searchQuery = ref("");
const selectedFilters = ref<Record<string, string | null>>({
  createdAfter: null,
  permission: null,
  updatedAfter: null,
});
const tempFilters = ref({ ...selectedFilters.value });
const showDropdown = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const availablePermissions = ["Owner", "Contributor", "Viewer"];

// Example studies (Replace with API data)
const studies = ref([
  {
    id: 1,
    title: "Quantum Computing",
    created: "2025-04-01",
    description: "Research in quantum physics and computing.",
    owner: "Dr. Alice Johnson",
    role: "Owner",
    updated: "2025-04-05",
  },
  {
    id: 2,
    title: "Space Exploration",
    created: "2025-05-15",
    description: "Studying planetary and deep space exploration.",
    owner: "NASA Research Team",
    role: "Contributor",
    updated: "2025-05-20",
  },
  {
    id: 3,
    title: "Climate Change Study",
    created: "2025-06-20",
    description: "Assessing environmental impacts and solutions.",
    owner: "Green Earth Initiative",
    role: "Viewer",
    updated: "2025-06-25",
  },
  {
    id: 4,
    title: "Healthcare Data Analysis",
    created: "2025-07-05",
    description: "Analyzing trends in medical research and treatments.",
    owner: "Dr. Emily Roberts",
    role: "Owner",
    updated: "2025-07-10",
  },
  {
    id: 5,
    title: "Social Media Study",
    created: "2025-08-10",
    description: "Understanding social media behaviors and trends.",
    owner: "Digital Behavior Lab",
    role: "Contributor",
    updated: "2025-08-15",
  },
  {
    id: 6,
    title: "Cybersecurity Research",
    created: "2025-09-01",
    description: "Exploring security vulnerabilities and protections.",
    owner: "Cyber Defense Agency",
    role: "Viewer",
    updated: "2025-09-05",
  },
]);

// Toggle dropdown while preventing outside click from immediately closing it (doesn't seem to work atm, vueuse is conflicting with this)
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

// Apply filters when confirmed
const confirmFilters = () => {
  selectedFilters.value = { ...tempFilters.value };
  showDropdown.value = false;
};

// Reset all filters
const clearFilters = () => {
  selectedFilters.value = {
    createdAfter: null,
    permission: null,
    updatedAfter: null,
  };
  tempFilters.value = { ...selectedFilters.value };
};

// Computed property to filter studies
const filteredStudies = computed(() => {
  return studies.value.filter((study) => {
    const matchesSearch =
      searchQuery.value === "" ||
      study.title.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesPermission =
      !selectedFilters.value.permission ||
      selectedFilters.value.permission === study.role;

    const matchesCreatedAfter =
      !selectedFilters.value.createdAfter ||
      new Date(study.created) >= new Date(selectedFilters.value.createdAfter);

    const matchesUpdatedAfter =
      !selectedFilters.value.updatedAfter ||
      new Date(study.updated) >= new Date(selectedFilters.value.updatedAfter);

    return (
      matchesSearch &&
      matchesPermission &&
      matchesCreatedAfter &&
      matchesUpdatedAfter
    );
  });
});

// Close dropdown when clicking outside (currently conflicts with trying to close via button click)
onClickOutside(dropdownRef, () => {
  showDropdown.value = false;
});
</script>

<template>
  <div class="w-full">
    <!-- Header Section -->
    <div
      class="mb-8 flex flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
    >
      <div>
        <h1 class="text-3xl font-semibold text-gray-900 dark:text-white">
          My Studies
        </h1>

        <p class="text-gray-500 dark:text-gray-400">
          Manage and explore your research studies
        </p>
      </div>

      <button
        class="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-md transition hover:bg-blue-700"
      >
        + New Study
      </button>
    </div>

    <!-- Controls & Filtering -->
    <div
      class="mb-8 flex flex-wrap items-center gap-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900"
    >
      <!-- Search Bar -->
      <div class="relative flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search studies..."
          class="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-500"
        />
      </div>

      <!-- Filter Dropdown (Needs more styling) -->
      <div class="relative">
        <button
          class="flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-3 text-gray-700 shadow-sm transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          @click.stop="toggleDropdown"
        >
          <Icon name="material-symbols:filter-list" size="20" />
          Filter
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="showDropdown"
          ref="dropdownRef"
          class="absolute right-0 z-50 mt-2 w-64 rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800"
        >
          <!-- Permission Filter -->
          <div class="mb-4">
            <p class="mb-2 font-medium text-gray-700 dark:text-gray-200">
              Permission
            </p>

            <div
              v-for="permission in availablePermissions"
              :key="permission"
              class="flex items-center gap-2"
            >
              <input
                :id="permission"
                v-model="tempFilters.permission"
                type="radio"
                :value="permission"
                class="form-radio text-blue-600"
              />

              <label :for="permission" class="text-gray-700 dark:text-gray-200">
                {{ permission }}
              </label>
            </div>
          </div>

          <!-- Date Filters -->
          <div class="mb-4">
            <p class="mb-2 font-medium text-gray-700 dark:text-gray-200">
              Created After
            </p>

            <input
              v-model="tempFilters.createdAfter"
              type="date"
              class="w-full rounded-lg border bg-gray-50 px-3 py-2 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div class="mb-4">
            <p class="mb-2 font-medium text-gray-700 dark:text-gray-200">
              Updated After
            </p>

            <input
              v-model="tempFilters.updatedAfter"
              type="date"
              class="w-full rounded-lg border bg-gray-50 px-3 py-2 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <!-- Buttons -->
          <div class="flex justify-between">
            <button
              class="rounded-lg bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
              @click="confirmFilters"
            >
              Confirm Filters
            </button>

            <button
              class="rounded-lg bg-red-500 px-4 py-2 text-white shadow hover:bg-red-600"
              @click="clearFilters"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Studies Grid -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <StudyCard
        v-for="study in filteredStudies"
        :key="study.id"
        :study="study"
      />
    </div>
  </div>
</template>
