"use client";

import { EditorState } from "@codemirror/state";
import { Node, parseTree } from "./index";
import { iterate, traverse } from "./tree-utils";
import { match } from "ts-pattern";

const isPointProp = (type: "x" | "y", prop: string) => {
  return prop[0] === type || prop.endsWith(type);
};

export function EditorOutput({
  difficulty = "normal",
  editorState,
}: {
  difficulty?: "normal" | "hard";
  editorState: EditorState | null;
}) {
  if (!editorState) return null;

  // We want to immediately show feedback to the user even if the shapes don't
  // have the properties they need to be visible
  const tree = traverse(parseTree(editorState), {
    circle: (node) => {
      if (!keyExists(node.properties, ["r"])) {
        node.partial = true;
        node.properties.r = "25";
      }
    },
    rect: (node) => {
      if (!keyExists(node.properties, ["width"])) {
        node.partial = true;
        node.properties.width = "50";
      }
      if (!keyExists(node.properties, ["height"])) {
        node.partial = true;
        node.properties.height = "50";
      }
    },
  });

  const active = getActive(tree, editorState);
  return (
    <>
      <g
        dangerouslySetInnerHTML={{
          __html: editorState?.doc.toString() ?? "",
        }}
      />
      {difficulty === "normal" &&
        match(active)
          .with({ type: "point" }, ({ x, y, property }) => {
            return (
              <g className="text-cyan10">
                <path
                  className={isPointProp("y", property) ? "stroke-cyan5" : ""}
                  d={`M ${x} 0 v ${y}`}
                  fill="none"
                  stroke="currentColor"
                />
                <path
                  className={isPointProp("x", property) ? "stroke-cyan5" : ""}
                  d={`M 0 ${y} h ${x}`}
                  fill="none"
                  stroke="currentColor"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="2"
                  className="fill-gray1"
                  stroke="currentColor"
                />
              </g>
            );
          })
          .with({ type: "radius" }, ({ cx, cy, r }) => {
            return (
              <g className="text-cyan10">
                <path
                  d={`M ${cx} ${cy} h ${r}`}
                  fill="none"
                  stroke="currentColor"
                />
                <circle cx={cx + r} cy={cy} r="1.5" className="fill-current" />
                <circle
                  cx={cx}
                  cy={cy}
                  r="2"
                  className="fill-gray1"
                  stroke="currentColor"
                />
              </g>
            );
          })
          .with({ type: "size", property: "width" }, ({ node, width }) => {
            const x = +node.properties.x;
            const y = +node.properties.y;
            return (
              <g className="text-cyan10">
                <path
                  d={`M ${x} ${y} v -${y} h ${width} v ${y}`}
                  fill="none"
                  stroke="currentColor"
                />
                <circle cx={x} cy={y} r="1.5" fill="currentColor" />
                <circle cx={x + width} cy={y} r="1.5" fill="currentColor" />
              </g>
            );
          })
          .with({ type: "size", property: "height" }, ({ node, height }) => {
            const x = +node.properties.x;
            const y = +node.properties.y;
            return (
              <g className="text-cyan10">
                <path
                  d={`M ${x} ${y} h -${x} v ${height} h ${x}`}
                  fill="none"
                  stroke="currentColor"
                />
                <circle cx={x} cy={y} r="1.5" fill="currentColor" />
                <circle cx={x} cy={y + height} r="1.5" fill="currentColor" />
              </g>
            );
          })
          .otherwise(() => null)}
    </>
  );
}

function keyExists(obj: any, keys: string[]) {
  return keys.every((key) => obj.hasOwnProperty(key) && Boolean(obj[key]));
}

type ActiveNode =
  | {
      type: "point";
      property: string;
      node: Node;
      x: number;
      y: number;
    }
  | {
      type: "size";
      property: string;
      node: Node;
      width: number;
      height: number;
    }
  | {
      type: "radius";
      property: string;
      node: Node;
      r: number;
      cx: number;
      cy: number;
    }
  | {
      type: "color";
      property: string;
      node: Node;
      color: string;
    }
  | {
      type: "unstyled";
      node: Node;
      property: string;
    };

function getActive(tree: Node, state: EditorState): ActiveNode | null {
  const [selection] = state.selection.ranges;
  if (!selection) return null;

  const pos = selection.to;
  let active = null as { node: Node; property: string } | null;
  iterate(tree, (node) => {
    if (!node.positions) return false;
    const { from, to } = node.positions;
    if (pos >= from && pos <= to) {
      const prop = Object.entries(node.positions.properties).find(
        ([_, { from, to }]) => {
          return pos >= from && pos <= to;
        }
      );
      if (prop) {
        const [propName] = prop;
        active = { node, property: propName };
        return false;
      }
    }
  });

  if (!active) return null;

  const { node, property } = active;
  if (["x1", "x2", "y1", "y2", "y", "x", "cx", "cy"].includes(property)) {
    return {
      type: "point",
      node,
      property,
      x: getX(node, property),
      y: getY(node, property),
    };
  }

  if (["r"].includes(property)) {
    return {
      type: "radius",
      node,
      property,
      r: +node.properties.r,
      cx: +node.properties.cx,
      cy: +node.properties.cy,
    };
  }

  if (["width", "height"].includes(property)) {
    return {
      type: "size",
      node,
      property,
      width: +node.properties.width,
      height: +node.properties.height,
    };
  }

  if (["stroke", "fill"].includes(property)) {
    return {
      type: "color",
      node,
      property,
      color: node.properties[property],
    };
  }

  return {
    type: "unstyled",
    node,
    property,
  };
}

function getX(node: Node, property: string): number {
  let prop: string | number = 0;
  if (isPointProp("x", property)) prop = node.properties[property];
  if (property === "y") prop = node.properties.x;
  if (property === "y1") prop = node.properties.x1;
  if (property === "y2") prop = node.properties.x2;
  if (property === "cy") prop = node.properties.cx;
  return Number(prop);
}

function getY(node: Node, property: string): number {
  let prop: string | number = 0;
  if (isPointProp("y", property)) prop = node.properties[property];
  if (property === "x") prop = node.properties.y;
  if (property === "x1") prop = node.properties.y1;
  if (property === "x2") prop = node.properties.y2;
  if (property === "cx") prop = node.properties.cy;
  return Number(prop);
}
