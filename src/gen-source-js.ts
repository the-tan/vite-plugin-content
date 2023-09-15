import path from "path";
import { DocumentConfig } from "./types";
import { globSync } from "glob";
import camelcase from "camelcase";
import fs from "fs-extra";
import Mustache from "mustache";

const getImportName = ({
  document,
  name,
}: {
  document: DocumentConfig;
  name: string;
}) => `${document.name}_${name}`;

export const getSourceJSName = (document: DocumentConfig) =>
  `${document.name.toLowerCase()}.mjs`;

export const getExportAllName = (document: DocumentConfig) =>
  `all${document.name}`;

export const genSourceJS = async ({
  outputDirPath,
  document,
}: {
  document: DocumentConfig;
  outputDirPath: string;
}) => {
  const generatedSourcePath = path.resolve(
    outputDirPath,
    "generated",
    document.folder
  );
  const jsonPaths = globSync("**/*.{mdx,md}.json", {
    cwd: generatedSourcePath,
    nodir: true,
    absolute: true,
  });

  const nameAndPath = jsonPaths
    .map((filePath) => filePath.replace(`${outputDirPath}/generated/`, ""))
    .map((relatevFilePath) => {
      const fileName = camelcase(
        `${relatevFilePath.replace(/.*\//, "").replace(/\.mdx?\.json$/, "")}`
      );
      const path = relatevFilePath;
      return { fileName, path };
    });
  const variables = {
    allSourceImports: nameAndPath
      .map(
        (v) =>
          `import ${getImportName({ document, name: v.fileName })} from "./${
            v.path
          }";`
      )
      .join("\n"),
    allSource: nameAndPath
      .map((v) => getImportName({ document, name: v.fileName }))
      .join(", "),
  };

  return fs.outputFile(
    path.resolve(outputDirPath, "generated", getSourceJSName(document)),
    Mustache.render(
      `{{{allSourceImports}}}

const ${getExportAllName(document)} = [{{{allSource}}}];
export { ${getExportAllName(document)} };
        `,
      variables
    )
  );
};
