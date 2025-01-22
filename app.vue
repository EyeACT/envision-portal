<script setup lang="ts">
const colorMode = useColorMode();

const color = computed(() =>
  colorMode.value === "dark" ? "#111827" : "white",
);

useHead({
  htmlAttrs: {
    lang: "en",
  },
  link: [{ href: "/favicon.ico", rel: "icon" }],
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "theme-color", content: color, key: "theme-color" },
  ],
});

useSeoMeta({
  ogImage:
    "https://kalai.fairdataihub.org/api/generate?title=Envision%20Portal&description=Some%20description%20here%0A&app=Envision%20Portal&org=eyeact",
  titleTemplate: "%s - Envision Portal",
  twitterCard: "summary_large_image",
  twitterImage:
    "https://kalai.fairdataihub.org/api/generate?title=Envision%20Portal&description=Some%20description%20here%0A&app=Envision%20Portal&org=eyeact",
});
</script>

<template>
  <div>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <UNotifications />
  </div>
</template>
