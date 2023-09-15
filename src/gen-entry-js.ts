import fs from "fs-extra";
import path from "path";
import Mustache from "mustache";
import { getExportAllName, getSourceJSName } from "./gen-source-js";
import { DocumentConfig } from "./types";

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
    path.resolve(outputDirPath, "generated", "index.mjs"),
    Mustache.render(
      `{{{allImportString}}}

export { {{{allImportNames}}} };
      `,
      variables
    )
  );
};
