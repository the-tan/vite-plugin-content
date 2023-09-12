import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: [
    { input: "src/index", name: "index" },
    {
      input: "src/cli",
      name: "cli/index",
    },
    {
      input: "src/remark-plugins/index",
      name: "remark-plugins/index",
      outDir: "dist/remark-plugins",
    },
  ],
  clean: true,
  declaration: true,
  externals: ["vite"],
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
  failOnWarn: false,
});
