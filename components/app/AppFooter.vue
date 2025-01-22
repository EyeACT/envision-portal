<script setup lang="ts"></script>

<template>
  <footer class="border-t border-gray-200 dark:border-gray-800">
    <div
      class="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
    >
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Copyright © {{ new Date().getFullYear() }}. All rights reserved.
      </p>

      <div class="flex items-center gap-x-2">
        <AppColorModeButton />

        <UButton
          to="https://github.com/nuxt-ui-pro/saas"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="gray"
          variant="ghost"
        />
      </div>
    </div>
  </footer>
</template>
