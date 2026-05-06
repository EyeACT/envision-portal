<script setup lang="ts">
import "md-editor-v3/lib/style.css";

const colorMode = useColorMode();

const color = computed(() =>
  colorMode.value === "dark" ? "#111827" : "white",
);

useHead({
  htmlAttrs: {
    lang: "en",
  },
  link: [
    { href: "/favicon.ico", rel: "shortcut icon" },
    { href: "/favicon-96x96.png", rel: "icon", sizes: "96x96" },
    { href: "/favicon.svg", rel: "icon", type: "image/svg+xml" },
    {
      href: "/apple-touch-icon.png",
      rel: "apple-touch-icon",
      sizes: "180x180",
    },
    { href: "/site.webmanifest", rel: "manifest" },
  ],
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
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
