import path from "path";
import { fileURLToPath } from "url";
import { build } from "tsup";
export const genTypes = async ({
  outputDirPath,
}: {
  outputDirPath: string;
}) => {
  // const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const tsconfigPath = path.resolve(__dirname, "..", "tsconfig.types.json");
  // console.log(tsconfigPath);
  // console.log(path.resolve(outputDirPath, "generated", "*.js"));
  await build({
    skipNodeModulesBundle: true,
    entry: [path.resolve(outputDirPath, "generated", "*.mjs")],
    outDir: path.resolve(outputDirPath, "generated"),
    format: ["esm"],
    clean: true,
    dts: { only: true },
    tsconfig: tsconfigPath,
    silent: true,
  });
};
