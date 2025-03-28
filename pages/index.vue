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

        <div class="absolute bottom-3 flex justify-between gap-10 px-10 pb-10">
          <p class="my-10 text-3xl font-medium">
            The Envision Portal is your new home to help you explore the future
            of uploading, preparing, and sharing eye imaging data.
          </p>

          <div class="flex w-max items-center justify-start gap-3">
            <UButton
              to="/dashboard"
              icon="line-md:upload-loop"
              size="xl"
              color="primary"
              class="w-max"
            >
              View eye imaging datasets
            </UButton>

            <UButton
              to="https://github.com/eyeact/envision-portal"
              icon="i-simple-icons-github"
              size="xl"
              target="_blank"
              variant="outline"
              class="w-max"
              color="neutral"
              label="View on GitHub"
            >
              View on GitHub
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
          We are rethinking how you share your eye imaging data. The Envision
          Portal is built from the ground up to provide clinical researchers
          with a easy to use, secure, and scalable platform to share their study
          material. We are building a platform that is designed to be easy to
          use and accessible to all researchers, regardless of their technical
          expertise.
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

    <UContainer class="py-24">
      <section class="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <div class="grid items-center gap-12 md:grid-cols-2">
          <div class="space-y-4">
            <h2
              class="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl"
            >
              Built for clinicians like you
            </h2>

            <p class="text-xl text-gray-600">
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

              <p class="text-gray-600">
                We are committed to providing accurate and reliable data to
                support model training and clinical decision-making. Our
                datasets are carefully curated and validated to ensure the
                highest quality and reliability.
              </p>
            </div>

            <div class="space-y-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
              >
                <Icon name="rivet-icons:lock-open-solid" size="20" />
              </div>

              <h3 class="text-xl font-bold">Open Source</h3>

              <p class="text-gray-600">
                We believe in open-source software and are committed to making
                our code and data accessible to the community. We welcome
                contributions from the community and strive to maintain a
                collaborative and inclusive environment.
              </p>
            </div>

            <div class="space-y-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
              >
                <Icon name="cbi:ceiling-fair" size="20" />
              </div>

              <h3 class="text-xl font-bold">FAIR first</h3>

              <p class="text-gray-600">
                We are committed to making our datasets and models FAIR
                (Findable, Accessible, Interoperable, and Reusable) to ensure
                their long-term value and sustainability. We strive to follow
                the FAIR principles and make our datasets and models as
                accessible as possible.
              </p>
            </div>

            <div class="space-y-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
              >
                <Icon name="file-icons:codemeta" size="20" />
              </div>

              <h3 class="text-xl font-bold">Metadata and standards</h3>

              <p class="text-gray-600">
                All our datasets are curated to have all the possible metadata
                required for training and deployment of AI models. We also have
                a set of standards and guidelines to ensure consistency and
                interoperability across datasets.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div
        class="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-3 lg:px-8"
      >
        <!-- Left Side Content (Text and Paragraph) -->
        <div class="text-center lg:text-left">
          <h1
            class="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl"
          >
            Accurate
          </h1>

          <p class="mt-4 text-lg leading-relaxed text-gray-600">
            Our AI-powered data platform serves as a trusted and comprehensive
            source of truth, enabling organizations to make informed,
            data-driven decisions at scale.
          </p>
        </div>
        <!-- Right Side Content (Image) -->
        <div class="flex flex-col justify-center lg:col-span-2">
          <div class="mt-6 text-left">
            <img
              src="public/images/brain.jpg"
              alt="Brain and Eye Health"
              class="h-auto w-full max-w-2xl transform rounded-lg shadow-xl transition-all duration-300 hover:scale-105"
            />
          </div>
        </div>
      </div>
    </UContainer>

    <UContainer class="bg-gray-100 py-24 dark:bg-gray-400">
      <div
        class="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:px-8"
      >
        <!-- Left Side Content (Image) -->
        <div class="flex justify-center lg:justify-end">
          <img
            src="public/images/ai-eye.jpg"
            alt="AI Eye"
            class="w-full max-w-lg transform rounded-lg shadow-xl transition-all duration-300 hover:scale-105"
          />
        </div>
        <!-- Right Side Content (Text) -->
        <div class="text-center lg:text-left">
          <h1
            class="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl"
          >
            Scalable
          </h1>

          <p class="mt-4 text-lg leading-relaxed text-gray-600">
            We process data at scale, with unparalleled speed and scalability
            across all research, delivering detailed and complete insights into
            the real world.
          </p>
        </div>
      </div>
    </UContainer>

    <UContainer class="py-24">
      <div
        class="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-3 lg:px-8"
      >
        <!-- Left Side Content (Text) -->
        <div class="text-center lg:text-left">
          <h1
            class="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl"
          >
            Up-to-date
          </h1>

          <p class="mt-4 text-lg leading-relaxed text-gray-600">
            Our global partners provide the latest medical imaging and
            specialized data, which are then rapidly mined using our AI-based
            systems to create and maintain a current representation of reality.
          </p>
        </div>
        <!-- Right Side Content (Image) -->
        <div class="flex flex-col justify-center lg:col-span-2">
          <div class="mt-6 text-left">
            <img
              src="public/images/ai-brain.jpg"
              alt="AI Brain"
              class="w-full max-w-2xl transform rounded-lg shadow-xl transition-all duration-300 hover:scale-105"
            />
          </div>
        </div>
      </div>
    </UContainer>

    <UContainer class="bg-gray-100 py-12 dark:bg-gray-500">
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
            <h2 class="text-4xl font-bold text-blue-400">5,763</h2>

            <p class="mt-2 text-gray-700">Total participants enrolled</p>
          </div>

          <div
            class="rounded-lg bg-white p-6 text-center shadow-md dark:bg-gray-400"
          >
            <h2 class="text-4xl font-bold text-blue-400">24,000+</h2>

            <p class="mt-2 text-gray-700">Biennial study visits conducted</p>
          </div>

          <div
            class="rounded-lg bg-white p-6 text-center shadow-md dark:bg-gray-400"
          >
            <h2 class="text-4xl font-bold text-blue-400">2000+</h2>

            <p class="mt-2 text-gray-700">Cases recorded</p>
          </div>

          <div
            class="rounded-lg bg-white p-6 text-center shadow-md dark:bg-gray-400"
          >
            <h2 class="text-4xl font-bold text-blue-400">80,000+</h2>

            <p class="mt-2 text-gray-700">Clinic visits extracted</p>
          </div>

          <div
            class="rounded-lg bg-white p-6 text-center shadow-md dark:bg-gray-400"
          >
            <h2 class="text-4xl font-bold text-blue-400">18,000+</h2>

            <p class="mt-2 text-gray-700">Clinical retinal images analyzed</p>
          </div>

          <div
            class="rounded-lg bg-white p-6 text-center shadow-md dark:bg-gray-400"
          >
            <h2 class="text-4xl font-bold text-blue-400">3,000</h2>

            <p class="mt-2 text-gray-700">Expanded active participants</p>
          </div>
        </div>
      </div>
    </UContainer>

    <UContainer class="py-24">
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

    <section id="footer">
      <img
        src="public/images/footer.jpg"
        alt="Predictive Modeling"
        class="h-150 w-full object-cover"
      />

      <div class="main-footer">
        <!-- Logo & Mission -->
        <div class="logoinfo">
          <h2>Envision Portal</h2>

          <p>Seeing the Future of Brain Health Through the Eyes</p>

          <div class="contact-details">
            <h1>Contact Us</h1>

            <ul>
              <li>
                <div class="fa fa-phone"></div>

                <a href="tel:+1234567890">+1 234 567 890</a>
              </li>

              <li>
                <div class="fa fa-envelope"></div>

                <a href="mailto:contact@eyeact.com">contact@eyeact.com</a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Navigation Links -->
        <div class="com">
          <h1>Quick Links</h1>

          <ul>
            <li><a href="#">Home</a></li>

            <li><a href="#">About</a></li>

            <li><a href="#">Research</a></li>

            <li><a href="#">Contact</a></li>
          </ul>
        </div>

        <!-- Social Media -->
        <div class="info">
          <h1>Follow Us</h1>

          <div class="sociallogos">
            <div class="logobox">
              <a href="#" class="fa fa-instagram"></a>

              <a href="#" class="fa fa-linkedin"></a>

              <a href="#" class="fa fa-twitter"></a>

              <a href="#" class="fa fa-youtube-play"></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
