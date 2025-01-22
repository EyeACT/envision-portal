export default defineAppConfig({
  ui: {
    button: {
      default: {
        size: "md",
      },
      rounded: "rounded-full",
    },
    card: {
      rounded: "rounded-xl",
    },
    footer: {
      bottom: {
        wrapper: "border-t border-gray-200 dark:border-gray-800",
      },
      top: {
        container: "py-8 lg:py-16",
        wrapper: "border-t border-gray-200 dark:border-gray-800",
      },
    },
    gray: "neutral",
    input: {
      default: {
        size: "md",
      },
    },
    page: {
      hero: {
        wrapper: "lg:py-24",
      },
    },
    primary: "sky",
  },
});
