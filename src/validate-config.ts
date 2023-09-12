import path from "path";
import { z } from "zod";
import { Config } from "./types";

export const validateConfig = (options: Config) => {
  const DocumentSchema = z.object({
    name: z.string(),
    folder: z.string(),
  });
  const OptionsSchema = z.object({
    contentDirPath: z.string(),
    outputDirPath: z.string().default("./.content"),
    documents: z.array(DocumentSchema),
    remarkPlugins: z.array(z.any()).optional(),
    rehypePlugins: z.array(z.any()).optional(),
  });
  try {
    OptionsSchema.parse(options);
  } catch (err) {
    throw new Error("VitePluginContent parse options failed");
  }

  const inputDirPath = path.resolve(process.cwd(), options.contentDirPath);
  const outputDirPath = path.resolve(
    process.cwd(),
    options.outputDirPath || ".content"
  );

  if (!isDiffPath(inputDirPath, outputDirPath)) {
    throw new Error("contentDirPath and outputDirPath should be different");
  }

  return {
    options,
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
