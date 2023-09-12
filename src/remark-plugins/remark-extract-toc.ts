// from https://github.com/timlrx/pliny/blob/main/packages/pliny/src/mdx-plugins/remark-code-title.ts

import { visit } from "unist-util-visit";
import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";

const slugger = new GithubSlugger();

/**
 * @param {Object} opts
 * @param {{value: string, url: string, depth: number}[]} opts.tocRef
 * @return {import("unified").Plugin}
 */
export default function RemarkExtractToc(opts) {
  return (tree) => {
    visit(tree, "heading", (node) => {
      const textContent = toString(node);
      opts.tocRef.push({
        value: textContent,
        url: "#" + slugger.slug(textContent),
        depth: node.depth,
      });
    });
    // file.data.toc = toc
  };
}

export { RemarkExtractToc };
