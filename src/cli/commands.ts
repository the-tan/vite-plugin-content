import { Command } from "clipanion";
import { generate } from "../generate";
import { loadConfig } from "../load";
import { transDocumentsToMap } from "../trans-documents-to-map";

class BuildCommand extends Command {
  static paths = [[`build`]];

  // name = Option.String();

  async execute() {
    const { config, inputDirPath, outputDirPath } = await loadConfig();
    const { documents } = config;
    const documentsMap = transDocumentsToMap({ documents, inputDirPath });
    this.context.stdout.write(`vite-plugin-content build start...\n`);
    await generate({
      config,
      inputDirPath,
      outputDirPath,
      documentsMap,
    });
    this.context.stdout.write(`vite-plugin-content build done.\n`);
    this.context.stdout.write("\n");

    // this.context.stdout.write(`Adding ${this.name}!\n`);
  }
}

export { BuildCommand };
