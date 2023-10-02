import path from "node:path";
import { DocumentConfig } from "./types";
import { getPathsWithSync } from "./utils";

export const transDocumentsToMap = ({
  documents,
  contentDirPath,
}: {
  documents: DocumentConfig[];
  contentDirPath: string;
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
      paths: getPathsWithSync({
        pattern: "**/*.{mdx,md}",
        folderPath: path.resolve(contentDirPath, document.folder),
      }),
    };

    result.byName[document.name].paths.forEach((p) => {
      result.byPath[p] = result.byName[document.name];
    });
  }

  return result;
};
