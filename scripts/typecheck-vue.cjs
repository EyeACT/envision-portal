// vue-tsc needs the TypeScript JS API, which TypeScript 7 no longer ships, so
// point it at the 5.9 alias. The rest of the project stays on TypeScript 7.
process.argv.push("--noEmit", "-p", ".nuxt/tsconfig.app.json");

require("vue-tsc").run(require.resolve("typescript-vue-tsc/lib/tsc"));
