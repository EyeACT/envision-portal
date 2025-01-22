<script setup lang="ts">
const { clear } = useUserSession();

const logout = async () => {
  clear();
  await navigateTo("/login");
};
</script>

<template>
  <header class="border-b border-gray-200 dark:border-gray-800">
    <div
      class="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
    >
      <NuxtLink
        to="/"
        class="flex text-2xl font-bold text-gray-900 dark:text-white"
      >
        Envision Portal
      </NuxtLink>

      <div class="flex items-center justify-center gap-3">
        <NuxtLink
          to="/dashboard"
          class="text-base font-medium text-gray-900 dark:text-white"
        >
          Dashboard
        </NuxtLink>

        <NuxtLink
          to="/profile"
          class="text-base font-medium text-gray-900 dark:text-white"
        >
          Profile
        </NuxtLink>

        <NuxtLink
          to="/settings"
          class="text-base font-medium text-gray-900 dark:text-white"
        >
          Settings
        </NuxtLink>
      </div>

      <AuthState v-slot="{ loggedIn }">
        <UButton v-if="loggedIn" size="sm" @click="logout"> Logout </UButton>

        <div v-else class="flex items-center justify-center gap-3">
          <UButton to="/login" size="sm" color="gray"> Sign in </UButton>

          <UButton to="/signup" size="sm" color="black">
            <template #trailing>
              <Icon name="i-heroicons-arrow-right-20-solid" size="20" />
            </template>
            Sign up
          </UButton>
        </div>
      </AuthState>
    </div>
  </header>
</template>
