import path from "node:path";
import { bundleMDX } from "mdx-bundler";
import fse from "fs-extra";
import remarkExtractToc from "./remark-plugins/remark-extract-toc";
import { ZodIssue } from "zod";
import { Pluggable } from "unified";
import { BaseJsonDocument, DocumentConfig } from "./types";
import { checksum } from "./utils";

type GenMdxJsonOptions = {
  file: string;
  contentDirPath: string;
  outputDirPath: string;
  document: DocumentConfig;
  remarkPlugins?: Pluggable[];
  rehypePlugins?: Pluggable[];
};
export async function genMdxJson({
  file,
  contentDirPath,
  outputDirPath,
  document,
  remarkPlugins,
  rehypePlugins,
}: GenMdxJsonOptions) {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "production";
  }
  const sum = await checksum(file);
  const toc = [] as { value: string; url: string; depth: number }[];
  const result = await bundleMDX({
    file,
    mdxOptions(options) {
      options.remarkPlugins = [
        // @ts-ignore
        ...(options.remarkPlugins ?? []),
        // @ts-ignore
        ...(remarkPlugins ?? []),
        // @ts-ignore
        [remarkExtractToc, { tocRef: toc }],
      ];
      // @ts-ignore
      options.rehypePlugins = [
        ...(options.rehypePlugins ?? []),
        ...(rehypePlugins ?? []),
      ];
      return options;
    },
    esbuildOptions: (opts) => {
      opts.target = "es2020";
      return opts;
    },
  });

  //@ts-ignore
  const filePath = result.matter?.path ?? "unknown path";
  const parsedPath = path.parse(filePath);

  if (document.fields) {
    const parsed = document.fields.safeParse(result.frontmatter);
    if (!parsed.success) {
      const errorMessage = generateZodErrorMessage({
        issues: parsed.error.issues,
        path: filePath,
      });
      console.log("[Frontmatter Parse Error]");
      console.log(errorMessage);
    }
  }

  const mdxJson: BaseJsonDocument = {
    code: result.code,
    content: result.matter.content,
    frontmatter: result.frontmatter,
    path: filePath,
    data: {
      toc,
      slug: parsedPath.name.replace(/^.+?(\/)/, ""),
      sourceFileName: parsedPath.base,
      sourceFileDir: parsedPath.dir.replace(contentDirPath, ""),
      contentType: parsedPath.ext.replace(/^\./, ""),
    },
  };

  fse.outputJSON(
    `${outputDirPath}/cached/${mdxJson.data.sourceFileDir}/${mdxJson.data.sourceFileName}.json`,
    mdxJson
  );

  fse.outputJSON(
    `${outputDirPath}/generated/${mdxJson.data.sourceFileDir}/${mdxJson.data.sourceFileName}.json`,
    mdxJson
  );

  return {
    path: file,
    type: document.name,
    sum,
  };
}

type GenerateZodErrorMessage = {
  issues: ZodIssue[];
  path: string;
};
const generateZodErrorMessage = ({ issues, path }: GenerateZodErrorMessage) => {
  let errors = [`Path: ${path}\n`];
  let i = 1;
  for (const issue of issues) {
    const { path, message } = issue;
    errors.push(`#${i} => Path: {${path.join(".")}}, Message: ${message}.\n`);
    i++;
  }
  return errors.join(" | ");
};
