import { autocompletion } from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";

const options = [
  {
    label: "circle",
    type: "keyword",
    apply: `<circle r="25" cx="50" cy="50" fill="currentColor" />`,
  },
  {
    label: "rect",
    type: "keyword",
    apply: `<rect x="25" y="25" width="50" height="50" fill="currentColor" />`,
  },
  {
    label: "line",
    type: "keyword",
    apply: `<line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="2" />`,
  },
];

export const autocomplete = autocompletion({
  override: [
    (context) => {
      const { state, pos } = context;
      const tree = syntaxTree(state).resolveInner(pos, -1);
      if (!["StartTag", "TagName"].includes(tree.name)) return null;
      return {
        from: tree.from,
        to: pos,
        filter: false,
        options,
        validFor: (text) => {
          const tagName = text.startsWith("<") ? text.slice(1) : text;
          const validNames = options.map((o) => o.label);

          // These autocomplet options are valid as long as the tag name is a
          // substring of one of the options
          return validNames.some((name) => {
            return name.startsWith(tagName);
          });
        },
      };
    },
  ],
});
