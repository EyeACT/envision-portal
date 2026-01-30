// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: "Envision Portal",
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
      ],
      script: [
        {
          async: true,
          "data-website-id":
            process.env.NUXT_SITE_ENV === "production"
              ? "dd7449f0-ad92-480a-bb86-78c9daba61a4"
              : "df7cf3a6-0b7b-4f50-9e5e-c7ad8211d28b",
          src: "https://umami.fairdataihub.org/mushroom",
        },
        {
          src: "https://tally.so/widgets/embed.js",
          async: true,
        },
      ],
    },
  },
  colorMode: {
    preference: "light",
  },
  compatibilityDate: "2025-01-16",
  css: ["~/assets/css/main.css"],
  dayjs: {
    defaultLocale: "en",
    defaultTimezone: "America/Los_Angeles",
    plugins: ["relativeTime", "utc", "timezone"],
  },
  devtools: { enabled: true },
  modules: [
    "@nuxt/ui",
    "nuxt-auth-utils",
    "dayjs-nuxt",
    "@nuxt/eslint",
    "@nuxt/content",
    "@scalar/nuxt",
  ],
  nitro: {
    experimental: {
      openAPI: true,
    },
  },
  runtimeConfig: {
    AZURE_DRAFT_ACCOUNT_KEY: process.env.AZURE_DRAFT_ACCOUNT_KEY,
    AZURE_DRAFT_CONNECTION_STRING: process.env.AZURE_DRAFT_CONNECTION_STRING,
    AZURE_PUBLISHED_ACCOUNT_KEY: process.env.AZURE_PUBLISHED_ACCOUNT_KEY,
    AZURE_PUBLISHED_CONNECTION_STRING:
      process.env.AZURE_PUBLISHED_CONNECTION_STRING,
    emailVerificationDomain: process.env.EMAIL_VERIFICATION_DOMAIN,
    mailFrom: process.env.MAIL_FROM,
    mailHost: process.env.MAIL_HOST,
    mailPass: process.env.MAIL_PASS,
    mailPort: process.env.MAIL_PORT,
    mailUser: process.env.MAIL_USER,
    public: {
      baseUrl: process.env.NUXT_SITE_URL,
      environment: process.env.NUXT_SITE_ENV,
    },
  },
});
