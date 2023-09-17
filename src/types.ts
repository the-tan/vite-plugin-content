import type * as unified from "unified";
import type { z } from "zod";

export type DocumentConfig = {
  name: string;
  /**
   * The folder where your document is located related to contentDirPath.
   * ex: "blog/", "post/"
   */
  folder: string;
  /**
   * The zod schema definition for md/mdx frontmatters
   * @default undefined
   */
  fields?: z.Schema;
};

export type Config = {
  /**
   * The folder where your md/mdx is located.
   * ex: "./data"
   */
  contentDirPath: string;
  /**
   * The folder where the output file is stored.
   * ex: "./.mycontent"
   * @default "./.content/"
   */
  outputDirPath: string;
  documents: DocumentConfig[];
  remarkPlugins?: unified.Pluggable[];
  rehypePlugins?: unified.Pluggable[];
};

export type BaseJsonDocument = {
  code: string;
  content: string;
  frontmatter: Record<string, any>;
  path: string;
  data: {
    toc: { value: string; url: string; depth: number }[];
    slug: string;
    sourceFileName: string;
    sourceFileDir: string;
    contentType: string;
  };
};
