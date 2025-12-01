<script setup lang="ts">
useSeoMeta({
  title: "Home",
});
</script>

<template>
  <div>
    <div class="bg-wrapper relative">
      <div class="absolute inset-0 bg-black opacity-50"></div>

      <div
        class="absolute inset-0 z-10 grid h-full grid-cols-12 gap-3 text-white"
      >
        <h1 class="col-span-6 pt-10 pl-10 text-6xl font-bold">
          See the future with eye imaging data.
        </h1>

        <div
          class="absolute bottom-3 flex w-full flex-col justify-between gap-8 px-10 pb-10"
        >
          <p class="my-3 text-3xl font-medium">
            The Envision Portal is your launchpad for easily preparing, sharing,
            and finding eye imaging data using user friendly interfaces and
            automation tools.
          </p>

          <div class="flex w-max items-center justify-start gap-3">
            <UButton
              to="/datasets"
              icon="ri-eye-line"
              size="xl"
              color="primary"
              class="w-max"
            >
              View datasets
            </UButton>

            <UButton
              to="/app/dashboard"
              icon="ri-upload-cloud-line"
              size="xl"
              target="_blank"
              variant="outline"
              class="w-max"
              color="neutral"
            >
              Share dataset
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <UContainer class="py-24">
      <div class="max-w-screen-lg text-gray-500 sm:text-lg dark:text-gray-400">
        <h2 class="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
          What is the Envision Portal?
        </h2>

        <p class="mb-4 font-light">
          Eye imaging data are essential to advancing research in eye health and
          beyond. Yet, the research community faces challenges in finding and
          accessing eye imaging datasets that are standardized, well-documented,
          and ready for reuse. To address this challenge, we are developing the
          Envision Portal, a cloud-based, open-source platform that provides
          researchers and AI developers with the tools they need to conveniently
          share, discover, and reuse eye imaging data.
        </p>

        <NuxtLink
          to="/about"
          class="text-primary-600 hover:text-primary-800 dark:text-primary-500 dark:hover:text-primary-700 inline-flex items-center font-medium"
        >
          Learn more
          <Icon name="i-heroicons-arrow-right-20-solid" size="20" />
        </NuxtLink>
      </div>
    </UContainer>

    <USeparator class="my-1" />

    <UContainer class="py-12">
      <section class="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <div class="grid items-start gap-12 md:grid-cols-2">
          <div class="space-y-4">
            <h2 class="text-4xl font-bold tracking-tight md:text-5xl">
              Easy to use, intuitive, and focused on supporting your work.
            </h2>

            <p class="text-xl">
              Whether you are sharing data, searching for datasets, or building
              AI models, the Envision Portal provides the tools you need to work
              efficiently and responsibly.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div class="space-y-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
              >
                <Icon name="fa-solid:bullseye" size="20" />
              </div>

              <h3 class="text-xl font-bold">Easy Data Sharing</h3>

              <p class="">
                Contribute your datasets through guided submission workflows.
                The platform supports data standardization, data
                de-identification, metadata completeness, and multiple access
                methods making your data valuable and responsibly reusable by
                the community.
              </p>
            </div>

            <div class="space-y-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
              >
                <Icon name="rivet-icons:lock-open-solid" size="20" />
              </div>

              <h3 class="text-xl font-bold">Convenient Data Discovery</h3>

              <p class="">
                Discover diverse eye imaging datasets using powerful search and
                filtering tools. The platform act as a registry for all eye
                imaging datasets, whether they are shared through the Envision
                Portal or not.
              </p>
            </div>

            <div class="space-y-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
              >
                <Icon name="cbi:ceiling-fair" size="20" />
              </div>

              <h3 class="text-xl font-bold">Automation for Efficiency</h3>

              <p class="">
                Automated tools for data formatting, metadata completeness, and
                de-identification help ensure that are AI-ready while reducing
                effort for contributors. The platform also includes a novel
                LLM-based search tool where data consumers can identify the
                right datasets for their use cases through a series of
                questions.
              </p>
            </div>

            <div class="space-y-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
              >
                <Icon name="file-icons:codemeta" size="20" />
              </div>

              <h3 class="text-xl font-bold">FAIR first</h3>

              <p class="">
                Every dataset on the Envision Portal is aligned with the FAIR
                (Findable, Accessible, Interoperable, Reusable) principles. Rich
                metadata, standardized formats, and clear documentation make
                data ready for reuse in research, AI development, and beyond.
              </p>
            </div>
          </div>
        </div>
      </section>
    </UContainer>

    <UContainer class="py-12">
      <div class="mx-auto max-w-screen-xl px-4 py-8 lg:px-6 lg:py-16">
        <div class="mx-auto mb-8 max-w-screen-sm text-center lg:mb-16">
          <h2 class="mb-4 text-3xl font-extrabold lg:text-4xl">
            Development Timeline
          </h2>

          <p class="sm:text-xl">
            Our development timeline is designed to align with the needs of our
            users and ensure a smooth transition from prototype to production.
          </p>
        </div>

        <ol class="relative border-s border-gray-200 dark:border-gray-700">
          <li class="ms-6">
            <span
              class="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 ring-8 ring-white dark:bg-blue-900 dark:ring-gray-900"
            >
              <svg
                class="h-2.5 w-2.5 text-blue-800 dark:text-blue-300"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"
                />
              </svg>
            </span>

            <h3
              class="mb-1 flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white"
            >
              Envision Portal v0.1.0
              <span
                class="rounded-sm bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300"
              >
                Latest
              </span>
            </h3>

            <time
              class="mb-2 block text-sm leading-none font-normal text-gray-400 dark:text-gray-500"
            >
              Current Development Version
            </time>

            <p class="text-base font-normal text-gray-500 dark:text-gray-400">
              The first version of the Envision Portal includes comprehensive
              features for eye imaging data management. Users can create
              accounts with email verification, manage datasets through an
              intuitive dashboard, and upload files using Azure Data Lake
              integration. The platform supports rich metadata collection
              including study descriptions, dataset descriptions, and health
              sheets for AI-ready data documentation. Access control features
              allow for both public and controlled dataset access with request
              management. The platform includes dataset publishing workflows,
              version management, and comprehensive search and discovery
              capabilities for finding eye imaging datasets.
            </p>

            <div class="mt-4 flex flex-wrap gap-2">
              <UButton
                to="/app/dashboard"
                icon="ri-dashboard-line"
                size="sm"
                color="primary"
                variant="outline"
              >
                Dashboard
              </UButton>

              <UButton
                to="/datasets"
                icon="ri-eye-line"
                size="sm"
                color="primary"
                variant="outline"
              >
                Browse Datasets
              </UButton>
            </div>
          </li>
        </ol>
      </div>
    </UContainer>

    <UContainer class="hidden py-24">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <h2
          class="text-center text-4xl font-bold text-gray-900 dark:text-gray-200"
        >
          Unlocking Eye & Brain Health Insights
        </h2>

        <p class="mt-4 text-center text-lg text-gray-600 dark:text-gray-300">
          Explore how AI and data-driven research are transforming ophthalmology
          and neuroscience.
        </p>
        <!-- Grid Layout for 6 Cards -->
        <div class="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <!-- Card 1 -->
          <div
            class="rounded-2xl bg-white p-6 shadow-lg transition-transform duration-300 hover:scale-105 dark:bg-gray-800"
          >
            <img
              src="/images/brain-health.jpg"
              alt="Retinal & Brain Health"
              class="mb-4 h-40 w-full rounded-lg object-cover"
            />

            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              Linking Retinal Changes to Brain Health
            </h3>

            <p class="mt-2 text-gray-600 dark:text-gray-300">
              Analyzes retinal structure and vascular features to detect
              neurological risks.
            </p>

            <button
              class="mt-4 rounded-lg bg-[#ccffff] px-4 py-2 text-gray-900 hover:bg-[#b3e6e6]"
            >
              Learn More
            </button>
          </div>
          <!-- Card 2 -->
          <div
            class="rounded-2xl bg-white p-6 shadow-lg transition-transform duration-300 hover:scale-105 dark:bg-gray-800"
          >
            <img
              src="/images/data.jpg"
              alt="Longitudinal Data"
              class="mb-4 h-40 w-full rounded-lg object-cover"
            />

            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              Leveraging Longitudinal Data
            </h3>

            <p class="mt-2 text-gray-600 dark:text-gray-300">
              Tracks thousands of participants over decades for deep, diverse
              insights.
            </p>

            <button
              class="mt-4 rounded-lg bg-[#ccffff] px-4 py-2 text-gray-900 hover:bg-[#b3e6e6]"
            >
              Learn More
            </button>
          </div>
          <!-- Card 3 -->
          <div
            class="rounded-2xl bg-white p-6 shadow-lg transition-transform duration-300 hover:scale-105 dark:bg-gray-800"
          >
            <img
              src="/images/data-modeling.jpg"
              alt="Predictive Modeling"
              class="mb-4 h-40 w-full rounded-lg object-cover"
            />

            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              Advancing Predictive Modeling
            </h3>

            <p class="mt-2 text-gray-600 dark:text-gray-300">
              AI-driven analysis helps predict disease risks early on.
            </p>

            <button
              class="mt-4 rounded-lg bg-[#ccffff] px-4 py-2 text-gray-900 hover:bg-[#b3e6e6]"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>
