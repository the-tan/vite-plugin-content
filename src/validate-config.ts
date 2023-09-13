import path from "path";
import { z } from "zod";
import { Config } from "./types";

export const validateConfig = (config?: Config) => {
  if (!config) {
    throw new Error("Can not find config for vite-plugin-content");
  }
  const DocumentSchema = z.object({
    name: z.string(),
    folder: z.string(),
  });
  const ConfigSchema = z.object({
    contentDirPath: z.string(),
    outputDirPath: z.string().default("./.content"),
    documents: z.array(DocumentSchema),
    remarkPlugins: z.array(z.any()).optional(),
    rehypePlugins: z.array(z.any()).optional(),
  });
  try {
    ConfigSchema.parse(config);
  } catch (err) {
    throw new Error("VitePluginContent parse config failed");
  }

  const inputDirPath = path.resolve(process.cwd(), config.contentDirPath);
  const outputDirPath = path.resolve(
    process.cwd(),
    config.outputDirPath || ".content"
  );

  if (!isDiffPath(inputDirPath, outputDirPath)) {
    throw new Error("contentDirPath and outputDirPath should be different");
  }

  return {
    config,
    inputDirPath,
    outputDirPath,
  };
};

function isDiffPath(inputDirPath: string, outputDirPath: string) {
  return (
    path.resolve(process.cwd(), inputDirPath) !==
    path.resolve(process.cwd(), outputDirPath)
  );
}
