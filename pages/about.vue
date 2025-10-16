<script setup lang="ts">
useSeoMeta({
  title: "About",
});

definePageMeta({
  layout: "public",
});
</script>

<template>
  <UContainer class="py-12">
    <h1 class="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
      About the Envision Portal
    </h1>

    <div class="prose prose-lg dark:prose-invert max-w-none">
      <p class="text-lg text-gray-600 dark:text-gray-300">
        The Envision Portal is a cloud-based, open-source platform designed to
        address the challenges researchers face in finding and accessing
        standardized, well-documented eye imaging datasets.
      </p>

      <h2
        class="mt-8 mb-4 text-2xl font-semibold text-gray-900 dark:text-white"
      >
        Purpose
      </h2>

      <p class="text-gray-600 dark:text-gray-300">
        Eye imaging data are essential to advancing research in eye health and
        beyond. The research community faces challenges in finding and accessing
        eye imaging datasets that are standardized, well-documented, and ready
        for reuse. The Envision Portal provides researchers and AI developers
        with tools to conveniently share, discover, and reuse eye imaging data.
      </p>

      <h2
        class="mt-8 mb-4 text-2xl font-semibold text-gray-900 dark:text-white"
      >
        Key Features
      </h2>

      <ul class="list-disc pl-6 text-gray-600 dark:text-gray-300">
        <li>Dataset sharing with guided submission workflows</li>

        <li>Data standardization and de-identification tools</li>

        <li>
          Comprehensive metadata collection (study descriptions, health sheets)
        </li>

        <li>Search and discovery capabilities for eye imaging datasets</li>

        <li>Access control for both public and controlled datasets</li>

        <li>
          FAIR (Findable, Accessible, Interoperable, Reusable) data principles
        </li>

        <li>Dataset publishing and version management</li>
      </ul>

      <h2
        class="mt-8 mb-4 text-2xl font-semibold text-gray-900 dark:text-white"
      >
        Technology
      </h2>

      <p class="text-gray-600 dark:text-gray-300">
        Built with modern web technologies including Nuxt.js, Vue.js,
        TypeScript, PostgreSQL, and Azure Data Lake for scalable file storage.
        The platform is open-source and designed for extensibility.
      </p>

      <h2
        class="mt-8 mb-4 text-2xl font-semibold text-gray-900 dark:text-white"
      >
        Current Status
      </h2>

      <p class="text-gray-600 dark:text-gray-300">
        The platform is currently in development (v0.1.0) with core
        functionality implemented for dataset management, metadata collection,
        and access control.
      </p>
    </div>
  </UContainer>
</template>
