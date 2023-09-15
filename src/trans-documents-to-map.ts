import path from "node:path";
import { DocumentConfig } from "./types";
import { globSync } from "glob";

const getPathsWith = ({
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

export const transDocumentsToMap = ({
  documents,
  inputDirPath,
}: {
  documents: DocumentConfig[];
  inputDirPath: string;
}) => {
  const result = {
    byName: {},
    byPath: {},
  } as {
    byName: { [name: string]: DocumentConfig & { paths: string[] } };
    byPath: { [path: string]: DocumentConfig & { paths: string[] } };
  };

  for (const document of documents) {
    result.byName[document.name] = {
      ...document,
      paths: getPathsWith({
        pattern: "**/*.{mdx,md}",
        folderPath: path.resolve(inputDirPath, document.folder),
      }),
    };

    result.byName[document.name].paths.forEach((p) => {
      result.byPath[p] = result.byName[document.name];
    });
  }

  return result;
};
