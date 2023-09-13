import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/**/*"],
  outDir: "dist",
  format: ["cjs", "esm"],
  clean: true,
  splitting: true,
  treeshake: true,
  dts: true,
  silent: true,
  tsconfig: "./configs/tsconfig.build.json",
});
