import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PanelHeightMap, ResizableRow, ResizableRows } from "../../ui";

const stubRects = (rects: Record<string, DOMRect>): void => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement): DOMRect {
      const key = this.getAttribute("data-row") ?? this.getAttribute("data-rect") ?? "container";
      return rects[key] ?? rects.container;
    },
  );
};

const rect = (top: number, bottom: number, left = 0, right = 1000): DOMRect =>
  ({
    top,
    bottom,
    left,
    right,
    width: right - left,
    height: bottom - top,
    x: left,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ResizableRowsInteractions Component Spec", () => {
  const buildRows = (
    heights: PanelHeightMap = {},
    visibility: Partial<Record<string, boolean>> = {},
  ): ResizableRow[] => [
    {
      id: "code",
      label: "code",
      content: <div>Code Content</div>,
      height: heights.code ?? null,
      visible: visibility.code !== false,
    },
    {
      id: "complexity",
      label: "complexity",
      content: <div>Complexity Content</div>,
      height: heights.complexity ?? null,
      visible: visibility.complexity !== false,
    },
  ];

  const renderRows = (rows: ResizableRow[]) => {
    const onHeightsChange = vi.fn();
    const onHeightsCommit = vi.fn();
    const utils = render(
      <ResizableRows
        rows={rows}
        onHeightsChange={onHeightsChange}
        onHeightsCommit={onHeightsCommit}
      />,
    );
    return { ...utils, onHeightsChange, onHeightsCommit };
  };

  it("resizes the row above the handle, whose top edge is the drag anchor", () => {
    stubRects({
      container: rect(0, 600),
      code: rect(0, 300),
      complexity: rect(308, 600),
    });
    const { onHeightsChange, onHeightsCommit } = renderRows(buildRows());

    fireEvent.mouseDown(screen.getByRole("separator"));
    fireEvent.mouseMove(window, { clientY: 420 });

    expect(onHeightsChange).toHaveBeenLastCalledWith({ code: 420, complexity: null });
    expect(onHeightsCommit).not.toHaveBeenCalled();

    fireEvent.mouseUp(window);
    expect(onHeightsCommit).toHaveBeenCalledTimes(1);
  });

  it("clamps a drag so a pinned row can never swallow the whole column", () => {
    stubRects({ container: rect(0, 600), code: rect(0, 300), complexity: rect(308, 600) });
    const { onHeightsChange } = renderRows(buildRows());

    fireEvent.mouseDown(screen.getByRole("separator"));
    fireEvent.mouseMove(window, { clientY: 1200 });

    expect(onHeightsChange).toHaveBeenLastCalledWith({ code: 536, complexity: null });
  });

  it("clamps a drag above the row top to the row floor", () => {
    stubRects({ container: rect(0, 600), code: rect(0, 300), complexity: rect(308, 600) });
    const { onHeightsChange } = renderRows(buildRows());

    fireEvent.mouseDown(screen.getByRole("separator"));
    fireEvent.mouseMove(window, { clientY: -200 });

    expect(onHeightsChange).toHaveBeenLastCalledWith({ code: 64, complexity: null });
  });

  it("ignores drag movement while the row has no measurable height", () => {
    const { onHeightsChange } = renderRows(buildRows());

    fireEvent.mouseDown(screen.getByRole("separator"));
    fireEvent.mouseMove(window, { clientY: 120 });

    expect(onHeightsChange).not.toHaveBeenCalled();
  });

  it("pins the row above with an arrow-key nudge and commits it", () => {
    stubRects({ container: rect(0, 600), code: rect(0, 300), complexity: rect(308, 600) });
    const { onHeightsChange, onHeightsCommit } = renderRows(buildRows());

    fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowDown" });

    expect(onHeightsChange).toHaveBeenLastCalledWith({ code: 316, complexity: null });
    expect(onHeightsCommit).toHaveBeenLastCalledWith({ code: 316, complexity: null });
  });

  it("shrinks the row above when the handle is nudged up", () => {
    stubRects({ container: rect(0, 600), code: rect(0, 300), complexity: rect(308, 600) });
    const { onHeightsCommit } = renderRows(buildRows());

    fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowUp" });

    expect(onHeightsCommit).toHaveBeenLastCalledWith({ code: 284, complexity: null });
  });

  it("nudges a pinned row from its stored height", () => {
    stubRects({ container: rect(0, 600), code: rect(0, 300), complexity: rect(308, 600) });
    const { onHeightsCommit } = renderRows(buildRows({ code: 180 }));

    fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowDown" });

    expect(onHeightsCommit).toHaveBeenLastCalledWith({ code: 196, complexity: null });
  });

  it("restores the row above to automatic on double-click", () => {
    const { onHeightsChange, onHeightsCommit } = renderRows(buildRows({ code: 180 }));

    fireEvent.doubleClick(screen.getByRole("separator"));

    expect(onHeightsChange).toHaveBeenLastCalledWith({ code: null, complexity: null });
    expect(onHeightsCommit).toHaveBeenLastCalledWith({ code: null, complexity: null });
  });

  it("keeps a hidden row at its stored height while resizing the visible ones", () => {
    stubRects({ container: rect(0, 600), code: rect(0, 300) });
    const onHeightsChange = vi.fn();
    render(
      <ResizableRows
        rows={[
          ...buildRows(),
          {
            id: "scratch",
            label: "scratch",
            content: <div>Scratch Content</div>,
            height: 220,
            visible: false,
          },
        ]}
        onHeightsChange={onHeightsChange}
      />,
    );

    fireEvent.mouseDown(screen.getByRole("separator"));
    fireEvent.mouseMove(window, { clientY: 420 });

    expect(onHeightsChange).toHaveBeenLastCalledWith({
      code: 420,
      complexity: null,
      scratch: 220,
    });
  });

  it("uses maxRowHeight as ceiling when container height is small or zero", () => {
    stubRects({ container: rect(0, 50), code: rect(0, 20), complexity: rect(20, 50) });
    const { onHeightsChange } = renderRows(buildRows());

    fireEvent.mouseDown(screen.getByRole("separator"));
    fireEvent.mouseMove(window, { clientY: 300 });

    // minRowHeight is 64, container is 50 <= 128, so ceiling is maxRowHeight (2000), clamped to 300
    expect(onHeightsChange).toHaveBeenLastCalledWith({ code: 300, complexity: null });
  });

  it("handles nudge when stored height is null and element height is zero", () => {
    // element getBoundingClientRect defaults to 0
    const { onHeightsCommit } = renderRows(buildRows());

    fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowDown" });

    // base = 0 + 16 = 16, clamped to minRowHeight 64
    expect(onHeightsCommit).toHaveBeenLastCalledWith({ code: 64, complexity: null });
  });

  it("handles drag and nudge when row element or container is missing", () => {
    const onHeightsChange = vi.fn();
    const onHeightsCommit = vi.fn();

    // Render with missing element in ref map simulation
    const { rerender } = render(
      <ResizableRows
        rows={buildRows()}
        onHeightsChange={onHeightsChange}
        onHeightsCommit={onHeightsCommit}
      />,
    );

    // Start drag
    const handle = screen.getByRole("separator");
    fireEvent.mouseDown(handle);

    // Now re-render with empty rows while drag is active so rowElementsRef lacks the element
    rerender(
      <ResizableRows
        rows={[]}
        onHeightsChange={onHeightsChange}
        onHeightsCommit={onHeightsCommit}
      />,
    );

    // Trigger mouseMove when element is missing
    fireEvent.mouseMove(window, { clientY: 400 });
    // onMove should return early without updating heights
    expect(onHeightsChange).not.toHaveBeenCalledWith(expect.objectContaining({ code: 400 }));
  });
});
