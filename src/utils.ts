import fs from "fs-extra";
import path from "node:path";
import md5 from "md5";
import { globSync, glob } from "glob";
import type { Schema } from "zod";

export const readFileSync = (filePath: string) => {
  const p = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  const isPathExists = fs.pathExistsSync(p);

  if (!isPathExists) {
    console.log(`${p} not found.`);
    throw new Error(`File: ${p} not found.`);
  }

  return fs.readFileSync(p, { encoding: "utf-8" });
};

export const checksumSync = (filePath: string) => {
  return md5(readFileSync(filePath));
};

export const compareChecksum = (aPath: string, bPath: string) => {
  return checksumSync(aPath) === checksumSync(bPath);
};

export const readFile = async (filePath: string) => {
  const p = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  const isPathExists = await fs.pathExists(p);

  if (!isPathExists) {
    console.log(`${p} not found.`);
    throw new Error(`File: ${p} not found.`);
  }

  return fs.readFile(p, { encoding: "utf-8" });
};

export const checksum = async (filePath: string) => {
  const f = await readFile(filePath);
  return md5(f);
};

export const getPathsWith = async ({
  folderPath,
  pattern,
}: {
  folderPath: string;
  pattern: string;
}) => {
  const isPathExists = await fs.pathExists(folderPath);
  const isDirectory = isPathExists
    ? await fs.stat(folderPath).then((stat) => stat.isDirectory())
    : false;

  if (!isPathExists || !isDirectory) {
    console.log(`${folderPath} may not exist or is not a directory`);
    return Promise.resolve([]);
  }

  return glob(pattern, {
    cwd: path.resolve(folderPath),
    nodir: true,
    absolute: true,
  });
};

export const getPathsWithSync = ({
  folderPath,
  pattern,
}: {
  folderPath: string;
  pattern: string;
}) => {
  if (!fs.statSync(folderPath).isDirectory()) return [];
  return globSync(pattern, {
    cwd: path.resolve(folderPath),
    nodir: true,
    absolute: true,
  });
};

export const readCachedCheckSum = async (
  outputDirPath: string
): Promise<{ [path: string]: { sum: string; type: string } }> => {
  const cacheDirPath = path.resolve(outputDirPath, "cache");
  if (fs.existsSync(path.resolve(cacheDirPath, "checksumMap.json"))) {
    return fs.readJSON(path.resolve(cacheDirPath, "checksumMap.json"));
  }

  await fs.outputJSON(path.resolve(cacheDirPath, "checksumMap.json"), {});
  return {} as { [path: string]: { sum: string; type: string } };
};

export const writeCachedCheckSum = async (
  outputDirPath: string,
  data: { [path: string]: { sum: string; type: string } }
) => {
  return fs.outputJSON(
    path.resolve(outputDirPath, "cache", "checksumMap.json"),
    data
  );
};

export function isZodSchema(obj: {}): obj is Schema {
  const fileds = ["_def", "parse", "safeParse", "parseAsync", "safeParseAsync"];
  for (const field of fileds) {
    if (!(field in obj)) {
      return false;
    }
  }
  return true;
}
