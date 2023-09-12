import path from "path";
import fs from "fs-extra";
import Mustache from "mustache";
import { globSync } from "glob";
import camelCase from "camelcase";
import { DocumentConfig } from "./types";
export { z } from "zod";

const getImportName = ({
  document,
  name,
}: {
  document: DocumentConfig;
  name: string;
}) => `${document.name}_${name}`;
const getExportAllName = (document: DocumentConfig) => `all${document.name}`;
const getSourceJSName = (document: DocumentConfig) =>
  `${document.name.toLowerCase()}.js`;

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
      const fileName = camelCase(
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

export const genEntryJS = async ({
  outputDirPath,
  documents,
}: {
  documents: DocumentConfig[];
  outputDirPath: string;
}) => {
  const templates = documents.map((document) => {
    const importName = getExportAllName(document);
    return {
      importName,
      importString: `import { ${importName} } from "./${getSourceJSName(
        document
      )}"`,
    };
  });
  const variables = {
    allImportString: templates.map((t) => t.importString).join("\n"),
    allImportNames: templates.map((t) => t.importName).join(", "),
  };

  return fs.outputFile(
    path.resolve(outputDirPath, "generated", "index.js"),
    Mustache.render(
      `{{{allImportString}}}

export { {{{allImportNames}}} };
      `,
      variables
    )
  );
};

export const getPathsWith = ({
  folderPath,
  pattern,
}: {
  folderPath: string;
  pattern: string;
}) => {
  if (!folderPath) return [];
  return globSync(pattern, {
    cwd: path.resolve(folderPath),
    nodir: true,
    absolute: true,
  });
};
