import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PanelHeightMap, ResizableRow, ResizableRows } from "../ResizableLayout";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ResizableRowsRendering Component Spec", () => {
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

  const row = (container: HTMLElement, id: string): HTMLElement =>
    container.querySelector(`[data-row="${id}"]`) as HTMLElement;

  it("renders one horizontal separator between each adjacent visible pair", () => {
    renderRows(buildRows());

    const handles = screen.getAllByRole("separator");
    expect(handles).toHaveLength(1);
    expect(handles[0]).toHaveAttribute("aria-orientation", "horizontal");
    expect(handles[0]).toHaveAttribute("tabindex", "0");
    expect(handles[0]).toHaveAccessibleName("Resize code and complexity rows");
  });

  it("gives both rows no imposed height so each hugs its content", () => {
    const { container } = renderRows(buildRows());

    for (const id of ["code", "complexity"]) {
      const element = row(container, id);
      expect(element).toHaveAttribute("data-height-mode", "hug");
      expect(element.style.flexGrow).toBe("0");
      expect(element.style.flexShrink).toBe("0");
      expect(element.style.flexBasis).toBe("auto");
      expect(element.style.height).toBe("");
      expect(element.style.minHeight).toBe("");
      expect(element.style.overflowY).toBe("visible");
    }
  });

  it("scrolls the column itself when its hugging rows outgrow it", () => {
    const { container } = renderRows(buildRows());

    const column = row(container, "code").parentElement as HTMLElement;
    expect(column.style.overflowY).toBe("auto");
    expect(column.style.height).toBe("100%");
    expect(column.style.flexDirection).toBe("column");
  });

  it("lets a single greedy row absorb the whole column", () => {
    const { container } = renderRows([
      {
        id: "visualizer",
        label: "visualizer",
        content: <div>Visualizer Content</div>,
        greedy: true,
        height: null,
      },
    ]);

    const visualizer = row(container, "visualizer");
    expect(visualizer).toHaveAttribute("data-height-mode", "greedy");
    expect(visualizer.style.flexGrow).toBe("1");
    expect(visualizer.style.flexBasis).toBe("0%");
    expect(visualizer.style.minHeight).toBe("var(--panel-min-h)");
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("pins a dragged row to an explicit pixel height with its own scroll", () => {
    const { container } = renderRows(buildRows({ code: 180 }));

    const code = row(container, "code");
    expect(code).toHaveAttribute("data-height-mode", "pinned");
    expect(code.style.height).toBe("180px");
    expect(code.style.flexBasis).toBe("180px");
    expect(code.style.flexGrow).toBe("0");
    expect(code.style.overflowY).toBe("auto");

    expect(row(container, "complexity")).toHaveAttribute("data-height-mode", "hug");
  });

  it("reports the height of the row above on the separator", () => {
    const { unmount } = renderRows(buildRows({ code: 180 }));

    expect(screen.getByRole("separator")).toHaveAttribute("aria-valuenow", "180");
    expect(screen.getByRole("separator")).not.toHaveAttribute("aria-valuetext");

    unmount();
    renderRows(buildRows());

    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-valuetext",
      "Automatic, sized to content",
    );
  });

  it("leaves no row, gap or dead handle for a hidden row", () => {
    const { container } = renderRows(buildRows({}, { complexity: false }));

    expect(screen.getByText("Code Content")).toBeInTheDocument();
    expect(screen.queryByText("Complexity Content")).not.toBeInTheDocument();
    expect(container.querySelector('[data-row="complexity"]')).toBeNull();
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });
});
