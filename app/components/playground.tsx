"use client";

import { Fragment, type ReactNode, useCallback, useState } from "react";
import { Filter } from "./filter";
import { Editor, Node, parseTree } from "./editor";
import { EditorState } from "@codemirror/state";
import { QuestionMark } from "./icons";

const range = (
  to: number,
  {
    from = 0,
    step = 1,
  }: {
    from?: number;
    step?: number;
  } = {}
) => {
  return Array.from(
    { length: (to - from) / step + 1 },
    (_, i) => from + i * step
  );
};

const initialCode = `<g fill="green">
  <circle cx="35" cy="35" r="20" />
  <circle cx="65" cy="65" r="20" />
</g>`;

const initialFilters = `<filter id="filter">
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
</filter>`;

function findLinks(filters: Pick<Node, "properties">[]): [number, number][] {
  /**
   * A record of ids to the indexes of the filters that reference them.
   */
  const mapIdToLinks: Record<string, number[]> = {};

  const mapIdToIndex: Record<string, number> = {
    // special ids
    SourceGraphic: -2,
    SourceAlpha: -1,
  };

  filters.forEach((filter, index) => {
    const { in: inProp, in2, result } = filter.properties;
    if (result) {
      mapIdToIndex[result] = index;
    }
    if (inProp) {
      mapIdToLinks[inProp] = [...(mapIdToLinks[inProp] || []), index];
    }
    if (in2) {
      mapIdToLinks[in2] = [...(mapIdToLinks[in2] || []), index];
    }
  });

  const links: [number, number][] = [];
  Object.entries(mapIdToLinks).forEach(([id, indexes]) => {
    /**
     * If the map doesn't have an entry for the id, it's not a valid id. We
     * don't want to throw here because the user might be typing, so we use a
     * special value - "-3" in this case.
     */
    const key = mapIdToIndex[id] ?? -3;
    indexes.forEach((index) => {
      links.push([key, index]);
    });
  });
  return links;
}

export function Playground() {
  const [filterView, setFilterView] = useState<EditorState | null>(null);
  const filters = parseTree(filterView).children.map((child) => {
    return {
      type: child.tagName,
      properties: child.properties,
      positions: child.positions,
    };
  });

  const links = findLinks(filters);
  const linksWithCoordinates = links.map((link) => {
    const [start, end] = link;
    const startY = (Math.max(start, -1) + 1) * 82 + 40;
    const endY = (end + 1) * 82;

    const linksEndingAtEnd = links.filter(([_, e]) => e === end);
    const currentIndex = linksEndingAtEnd.findIndex((l) => l === link);

    const endX = (388 / (linksEndingAtEnd.length + 1)) * (currentIndex + 1);
    const startX = start === -2 ? 85 : start === -1 ? 303 : 194;

    return {
      link,
      x0: startX,
      y0: startY,
      x1: endX,
      y1: endY,
    };
  });

  return (
    <div className="h-screen w-full grid grid-cols-[420px_1fr_420px] divide-x divide-gray4">
      <aside className="flex flex-col divide-y divide-gray4 bg-gray2">
        <header className="p-4 flex justify-between items-center">
          <h1 className="font-medium">SVG Filter Playground</h1>
          <a
            className="flex items-center gap-1 py-1.5 rounded-xl px-2 bg-gray1 border border-gray4"
            href="https://svg-animations.how"
            target="_blank"
            rel="noreferrer"
          >
            <span className="text-xs font-medium">SVG Course</span>
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <path d="M17.25 15.25V6.75H8.75" />
              <path d="M17 7L6.75 17.25" />
            </svg>
          </a>
        </header>
        <ul className="p-4 flex flex-col gap-10 relative h-full">
          <div className="absolute inset-0 p-4 pointer-events-none">
            <svg width="100%" height="100%">
              <g className="text-green9">
                {linksWithCoordinates.map((link) => {
                  if (link.x0 === link.x1) {
                    return (
                      <path
                        key={`${link.x0}-${link.y0}-${link.y1}`}
                        d={`M ${link.x0} ${link.y0} V ${link.y1}`}
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                      />
                    );
                  }
                  return (
                    <path
                      key={`${link.x0}-${link.y0}-${link.y1}`}
                      d={`M ${link.x0} ${link.y0} V ${link.y1 - 26} a 6 6 0 0 0 6 6 H ${link.x1 - 6} a 6 6 0 0 1 6 6 V ${link.y1}`}
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      fill="none"
                    />
                  );
                })}
              </g>
            </svg>
          </div>
          <li className="flex gap-2 text-sm font-medium relative">
            <button className="bg-gray1 border h-10 pl-4 pr-2.5 gap-2 flex items-center rounded-xl justify-between w-full shadow-sm">
              <span>SourceGraphic</span>
              <span className="text-gray11">
                <QuestionMark />
              </span>
            </button>
            <button className="bg-gray1 border h-10 pl-4 pr-2.5 gap-2 flex items-center rounded-xl w-full justify-between shadow-sm">
              <span>SourceAlpha</span>
              <span className="text-gray11">
                <QuestionMark />
              </span>
            </button>
          </li>
          {filters.map((filter) => {
            return <Filter key={filter.type} filter={filter} />;
          })}
          <div className="absolute inset-0 p-4 pointer-events-none">
            <svg width="100%" height="100%">
              <g className="text-green9">
                {linksWithCoordinates.map((link) => {
                  return (
                    <g
                      key={`${link.x0}-${link.y0}-${link.x1}-${link.y1}`}
                      fill="currentColor"
                    >
                      <circle cx={link.x0} cy={link.y0} r="3" />
                      <circle cx={link.x1} cy={link.y1} r="3" />
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </ul>
      </aside>
      <main
        className="w-full flex items-center justify-center"
        style={{ backgroundImage: `url(/pattern.svg)` }}
      >
        <SvgWrapper>
          <svg viewBox="0 0 100 100" width="100%">
            <filter id="filter">
              {filters.map((filter, index) => {
                const Component = filter.type;
                return (
                  <Component
                    key={`${filter.type}-${index}`}
                    {...filter.properties}
                  />
                );
              })}
            </filter>
            <g filter="url(#filter)" fill="green">
              <circle cx="35" cy="35" r="20" />
              <circle cx="65" cy="65" r="20" />
            </g>
          </svg>
        </SvgWrapper>
      </main>
      <aside className="flex flex-col divide-y divide-gray4 text-sm">
        <header className="grid grid-cols-2 divide-x divide-gray4">
          <div className="flex justify-between p-4">
            <p className="text-gray11 font-medium">Width</p>
            <p className="font-mono">100</p>
          </div>
          <div className="flex justify-between p-4">
            <p className="text-gray11 font-medium">Height</p>
            <p className="font-mono">100</p>
          </div>
        </header>
        <div className="grow">
          <header className="p-4 pb-0 text-gray11">
            <h2 className="font-medium">Filters</h2>
          </header>
          <Editor
            initialValue={initialFilters}
            onViewChange={useCallback((update) => {
              setFilterView(update.state);
            }, [])}
          />
        </div>
        <div className="grow-0 min-h-[250px]">
          <header className="p-4 pb-0 text-gray11">
            <h2 className="font-medium">Shape</h2>
          </header>
          <Editor initialValue={initialCode} onViewChange={() => {}} />
        </div>
      </aside>
    </div>
  );
}

function SvgWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="w-[650px] aspect-square border border-gray4 bg-gray1 relative">
      <div className="text-gray7">
        <div className="absolute -top-2 -right-2">
          <Corner />
        </div>
        <div className="absolute -top-2 -left-2">
          <Corner />
        </div>
        <div className="absolute -bottom-2 -right-2">
          <Corner />
        </div>
        <div className="absolute -bottom-2 -left-2">
          <Corner />
        </div>
      </div>
      <div className="absolute bottom-[calc(100%+16px)] flex justify-between w-[calc(100%+16px)] -left-2.5 font-mono text-sm text-gray10">
        {range(100, { step: 25 }).map((i) => (
          <div key={i} className="w-5 text-center">
            <p>{i}</p>
          </div>
        ))}
      </div>
      <div className="absolute right-[calc(100%+16px)] flex flex-col justify-between h-[calc(100%+20px)] -top-2.5 font-mono text-sm text-gray10">
        {range(100, { step: 25 }).map((i) => (
          <div key={i} className="h-5 flex items-center justify-end">
            <p>{i}</p>
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

function Corner() {
  return (
    <svg viewBox="0 0 10 10" width="16">
      <path d="M 5 0 v 10 M 0 5 h 10" stroke="currentColor" />
    </svg>
  );
}
