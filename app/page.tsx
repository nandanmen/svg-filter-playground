import { unified } from "unified";
import parse from "rehype-parse";
import { find } from "unist-util-find";
import type { Root } from "hast";
import { Playground } from "./components/playground";

const defaultText = `<svg viewBox="0 0 100 100" width="100%">
  <g
    filter="url(#filter)"
    fill="green"
  >
    <circle
      cx="35"
      cy="35"
      r="20"
    />
    <circle
      cx="65"
      cy="65"
      r="20"
    />
  </g>
  <defs>
    <filter id="filter">
      <feGaussianBlur
        in="SourceGraphic"
        stdDeviation="2"
        result="blur"
      />
      <feColorMatrix
        in="blur"
        type="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
        result="goo"
      />
      <feBlend in="SourceGraphic" in2="goo" />
    </filter>
  </defs>
</svg>`;

export default function Home() {
  const tree = unified().use(parse).parse(defaultText);
  const svg = find<Root>(tree, { tagName: "svg" });
  if (!svg) {
    throw new Error("No SVG element found");
  }
  return <Playground />;
}
