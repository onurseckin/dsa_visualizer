import { python } from "@codemirror/lang-python";
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
              color: "var(--text-primary)",
              fontFamily: "var(--font-code)",
              height: "100%",
            },
            ".cm-content": {
              caretColor: "var(--accent)",
              minHeight: "var(--code-workspace-editor-min-h)",
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
