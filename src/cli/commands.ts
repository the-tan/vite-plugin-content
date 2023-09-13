import { Command } from "clipanion";
import path from "path";
import { glob } from "glob";
import { generate } from "./generate";
import { readConfig } from "../read-config";

class BuildCommand extends Command {
  static paths = [[`build`]];

  // name = Option.String();

  async execute() {
    const config = await readConfig();
    await generate(config);
    this.context.stdout.write(`vite-plugin-content build done.`);

    // this.context.stdout.write(`Adding ${this.name}!\n`);
  }
}

export { BuildCommand };
