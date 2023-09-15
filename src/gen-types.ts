import path from "path";
import { fileURLToPath } from "url";
import { build } from "tsup";
import JoyCon from "joycon";

export const genTypes = async ({
  outputDirPath,
}: {
  outputDirPath: string;
}) => {
  const configJoycon = new JoyCon();
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const tsconfigPath = await configJoycon.resolve({
    files: [
      path.resolve(__dirname, "..", "tsconfig.types.json"),
      path.resolve(__dirname, "tsconfig.types.json"),
    ],
    cwd: process.cwd(),
    // stopDir: path.parse(cwd).root,
  });

  if (!tsconfigPath) {
    throw new Error(
      `Can not find vite-plugin-content's tsconfig for generating types`
    );
  }

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
