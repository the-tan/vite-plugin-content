import { Command } from "clipanion";
import path from "path";
import { glob } from "glob";
import { generate } from "./generate";

class BuildCommand extends Command {
  static paths = [[`build`]];

  // name = Option.String();

  async execute() {
    const configPath = await glob(
      path.resolve(process.cwd(), "content.config.{js,mjs,cjs}")
    ).then((filePaths) => filePaths[0]);

    if (configPath) {
      const config = await import(configPath).then((module) => module.default);
      await generate(config);
      this.context.stdout.write(`vite-plugin-content build done.`);
    } else {
      this.context.stderr.write(
        `Can not find content.config.{js,mjs,cjs} file.`
      );
    }
    // this.context.stdout.write(`Adding ${this.name}!\n`);
  }
}

export { BuildCommand };
