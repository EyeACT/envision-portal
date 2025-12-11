export default defineAppConfig({
  ui: {
    button: {
      defaultVariants: {
        size: "lg",
      },
      slots: {
        base: "cursor-pointer rounded-lg",
      },
    },
    colors: {
      neutral: "zinc",
      primary: "teal",
    },
    input: {
      slots: {
        root: "w-full",
      },
    },
    timeline: {
      slots: {
        separator: "bg-gray-200 dark:bg-gray-800",
      },
    },
  },
});
