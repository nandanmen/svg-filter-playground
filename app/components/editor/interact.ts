import {
  EditorView,
  ViewPlugin,
  PluginValue,
  DecorationSet,
  Decoration,
} from "@codemirror/view";
import { StateEffect, Facet, Prec, Compartment } from "@codemirror/state";

interface Target {
  pos: number;
  text: string;
  rule: InteractRule;
}

export interface InteractRule {
  regexp: RegExp;
  cursor?: string;
  style?: any;
  onClick?: (text: string, setText: (t: string) => void, e: MouseEvent) => void;
  onDrag?: (text: string, setText: (t: string) => void, e: MouseEvent) => void;
  onDragStart?: (target: Target, view: EditorView) => void;
  onDragEnd?: (target: Target, view: EditorView) => void;
  onHoverStart?: (target: Target, view: EditorView) => void;
  onHoverEnd?: (target: Target, view: EditorView) => void;
  onMatchChange?: (target: Target | null, view: EditorView) => void;
}

const mark = Decoration.mark({ class: "cm-interact" });
const setInteract = StateEffect.define<Target | null>();

const interactTheme = EditorView.theme({
  ".cm-interact": {
    background: "var(--blue8)",
  },
});

/**
 * A rule that defines a type of value and its interaction.
 *
 * @example
 * ```
 * // a number dragger
 * interactRule.of({
 *     // the regexp matching the value
 *     regexp: /-?\b\d+\.?\d*\b/g,
 *     // set cursor to 'ew-resize'on hover
 *     cursor: 'ew-resize'
 *     // change number value based on mouse X movement on drag
 *     onDrag: (text, setText, e) => {
 *         const newVal = Number(text) + e.movementX;
 *         if (isNaN(newVal)) return;
 *         setText(newVal.toString());
 *     },
 * })
 * ```
 */
export const interactRule = Facet.define<InteractRule>();

export const interactModKey = Facet.define<ModKey, ModKey>({
  combine: (values) => values[values.length - 1],
});

const setStyle = (style = "") => EditorView.contentAttributes.of({ style });

const normalCursor = setStyle();
const cursorCompartment = new Compartment();
const cursorRule = Prec.highest(cursorCompartment.of(normalCursor));

const clearCursor = () => cursorCompartment.reconfigure(normalCursor);

const setCursor = (cursor?: string) =>
  cursor ? [cursorCompartment.reconfigure(setStyle(`cursor: ${cursor}`))] : [];

interface ViewState extends PluginValue {
  state: "idle" | "pressed" | "dragging";
  hovering: Target | null;
  match: Target | null;
  mouseX: number;
  mouseY: number;
  deco: DecorationSet;
  getMatch(): Target | null;
  updateText(target: Target): (text: string) => void;
  highlight(target: Target): void;
  unhighlight(): void;
  isModKeyDown(e: KeyboardEvent | MouseEvent): boolean;
}

const interactViewPlugin = ViewPlugin.define<ViewState>(
  (view) => ({
    state: "idle",
    hovering: null,
    match: null,
    mouseX: 0,
    mouseY: 0,
    deco: Decoration.none,

    // Get current match under cursor from all rules
    getMatch() {
      const rules = view.state.facet(interactRule);
      const pos = view.posAtCoords({ x: this.mouseX, y: this.mouseY });
      if (!pos) return null;
      const line = view.state.doc.lineAt(pos);
      const lpos = pos - line.from;
      let match = null;

      for (const rule of rules) {
        for (const m of line.text.matchAll(rule.regexp)) {
          if (m.index === undefined) continue;
          const text = m[0];
          if (!text) continue;
          const start = m.index;
          const end = m.index + text.length;
          if (lpos < start || lpos > end) continue;
          // If there are overlap matches from different rules, use the smaller one
          if (!match || text.length < match.text.length) {
            match = {
              rule: rule,
              pos: line.from + start,
              text: text,
            };
          }
        }
      }

      return match;
    },

    updateText(target) {
      return (text) => {
        view.dispatch({
          changes: {
            from: target.pos,
            to: target.pos + target.text.length,
            insert: text,
          },
        });
        target.text = text;
      };
    },

    // highlight a target (e.g. currently dragging or hovering)
    highlight(target) {
      this.match = target;
      target.rule.onMatchChange?.(target, view);
      view.dispatch({
        effects: [setInteract.of(target), ...setCursor(target.rule.cursor)],
      });
    },

    unhighlight() {
      this.match?.rule?.onMatchChange?.(null, view);
      this.match = null;
      view.dispatch({
        effects: [setInteract.of(null), clearCursor()],
      });
    },

    isModKeyDown(e) {
      const modkey = view.state.facet(interactModKey);
      switch (modkey) {
        case "alt":
          return e.altKey;
        case "shift":
          return e.shiftKey;
        case "ctrl":
          return e.ctrlKey;
        case "meta":
          return e.metaKey;
      }
    },

    update(update) {
      for (const tr of update.transactions) {
        for (const e of tr.effects) {
          if (e.is(setInteract)) {
            const decos = e.value
              ? mark.range(e.value.pos, e.value.pos + e.value.text.length)
              : [];
            this.deco = Decoration.set(decos);
          }
        }
      }
    },
  }),
  {
    decorations: (v) => v.deco,

    eventHandlers: {
      mousedown(e, view) {
        if (!this.isModKeyDown(e)) return;

        const match = this.getMatch();
        if (!match) return;
        e.preventDefault();

        this.highlight(match);
        this.state = "pressed";

        if (match.rule.onClick) {
          match.rule.onClick(match.text, this.updateText(match), e);
        }

        const handleDrag = (dragEvent: MouseEvent) => {
          if (this.state === "pressed" && match.rule.onDrag) {
            if (
              Math.abs(dragEvent.clientX - e.clientX) > 3 ||
              Math.abs(dragEvent.clientY - e.clientY) > 3
            ) {
              this.state = "dragging";
              match.rule.onDragStart?.(match, view);
              if (match.rule.cursor) {
                document.body.style.cursor = match.rule.cursor;
              }
            }
          }

          if (this.state === "dragging") {
            if (match.rule.onDrag) {
              match.rule.onDrag(match.text, this.updateText(match), dragEvent);
            }
          }
        };
        document.addEventListener("mousemove", handleDrag);

        const handleDragEnd = () => {
          match.rule.onDragEnd?.(match, view);
          document.removeEventListener("mousemove", handleDrag);
          this.state = "idle";
          this.unhighlight();
          if (match.rule.cursor) {
            document.body.style.cursor = "auto";
          }
        };
        document.addEventListener("mouseup", handleDragEnd, { once: true });
        document.addEventListener(
          "keyup",
          (e) => {
            if (!this.isModKeyDown(e)) {
              handleDragEnd();
            }
          },
          { once: true }
        );
      },

      mousemove(e, view) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;

        if (!this.isModKeyDown(e)) return;

        if (this.state !== "dragging") {
          const match = this.getMatch();
          if (match) {
            this.highlight(match);
            match.rule.onHoverStart?.(match, view);
            this.hovering = match;
          } else {
            if (this.hovering && this.hovering.rule) {
              this.hovering.rule.onHoverEnd?.(this.hovering, view);
            }
            this.unhighlight();
            this.hovering = null;
          }
        }
      },

      keydown(e, view) {
        if (!this.isModKeyDown(e)) return;
        this.hovering = this.getMatch();
        if (this.hovering) {
          this.highlight(this.hovering);
        }
      },

      keyup(e, view) {
        if (!this.isModKeyDown(e)) {
          this.unhighlight();
        }
      },
    },
  }
);

type ModKey = "alt" | "shift" | "meta" | "ctrl";

interface InteractConfig {
  rules?: InteractRule[];
  key?: ModKey;
}

export const interact = (cfg: InteractConfig = {}) => [
  interactTheme,
  interactViewPlugin,
  interactModKey.of(cfg.key ?? "alt"),
  cursorRule,
  (cfg.rules ?? []).map((r) => interactRule.of(r)),
];
