<script setup lang="ts">
useSeoMeta({
  title: "Home",
});
</script>

<template>
  <UContainer>
    <div class="relative flex w-full items-center justify-center rounded-2xl">
      <div class="font-display relative text-4xl font-bold">
        <div
          class="relative mx-auto max-w-screen-xl px-4 pt-8 text-center lg:px-12 lg:pt-16"
        >
          <h1
            class="relative mb-4 py-2 text-4xl font-black md:text-5xl lg:text-6xl"
          >
            Seeing the future of brain health
          </h1>

          <p
            class="mb-8 text-lg font-medium text-stone-700 sm:px-16 lg:text-xl xl:px-48 dark:text-stone-50"
          >
            The Envision Portal is developed for the EyeACT project to
            streamline the uploading, preparation, and sharing of eye imaging
            research and data.
          </p>

          <div
            class="mb-8 flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0 lg:mb-16"
          >
            <UButton to="/dashboard" icon="line-md:upload-loop" size="xl">
              Get started
            </UButton>

            <UButton
              to="https://github.com/eyeact/envision-portal"
              icon="i-simple-icons-github"
              size="xl"
              target="_blank"
              color="gray"
              label="View on GitHub"
            >
              View on GitHub
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>
