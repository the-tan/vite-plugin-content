export { z } from "zod";
import fs from "fs-extra";
import path from "path";
import { genMdxJson } from "./gen-mdx-json";
import { genTypes } from "./gen-types";
import { genSourceJS } from "./gen-source-js";
import { genEntryJS } from "./gen-entry-js";
import { InternalConfig, DocumentConfig } from "./types";
import { readCachedCheckSum, writeCachedCheckSum } from "./utils";

type GenerateParams = {
  config: InternalConfig;
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
export const generate = async ({ config, documentsMap }: GenerateParams) => {
  const {
    contentDirPath,
    outputDirPath,
    documents,
    remarkPlugins,
    rehypePlugins,
  } = config;
  if (Object.keys(documentsMap.byPath).length) {
    // generate all .{mdx|md}.json
    const genResult = await Promise.all(
      Object.entries(documentsMap.byPath).map(([path, document]) =>
        genMdxJson({
          document,
          file: path,
          contentDirPath,
          outputDirPath,
          remarkPlugins,
          rehypePlugins,
        })
      )
    );

    // update cache
    const cachedCheckSum = await readCachedCheckSum(outputDirPath);
    genResult.map(async ({ path, sum, type }) => {
      if (!(path in cachedCheckSum) || cachedCheckSum[path].sum !== sum) {
        cachedCheckSum[path] = { sum, type };
      }
    });
    await writeCachedCheckSum(outputDirPath, cachedCheckSum);

    // generate all needed js
    await Promise.all([
      ...config.documents.map((document) =>
        genSourceJS({ outputDirPath, document })
      ),
      genEntryJS({ outputDirPath, documents }),
    ]);

    // generate .d.ts
    await genTypes({ outputDirPath, documents });
  }
};
