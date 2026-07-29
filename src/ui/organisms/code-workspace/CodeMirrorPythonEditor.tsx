import { python } from "@codemirror/lang-python";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { EditorState } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { useEffect, useRef } from "react";

import type { PythonEditorControlProps } from "./PythonEditor";

/**
 * Maps Lezer highlight tags to the exact colors used by pythonHighlighter.tsx
 * so the playground and reference views share one visual language.
 */
const pythonHighlightStyle = HighlightStyle.define([
  // Keywords: purple semibold
  { tag: tags.keyword, color: "#c084fc", fontWeight: "600" },
  // Control-flow keywords use the same purple
  { tag: tags.controlKeyword, color: "#c084fc", fontWeight: "600" },
  // def / class operator-like tokens
  { tag: tags.definitionKeyword, color: "#c084fc", fontWeight: "600" },
  // Function definitions (name after def)
  { tag: tags.definition(tags.function(tags.variableName)), color: "#facc15", fontWeight: "600" },
  // Class name definitions
  { tag: tags.definition(tags.typeName), color: "#facc15", fontWeight: "600" },
  // String literals: green
  { tag: tags.string, color: "#86efac" },
  { tag: tags.special(tags.string), color: "#86efac" },
  // Number literals: orange
  { tag: tags.number, color: "#fb923c" },
  // Boolean / None literals
  { tag: tags.bool, color: "#fb923c" },
  { tag: tags.null, color: "#fb923c" },
  // Built-in names: sky blue
  { tag: tags.standard(tags.name), color: "#38bdf8" },
  { tag: tags.standard(tags.variableName), color: "#38bdf8" },
  // Operators and punctuation: slate
  { tag: tags.operator, color: "#94a3b8" },
  { tag: tags.punctuation, color: "#94a3b8" },
  { tag: tags.bracket, color: "#94a3b8" },
  // Comments: muted italic
  { tag: tags.comment, color: "var(--text-muted)", fontStyle: "italic" },
  // Line comment (#)
  { tag: tags.lineComment, color: "var(--text-muted)", fontStyle: "italic" },
  // Property names
  { tag: tags.propertyName, color: "#38bdf8" },
  // Decorator
  { tag: tags.meta, color: "#94a3b8" },
  // Default identifiers
  { tag: tags.variableName, color: "#e4e4e7" },
  { tag: tags.name, color: "#e4e4e7" },
]);

export default function CodeMirrorPythonEditor({
  label,
  onChange,
  onRun,
  value,
}: PythonEditorControlProps): React.ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);

  useEffect(() => {
    onChangeRef.current = onChange;
    onRunRef.current = onRun;
  }, [onChange, onRun]);

  useEffect(() => {
    if (!hostRef.current) return;
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          drawSelection(),
          highlightActiveLine(),
          python(),
          syntaxHighlighting(pythonHighlightStyle),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({
            "aria-label": label,
            "aria-multiline": "true",
            role: "textbox",
            spellcheck: "false",
          }),
          keymap.of([
            {
              key: "Mod-Enter",
              preventDefault: true,
              run: () => {
                onRunRef.current();
                return true;
              },
            },
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
          EditorView.theme({
            "&": {
              backgroundColor: "var(--bg-inset)",
              color: "#e4e4e7",
              fontFamily: "var(--font-code)",
              // Match the reference viewer's text-sm (0.875rem / 14px)
              fontSize: "var(--text-sm)",
              height: "100%",
            },
            ".cm-content": {
              caretColor: "var(--accent)",
              minHeight: "var(--code-workspace-editor-min-h)",
              // Align line height with the reference viewer (leading-relaxed = 1.625)
              lineHeight: "1.625",
            },
            ".cm-cursor": {
              borderLeftColor: "var(--accent)",
            },
            ".cm-activeLine": {
              backgroundColor: "var(--accent-softer)",
            },
            ".cm-gutters": {
              backgroundColor: "var(--bg-chrome)",
              borderRight: "1px solid var(--border-default)",
              color: "var(--text-faint)",
              // Gutter font size matches editor content
              fontSize: "var(--text-sm)",
            },
            "&.cm-focused": {
              outline: "none",
              boxShadow: "var(--focus-ring)",
            },
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // The editor owns prop synchronization below; recreating it would lose focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === value) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
  }, [value]);

  return <div ref={hostRef} className="code-workspace__codemirror" />;
}
