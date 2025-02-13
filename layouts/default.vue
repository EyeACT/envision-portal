<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";

const sidebarCollapsed = ref(true);
const route = useRoute();
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
    name: "Permissions",
    icon: "mdi:account-group-outline",
    route: "collaborators",
  },
  { name: "Participants", icon: "mdi:account-multiple", route: "participants" },
  { name: "Data Upload", icon: "heroicons-outline:upload", route: "upload" },
  {
    name: "Data Processing",
    icon: "heroicons-outline:cube",
    route: "processing",
  },
];

// Watch the sidebarCollapsed state in the parent if you need to trigger any other actions
watch(sidebarCollapsed, (newVal) => {
  sidebarCollapsed.value = newVal;
});
</script>

<template>
  <div
    class="flex min-h-screen w-full overflow-hidden bg-gray-100 dark:bg-gray-900"
  >
    <!-- Sidebar -->
    <aside
      id="sidebar"
      :class="[
        'fixed top-20 left-0 z-10 h-full border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-900',
        sidebarCollapsed ? 'w-20' : 'w-64',
      ]"
    >
      <!-- Global Navigation -->
      <ul class="mt-2 space-y-2">
        <li>
          <ULink
            to="/dashboard"
            class="group mx-1 flex items-center gap-3 rounded-lg px-3 py-3"
            active-class="bg-gray-200 dark:bg-gray-700"
            :class="[sidebarCollapsed ? 'justify-center' : 'justify-start']"
            inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Icon name="tabler:home-2" size="20" />

            <span :class="[sidebarCollapsed ? 'hidden' : 'block']">
              My Studies
            </span>
          </ULink>
        </li>

        <hr class="border-gray-200 dark:border-gray-700" />
      </ul>

      <!-- Study-Specific Navigation -->
      <template v-if="selectedStudy">
        <div class="mt-4">
          <p
            class="px-3 py-2 text-xs font-semibold text-gray-600 uppercase dark:text-gray-400"
            :class="[sidebarCollapsed ? 'hidden' : 'block']"
          >
            Study Navigation
          </p>

          <ul class="space-y-1">
            <li v-for="item in studyNavItems" :key="item.route">
              <ULink
                :to="`/studies/${selectedStudy}/${item.route}`"
                class="group flex items-center gap-3 rounded-lg px-3 py-3"
                :class="[sidebarCollapsed ? 'justify-center' : 'justify-start']"
                active-class="bg-gray-200 dark:bg-gray-700"
                inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Icon :name="item.icon" size="20" />

                <span :class="[sidebarCollapsed ? 'hidden' : 'block']">
                  {{ item.name }}
                </span>
              </ULink>
            </li>
          </ul>
        </div>
      </template>
    </aside>

    <!-- Main Content -->
    <main
      :class="[
        'flex-1 transition-all duration-300',
        sidebarCollapsed ? 'ml-20' : 'ml-64',
      ]"
    >
      <!-- Dashboard Header -->
      <DashboardHeader @update:sidebar-collapsed="sidebarCollapsed = $event" />

      <!-- Page Content -->
      <div class="mt-24 w-full px-6">
        <slot />
      </div>
    </main>
  </div>
</template>
