<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const sidebarCollapsed = ref(false);
const selectedStudy = computed(() => route.params.id || null);

const studyNavItems = [
  {
    name: "Overview",
    icon: "material-symbols:overview-key-rounded",
    route: "overview",
  },
  { name: "Metadata", icon: "ooui:view-details-ltr", route: "metadata" },
  { name: "Files", icon: "ph:files-fill", route: "files" },
  { name: "Datasets", icon: "material-symbols:dataset", route: "datasets" },
  {
    name: "Collaborators",
    icon: "mdi:account-group-outline",
    route: "collaborators",
  },
  { name: "Settings", icon: "heroicons-outline:cog", route: "settings" },
];
</script>

<template>
  <div
    class="flex min-h-screen w-full overflow-hidden bg-gray-100 dark:bg-gray-900"
  >
    <!-- Sidebar -->
    <aside
      id="sidebar"
      :class="[
        'fixed top-0 left-0 z-10 h-full w-64 border-r border-gray-200 bg-white px-4 py-3 transition-transform dark:border-gray-700 dark:bg-gray-900',
        sidebarCollapsed ? '-translate-x-full' : 'translate-x-0',
      ]"
    >
      <!-- Sidebar Logo -->
      <div class="flex items-center gap-2 px-2 py-2 text-lg font-semibold">
        <Icon name="material-symbols:apps" size="24" />

        <span>Envision Portal</span>
      </div>

      <!-- Global Navigation -->
      <ul class="mt-4 space-y-1">
        <li>
          <ULink
            to="/studies"
            class="group flex items-center gap-3 rounded-lg px-3 py-2"
            active-class="bg-gray-200 dark:bg-gray-700"
            inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Icon name="tabler:home-2" size="20" />

            <span> My Studies </span>
          </ULink>
        </li>

        <li>
          <ULink
            to="/inbox"
            class="group flex items-center gap-3 rounded-lg px-3 py-2"
            active-class="bg-gray-200 dark:bg-gray-700"
            inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Icon name="material-symbols:inbox-rounded" size="20" />

            <span> Inbox </span>
          </ULink>
        </li>

        <hr class="border-gray-200 dark:border-gray-700" />

        <li>
          <ULink
            to="/upload"
            class="group flex items-center gap-3 rounded-lg px-3 py-2"
            active-class="bg-gray-200 dark:bg-gray-700"
            inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Icon name="heroicons-outline:upload" size="20" />

            <span> Upload </span>
          </ULink>
        </li>

        <li>
          <ULink
            to="/docs"
            class="group flex items-center gap-3 rounded-lg px-3 py-2"
            active-class="bg-gray-200 dark:bg-gray-700"
            inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Icon name="heroicons-outline:document-text" size="20" />

            <span> Docs </span>
          </ULink>
        </li>

        <hr class="border-gray-200 dark:border-gray-700" />
      </ul>

      <!-- Study-Specific Navigation -->
      <template v-if="selectedStudy">
        <div class="mt-4">
          <p
            class="px-3 py-2 text-xs font-semibold text-gray-600 uppercase dark:text-gray-400"
          >
            Study Navigation
          </p>

          <ul class="space-y-1">
            <li v-for="item in studyNavItems" :key="item.route">
              <ULink
                :to="`/studies/${selectedStudy}/${item.route}`"
                class="group flex items-center gap-3 rounded-lg px-3 py-2"
                active-class="bg-gray-200 dark:bg-gray-700"
                inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Icon :name="item.icon" size="20" />

                <span> {{ item.name }} </span>
              </ULink>
            </li>
          </ul>
        </div>
      </template>

      <!-- Help & Settings -->
      <div class="absolute bottom-4 w-full">
        <ul class="space-y-1">
          <li>
            <ULink
              to="/help"
              class="group flex items-center gap-3 rounded-lg px-3 py-2"
              active-class="bg-gray-200 dark:bg-gray-700"
              inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Icon name="heroicons-outline:question-mark-circle" size="20" />

              <span> Help </span>
            </ULink>
          </li>

          <li>
            <ULink
              to="/settings"
              class="group flex items-center gap-3 rounded-lg px-3 py-2"
              active-class="bg-gray-200 dark:bg-gray-700"
              inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Icon name="heroicons-outline:cog" size="20" />

              <span> Settings </span>
            </ULink>
          </li>
        </ul>
      </div>
    </aside>

    <!-- Main Content -->
    <main
      class="ml-64 min-h-screen flex-1 overflow-x-hidden overflow-y-auto transition-all"
    >
      <!-- Dashboard Header -->
      <DashboardHeader v-model:sidebar-collapsed="sidebarCollapsed" />

      <!-- Page Content -->
      <div class="mt-16 p-6">
        <slot />
      </div>
    </main>
  </div>
</template>
