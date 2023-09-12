import path from "node:path";
import { getPathsWith } from "./files";
import { DocumentConfig } from "./types";

export const enhanceDocuments = ({
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
