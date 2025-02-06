<script setup lang="ts">
const { loggedIn, user } = useUserSession();

// Showing an alert for now but can redirect to a verification page later if needed
const emailVerified = computed(
  () => loggedIn.value && user.value?.emailVerified,
);
</script>

<template>
  <div>
    <DashboardHeader />

    <aside
      id="default-sidebar"
      class="fixed top-0 left-0 z-0 h-screen w-64 -translate-x-full transition-transform sm:translate-x-0"
      :class="{
        'mt-[52px]': emailVerified,
        'mt-[80px]': !emailVerified,
      }"
      aria-label="Sidebar"
    >
      <div
        class="h-full overflow-y-auto border-r border-gray-200 px-3 py-4 dark:border-gray-700"
      >
        <ul class="flex flex-col gap-1 font-medium">
          <li>
            <ULink
              to="/dashboard"
              class="group flex items-center justify-start gap-3 rounded-lg p-2"
              active-class="bg-gray-200 dark:bg-gray-700"
              inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Icon name="material-symbols:dashboard-rounded" size="20" />

              <span> Dashboard </span>
            </ULink>
          </li>

          <li>
            <ULink
              to="/inbox"
              class="group flex items-center justify-start gap-3 rounded-lg p-2"
              active-class="bg-gray-200 dark:bg-gray-700"
              inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Icon name="material-symbols:inbox-rounded" size="20" />

              <span> Inbox </span>
            </ULink>
          </li>

          <li>
            <ULink
              to="/upload"
              class="group flex items-center justify-start gap-3 rounded-lg p-2"
              active-class="bg-gray-200 dark:bg-gray-700"
              inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Icon name="heroicons-outline:upload" size="20" />

              <span> Upload </span>
            </ULink>
          </li>

          <hr class="border-gray-200 dark:border-gray-700" />

          <li>
            <ULink
              to="/docs"
              class="group flex items-center justify-start gap-3 rounded-lg p-2"
              active-class="bg-gray-200 dark:bg-gray-700"
              inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Icon name="heroicons-outline:document-text" size="20" />

              <span> Docs </span>
            </ULink>
          </li>

          <li>
            <ULink
              to="/settings"
              class="group flex items-center justify-start gap-3 rounded-lg p-2"
              active-class="bg-gray-200 dark:bg-gray-700"
              inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Icon name="heroicons-outline:cog" size="20" />

              <span> Settings </span>
            </ULink>
          </li>

          <li>
            <ULink
              to="/help"
              class="group flex items-center justify-start gap-3 rounded-lg p-2"
              active-class="bg-gray-200 dark:bg-gray-700"
              inactive-class="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Icon name="heroicons-outline:question-mark-circle" size="20" />

              <span> Help </span>
            </ULink>
          </li>
        </ul>
      </div>
    </aside>

    <main class="px-8 py-6 sm:ml-64">
      <slot />
    </main>
  </div>
</template>
