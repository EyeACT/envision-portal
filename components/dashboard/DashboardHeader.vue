<script setup lang="ts">
const { clear } = useUserSession();

const sidebarCollapsed = ref(false);

const logout = async () => {
  clear();
  await navigateTo("/login");
};

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};
</script>

<template>
  <header
    class="fixed top-0 right-0 left-0 z-10 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
  >
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
        <AppColorModeButton />

        <AuthState v-slot="{ loggedIn }">
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
</template>
