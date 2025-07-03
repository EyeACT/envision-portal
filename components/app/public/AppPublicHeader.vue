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
      class="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
    >
      <NuxtLink to="/" class="flex text-2xl font-bold">
        Envision Portal
      </NuxtLink>

      <div class="flex items-center justify-center gap-4">
        <NuxtLink
          to="/app/dashboard"
          class="text-base font-medium transition-colors hover:text-sky-500"
        >
          Share data
        </NuxtLink>

        <NuxtLink
          to="/datasets"
          class="text-base font-medium transition-colors hover:text-sky-500"
        >
          Find data
        </NuxtLink>

        <NuxtLink
          to="/about"
          class="text-base font-medium transition-colors hover:text-sky-500"
        >
          About
        </NuxtLink>

        <NuxtLink
          to="/docs"
          class="text-base font-medium transition-colors hover:text-sky-500"
        >
          Documentation
        </NuxtLink>

        <NuxtLink
          to="/contact"
          class="text-base font-medium transition-colors hover:text-sky-500"
        >
          Contact us
        </NuxtLink>
      </div>

      <AuthState v-slot="{ loggedIn }">
        <div v-if="loggedIn" class="flex items-center justify-center gap-3">
          <UButton color="neutral" variant="outline" @click="logout">
            Logout
          </UButton>
        </div>

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
  </header>
</template>
