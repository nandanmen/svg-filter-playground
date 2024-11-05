"use client";

import React from "react";
import * as prettier from "prettier/standalone";
import htmlParser from "prettier/plugins/html";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import type { ViewUpdate } from "@codemirror/view";
import { html } from "@codemirror/lang-html";
import { interact, type InteractRule } from "./interact";
import { theme } from "./theme";
import { autocomplete } from "./autocomplete";

export * from "./tree";

type EditorProps = {
  initialValue: string;
  onViewChange: (update: ViewUpdate) => void;
  onPaste?: (text: string, view: EditorView) => void;
  interactRules?: InteractRule[];
  getViewRef?: (view: EditorView) => void;
};

export function Editor({
  initialValue,
  onViewChange,
  getViewRef,
  onPaste,
  interactRules = [],
}: EditorProps) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: initialValue,
        extensions: [
          EditorView.updateListener.of(onViewChange),
          EditorView.domEventHandlers({
            paste: (evt, view) => {
              const data = evt.clipboardData?.getData("text/plain");
              if (data && onPaste) {
                evt.preventDefault();
                onPaste(data, view);
              }
            },
            keydown: (evt, view) => {
              if (evt.key === "s" && evt.metaKey) {
                evt.preventDefault();
                prettier
                  .format(view.state.doc.toString(), {
                    parser: "html",
                    plugins: [htmlParser],
                    printWidth: 60,
                  })
                  .then((formatted) => {
                    view.dispatch({
                      changes: {
                        from: 0,
                        to: view.state.doc.length,
                        // remove trailing newline
                        insert: formatted.slice(0, -1),
                      },
                    });
                  });
              }
            },
          }),
          basicSetup,
          html(),
          autocomplete,
          theme,
          interact({
            rules: interactRules,
          }),
        ],
      }),
      parent: ref.current,
    });
    getViewRef?.(view);

    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onViewChange, onPaste]);

  return <div className="h-full font-mono text-sm" ref={ref} />;
}
