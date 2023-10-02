export { z } from "zod";
import micromatch from "micromatch";
import { genMdxJson } from "./gen-mdx-json";
import { transDocumentsToMap } from "./trans-documents-to-map";
import { Config, InternalConfig } from "./types";
import { Plugin } from "vite";
import { load } from "./load";
import { generate } from "./generate";

export function vitePluginContent(_config?: Config): Plugin {
  let internalConfig: InternalConfig;
  let contentDirPath: string;
  let outputDirPath: string;
  let documentsMap: ReturnType<typeof transDocumentsToMap>;

  return {
    name: "vite-plugin-content",
    enforce: "pre",
    async config() {
      const loadMachineContext = await load();
      internalConfig = loadMachineContext.config;
      const { documents } = internalConfig;
      documentsMap = transDocumentsToMap({ documents, contentDirPath });

      return { server: { watch: { disableGlobbing: false } } };
    },
    async buildStart() {
      await generate({
        config: internalConfig,
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
            contentDirPath,
            document: documentsMap.byName[documentsMap.byPath[path].name],
            remarkPlugins: internalConfig.remarkPlugins,
            rehypePlugins: internalConfig.rehypePlugins,
          });
        }
      });
    },
  };
}

export function definedConfig(config: Config) {
  return config;
}
