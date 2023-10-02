import path from "node:path";
import { Schema, z } from "zod";
import JoyCon from "joycon";
import { bundleRequire } from "bundle-require";
import fs from "fs-extra";
import {
  createMachine,
  createActor,
  fromPromise,
  waitFor,
  assign,
} from "xstate";
import { InternalConfig, LoadMachineContext } from "./types";
import { checksum, compareChecksum, getPathsWith } from "./utils";

const loadConfig = fromPromise(async () => {
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
  const internalConfig = await validate(mod.default || mod);
  internalConfig["configPath"] = configPath;

  return internalConfig;
});

const machine = createMachine(
  {
    types: {
      context: {} as LoadMachineContext,
    },
    id: "Load",
    initial: "loadingConfig",
    context: {
      config: {} as LoadMachineContext["config"],
      isNewConfig: false,
      allDocuments: [],
      cacheSumMap: {},
    },
    states: {
      loadingConfig: {
        invoke: {
          src: "loadConfig",
          onDone: {
            actions: assign(({ event }) => {
              return { config: event.output };
            }),
            target: "checkCacheConfig",
          },
          onError: {
            target: "error",
          },
        },
      },
      checkCacheConfig: {
        always: [
          {
            guard: "isNewConfig",
            actions: ["updateCacheConfig", assign({ isNewConfig: true })],
            target: "getCachedSumMap",
          },
          {
            target: "getCachedSumMap",
          },
        ],
      },
      getCachedSumMap: {
        always: {
          actions: ["getCacheSumMap"],
          target: "getAllDocumentPaths",
        },
      },
      getAllDocumentPaths: {
        invoke: {
          src: "getAllDocuments",
          input: ({ context }) => context.config,
          onDone: {
            actions: assign({ allDocuments: ({ event }) => event.output }),
            target: "groupDocuments",
          },
          onError: {
            target: "error",
          },
        },
      },
      groupDocuments: {
        always: {
          actions: "groupDocuments",
          target: "finish",
        },
      },
      loadingCache: {
        // invoke: {
        //   src: "loadCache",
        //   onDone: {
        //     actions: () => {},
        //   },
        //   onError: {
        //     target: "error",
        //   },
        // },
      },
      compareCache: {},
      finish: {
        type: "final",
      },
      error: {
        type: "final",
        entry: ({ event }) => console.log("Error: ", event),
      },
    },
  },
  {
    actors: {
      loadConfig,
      getAllDocuments: fromPromise(
        async ({ input }: { input: InternalConfig }) => {
          const { documents, contentDirPath } = input;
          const result: LoadMachineContext["allDocuments"] = await Promise.all(
            documents.map(async (document) => {
              const paths = await getPathsWith({
                pattern: "**/*.{mdx,md}",
                folderPath: path.resolve(contentDirPath, document.folder),
              });
              return Promise.all(
                paths.map((path) =>
                  checksum(path).then((sum) => ({
                    path,
                    sum,
                    type: document.name,
                  }))
                )
              );
            })
          ).then((arr) => arr.flat());
          return result;
        }
      ),
    },
    guards: {
      isNewConfig: ({ context: { config } }) => {
        const cacheConfig = path.resolve(
          config.outputDirPath,
          "cache",
          path.parse(config.configPath).base
        );

        if (!fs.pathExistsSync(cacheConfig)) {
          return true;
        }

        return compareChecksum(cacheConfig, config.configPath) === false;
      },
    },
    actions: {
      updateCacheConfig: ({ context: { config } }) => {
        const cacheDirPath = path.resolve(config.outputDirPath, "cache");
        const cacheConfig = path.resolve(
          cacheDirPath,
          path.parse(config.configPath).base
        );
        fs.ensureDirSync(cacheDirPath);
        fs.copyFileSync(config.configPath, cacheConfig);
      },
      getCacheSumMap: assign({
        cacheSumMap: ({ context: { config } }) => {
          const cacheDirPath = path.resolve(config.outputDirPath, "cache");
          if (fs.existsSync(path.resolve(cacheDirPath, "checksumMap.json"))) {
            return fs.readJSONSync(
              path.resolve(cacheDirPath, "checksumMap.json")
            );
          }

          fs.outputJSONSync(path.resolve(cacheDirPath, "checksumMap.json"), {});
          return {};
        },
      }),
      groupDocuments: ({ context }) => {
        const { allDocuments, cacheSumMap, isNewConfig, config } = context;
        if (Object.keys(cacheSumMap).length === 0) {
        } else {
          // updated
          const updateFiles = allDocuments.filter(
            (d) => d.path in cacheSumMap && d.sum !== cacheSumMap[d.path].sum
          );
          // deleted
          const currentFilePath = allDocuments.reduce((acc, curr) => {
            acc[curr.path] = 1;
            return acc;
          }, {});
          const deletedFiles = Object.keys(cacheSumMap).filter(
            (p) => !(p in currentFilePath)
          );
        }
        console.log(cacheSumMap);
        console.log(allDocuments);
      },
    },
  }
);
export const load = async () => {
  const actor = createActor(machine);
  actor.start();
  const snapshot = await waitFor(actor, (snapshot) => snapshot.done);
  return snapshot.context;
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

  const contentDirPath = path.resolve(process.cwd(), parsed.contentDirPath);
  const outputDirPath = path.resolve(
    process.cwd(),
    parsed.outputDirPath || ".content"
  );

  if (
    path.resolve(process.cwd(), contentDirPath) ===
    path.resolve(process.cwd(), outputDirPath)
  ) {
    throw new Error("contentDirPath and outputDirPath should be different");
  }

  return {
    ...parsed,
    contentDirPath,
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
