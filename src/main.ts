export { z } from "zod";
import * as micromatch from "micromatch";
import { genMdxJson } from "./gen-mdx-json";
import { genEntryJS, genSourceJS } from "./files";
import { validateConfig } from "./validate-config";
import { enhanceDocuments } from "./enhance-documents";
import { Config } from "./types";
import { Plugin } from "vite";

export function vitePluginContent(config: Config): Plugin {
  const { options, inputDirPath, outputDirPath } = validateConfig(config);
  const { documents } = options;
  const enhancedDocuments = enhanceDocuments({ documents, inputDirPath });

  return {
    name: "vite-plugin-content",
    enforce: "pre",
    config: () => ({ server: { watch: { disableGlobbing: false } } }),
    async buildStart() {
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
          ...documents.map((document) =>
            genSourceJS({ outputDirPath, document })
          ),
          genEntryJS({ outputDirPath, documents }),
        ]);
      }
    },
    async configureServer(server) {
      const paths = Object.keys(enhancedDocuments.byPath);

      server.watcher.add(paths);
      server.watcher.on("change", (path) => {
        if (micromatch.isMatch(path, paths)) {
          genMdxJson({
            file: path,
            outputDirPath,
            inputDirPath,
            fieldsSchema: enhancedDocuments.byPath[path].fields,
            remarkPlugins: options.remarkPlugins,
            rehypePlugins: options.rehypePlugins,
          });
        }
      });
    },
  };
}
