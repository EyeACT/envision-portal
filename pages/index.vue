<script setup lang="ts">
useSeoMeta({
  title: "Home",
});
</script>

<template>
  <div>
    <UContainer>
      <div class="flex w-full items-center justify-center text-4xl font-bold">
        <div
          class="mx-auto max-w-screen-xl px-4 pt-8 text-center lg:px-12 lg:pt-16"
        >
          <h1 class="mb-4 py-2 text-4xl font-black md:text-5xl lg:text-6xl">
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
            class="mb-8 flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4 lg:mb-16"
          >
            <UButton to="/dashboard" icon="line-md:upload-loop" size="xl">
              Get started
            </UButton>

            <UButton
              to="https://github.com/eyeact/envision-portal"
              icon="i-simple-icons-github"
              size="xl"
              target="_blank"
              variant="outline"
              color="neutral"
              label="View on GitHub"
            >
              View on GitHub
            </UButton>
          </div>
        </div>
      </div>
    </UContainer>

    <UContainer>
      <div
        class="mx-auto grid w-full max-w-7xl gap-16 px-4 py-24 sm:gap-y-24 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8"
      >
        <div>
          <h2 class="text-3xl font-bold lg:text-4xl">
            Lorem ipsum dolor sit adipisicing elit.
          </h2>

          <div class="mt-6 text-lg">
            Dolore ad ex ad mollit proident mollit. Dolor mollit qui deserunt ex
            deserunt veniam sit nulla qui laboris deserunt ullamco ea. Sunt eu
            proident quis id cillum reprehenderit veniam occaecat dolore dolore
            culpa.
          </div>

          <dl class="mt-6 space-y-4">
            <div class="relative pl-8">
              <dt class="font-semibold">
                <Icon
                  name="mingcute:ai-fill"
                  class="absolute top-1 left-0"
                  size="25"
                />

                <span> Eu anim irure adipisicing tempor. </span>
              </dt>

              <dd>Magna cupidatat laborum laboris cillum.</dd>
            </div>

            <div class="relative pl-8">
              <dt class="font-semibold">
                <Icon
                  name="mingcute:cat-fill"
                  class="absolute top-1 left-0"
                  size="25"
                />

                <span>
                  Aute aliqua nostrud ad sint dolore eiusmod aute ex Lorem
                  minim.
                </span>
              </dt>

              <dd>Culpa ipsum exercitation minim sint sunt tempor minim.</dd>
            </div>

            <div class="relative pl-8">
              <dt class="font-semibold">
                <Icon
                  name="mingcute:flower-2-fill"
                  class="absolute top-1 left-0"
                  size="25"
                />

                <span>
                  Ex elit eiusmod labore velit ipsum sit mollit do non nulla
                  duis.
                </span>
              </dt>

              <dd>Laboris nisi nostrud Lorem elit anim.</dd>
            </div>
          </dl>
        </div>

        <AppImagePlaceholder />
      </div>
    </UContainer>

    <UContainer>
      <div
        class="mx-auto grid w-full max-w-7xl gap-16 px-4 py-24 sm:gap-y-24 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8"
      >
        <AppImagePlaceholder />

        <div>
          <h2 class="text-3xl font-bold lg:text-4xl">
            Lorem ipsum dolor sit adipisicing elit.
          </h2>

          <div class="mt-6 text-lg">
            Dolore ad ex ad mollit proident mollit. Dolor mollit qui deserunt ex
            deserunt veniam sit nulla qui laboris deserunt ullamco ea. Sunt eu
            proident quis id cillum reprehenderit veniam occaecat dolore dolore
            culpa.
          </div>

          <dl class="mt-6 space-y-4">
            <div class="relative pl-8">
              <dt class="font-semibold">
                <Icon
                  name="mingcute:lemon-squeezy-fill"
                  class="absolute top-1 left-0"
                  size="25"
                />

                <span> Eu anim irure adipisicing tempor. </span>
              </dt>

              <dd>Magna cupidatat laborum laboris cillum.</dd>
            </div>

            <div class="relative pl-8">
              <dt class="font-semibold">
                <Icon
                  name="mingcute:pig-money-fill"
                  class="absolute top-1 left-0"
                  size="25"
                />

                <span>
                  Aute aliqua nostrud ad sint dolore eiusmod aute ex Lorem
                  minim.
                </span>
              </dt>

              <dd>Culpa ipsum exercitation minim sint sunt tempor minim.</dd>
            </div>

            <div class="relative pl-8">
              <dt class="font-semibold">
                <Icon
                  name="mingcute:safe-flash-fill"
                  class="absolute top-1 left-0"
                  size="25"
                />

                <span>
                  Ex elit eiusmod labore velit ipsum sit mollit do non nulla
                  duis.
                </span>
              </dt>

              <dd>Laboris nisi nostrud Lorem elit anim.</dd>
            </div>
          </dl>
        </div>
      </div>
    </UContainer>
  </div>
</template>
