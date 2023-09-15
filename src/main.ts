export { z } from "zod";
import micromatch from "micromatch";
import { genMdxJson } from "./gen-mdx-json";
import { transDocumentsToMap } from "./trans-documents-to-map";
import { Config } from "./types";
import { Plugin } from "vite";
import { loadConfig } from "./load";
import { generate } from "./generate";

export function vitePluginContent(_config?: Config): Plugin {
  let config: Config;
  let inputDirPath: string;
  let outputDirPath: string;
  let documentsMap: ReturnType<typeof transDocumentsToMap>;

  return {
    name: "vite-plugin-content",
    enforce: "pre",
    async config() {
      ({ config, inputDirPath, outputDirPath } = await loadConfig());
      const { documents } = config;
      documentsMap = transDocumentsToMap({ documents, inputDirPath });

      return { server: { watch: { disableGlobbing: false } } };
    },
    async buildStart() {
      await generate({
        config,
        inputDirPath,
        outputDirPath,
        documentsMap,
      });
    },
    async configureServer(server) {
      const paths = Object.keys(documentsMap.byPath);

      server.watcher.add(paths);
      server.watcher.on("change", (path) => {
        if (micromatch.isMatch(path, paths)) {
          genMdxJson({
            file: path,
            outputDirPath,
            inputDirPath,
            fieldsSchema: documentsMap.byPath[path].fields,
            remarkPlugins: config.remarkPlugins,
            rehypePlugins: config.rehypePlugins,
          });
        }
      });
    },
  };
}
