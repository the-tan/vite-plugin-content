import { Command } from "clipanion";
import { generate } from "../generate";
import { load } from "../load";
import { transDocumentsToMap } from "../trans-documents-to-map";

class BuildCommand extends Command {
  static paths = [[`build`]];

  // name = Option.String();

  async execute() {
    const { config } = await load();

    const documentsMap = transDocumentsToMap({
      documents: config.documents,
      contentDirPath: config.contentDirPath,
    });
    this.context.stdout.write(`vite-plugin-content build start...\n`);
    await generate({
      config,
      documentsMap,
    });
    this.context.stdout.write(`vite-plugin-content build done.\n`);
    this.context.stdout.write("\n");

    // this.context.stdout.write(`Adding ${this.name}!\n`);
  }
}

export { BuildCommand };
