import { defineBuildConfig } from "unbuild";

export default defineBuildConfig([
  {
    entries: ["src/index"],
    name: "src/index",
    clean: true,
    externals: ["vite"],
    rollup: {
      emitCJS: true,
      output: { exports: "named" },
      dts: {
        tsconfig: "./configs/tsconfig.build.json",
      },
    },
    declaration: true,
    failOnWarn: false,
  },
  {
    entries: ["src/remark-plugins/index"],
    name: "remark-plugins",
    clean: true,
    rollup: {
      emitCJS: true,
      dts: {
        tsconfig: "./configs/tsconfig.build.json",
      },
    },
    declaration: true,
    failOnWarn: false,
  },
  {
    entries: ["src/cli/index"],
    name: "src/cli",
    clean: true,
    declaration: false,
    failOnWarn: false,
    hooks: {
      "build:done": async () => {
        const { run } = await import("./scripts/move-tsconfig");
        await run();
      },
    },
  },
]);
