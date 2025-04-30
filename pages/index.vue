<script setup lang="ts">
useSeoMeta({
  title: "Home",
});

definePageMeta({
  layout: "public",
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
            The Envision Portal is more than just a platform—it's your launchpad
            for preparing, sharing, and scaling eye imaging data for advanced AI
            research. With rich context and MLCommons Croissant compatibility,
            it supports seamless integration with TensorFlow, JAX, and
            PyTorch—enabling powerful analysis and sharing on platforms like
            Kaggle and HuggingFace.
          </p>

          <div class="flex w-max items-center justify-start gap-3">
            <UButton
              to="/dashboard"
              icon="ri-eye-line"
              size="xl"
              color="primary"
              class="w-max"
            >
              View Eye Imaging Datasets
            </UButton>

            <UButton
              to="/upload"
              icon="ri-upload-cloud-line"
              size="xl"
              target="_blank"
              variant="outline"
              class="w-max"
              color="neutral"
            >
              Upload Your Dataset
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <UContainer class="py-24">
      <div class="max-w-screen-lg text-gray-500 sm:text-lg dark:text-gray-400">
        <h2 class="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
          What are we doing?
        </h2>

        <p class="mb-4 font-light">
          We are redefining the way clinical researchers share and collaborate
          on eye imaging data. The Envision Portal is a next-generation platform
          engineered to deliver a secure, user-friendly, and highly scalable
          solution for data sharing. It is thoughtfully designed to support
          researchers at every level, enabling efficient collaboration without
          technical barriers.
        </p>

        <p class="mb-4 font-medium">
          Our goal is to provide a seamless experience for researchers to share
          their data and collaborate with their peers.
        </p>

        <a
          href="#"
          class="text-primary-600 hover:text-primary-800 dark:text-primary-500 dark:hover:text-primary-700 inline-flex items-center font-medium"
        >
          Try it out now
          <svg
            class="ml-1 h-6 w-6"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </a>
      </div>
    </UContainer>

    <USeparator class="my-1" />

    <UContainer class="py-12">
      <section class="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <div class="grid items-center gap-12 md:grid-cols-2">
          <div class="space-y-4">
            <h2 class="text-4xl font-bold tracking-tight md:text-5xl">
              Built for clinicians, data scientists and AI developers like you
            </h2>

            <p class="text-xl">
              We are a team of clinicians, researchers, and engineers who are
              passionate about the future of eye health. We are dedicated to
              making the most of the latest technologies and data to improve
              patient care and outcomes.
            </p>

            <a
              href="#"
              class="text-primary-600 hover:text-primary-800 dark:text-primary-500 dark:hover:text-primary-700 inline-flex items-center font-medium"
            >
              Learn more
              <svg
                class="ml-1 h-6 w-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </a>
          </div>

          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div class="space-y-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
              >
                <Icon name="fa-solid:bullseye" size="20" />
              </div>

              <h3 class="text-xl font-bold">Accuracy</h3>

              <p class="">
                At Envision, we are committed to providing accurate,
                high-quality medical imaging data to support model training,
                clinical research, and informed decision-making. Our datasets
                are meticulously curated and validated to ensure maximum
                reliability and utility.
              </p>
            </div>

            <div class="space-y-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
              >
                <Icon name="rivet-icons:lock-open-solid" size="20" />
              </div>

              <h3 class="text-xl font-bold">Open Source</h3>

              <p class="">
                Envision is built on open-source principles. We are committed to
                transparency and collaboration, making our tools, code, and
                imaging datasets openly available to the community. We encourage
                contributions and aim to foster an inclusive, innovative
                ecosystem.
              </p>
            </div>

            <div class="space-y-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
              >
                <Icon name="cbi:ceiling-fair" size="20" />
              </div>

              <h3 class="text-xl font-bold">FAIR first</h3>

              <p class="">
                We prioritize FAIR principles (<strong
                  >Findable, Accessible, Interoperable, and Reusable</strong
                >) to ensure the long-term value and usability of medical image
                data and AI models. Envision is designed to make sharing and
                discovery effortless and compliant with these foundational
                standards.
              </p>
            </div>

            <div class="space-y-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
              >
                <Icon name="file-icons:codemeta" size="20" />
              </div>

              <h3 class="text-xl font-bold">Metadata and standards</h3>

              <p class="">
                All our datasets are curated to have all the possible metadata
                required for training and deployment of AI models. We also have
                a set of standards and guidelines to ensure consistency and
                interoperability across datasets.
              </p>
            </div>
          </div>
        </div>
      </section>
    </UContainer>

    <UContainer class="py-12">
      <div
        class="mx-auto flex max-w-screen-xl flex-col items-center justify-between px-4 lg:flex-row"
      >
        <div class="px-5 lg:max-w-2xl">
          <h2 class="mb-5 text-4xl font-bold tracking-tight md:text-5xl">
            Reinventing what it means to share data
          </h2>

          <p class="text-lg">
            Transforming the Future of Data Sharing in the era of AI, data is
            not just a byproduct—it's a foundational asset. To develop AI models
            that truly make an impact, we must prioritize how data is accessed,
            shared, and understood. The Envision Portal is pioneering a new
            standard in data collaboration—bridging the gap between data
            contributors and AI developers to accelerate innovation and
            discovery.
          </p>
        </div>

        <div class="flex w-full items-center justify-center px-5 py-5">
          <img class="rounded-lg" src="public/images/brain.jpg" alt="mockup" />
        </div>
      </div>
    </UContainer>

    <UContainer class="py-12">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900">
            Snapshot of the One-Stop Solution
          </h1>

          <p class="mt-2 text-lg text-gray-600">
            Some key numbers from the project
          </p>
        </div>

        <div class="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div
            class="rounded-lg bg-white p-6 text-center shadow-md dark:bg-gray-400"
          >
            <h2 class="text-4xl font-bold text-blue-400">150+</h2>

            <p class="mt-2 text-gray-700">Eye Imaging Datasets</p>
          </div>

          <div
            class="rounded-lg bg-white p-6 text-center shadow-md dark:bg-gray-400"
          >
            <h2 class="text-4xl font-bold text-blue-400">1.2+ Million</h2>

            <p class="mt-2 text-gray-700">Eye Images Curated</p>
          </div>

          <div
            class="rounded-lg bg-white p-6 text-center shadow-md dark:bg-gray-400"
          >
            <h2 class="text-4xl font-bold text-blue-400">100+</h2>

            <p class="mt-2 text-gray-700">Universities & Research Centers</p>
          </div>

          <div
            class="rounded-lg bg-white p-6 text-center shadow-md dark:bg-gray-400"
          >
            <h2 class="text-4xl font-bold text-blue-400">800,000+</h2>

            <p class="mt-2 text-gray-700">Dataset Downloads</p>
          </div>

          <div
            class="rounded-lg bg-white p-6 text-center shadow-md dark:bg-gray-400"
          >
            <h2 class="text-4xl font-bold text-blue-400">1800,000+</h2>

            <p class="mt-2 text-gray-700">API Requests</p>
          </div>

          <div
            class="rounded-lg bg-white p-6 text-center shadow-md dark:bg-gray-400"
          >
            <h2 class="text-4xl font-bold text-blue-400">200+</h2>

            <p class="mt-2 text-gray-700">Research Papers Ciring our Data</p>
          </div>
        </div>
      </div>
    </UContainer>

    <UContainer class="py-18">
      <div class="mx-auto max-w-screen-xl px-4 py-8 lg:px-6 lg:py-16">
        <div class="mx-auto mb-8 max-w-screen-sm text-center lg:mb-16">
          <h2 class="mb-4 text-3xl font-extrabold lg:text-4xl">Our Blog</h2>

          <p class="sm:text-xl">
            Learn about updates to the platform and other news regarding the
            FAIRification of eye imaging data.
          </p>
        </div>

        <div class="grid gap-8 lg:grid-cols-2">
          <article
            class="rounded-lg border border-gray-200 bg-white p-6 shadow-md"
          >
            <div class="mb-5 flex items-center justify-between">
              <span
                class="bg-primary-100 text-primary-800 inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium"
              >
                <svg
                  class="mr-1 h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z"
                    clip-rule="evenodd"
                  ></path>

                  <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z"></path>
                </svg>
                Article
              </span>

              <span class="text-sm">14 days ago</span>
            </div>

            <h2 class="mb-2 text-2xl font-bold tracking-tight text-gray-900">
              <a href="#">Linking Retinal Changes to Brain Health</a>
            </h2>

            <p class="mb-5 text-gray-500">
              Researchers are using eye imaging data to track changes in retinal
              structure and vascular features to detect neurological risks. The
              Anderson Lab at the University of California, San Francisco, is
              using this data to study the effects of aging on a population of
              mice.
            </p>

            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4 text-gray-500">
                <img
                  class="h-7 w-7 rounded-full"
                  src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/jese-leos.png"
                  alt="Jese Leos avatar"
                />

                <span class="font-medium"> Fujibayashi Naoue </span>
              </div>

              <a
                href="#"
                class="text-primary-600 inline-flex items-center font-medium hover:underline"
              >
                Read more
                <svg
                  class="ml-2 h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              </a>
            </div>
          </article>

          <article
            class="rounded-lg border border-gray-200 bg-white p-6 shadow-md"
          >
            <div class="mb-5 flex items-center justify-between text-gray-500">
              <span
                class="bg-primary-100 text-primary-800 inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium"
              >
                <svg
                  class="mr-1 h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z"
                    clip-rule="evenodd"
                  ></path>

                  <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z"></path>
                </svg>
                Article
              </span>

              <span class="text-sm">20 days ago</span>
            </div>

            <h2 class="mb-2 text-2xl font-bold tracking-tight text-gray-900">
              <a href="#"> Updates to the Envision Portal </a>
            </h2>

            <p class="mb-5 font-light text-gray-500">
              We recently updated the Envision Portal to include new features
              and improved functionality. The new features include the ability
              to upload and manage multiple datasets, as well as the ability to
              view and analyze data from multiple studies.
            </p>

            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4 text-gray-500">
                <img
                  class="h-7 w-7 rounded-full"
                  src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/bonnie-green.png"
                  alt="Bonnie Green avatar"
                />

                <span class="font-medium"> Bonnie Green </span>
              </div>

              <a
                href="#"
                class="text-primary-600 inline-flex items-center font-medium hover:underline"
              >
                Read more
                <svg
                  class="ml-2 h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              </a>
            </div>
          </article>
        </div>
      </div>
    </UContainer>

    <UContainer class="py-18">
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
          <li class="ms-6 mb-10">
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
              Envision Portal v0.3.0
              <span
                class="rounded-sm bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300"
              >
                Latest
              </span>
            </h3>

            <time
              class="mb-2 block text-sm leading-none font-normal text-gray-400 dark:text-gray-500"
            >
              Released on December 13th, 2025
            </time>

            <p
              class="mb-4 text-base font-normal text-gray-500 dark:text-gray-400"
            >
              Added a new uploading tool that allows users to upload their own
              datasets. The uploading tool includes a drag-and-drop interface, a
              progress bar, and a file preview. It also includes a documentation
              page that provides detailed instructions on how to upload
              datasets.
            </p>

            <UButton
              to="/"
              icon="line-md:upload-loop"
              size="xl"
              color="primary"
              variant="outline"
            >
              Upload Dataset
            </UButton>
          </li>

          <li class="ms-6 mb-10">
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
              class="mb-1 text-lg font-semibold text-gray-900 dark:text-white"
            >
              Envision Portal v0.2.0
            </h3>

            <time
              class="mb-2 block text-sm leading-none font-normal text-gray-400 dark:text-gray-500"
            >
              Released on July 7th, 2025
            </time>

            <p class="text-base font-normal text-gray-500 dark:text-gray-400">
              The Envision Portal v0.2.0 is a significant update that includes
              new features, improved usability, and enhanced security. The
              dashboard has been redesigned to provide a more intuitive and
              user-friendly interface. The data explorer has been updated to
              include new features and improved functionality. The visualization
              tool has been improved to provide more customization options and
              better integration with other tools.
            </p>
          </li>

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
              class="mb-1 text-lg font-semibold text-gray-900 dark:text-white"
            >
              Envision Portal v0.1.0
            </h3>

            <time
              class="mb-2 block text-sm leading-none font-normal text-gray-400 dark:text-gray-500"
            >
              Released on May 2nd, 2025
            </time>

            <p class="text-base font-normal text-gray-500 dark:text-gray-400">
              The first version of the Envision Portal is now available for
              testing. It includes a dashboard, a data explorer, and a
              visualization tool. The dashboard allows users to view and analyze
              their data, while the data explorer provides a user-friendly
              interface for uploading, managing, and sharing datasets. The
              visualization tool enables users to create and share
              visualizations of their data.
            </p>
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
              src="public/images/brain-health.jpg"
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
              src="public/images/data.jpg"
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
              src="public/images/data-modeling.jpg"
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
