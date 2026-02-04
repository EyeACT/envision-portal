<script setup lang="ts">
useSeoMeta({
  title: "Contact Us",
});

definePageMeta({
  layout: "public",
});
</script>

<template>
  <UContainer class="py-12">
    <div class="mb-4 text-center">
      <h1 class="mb-4 text-3xl font-bold">Contact Us</h1>

      <p class="text-lg">
        Have a question or need help? We'd love to hear from you. Send us a
        message and we'll respond as soon as possible.
      </p>
    </div>

    <p
      className="mb-8 w-full rounded-lg bg-yellow-50 p-2 text-center text-base font-normal text-slate-600"
    >
      Please read our
      <NuxtLink href="/faq" class="text-primary-500 font-medium hover:underline"
        >FAQ</NuxtLink
      >
      first - the answer to your question could be there!
    </p>

    <UCard class="border border-slate-200 shadow-lg dark:border-slate-800">
      <iframe
        data-tally-src="https://tally.so/embed/44JZaX?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
        loading="lazy"
        width="100%"
        height="324"
        frameborder="0"
        marginheight="0"
        marginwidth="0"
        title="Envision Portal Contact Form"
      />

      <template #footer-hidden>
        <div class="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            You can also reach us directly at
            <a
              href="mailto:info@envisionportal.io"
              class="text-primary-500 font-medium hover:underline"
            >
              info@envisionportal.io
            </a>
          </p>
        </div>
      </template>
    </UCard>
  </UContainer>
</template>
