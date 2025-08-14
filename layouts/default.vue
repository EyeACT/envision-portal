<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const sidebarCollapsed = ref(false);
const selectedDataset = computed(() => route.params.datasetId || null);

const inStudyMetadata = computed(() => {
  return route.path.includes(
    `/datasets/${selectedDataset.value}/study/metadata`,
  );
});
const inDatasetMetadata = computed(() => {
  return route.path.includes(`/datasets/${selectedDataset.value}/metadata`);
});
const inHealthsheet = computed(() => {
  return route.path.includes(`/datasets/${selectedDataset.value}/healthsheet`);
});

const datasetNavItems = [
  {
    name: "Overview",
    icon: "material-symbols:overview-key-rounded",
    route: "overview",
  },
  {
    name: "Dataset Metadata",
    children: [
      {
        name: "General Information",
        icon: "material-symbols:description",
        route: "metadata/general-information",
      },
      {
        name: "Identifiers",
        icon: "mdi:identifier",
        route: "metadata/identifiers",
      },
      {
        name: "Team",
        icon: "ri:team-line",
        route: "metadata/team",
      },
      {
        name: "Data Management",
        icon: "tdesign:data-search",
        route: "metadata/data-management",
      },
      {
        name: "Access & Rights",
        icon: "streamline-logos:open-access-logo-block",
        route: "metadata/access-rights",
      },
      {
        name: "Related Identifiers",
        icon: "streamline-sharp:share-link",
        route: "metadata/related-identifiers",
      },
      {
        name: "About",
        icon: "jam:task-list",
        route: "metadata/about",
      },
    ],
    icon: "ooui:view-details-ltr",
    route: "metadata",
  },
  {
    name: "Healthsheet",
    children: [
      {
        name: "Motivation",
        icon: "material-symbols-light:motion-photos-on-rounded",
        route: "healthsheet/motivation",
      },
      {
        name: "Composition",
        icon: "ph:compass-tool-duotone",
        route: "healthsheet/composition",
      },
      {
        name: "Collection",
        icon: "fluent:collections-add-24-filled",
        route: "healthsheet/collection",
      },
      {
        name: "Preprocessing",
        icon: "carbon:process",
        route: "healthsheet/preprocessing",
      },
      {
        name: "Uses",
        icon: "icon-park-twotone:data-user",
        route: "healthsheet/uses",
      },
      {
        name: "Distribution",
        icon: "fluent-mdl2:distribute-down",
        route: "healthsheet/distribution",
      },
      {
        name: "Maintenance",
        icon: "pajamas:issue-type-maintenance",
        route: "healthsheet/maintenance",
      },
    ],
    icon: "ooui:view-details-ltr",
    route: "healthsheet",
  },
  {
    name: "Study Metadata",
    children: [
      {
        name: "About",
        icon: "material-symbols:description",
        route: "study/metadata/about",
      },
      {
        name: "Oversight",
        icon: "material-symbols:admin-panel-settings",
        route: "study/metadata/oversight",
      },
      {
        name: "Status",
        icon: "hugeicons:status",
        route: "study/metadata/status",
      },
      {
        name: "Team",
        icon: "material-symbols:group",
        route: "study/metadata/team",
      },
      {
        name: "Design",
        icon: "material-symbols:architecture",
        route: "study/metadata/design",
      },
      {
        name: "Eligibility",
        icon: "material-symbols:checklist",
        route: "study/metadata/eligibility",
      },
      {
        name: "Arms",
        icon: "material-symbols:science",
        route: "study/metadata/arms",
      },
      {
        name: "Interventions",
        icon: "material-symbols:syringe-sharp",
        route: "study/metadata/interventions",
      },
      {
        name: "Central Contacts",
        icon: "mdi:contact",
        route: "study/metadata/contacts",
      },
      {
        name: "Overall Officials",
        icon: "material-symbols:badge",
        route: "study/metadata/officials",
      },
      {
        name: "Locations",
        icon: "material-symbols:location-on",
        route: "study/metadata/locations",
      },
    ],
    icon: "ooui:view-details-ltr",
    route: "metadata",
  },
  { name: "Files", icon: "ph:files-fill", route: "files" },
  {
    name: "Changelog",
    icon: "material-symbols:history",
    route: "changelog",
  },
  {
    name: "Readme",
    icon: "gg:readme",
    route: "readme",
  },
  {
    name: "Permissions",
    icon: "mdi:account-group-outline",
    route: "permissions",
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
  {
    name: "Publish",
    icon: "material-symbols:publish",
    route: "publish",
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
        'fixed top-13 left-0 z-10 h-[calc(100vh-3.25rem)] border-r border-gray-200 bg-white px-2 py-1 transition-all duration-300 dark:border-gray-700 dark:bg-gray-900',
        sidebarCollapsed ? 'w-15' : 'w-64',
      ]"
    >
      <div class="flex h-full flex-col">
        <!-- Global Navigation -->
        <ul class="flex-none">
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
                My Datasets
              </span>
            </ULink>
          </li>

          <hr class="my-2 border-gray-200 dark:border-gray-700" />
        </ul>

        <!-- Scrollable Navigation Section -->
        <div class="flex-1 overflow-y-auto">
          <!-- Dataset-Specific Navigation -->
          <template v-if="selectedDataset">
            <ul class="space-y-1">
              <li v-for="item in datasetNavItems" :key="item.route">
                <template v-if="item.children">
                  <UCollapsible
                    :default-open="
                      (inDatasetMetadata && item.name === 'Dataset Metadata') ||
                      (inHealthsheet && item.name === 'Healthsheet') ||
                      (inStudyMetadata && item.name === 'Study Metadata')
                    "
                    class="flex w-full flex-col gap-2"
                  >
                    <UButton
                      color="neutral"
                      variant="ghost"
                      class="flex w-full items-center gap-2 rounded-lg p-2 text-sm"
                      :class="[
                        sidebarCollapsed ? 'justify-center' : 'justify-start',
                      ]"
                    >
                      <Icon :name="item.icon" size="20" />

                      <span :class="[sidebarCollapsed ? 'hidden' : 'block']">
                        {{ item.name }}
                      </span>

                      <Icon
                        v-if="!sidebarCollapsed"
                        name="i-lucide-chevron-down"
                        size="16"
                        class="ml-auto"
                      />
                    </UButton>

                    <template #content>
                      <ul class="ml-6 space-y-1">
                        <li v-for="child in item.children" :key="child.route">
                          <ULink
                            :to="`/app/datasets/${selectedDataset}/${child.route}`"
                            class="flex items-center gap-2 rounded-lg p-2 text-sm"
                            :class="[
                              sidebarCollapsed
                                ? 'justify-center'
                                : 'justify-start',
                            ]"
                            active-class="bg-gray-200 dark:bg-gray-700"
                            inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Icon :name="child.icon" size="18" />

                            <span
                              :class="[sidebarCollapsed ? 'hidden' : 'block']"
                            >
                              {{ child.name }}
                            </span>
                          </ULink>
                        </li>
                      </ul>
                    </template>
                  </UCollapsible>
                </template>

                <template v-else>
                  <ULink
                    :to="`/app/datasets/${selectedDataset}/${item.route}`"
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
                </template>
              </li>
            </ul>

            <hr class="my-2 border-gray-200 dark:border-gray-700" />
          </template>
        </div>
      </div>
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
