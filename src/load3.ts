import { bundleRequire } from "bundle-require";
import JoyCon from "joycon";

import { InternalConfig } from "./types";
import { z } from "zod";
import { checksum, getPathsWith, isZodSchema, readFile } from "./utils";
import path from "path";
import fs from "fs-extra";
import md5 from "md5";

// some schema
const DocumentSchema = z.object({
  name: z.string(),
  folder: z.string(),
  fields: z
    .any()
    .refine(isZodSchema, { message: "fields should be ZodSchema" }),
});

const ConfigSchema = z.object({
  source: z.string(),
  contentDirPath: z.string(),
  outputDirPath: z.string().default("./.content"),
  documents: z.array(DocumentSchema),
  remarkPlugins: z.array(z.any()).optional(),
  rehypePlugins: z.array(z.any()).optional(),
});

const CacheResultSchema = z.record(
  z.object({ sum: z.string(), type: z.string() })
);

const readUserConfig = async () => {
  const configJoycon = new JoyCon();
  const configPath = await configJoycon.resolve({
    files: [
      "content.config.ts",
      "content.config.js",
      "content.config.cjs",
      "content.config.mjs",
    ],
    cwd: process.cwd(),
  });

  if (!configPath) {
    throw new Error("Can not find config for vite-plugin-content.");
  }

  const { mod } = await bundleRequire({ filepath: configPath });
  const config = mod.default || mod;

  if (!config) {
    throw new Error("Config is empty.");
  }

  return { ...config, source: configPath };
};

const validateUserConfig = async (userConfig: {}) => {
  const parsed = ConfigSchema.safeParse(userConfig);
  if (!parsed.success) {
    throw new Error("VitePluginContent parse config failed");
  }

  const contentDirPath = path.resolve(
    process.cwd(),
    parsed.data.contentDirPath
  );
  const outputDirPath = path.resolve(
    process.cwd(),
    parsed.data.outputDirPath || ".content"
  );

  if (contentDirPath === outputDirPath) {
    throw new Error("contentDirPath and outputDirPath should be different");
  }

  return { ...parsed.data, contentDirPath, outputDirPath };
};

const getDocumentMap = async (config: InternalConfig) => {
  const { documents, contentDirPath } = config;
  const result: { [path: string]: { sum: string; type: string } } = {};
  await Promise.all(
    documents.map(async (document) => {
      const paths = await getPathsWith({
        pattern: "**/*.{mdx,md}",
        folderPath: path.resolve(contentDirPath, document.folder),
      });
      await Promise.all(
        paths.map((path) =>
          checksum(path).then((sum) => {
            result[path] = {
              sum,
              type: document.name,
            };
          })
        )
      );
    })
  );
  return result;
};

const hasNewConfig = async (config: InternalConfig) => {
  const { source, outputDirPath } = config;
  const cacheConfigPath = path.resolve(
    outputDirPath,
    "cache",
    path.parse(source).base
  );
  const isCahceExist = await fs.pathExists(cacheConfigPath);

  if (!isCahceExist) {
    return true;
  }
  const [sourceMD5, cacheMD5] = await Promise.all([
    readFile(source).then(md5),
    readFile(cacheConfigPath).then(md5),
  ]);

  return sourceMD5 !== cacheMD5;
};

const createNewCacheConfig = async (config: InternalConfig) => {
  const { source, outputDirPath } = config;
  const cacheDirPath = path.resolve(outputDirPath, "cache");
  const cacheConfig = path.resolve(cacheDirPath, path.parse(source).base);
  await fs.ensureDir(cacheDirPath);
  return fs.copyFile(source, cacheConfig);
};

const readCacheResult = async (config: InternalConfig) => {
  const { outputDirPath } = config;
  const cacheResultPath = path.resolve(outputDirPath, "cache", "result.json");
  const isCahceExist = await fs.pathExists(cacheResultPath);

  if (!isCahceExist) {
    await fs.outputJSON(cacheResultPath, {});
    return {};
  }

  const _cacheResult = await fs.readJSON(cacheResultPath);
  const parsed = CacheResultSchema.safeParse(_cacheResult);

  if (!parsed.success) {
    console.log(
      "cacheResult do not have valid schema, creating another cacheResult.json..."
    );
    await fs.outputJSON(cacheResultPath, {});
    return {};
  }

  return parsed.data;
};

const updateCacheResultForRemoved = async (params: {
  config: InternalConfig;
  documentMap: z.output<typeof CacheResultSchema>;
  cache: z.output<typeof CacheResultSchema>;
}) => {
  const { config, cache, documentMap } = params;
  // in cache but not in current documents
  const removedDocumenPaths = Object.keys(config).filter(
    (filePath) => !(filePath in documentMap)
  );

  if (removedDocumenPaths.length === 0) return;

  const _cache = { ...cache };
  const { outputDirPath } = config;
  const cacheResultPath = path.resolve(outputDirPath, "cache", "result.json");
  for (const filePath of removedDocumenPaths) {
    delete _cache[filePath];
  }
  return fs.outputJSON(cacheResultPath, _cache);
};

const main = async () => {
  const userConfig = await readUserConfig().then(validateUserConfig);

  if (await hasNewConfig(userConfig)) {
    await createNewCacheConfig(userConfig);
  }

  const [documentMap, cacheResult] = await Promise.all([
    getDocumentMap(userConfig),
    readCacheResult(userConfig),
  ]);

  await updateCacheResultForRemoved({
    config: userConfig,
    cache: cacheResult,
    documentMap,
  });

  // in cache but updated, or not in cache.
  // mdx.json files of these documents should be regenerated.
  const newDocumentMap = Object.entries(documentMap)
    .filter(([filePath, { sum }]) => {
      return cacheResult[filePath].sum !== sum;
    })
    .reduce((acc, [filePath, value]) => {
      acc[filePath] = value;
      return acc;
    }, {} as typeof documentMap);
};
