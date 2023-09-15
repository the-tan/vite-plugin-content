import { Command } from "clipanion";
import { generate } from "./generate";

class BuildCommand extends Command {
  static paths = [[`build`]];

  // name = Option.String();

  async execute() {
    await generate();
    this.context.stdout.write(`vite-plugin-content build done.`);

    // this.context.stdout.write(`Adding ${this.name}!\n`);
  }
}

export { BuildCommand };
