import { describe, expect, it } from "vitest";
import { parseTree } from "./tree";
import { EditorState } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { html } from "@codemirror/lang-html";

const createState = (code: string) => {
  return EditorState.create({
    doc: code,
    extensions: [basicSetup, html()],
  });
};

describe("tree", () => {
  it("should parse the tree", () => {
    expect(
      parseTree(
        createState(`<svg viewBox="0 0 90 90">
  <circle cx="45" cy="45" r="40" fill="red" />
</svg>`)
      )
    ).toEqual({
      tagName: "svg",
      properties: {
        viewBox: "0 0 90 90",
      },
      children: [
        {
          tagName: "circle",
          properties: {
            cx: "45",
            cy: "45",
            r: "40",
            fill: "red",
          },
          children: [],
        },
      ],
    });
  });

  it("should parse incomplete trees", () => {
    expect(
      parseTree(
        createState(`<svg viewBox="0 0 90 90">
  <circle 
</svg>`)
      )
    ).toEqual({
      tagName: "svg",
      properties: {
        viewBox: "0 0 90 90",
      },
      children: [
        {
          tagName: "circle",
          properties: {},
          children: [],
        },
      ],
    });
  });

  it("should parse incomplete tags", () => {
    expect(
      parseTree(
        createState(`<svg viewBox="0 0 90 90">
  <
</svg>`)
      )
    ).toEqual({
      tagName: "svg",
      properties: {
        viewBox: "0 0 90 90",
      },
      children: [],
    });
  });

  it("should parse incomplete attribute names", () => {
    expect(
      parseTree(
        createState(`<svg viewBox="0 0 90 90">
  <rect x
</svg>`)
      )
    ).toEqual({
      tagName: "svg",
      properties: {
        viewBox: "0 0 90 90",
      },
      children: [
        {
          tagName: "rect",
          properties: {
            x: "",
          },
          children: [],
        },
      ],
    });
  });

  it("should parse missing attribute value", () => {
    expect(
      parseTree(
        createState(`<svg viewBox="0 0 90 90">
  <rect x=
</svg>`)
      )
    ).toEqual({
      tagName: "svg",
      properties: {
        viewBox: "0 0 90 90",
      },
      children: [
        {
          tagName: "rect",
          properties: {
            x: "",
          },
          children: [],
        },
      ],
    });
  });
});
