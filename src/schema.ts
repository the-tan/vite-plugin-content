import { z } from "zod";

export const BaseJsonDocumentSchema = z.object({
  code: z.string(),
  content: z.string(),
  frontmatter: z.record(z.any()),
  path: z.string(),
  data: z.object({
    toc: z.array(
      z.object({
        value: z.string(),
        url: z.string(),
        depth: z.number(),
      })
    ),
    slug: z.string(),
    sourceFileName: z.string(),
    sourceFileDir: z.string(),
    contentType: z.string(),
  }),
});
