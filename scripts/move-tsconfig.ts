import fs from "fs-extra";

export const run = async () => {
  await fs.copyFile(
    "./configs/tsconfig.types.json",
    "./dist/tsconfig.types.json"
  );
};
