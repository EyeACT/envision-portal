import { defineContentConfig, defineCollection, z } from "@nuxt/content"; // This is a simplified version of it
import { joinURL } from "ufo";
import { useNuxt } from "@nuxt/kit";
import type { DefinedCollection } from "@nuxt/content";

const { options } = useNuxt();
// const cwd = joinURL(options.rootDir, "content"); // resolves to '/content' of your project

const createDocsSchema = () =>
  z.object({
    links: z
      .array(
        z.object({
          label: z.string(),
          icon: z.string(),
          to: z.string(),
          target: z.string().optional(),
        }),
      )
      .optional(),
  });

let collections: Record<string, DefinedCollection>;

collections = {
  // landing: defineCollection({
  //   type: "page",
  //   source: {
  //     cwd,
  //     include: "index.md",
  //   },
  // }),
  docs: defineCollection({
    type: "page",
    source: {
      // cwd,
      include: "docs/**",
      exclude: ["index.md"],
    },
    schema: createDocsSchema(),
  }),
};

// console.log(JSON.stringify(collections, null, 2));

export default defineContentConfig({ collections });
