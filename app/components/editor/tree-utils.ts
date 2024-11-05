import { produce } from "immer";
import { Node } from "./tree";

export const traverse = (
  tree: Node,
  map: Record<string, (node: Node) => void>
) => {
  return produce(tree, (draft) => {
    const queue = [draft];
    while (queue.length) {
      const node = queue.shift() as Node;
      if (node.tagName in map) {
        map[node.tagName](node);
      }
      queue.push(...node.children);
    }
  });
};

export const iterate = (
  tree: Node,
  fn: (node: Node, index: number) => false | undefined
) => {
  const queue = [{ node: tree, index: 0 }];
  while (queue.length) {
    const { node, index } = queue.shift() as {
      node: Node;
      index: number;
    };
    const shouldContinue = fn(node, index);
    if (shouldContinue === false) return;

    node.children.forEach((child, i) => {
      queue.push({ node: child, index: i });
    });
  }
};
