export { z } from "zod";
import { genMdxJson } from "./gen-mdx-json";
import { genTypes } from "./gen-types";
import { genSourceJS } from "./gen-source-js";
import { genEntryJS } from "./gen-entry-js";
import { Config, DocumentConfig } from "./types";

type GenerateParams = {
  config: Config;
  inputDirPath: string;
  outputDirPath: string;
  documentsMap: {
    byName: {
      [name: string]: DocumentConfig & {
        paths: string[];
      };
    };
    byPath: {
      [path: string]: DocumentConfig & {
        paths: string[];
      };
    };
  };
};
export const generate = async ({
  config,
  inputDirPath,
  outputDirPath,
  documentsMap,
}: GenerateParams) => {
  if (Object.keys(documentsMap.byPath).length) {
    // generate all .{mdx|md}.json
    await Promise.all(
      Object.entries(documentsMap.byPath).map(([path, document]) =>
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
      ...config.documents.map((document) =>
        genSourceJS({ outputDirPath, document })
      ),
      genEntryJS({ outputDirPath, documents: config.documents }),
    ]);
    // generate .d.ts
    await genTypes({ outputDirPath, documents: config.documents });
  }
};
