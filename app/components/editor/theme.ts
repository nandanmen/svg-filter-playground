import { EditorView } from "@codemirror/view";

const editorTheme = EditorView.theme({
  ".cm-content": {
    padding: "16px",
  },
  ".cm-gutters": {
    display: "none",
  },
  ".cm-scroller": {
    fontFamily: "var(--font-mono)",
  },
});

export const theme = [editorTheme];
