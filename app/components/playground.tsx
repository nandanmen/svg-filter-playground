"use client";

import { type ReactNode, useCallback, useState } from "react";
import { find } from "unist-util-find";
import { Root } from "hast";
import { Filter } from "./filter";
import { Editor, parseTree } from "./editor";
import { EditorState } from "@codemirror/state";

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
  ></feGaussianBlur>
  <feColorMatrix
    in="blur"
    type="matrix"
    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
    result="goo"
  ></feColorMatrix>
  <feBlend in="SourceGraphic" in2="goo"></feBlend>
</filter>`;

export function Playground() {
  const [filterView, setFilterView] = useState<EditorState | null>(null);
  const filters = parseTree(filterView).children.map((child) => {
    return {
      type: child.tagName,
      properties: child.properties,
    };
  });
  return (
    <div className="h-screen w-full grid grid-cols-4 divide-x divide-gray4">
      <aside className="flex flex-col divide-y divide-gray4">
        <header className="p-4 flex justify-between items-center">
          <h1 className="font-medium">SVG Filter Playground</h1>
          <a
            className="flex items-center gap-1 py-1.5 rounded px-2 bg-gray3 border border-gray4"
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
        <ul className="p-4 space-y-4">
          <li className="flex gap-2 text-sm font-medium">
            <button className="border h-10 pl-4 pr-2.5 gap-2 flex items-center rounded-full justify-between w-full">
              <span>SourceGraphic</span>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 13V15"
                />
                <circle cx="12" cy="9" r="1" fill="currentColor" />
                <circle
                  cx="12"
                  cy="12"
                  r="7.25"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
            <button className="border h-10 pl-4 pr-2.5 gap-2 flex items-center rounded-full w-full justify-between">
              <span>SourceAlpha</span>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 13V15"
                />
                <circle cx="12" cy="9" r="1" fill="currentColor" />
                <circle
                  cx="12"
                  cy="12"
                  r="7.25"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          </li>
          {filters.map((filter) => {
            return <Filter filter={filter} key={filter.type} />;
          })}
        </ul>
      </aside>
      <main
        className="w-full flex items-center justify-center col-span-2"
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
