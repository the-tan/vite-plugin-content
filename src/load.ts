import path from "node:path";
import { Schema, z } from "zod";
import JoyCon from "joycon";
import { bundleRequire } from "bundle-require";

export const loadConfig = async () => {
  const configJoycon = new JoyCon();
  const configPath = await configJoycon.resolve({
    files: [
      "content.config.ts",
      "content.config.js",
      "content.config.cjs",
      "content.config.mjs",
    ],
    cwd: process.cwd(),
    // stopDir: path.parse(cwd).root,
  });

  if (!configPath) {
    throw new Error("Can not find config for vite-plugin-content.");
  }
  const { mod } = await bundleRequire({ filepath: configPath });

  return validate(mod.default || mod);
};

const validate = async (config?: any) => {
  if (!config) {
    throw new Error("Can not find config for vite-plugin-content");
  }
  const DocumentSchema = z.object({
    name: z.string(),
    folder: z.string(),
    fields: z
      .any()
      .refine(isZodSchema, { message: "fields should be ZodSchema" }),
  });

  const ConfigSchema = z.object({
    contentDirPath: z.string(),
    outputDirPath: z.string().default("./.content"),
    documents: z.array(DocumentSchema),
    remarkPlugins: z.array(z.any()).optional(),
    rehypePlugins: z.array(z.any()).optional(),
  });

  let parsed: z.output<typeof ConfigSchema>;
  try {
    parsed = ConfigSchema.parse(config);
  } catch (err) {
    throw new Error("VitePluginContent parse config failed");
  }

  const inputDirPath = path.resolve(process.cwd(), parsed.contentDirPath);
  const outputDirPath = path.resolve(
    process.cwd(),
    parsed.outputDirPath || ".content"
  );

  if (
    path.resolve(process.cwd(), inputDirPath) ===
    path.resolve(process.cwd(), outputDirPath)
  ) {
    throw new Error("contentDirPath and outputDirPath should be different");
  }

  return {
    config: parsed,
    inputDirPath,
    outputDirPath,
  };
};

function isZodSchema(obj: {}): obj is Schema {
  const fileds = ["_def", "parse", "safeParse", "parseAsync", "safeParseAsync"];
  for (const field of fileds) {
    if (!(field in obj)) {
      return false;
    }
  }
  return true;
}
