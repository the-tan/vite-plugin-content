export { z } from "zod";
import { genMdxJson } from "../gen-mdx-json";
import { genEntryJS, genSourceJS } from "../files";
import { validateConfig } from "../validate-config";
import { enhanceDocuments } from "../enhance-documents";
import { Config } from "../types";

export const generate = async (_config: Config) => {
  const { config, inputDirPath, outputDirPath } = validateConfig(_config);
  const { documents } = config;
  const enhancedDocuments = enhanceDocuments({ documents, inputDirPath });

  if (Object.keys(enhancedDocuments.byPath).length) {
    // generate all .{mdx|md}.json
    await Promise.all(
      Object.entries(enhancedDocuments.byPath).map(([path, document]) =>
        genMdxJson({
          file: path,
          outputDirPath,
          inputDirPath,
          fieldsSchema: document.fields,
          remarkPlugins: config.remarkPlugins,
          rehypePlugins: config.rehypePlugins,
        })
      )
    );
    // generate all needed js
    await Promise.all([
      ...documents.map((document) => genSourceJS({ outputDirPath, document })),
      genEntryJS({ outputDirPath, documents }),
    ]);
  }
};
