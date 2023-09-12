export { z } from "zod";
import { genMdxJson } from "../gen-mdx-json";
import { genEntryJS, genSourceJS } from "../files";
import { validateConfig } from "../validate-config";
import { enhanceDocuments } from "../enhance-documents";
import { Config } from "../types";

export const generate = async (config: Config) => {
  const { options, inputDirPath, outputDirPath } = validateConfig(config);
  const { documents } = options;
  const enhancedDocuments = enhanceDocuments({ documents, inputDirPath });

  if (Object.keys(enhancedDocuments.byPath).length) {
    // generate all .{mdx|md}.json
    await Promise.all(
      Object.entries(enhancedDocuments.byPath).map(([path, config]) =>
        genMdxJson({
          file: path,
          outputDirPath,
          inputDirPath,
          fieldsSchema: config.fields,
          remarkPlugins: options.remarkPlugins,
          rehypePlugins: options.rehypePlugins,
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
