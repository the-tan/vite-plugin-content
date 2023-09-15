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
  const variables = {
    allExportString: documents
      .map((document) => `export * from "./${getSourceJSName(document)}";`)
      .join("\n"),
  };

  return fs.outputFile(
    path.resolve(outputDirPath, "generated", "index.mjs"),
    Mustache.render(`{{{allExportString}}}`, variables)
  );
};
