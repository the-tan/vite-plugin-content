Similar to [contentlayer](https://contentlayer.dev/) but not as comprehensive, flexible and **only for md, mdx files currently**, still in WIP, and significant changes or errors may occur at any time, so please use it cautiously.

# Setup

### 1. Install

`pnpm install vite-plugin-content`

### 2. Define Schema

Add a file content.config.js in the project's root directory.

```ts
import { Config, z } from "vite-plugin-content";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";

const config: Config = {
  contentDirPath: "./data", // The directory for storing md and mdx files.
  outputDirPath: "./.content", // default: .content
  documents: [
    {
      name: "Blog",
      // sub directory in contentDirPath for Blog
      folder: "blog/",
      // zod schema definition for frontmatter
      fields: z.object({
        title: z.string(),
        date: z.coerce.date(),
        tags: z.array(z.string()).default([]),
        lastmod: z.coerce.date().default(new Date()),
        draft: z.boolean().default(false),
        summary: z.string().optional(),
      }),
    },
    {
      name: "Author",
      folder: "authors/",
      fields: z.object({
        tags: z.array(z.string()).default([]),
        lastmod: z.coerce.date().default(new Date()),
        draft: z.boolean().default(false),
        summary: z.string().optional(),
      }),
    },
  ],
  remarkPlugins: [remarkGfm, remarkMath],
  rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings, rehypeKatex],
};

export default config;
```

### 3. Update TypeScript Configuration

The modified parts need to correspond to the `outputDirPath` in your content.config.js.

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    //  ^^^^^^^^^^^
    "paths": {
      "#content/generated/*": ["./.content/generated/*"]
      // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    }
  },

  "include": [
    ".content/generated"
    // ^^^^^^^^^^^^^^^^^^^^^^
  ]
}
```

### 4. Update `vite.config.ts`

```ts
import { defineConfig } from "vite";
import vpc from "vite-plugin-content";

export default defineConfig({
  resolve: {
    alias: {
      "#content/generated": path.resolve(__dirname, "./.content/generated"),
    },
  },
  plugins: [vpc()],
});
```

### 5. Update build script in `package.json`

If the corresponding files have not been generated in advance by `vite-plugin-content`, errors may occur when building if there are code references to related content. Therefore, it is recommended to first execute the vite-plugin-content build command."

```json
// package.json
{
  "scripts": {
    "build": "vite-plugin-content build && your-build-command"
  }
}
```

### 6. Ignore Build Output

The modified parts need to correspond to the `outputDirPath` in your content.config.js.

```
# .gitignore

.content
```

### 7. Add Code

Show all blog titles

```tsx
import { allBlog } from "#content/generated/index.mjs";

function App() {
  return (
    <ul>
      {allBlog.map((blog) => (
        <li key={blog.data.slug}>{blog.frontmatter.title}</li>
      ))}
    </ul>
  );
}
```

Show blog page

```tsx
import { Blog } from "#content/generated/index.mjs";
import { getMDXComponent } from "mdx-bundler/client";
import { useMemo } from "react";

function Blog({ blog }: { blog: Blog }) {
  const { frontmatter, code } = blog;
  const Component = useMemo(() => getMDXComponent(code), [code]);

  return (
    <>
      <h1>{frontmatter.title}</h1>
      <p>{frontmatter.date}</p>
      <article>
        <Component />
      </article>
    </>
  );
}

export default Blog;
```
