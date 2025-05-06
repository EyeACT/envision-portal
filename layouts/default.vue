<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();

const sidebarCollapsed = ref(false);
const selectedStudy = computed(() => route.params.studyId || null);
const selectedDataset = computed(() => route.params.datasetId || null);

const studyNavigationIsOpen = ref(true);
const datasetNavigationIsOpen = ref(false);

const items = ref<NavigationMenuItem[][]>([
  [
    {
      label: "Links",
      type: "label",
    },
    {
      children: [
        {
          description: "Fully styled and customizable components for Nuxt.",
          icon: "i-lucide-house",
          label: "Introduction",
        },
        {
          description:
            "Learn how to install and configure Nuxt UI in your application.",
          icon: "i-lucide-cloud-download",
          label: "Installation",
        },
        {
          description:
            "You have nothing to do, @nuxt/icon will handle it automatically.",
          icon: "i-lucide-smile",
          label: "Icons",
        },
        {
          description:
            "Choose a primary and a neutral color from your Tailwind CSS theme.",
          icon: "i-lucide-swatch-book",
          label: "Colors",
        },
        {
          description:
            "You can customize components by using the `class` / `ui` props or in your app.config.ts.",
          icon: "i-lucide-cog",
          label: "Theme",
        },
      ],
      icon: "i-lucide-book-open",
      label: "Guide",
    },
    {
      children: [
        {
          description: "Define shortcuts for your application.",
          icon: "i-lucide-file-text",
          label: "defineShortcuts",
          to: "/composables/define-shortcuts",
        },
        {
          description: "Display a modal/slideover within your application.",
          icon: "i-lucide-file-text",
          label: "useOverlay",
          to: "/composables/use-overlay",
        },
        {
          description: "Display a toast within your application.",
          icon: "i-lucide-file-text",
          label: "useToast",
          to: "/composables/use-toast",
        },
      ],
      icon: "i-lucide-database",
      label: "Composables",
    },
    {
      active: true,
      children: [
        {
          description: "Use NuxtLink with superpowers.",
          icon: "i-lucide-file-text",
          label: "Link",
          to: "/components/link",
        },
        {
          description: "Display a modal within your application.",
          icon: "i-lucide-file-text",
          label: "Modal",
          to: "/components/modal",
        },
        {
          description: "Display a list of links.",
          icon: "i-lucide-file-text",
          label: "NavigationMenu",
          to: "/components/navigation-menu",
        },
        {
          description: "Display a list of pages.",
          icon: "i-lucide-file-text",
          label: "Pagination",
          to: "/components/pagination",
        },
        {
          description:
            "Display a non-modal dialog that floats around a trigger element.",
          icon: "i-lucide-file-text",
          label: "Popover",
          to: "/components/popover",
        },
        {
          description: "Show a horizontal bar to indicate task progression.",
          icon: "i-lucide-file-text",
          label: "Progress",
          to: "/components/progress",
        },
      ],
      defaultOpen: true,
      icon: "i-lucide-box",
      label: "Components",
      to: "/components",
    },
  ],
  [
    {
      badge: "3.8k",
      icon: "i-simple-icons-github",
      label: "GitHub",
      target: "_blank",
      to: "https://github.com/nuxt/ui",
    },
    {
      disabled: true,
      icon: "i-lucide-circle-help",
      label: "Help",
    },
  ],
]);

// TODO: Add tooltip for each nav item
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
  {
    name: "Data Requests",
    icon: "heroicons-outline:inbox-arrow-down",
    route: "requests",
  },
];

const datasetNavItems = [
  {
    name: "Overview",
    icon: "material-symbols:overview-key-rounded",
    route: "overview",
  },
  { name: "Metadata", icon: "ooui:view-details-ltr", route: "metadata" },
  { name: "Files", icon: "ph:files-fill", route: "files" },
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
        'fixed top-13 left-0 z-10 h-full border-r border-gray-200 bg-white px-2 py-1 transition-all duration-300 dark:border-gray-700 dark:bg-gray-900',
        sidebarCollapsed ? 'w-15' : 'w-64',
      ]"
    >
      <UNavigationMenu
        orientation="vertical"
        :items="items"
        class="data-[orientation=vertical]:w-48"
      />
      <!-- Global Navigation -->
      <ul>
        <li>
          <ULink
            to="/app/dashboard"
            class="mt-2 flex items-center gap-3 rounded-lg p-2 transition-all"
            active-class="bg-gray-200 dark:bg-gray-700"
            :class="[sidebarCollapsed ? 'justify-center' : 'justify-start']"
            inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Icon name="tabler:home-2" size="20" />

            <span
              :class="[sidebarCollapsed ? 'hidden opacity-0' : 'opacity-100']"
            >
              My Studies
            </span>
          </ULink>
        </li>

        <hr class="my-2 border-gray-200 dark:border-gray-700" />
      </ul>

      <!-- Study-Specific Navigation -->
      <template v-if="selectedStudy">
        <UCollapsible
          v-model:open="studyNavigationIsOpen"
          class="flex w-48 w-full flex-col gap-2"
        >
          <UButton
            label="Study Navigation"
            color="neutral"
            variant="ghost"
            block
            class="w-full"
            trailing-icon="i-lucide-chevron-down"
          />

          <template #content>
            <ul class="space-y-1">
              <li v-for="item in studyNavItems" :key="item.route">
                <ULink
                  :to="`/app/study/${selectedStudy}/${item.route}`"
                  class="flex items-center gap-2 rounded-lg p-2 text-sm"
                  :class="[
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                  ]"
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
          </template>
        </UCollapsible>

        <hr class="my-2 border-gray-200 dark:border-gray-700" />
      </template>

      <!-- Dataset-Specific Navigation -->
      <template v-if="selectedDataset">
        <UCollapsible
          v-model:open="datasetNavigationIsOpen"
          class="flex w-48 w-full flex-col gap-2"
        >
          <UButton
            label="Dataset Navigation"
            color="neutral"
            variant="ghost"
            block
            class="w-full"
            trailing-icon="i-lucide-chevron-down"
          />

          <template #content>
            <ul class="space-y-1">
              <li v-for="item in datasetNavItems" :key="item.route">
                <ULink
                  :to="`/app/study/${selectedStudy}/${item.route}`"
                  class="flex items-center gap-2 rounded-lg p-2 text-sm"
                  :class="[
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                  ]"
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
          </template>
        </UCollapsible>

        <hr class="my-2 border-gray-200 dark:border-gray-700" />
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
      <div class="mt-18 w-full px-6">
        <slot />
      </div>
    </main>
  </div>
</template>
