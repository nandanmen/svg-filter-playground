import { syntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";

export type Node = {
  tagName: string;
  properties: Record<string, string>;
  children: Node[];
  partial?: true;
  positions?: {
    from: number;
    to: number;
    properties: Record<string, { from: number; to: number }>;
  };
};

export const DEFAULT_TREE: Node = {
  tagName: "svg",
  properties: {
    viewBox: "0 0 100 100",
  },
  children: [],
};

export function parseTree(s: EditorState | null) {
  if (!s) return DEFAULT_TREE;
  const state = s as EditorState;

  const tree = syntaxTree(state);

  const cursor = tree.cursor();
  cursor.firstChild(); // root is document, so we want to go to the first child

  function parseAttribute() {
    cursor.firstChild();

    const key = state.doc.sliceString(cursor.from, cursor.to);

    cursor.nextSibling(); // Is
    const hasValue = cursor.nextSibling(); // AttributeValue
    if (!hasValue) {
      cursor.parent();
      return { key, value: "" };
    }

    const value = state.doc.sliceString(cursor.from, cursor.to);
    cursor.parent();
    return {
      key,
      value: value.slice(1, -1),
    };
  }

  function parseTag() {
    cursor.firstChild();

    cursor.nextSibling();
    if (cursor.name !== "TagName") {
      cursor.parent();
      return null;
    }
    const tagName = state.doc.sliceString(cursor.from, cursor.to);

    cursor.nextSibling();

    const properties = {} as Record<string, string>;
    const positions = {} as Record<string, { from: number; to: number }>;

    // @ts-expect-error TS doesn't realize cursor is mutable
    while (cursor.name === "Attribute") {
      const { from, to } = cursor;
      const attribute = parseAttribute();
      properties[attribute.key] = attribute.value;
      positions[attribute.key] = { from, to };
      cursor.nextSibling();
    }

    cursor.parent();
    return { tagName, properties, positions };
  }

  function parseElement(): Node | null {
    const { from, to } = cursor;
    cursor.firstChild(); // OpenTag or SelfClosingTag

    const tag = parseTag();
    if (!tag) return null;

    const { positions, ...tagProps } = tag;
    const children = [];
    while (cursor.nextSibling()) {
      if (cursor.name === "Element") {
        const child = parseElement();
        if (child) {
          children.push(child);
        }
      }
    }
    cursor.parent();

    return {
      ...tagProps,
      children,
      positions: {
        from,
        to,
        properties: positions,
      },
    };
  }

  const element = parseElement();
  if (!element) return DEFAULT_TREE;
  return element;
}
