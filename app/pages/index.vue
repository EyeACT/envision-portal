<script setup lang="ts">
useSeoMeta({
  title: "Home",
});

definePageMeta({
  layout: "public",
});

const timelineItems = [
  {
    title:
      "Platform foundation: architecture, standards, and first build (2024/2025)",
    list: [
      "Agree on the technical architecture and end-to-end user workflow so everyone is aligned on the big decisions",
      "Identify data standards to make datasets FAIR and AI-ready (CDS structure, DICOM for imaging, OMOP for clinical tables)",
      "Create initial wireframes and start building the core platform code",
      "Set up an open-source development approach (public GitHub, contributor-friendly structure)",
    ],
  },
  {
    title: "First dataset and public launch (2025/2026)",
    list: [
      "Standardize the first new dataset and publish it through the platform",
      "Build the essentials for sharing: storage, DOI minting, dataset landing pages, and an access workflow",
      "Index ~10 external eye imaging datasets from other repositories into the Envision Portal database",
      "Launch Envision Portal so users can access the new dataset and discover indexed external datasets",
      "Publish user and developer documentation, and set up a process for ongoing updates",
      "Begin community outreach through conferences and webinars",
    ],
  },
  {
    title: "Upload experience and early automation (2026/2027)",
    list: [
      "Build user-facing workflows to upload, manage, standardize, and share datasets in Envision Portal",
      "Kick off automation for data standardization and preparation",
      "Implement PHI detection/removal tooling, plus validation checks",
      "Add dataset versioning workflows",
      "Develop an automated pipeline to detect and index eye imaging datasets from other repositories",
      "Define a federated learning approach with the Alzheimer's Disease Data Initiative (ADDI)",
      "If needed, build a desktop upload/download app to improve the experience for large transfers",
    ],
  },
  {
    title: "Controlled access, better discovery, and reuse (2027/2028)",
    list: [
      "Continue improving data standardization tooling and automation",
      "Implement advanced data access features, including controlled access request workflows",
      "Add stronger dataset discovery features, including improved search and filtering",
      "Deliver a robust API for integration with AI/ML pipelines",
      "Add in-portal preview and visualization for common formats (CSV, XLSX, DICOM, BMP, and other common image formats) before download",
      "Build initial federated learning capabilities",
      "Support more datasets shared by external groups and expand the external index",
    ],
  },
  {
    title:
      "Scale, security validation, and long-term sustainability (2028/2029)",
    list: [
      "Complete federated learning capabilities",
      "Conduct full security validation to prepare for large-scale independent submissions and sharing",
      "Establish contribution guidelines and support community-driven extensions of the platform",
      "Pursue outreach for wide adoption and formal recognition as a trusted domain repository",
      "Execute the sustainability plan to support development and operations beyond current funding",
    ],
  },
];
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
          <h2 class="mb-4 text-3xl font-extrabold lg:text-4xl">Roadmap</h2>

          <p class="sm:text-xl">
            Our roadmap is designed to align with the needs of our users and
            ensure a smooth transition from our development environment to
            something you use everyday.
          </p>
        </div>

        <UiTimeline
          :items="[
            { id: 'year-0', label: 'Year 1' },
            { id: 'year-1', label: 'Year 2' },
            { id: 'year-2', label: 'Year 3' },
            { id: 'year-3', label: 'Year 4' },
            { id: 'year-4', label: 'Year 5' },
          ]"
        >
          <!-- Loop through timelineItems to create templates -->
          <template
            v-for="(item, index) in timelineItems"
            :key="index"
            v-slot:[`year-${index}`]
          >
            <div class="md:pl-20">
              <div class="relative w-full pr-4 pl-20 md:pl-4">
                <h3
                  class="mb-4 block text-left text-2xl font-bold text-teal-600 dark:text-neutral-500"
                >
                  {{ item.title }}
                </h3>
              </div>
              <ul
                class="list-disc space-y-2 pl-8 text-gray-600 dark:text-gray-300"
              >
                <li v-for="(task, taskIndex) in item.list" :key="taskIndex">
                  {{ task }}
                </li>
              </ul>
            </div>
          </template>
        </UiTimeline>
      </div>
    </UContainer>
  </div>
</template>
