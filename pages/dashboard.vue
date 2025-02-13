<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import { z } from "zod";
definePageMeta({
  middleware: ["auth"],
});

useSeoMeta({
  title: "Dashboard",
});

interface Study {
  id: string;
  title: string;
  createdOn: string;
  description: string;
  image: string;
  keywords: string[];
  ownerId: string;
  role: string;
  updatedOn: string;
  userName: string;
}
const studies = ref<Study[]>([]);

try {
  await $fetch("/api/studies", {
    method: "GET",
  }).then((response) => {
    studies.value = response;
  });
} catch (error) {
  console.error("Error fetching studies:", error);
}

// Search query and filter variables
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

// User session + study management variables
const loading = ref(false);
const showSidePanel = ref(false);

// New study form schema and state
const newStudySchema = z.object({
  title: z.string().min(1, "Title is required"),
  bannerImageUrl: z.string().optional(),
  description: z.string().optional(),
});

const newStudyState = reactive({
  title: "",
  bannerImageUrl: "",
  description: "",
});

const onSubmit = async () => {
  loading.value = true;

  try {
    await $fetch("/api/studies", {
      body: newStudyState,
      method: "POST",
    }).then((response) => {
      studies.value.push(response);
    });
  } catch (error) {
    console.error("Error creating new study:", error);
  } finally {
    loading.value = false;
    newStudyState.title = "";
    newStudyState.description = "";
    newStudyState.bannerImageUrl = "";
  }
};

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
      new Date(study.createdOn) >= new Date(selectedFilters.value.createdAfter);

    const matchesUpdatedAfter =
      !selectedFilters.value.updatedAfter ||
      new Date(study.updatedOn) >= new Date(selectedFilters.value.updatedAfter);

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
  <div>
    <UBreadcrumb
      class="mb-4"
      :items="[
        { label: 'Home', to: '/' },
        { label: 'Dashboard', to: '/dashboard' },
      ]"
    />
    <!-- Side Panel for Creating New Study -->

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

        <!-- New Study Button -->
        <USlideover side="left" title="Create New Study">
          <UButton
            color="primary"
            size="xl"
            class="text-white shadow-md"
            @click="showSidePanel = !showSidePanel"
          >
            + New Study
          </UButton>

          <template #body>
            <div>
              <UForm
                :schema="newStudySchema"
                :state="newStudyState"
                class="space-y-4"
                @submit="onSubmit"
              >
                <UFormField label="Title" name="title">
                  <UInput v-model="newStudyState.title" type="text" />
                </UFormField>

                <UFormField label="Description" name="description">
                  <UInput v-model="newStudyState.description" type="text" />
                </UFormField>

                <!-- New Banner Image Field -->
                <UFormField label="Banner Image URL" name="bannerImageUrl">
                  <!-- Accepts only JPEG and PNG -->
                  <UInput v-model="newStudyState.bannerImageUrl" type="href" />
                </UFormField>
              </UForm>
            </div>
          </template>

          <template #footer>
            <div class="flex justify-end p-2">
              <UButton
                color="primary"
                size="lg"
                class="text-white shadow-md"
                @click="onSubmit"
              >
                Create Study
              </UButton>
            </div>
          </template>
        </USlideover>
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
          <UButton
            class="flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-3 text-gray-700 shadow-sm transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            @click.stop="toggleDropdown"
          >
            <Icon name="material-symbols:filter-list" size="20" />
            Filter
          </UButton>

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

                <label
                  :for="permission"
                  class="text-gray-700 dark:text-gray-200"
                >
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
  </div>
</template>
