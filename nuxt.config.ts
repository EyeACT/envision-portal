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
  modules: ["@nuxt/ui", "nuxt-auth-utils", "dayjs-nuxt"],
  runtimeConfig: {
    AZURE_ACCOUNT_KEY: process.env.AZURE_ACCOUNT_KEY,
    AZURE_CONNECTION_STRING: process.env.AZURE_CONNECTION_STRING,
    emailVerificationDomain: process.env.EMAIL_VERIFICATION_DOMAIN,
    mailFrom: process.env.MAIL_FROM,
    mailHost: process.env.MAIL_HOST,
    mailPass: process.env.MAIL_PASS,
    mailPort: process.env.MAIL_PORT,
    mailUser: process.env.MAIL_USER,
  },
});
