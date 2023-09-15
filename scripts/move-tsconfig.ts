import fs from "fs-extra";

await fs.copyFile(
  "./configs/tsconfig.types.json",
  "./dist/tsconfig.types.json"
);
