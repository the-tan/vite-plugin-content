import path from "node:path";
import { glob } from "glob";

export const readConfig = async () => {
  const configPath = await glob(
    path.resolve(process.cwd(), "content.config.{js,mjs,cjs}")
  ).then((r) => r[0]);

  if (!configPath) {
    throw new Error(
      "Should pass config or `create content.config.{js,mjs,cjs}` file."
    );
  }

  const config = import(`${configPath}`).then((module) => module.default);
  return config;
};
