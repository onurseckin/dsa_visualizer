import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CodeMirrorPythonEditor from "../CodeMirrorPythonEditor";

describe("CodeMirrorPythonEditor", () => {
  it("mounts an accessible Python editor, synchronizes controlled code, and binds Mod+Enter", () => {
    const onRun = vi.fn();
    const view = render(
      <CodeMirrorPythonEditor
        label="Python playground editor"
        value="# first"
        onChange={vi.fn()}
        onRun={onRun}
      />,
    );

    const editor = screen.getByRole("textbox", { name: "Python playground editor" });
    expect(editor).toHaveAttribute("aria-multiline", "true");
    expect(editor).toHaveTextContent("# first");

    view.rerender(
      <CodeMirrorPythonEditor
        label="Python playground editor"
        value="# updated"
        onChange={vi.fn()}
        onRun={onRun}
      />,
    );
    expect(editor).toHaveTextContent("# updated");

    fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true });
    expect(onRun).toHaveBeenCalledOnce();

    view.unmount();
    expect(screen.queryByRole("textbox", { name: "Python playground editor" })).toBeNull();
  });
});
