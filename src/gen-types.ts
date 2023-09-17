import path from "path";
import { fileURLToPath } from "url";
import JoyCon from "joycon";
import fs from "fs-extra";
import { execSync } from "node:child_process";
import { deleteSync } from "del";
import { DocumentConfig } from "./types";
import { getExportAllName, getSourceName } from "./gen-source-js";
import { glob } from "glob";

export const genTypes = async ({
  outputDirPath,
  documents,
}: {
  documents: DocumentConfig[];
  outputDirPath: string;
}) => {
  const configJoycon = new JoyCon();
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const baseTsconfigPath = await configJoycon.resolve({
    files: [
      path.resolve(__dirname, "..", "tsconfig.types.json"),
      path.resolve(__dirname, "tsconfig.types.json"),
    ],
    cwd: process.cwd(),
  });

  if (!baseTsconfigPath) {
    throw new Error(
      `Can not find vite-plugin-content's tsconfig for generating types`
    );
  }

  const baseTsConfig = await fs.readJSON(baseTsconfigPath);
  const tsconfigPath = path.resolve(outputDirPath, "tsconfig.json");

  const generatedFolder = path.resolve(outputDirPath, "generated");
  const typesFolder = path.resolve(generatedFolder, "temp");

  await fs.outputJSON(tsconfigPath, {
    compilerOptions: {
      ...baseTsConfig.compilerOptions,
      declarationDir: typesFolder,
    },
    include: [
      path.resolve(generatedFolder, "*.mjs"),
      path.resolve(generatedFolder, "*.js"),
      path.resolve(generatedFolder, "*.cjs"),
    ],
  });

  try {
    execSync(`tsc -p ${tsconfigPath}`, { stdio: "inherit" });
    await modifyDTS({ documents, typesFolder });
    execSync(`cp -p ${path.resolve(typesFolder, "*")} ${generatedFolder}`, {
      stdio: "inherit",
    });
    deleteSync([typesFolder]);
  } catch (e) {
    console.log(e);
  }
};

const modifyDTS = async ({
  documents,
  typesFolder,
}: {
  documents: DocumentConfig[];
  typesFolder: string;
}) => {
  for (const document of documents) {
    const dtsFile = await glob([`${getSourceName(document)}.d.{mts,ts,cts}`], {
      cwd: typesFolder,
      absolute: true,
    }).then((res) => res[0]);
    if (dtsFile) {
      await fs.appendFile(
        dtsFile,
        `export type ${document.name} = (typeof ${getExportAllName(
          document
        )})[number]`
      );
    }
  }
};
