import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

import { PythonEditor, type PythonEditorControlProps } from "../PythonEditor";

describe("PythonEditor", () => {
  it("provides an accessible textarea fallback while the editor chunk is loading", () => {
    render(
      <PythonEditor
        value="# draft"
        label="Python playground editor"
        onChange={vi.fn()}
        onRun={vi.fn()}
        loadEditor={() => new Promise(() => {})}
      />,
    );

    const editor = screen.getByRole("textbox", { name: "Python playground editor" });
    expect(editor).toHaveValue("# draft");
    expect(editor).toHaveAttribute("spellcheck", "false");
  });

  it("keeps local Ctrl/Cmd+Enter bound to Run without stealing plain Enter", async () => {
    const onRun = vi.fn();
    const LoadedEditor: ComponentType<PythonEditorControlProps> = (props) => (
      <textarea
        data-testid="loaded-editor"
        aria-label={props.label}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            props.onRun();
          }
        }}
      />
    );
    render(
      <PythonEditor
        value=""
        label="Python playground editor"
        onChange={vi.fn()}
        onRun={onRun}
        loadEditor={async () => ({ default: LoadedEditor })}
      />,
    );

    const editor = await screen.findByTestId("loaded-editor");
    fireEvent.keyDown(editor, { key: "Enter" });
    expect(onRun).not.toHaveBeenCalled();
    fireEvent.keyDown(editor, { key: "Enter", metaKey: true });
    expect(onRun).toHaveBeenCalledOnce();
  });
});
