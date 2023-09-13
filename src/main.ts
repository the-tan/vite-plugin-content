export { z } from "zod";
import micromatch from "micromatch";
import { genMdxJson } from "./gen-mdx-json";
import { genEntryJS, genSourceJS } from "./files";
import { validateConfig } from "./validate-config";
import { enhanceDocuments } from "./enhance-documents";
import { Config } from "./types";
import { Plugin } from "vite";
import { readConfig } from "./read-config";

export function vitePluginContent(_config?: Config): Plugin {
  let config: Config;
  let inputDirPath: string;
  let outputDirPath: string;
  let enhancedDocuments: ReturnType<typeof enhanceDocuments>;

  return {
    name: "vite-plugin-content",
    enforce: "pre",
    async config() {
      const temp = validateConfig(_config ?? (await readConfig()));
      config = temp.config;
      inputDirPath = temp.inputDirPath;
      outputDirPath = temp.outputDirPath;
      const { documents } = config;
      enhancedDocuments = enhanceDocuments({ documents, inputDirPath });

      return { server: { watch: { disableGlobbing: false } } };
    },
    async buildStart() {
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
          ...config.documents.map((document) =>
            genSourceJS({ outputDirPath, document })
          ),
          genEntryJS({ outputDirPath, documents: config.documents }),
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
            remarkPlugins: config.remarkPlugins,
            rehypePlugins: config.rehypePlugins,
          });
        }
      });
    },
  };
}
