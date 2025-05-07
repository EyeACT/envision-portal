<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();

const sidebarCollapsed = ref(false);
const selectedStudy = computed(() => route.params.studyId || null);
const selectedDataset = computed(() => route.params.datasetId || null);

const datasetNavItems = [
  {
    name: "Overview",
    icon: "material-symbols:overview-key-rounded",
    route: "overview",
  },
  { name: "Metadata", icon: "ooui:view-details-ltr", route: "metadata" },
  { name: "Files", icon: "ph:files-fill", route: "files" },
];

const items = ref<NavigationMenuItem[][]>([
  [
    {
      label: "Navigation",
      type: "label",
    },
    {
      icon: "i-lucide-home",
      label: "My Studies",
      to: "/app/dashboard",
    },
    {
      children: [
        {
          icon: "material-symbols:overview-key-rounded",
          label: "Overview",
          to: `/app/study/${selectedStudy.value}/overview`,
        },
        {
          icon: "ooui:view-details-ltr",
          label: "Study Description",
          to: `/app/study/${selectedStudy.value}/metadata/description`,
        },
        {
          icon: "mdi:shield-check-outline",
          label: "Oversight",
          to: `/app/study/${selectedStudy.value}/metadata/oversight`,
        },
        {
          icon: "mdi:progress-check",
          label: "Status",
          to: `/app/study/${selectedStudy.value}/metadata/status`,
        },
        {
          icon: "mdi:account-group-outline",
          label: "Team",
          to: `/app/study/${selectedStudy.value}/metadata/team`,
        },
        {
          icon: "mdi:draw",
          label: "Design",
          to: `/app/study/${selectedStudy.value}/metadata/design`,
        },
        {
          icon: "mdi:medical-bag",
          label: "Eligibility",
          to: `/app/study/${selectedStudy.value}/metadata/treatment/eligibility`,
        },
        {
          icon: "mdi:medical-bag",
          label: "Arms",
          to: `/app/study/${selectedStudy.value}/metadata/treatment/arms`,
        },
        {
          icon: "mdi:medical-bag",
          label: "Interventions",
          to: `/app/study/${selectedStudy.value}/metadata/treatment/interventions`,
        },
        {
          icon: "mdi:account-multiple-plus",
          label: "Central Contacts",
          to: `/app/study/${selectedStudy.value}/metadata/enrollment/contacts`,
        },
        {
          icon: "mdi:account-multiple-plus",
          label: "Overall Officials",
          to: `/app/study/${selectedStudy.value}/metadata/enrollment/officials`,
        },
        {
          icon: "mdi:map-marker-multiple",
          label: "Locations",
          to: `/app/study/${selectedStudy.value}/metadata/locations`,
        },
        {
          icon: "ph:files-fill",
          label: "Files",
          to: `/app/study/${selectedStudy.value}/files`,
        },
        {
          icon: "material-symbols:dataset",
          label: "Datasets",
          to: `/app/study/${selectedStudy.value}/datasets`,
        },
        {
          icon: "mdi:account-group-outline",
          label: "Permissions",
          to: `/app/study/${selectedStudy.value}/collaborators`,
        },
        {
          icon: "mdi:account-multiple",
          label: "Participants",
          to: `/app/study/${selectedStudy.value}/participants`,
        },
        {
          icon: "heroicons-outline:upload",
          label: "Data Upload",
          to: `/app/study/${selectedStudy.value}/upload`,
        },
        {
          icon: "heroicons-outline:cube",
          label: "Data Processing",
          to: `/app/study/${selectedStudy.value}/processing`,
        },
        {
          icon: "heroicons-outline:inbox-arrow-down",
          label: "Data Requests",
          to: `/app/study/${selectedStudy.value}/requests`,
        },
      ],
      defaultOpen: true,
      icon: "i-lucide-book-open",
      label: "Study",
    },
    {
      children: datasetNavItems.map((item) => ({
        icon: item.icon,
        label: item.name,
        to: `/app/study/${selectedStudy.value}/${item.route}`,
      })),
      defaultOpen: true,
      icon: "i-lucide-database",
      label: "Dataset",
    },
  ],
]);

// TODO: Add tooltip for each nav item

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
        'fixed top-13 left-0 z-10 h-full border-r border-gray-200 bg-white px-2 py-1 transition-all duration-300 dark:border-gray-700 dark:bg-gray-900',
        sidebarCollapsed ? 'w-15' : 'w-64',
      ]"
    >
      <UNavigationMenu
        orientation="vertical"
        :items="items"
        class="data-[orientation=vertical]:w-48"
      />
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
      <div class="mt-18 w-full px-6">
        <slot />
      </div>
    </main>
  </div>
</template>
