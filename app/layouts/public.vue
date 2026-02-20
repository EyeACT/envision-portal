<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const { clear } = useUserSession();
const route = useRoute();

const logout = async () => {
  clear();
  await navigateTo("/");
};

const headerItems = computed<NavigationMenuItem[]>(() => [
  {
    label: "Share data",
    to: "/app/dashboard",
    active: route.path.startsWith("/app/dashboard"),
  },
  {
    label: "Find data",
    to: "/datasets",
    active: route.path.startsWith("/datasets"),
  },
  {
    label: "About",
    to: "/metrics",
    active: route.path.startsWith("/metrics"),
  },
  {
    label: "Trust & Safety",
    to: "/trust",
    active: route.path.startsWith("/trust"),
  },
  {
    label: "Contact us",
    to: "/contact",
    active: route.path.startsWith("/contact"),
  },
]);

const footerItems: NavigationMenuItem[] = [
  {
    label: "About",
    to: "/about",
    active: route.path.startsWith("/about"),
  },
  {
    label: "Contact us",
    to: "/contact",
    active: route.path.startsWith("/contact"),
  },
  {
    label: "Privacy Policy",
    to: "/privacy",
    active: route.path.startsWith("/privacy"),
  },
  {
    label: "Terms & Conditions",
    to: "/terms",
    active: route.path.startsWith("/terms"),
  },
];
</script>

<template>
  <div class="relative">
    <UHeader>
      <template #title>
        <NuxtLink to="/" class="flex text-2xl font-bold">
          Envision Portal
        </NuxtLink>
      </template>

      <UNavigationMenu :items="headerItems" />

      <template #right>
        <AuthState v-slot="{ loggedIn }">
          <UButton
            v-if="loggedIn"
            color="neutral"
            variant="outline"
            @click="logout"
          >
            Logout
          </UButton>

          <div v-else class="flex items-center justify-center gap-3">
            <UButton to="/login" variant="outline"> Sign in </UButton>

            <UButton to="/signup">
              <template #trailing>
                <Icon name="i-heroicons-arrow-right-20-solid" size="20" />
              </template>
              Sign up
            </UButton>
          </div>
        </AuthState>
      </template>
    </UHeader>

    <UMain class="py-4">
      <slot />
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-muted text-sm">
          Copyright © {{ new Date().getFullYear() }}
        </p>
      </template>

      <UNavigationMenu :items="footerItems" variant="link" color="primary" />

      <template #right>
        <UButton
          icon="i-simple-icons-bluesky"
          color="neutral"
          variant="ghost"
          to="https://bluesky.social/profile/fairdataihub.org"
          target="_blank"
          aria-label="BlueSky"
        />

        <UButton
          icon="i-simple-icons-github"
          color="neutral"
          variant="ghost"
          to="https://github.com/eyeact/envision-portal"
          target="_blank"
          aria-label="GitHub"
        />
      </template>
    </UFooter>
  </div>
</template>
