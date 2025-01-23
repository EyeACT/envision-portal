export default defineAppConfig({
  ui: {
    button: {
      defaultVariants: {
        size: "lg",
      },
      slots: {
        base: "cursor-pointer",
      },
    },
    colors: {
      neutral: "zinc",
      primary: "sky",
    },
    input: {
      slots: {
        root: "w-full",
      },
    },
  },
});
