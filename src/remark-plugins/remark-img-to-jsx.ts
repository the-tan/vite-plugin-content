// from https://github.com/timlrx/pliny/blob/main/packages/pliny/src/mdx-plugins/remark-code-title.ts

import { visit } from "unist-util-visit";
import sizeOf from "image-size";
import fs from "fs";
/**
 * Converts markdown image nodes to next/image jsx.
 *
 */
export default function remarkImgToJsx() {
  return (tree) => {
    visit(
      tree,
      // only visit p tags that contain an img element
      (node) =>
        node.type === "paragraph" &&
        // @ts-ignore
        node.children.some((n) => n.type === "image"),
      (node) => {
        const imageNode = node.children.find((n) => n.type === "image");

        // only local files
        if (fs.existsSync(`${process.cwd()}/public${imageNode.url}`)) {
          const dimensions = sizeOf(`${process.cwd()}/public${imageNode.url}`);

          // Convert original node to next/image
          (imageNode.type = "mdxJsxFlowElement"),
            (imageNode.name = "Image"),
            (imageNode.attributes = [
              { type: "mdxJsxAttribute", name: "alt", value: imageNode.alt },
              { type: "mdxJsxAttribute", name: "src", value: imageNode.url },
              {
                type: "mdxJsxAttribute",
                name: "width",
                value: dimensions.width,
              },
              {
                type: "mdxJsxAttribute",
                name: "height",
                value: dimensions.height,
              },
            ]);

          // Change node type from p to div to avoid nesting error
          node.type = "div";
          node.children = [imageNode];
        }
      }
    );
  };
}
export { remarkImgToJsx };
