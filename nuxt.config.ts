// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-01-16",
  css: ["~/assets/css/main.css"],
  dayjs: {
    defaultLocale: "en",
    defaultTimezone: "America/Los_Angeles",
    plugins: ["relativeTime", "utc", "timezone"],
  },
  devtools: { enabled: true },
  extends: ["docus"],
  modules: ["@nuxt/ui", "nuxt-auth-utils", "dayjs-nuxt", "@nuxt/eslint"],
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
  }
});
