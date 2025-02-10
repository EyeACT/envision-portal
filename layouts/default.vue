<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
const { clear, loggedIn, user } = useUserSession();

// Showing an alert for now but can redirect to a verification page later if needed
const emailVerified = computed(
  () => loggedIn.value && user.value?.emailVerified,
);

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

const logout = async () => {
  clear();
  await navigateTo("/login");
};

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};
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
        sidebarCollapsed ? 'w-20' : 'w-64', // Reduced collapsed width to remove extra space
      ]"
    >
      <!-- Global Navigation -->
      <ul class="mt-4 space-y-1">
        <li>
          <ULink
            to="/studies"
            class="group flex items-center gap-3 rounded-lg px-3 py-3"
            active-class="bg-gray-200 dark:bg-gray-700"
            :class="[sidebarCollapsed ? 'justify-center' : 'justify-start']"
            inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Icon name="tabler:home-2" size="28" />
            <!-- Increased icon size -->
            <span :class="[sidebarCollapsed ? 'hidden' : 'block']">
              My Studies
            </span>
          </ULink>
        </li>

        <!-- <li>
          <ULink
            to="/inbox"
            class="group flex items-center gap-3 rounded-lg px-3 py-3"
            active-class="bg-gray-200 dark:bg-gray-700"
            :class="[sidebarCollapsed ? 'justify-center' : 'justify-start']"
            inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Icon name="material-symbols:inbox-rounded" size="28" />

            <span :class="[sidebarCollapsed ? 'hidden' : 'block']">
              Inbox
            </span>
          </ULink>
        </li> -->

        <hr class="border-gray-200 dark:border-gray-700" />
        <!-- 
        <li>
          <ULink
            to="/upload"
            class="group flex items-center gap-3 rounded-lg px-3 py-3"
            active-class="bg-gray-200 dark:bg-gray-700"
            :class="[sidebarCollapsed ? 'justify-center' : 'justify-start']"
            inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Icon name="heroicons-outline:upload" size="28" />

            <span :class="[sidebarCollapsed ? 'hidden' : 'block']">
              Upload
            </span>
          </ULink>
        </li> -->

        <!-- <li>
          <ULink
            to="/docs"
            class="group flex items-center gap-3 rounded-lg px-3 py-3"
            active-class="bg-gray-200 dark:bg-gray-700"
            :class="[sidebarCollapsed ? 'justify-center' : 'justify-start']"
            inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Icon name="heroicons-outline:document-text" size="28" />

            <span :class="[sidebarCollapsed ? 'hidden' : 'block']"> Docs </span>
          </ULink>
        </li>

        <hr class="border-gray-200 dark:border-gray-700" /> -->
      </ul>

      <!-- Help & Settings -->
      <!-- <ul class="space-y-1">
        <li>
          <ULink
            to="/help"
            class="group mt-1 flex items-center gap-3 rounded-lg px-3 py-3"
            active-class="bg-gray-200 dark:bg-gray-700"
            :class="[sidebarCollapsed ? 'justify-center' : 'justify-start']"
            inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Icon name="heroicons-outline:question-mark-circle" size="28" />

            <span :class="[sidebarCollapsed ? 'hidden' : 'block']"> Help </span>
          </ULink>
        </li>

        <li>
          <ULink
            to="/settings"
            class="group flex items-center gap-3 rounded-lg px-3 py-3"
            active-class="bg-gray-200 dark:bg-gray-700"
            :class="[sidebarCollapsed ? 'justify-center' : 'justify-start']"
            inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Icon name="heroicons-outline:cog" size="28" />

            <span :class="[sidebarCollapsed ? 'hidden' : 'block']">
              Settings
            </span>
          </ULink>
        </li>

        <hr class="border-gray-200 dark:border-gray-700" />
      </ul> -->

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
    </aside>

    <!-- Main Content -->
    <main
      :class="[
        'flex-1 transition-all duration-300',
        sidebarCollapsed ? 'ml-20' : 'ml-64',
      ]"
    >
      <!-- Dashboard Header -->
      <header
        class="fixed top-0 right-0 left-0 z-10 block w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      >
        <div
          v-if="!emailVerified"
          class="flex items-center justify-center gap-2 bg-red-500 p-1 text-sm font-semibold text-white"
        >
          <Icon name="ic:baseline-warning" size="16" />

          <span> Please verify your email address. </span>
        </div>

        <div class="mx-auto flex items-center justify-between px-4 py-2">
          <div class="flex items-center gap-1">
            <UButton
              :icon="
                sidebarCollapsed
                  ? 'tabler:layout-sidebar-left-collapse-filled'
                  : 'tabler:layout-sidebar-right-collapse-filled'
              "
              variant="ghost"
              color="neutral"
              size="lg"
              @click="toggleSidebar"
            />

            <NuxtLink to="/" class="flex text-2xl font-bold">
              Envision Portal
            </NuxtLink>
          </div>

          <div class="flex items-center justify-center gap-3">
            <UTooltip text="Inbox">
              <UButton
                to="/inbox"
                color="neutral"
                variant="ghost"
                icon="material-symbols:inbox-rounded"
              />
            </UTooltip>

            <UTooltip placement="bottom" text="View Documentation">
              <UButton
                to="https://docs.envision.io"
                target="_blank"
                color="neutral"
                variant="ghost"
                icon="heroicons-outline:question-mark-circle"
              />
            </UTooltip>

            <UTooltip text="View Settings">
              <UButton
                icon="heroicons-outline:cog"
                color="neutral"
                to="/settings"
                variant="ghost"
              />
            </UTooltip>

            <UTooltip text="Toggle Color Mode">
              <AppColorModeButton />
            </UTooltip>

            <AuthState>
              <UButton
                v-if="loggedIn"
                color="neutral"
                variant="outline"
                @click="logout"
              >
                Logout
              </UButton>

              <div v-else class="flex items-center justify-center gap-3">
                <UButton to="/login" color="neutral" variant="outline">
                  Sign in
                </UButton>

                <UButton to="/signup" color="neutral">
                  <template #trailing>
                    <Icon name="i-heroicons-arrow-right-20-solid" size="20" />
                  </template>
                  Sign up
                </UButton>
              </div>
            </AuthState>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="mt-24 w-full p-6">
        <slot />
      </div>
    </main>
  </div>
</template>
