import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GridCellItem } from "../grid/GridCellItem";
import { GridMetrics } from "../grid/layoutEngine";
import { GridCellNode } from "../../../types/dsa";

describe("GridCellItem Component Spec", () => {
  const dummyMetrics: GridMetrics = {
    cell: 40,
    gap: 4,
    gridWidth: 200,
    gridHeight: 200,
    originX: 10,
    originY: 10,
    font: 14,
    strokeScale: 1,
    radius: 4,
  };

  const startCell: GridCellNode = { row: 0, col: 0, isStart: true };
  const numCell: GridCellNode = { row: 1, col: 2, distance: 12 };
  const infCell: GridCellNode = { row: 2, col: 1, distance: Infinity };

  it("renders cell symbol for special cell types (e.g. start, target)", () => {
    const { getByText } = render(
      <svg>
        <GridCellItem gridCell={startCell} rIdx={0} cIdx={0} metrics={dummyMetrics} />
      </svg>,
    );

    expect(getByText("S")).toBeInTheDocument();
  });

  it("renders distance label when showDistance is true and distance is finite", () => {
    const { getByText } = render(
      <svg>
        <GridCellItem
          gridCell={numCell}
          rIdx={1}
          cIdx={2}
          metrics={dummyMetrics}
          showDistance={true}
        />
      </svg>,
    );

    expect(getByText("12")).toBeInTheDocument();
  });

  it("hides distance label when showDistance is false or distance is Infinity", () => {
    const { container: c1 } = render(
      <svg>
        <GridCellItem
          gridCell={numCell}
          rIdx={1}
          cIdx={2}
          metrics={dummyMetrics}
          showDistance={false}
        />
      </svg>,
    );
    expect(c1.querySelector("text")).toBeNull();

    const { container: c2 } = render(
      <svg>
        <GridCellItem
          gridCell={infCell}
          rIdx={2}
          cIdx={1}
          metrics={dummyMetrics}
          showDistance={true}
        />
      </svg>,
    );
    expect(c2.querySelector("text")).toBeNull();
  });

  it("renders non-interactive cell when onCellClick is omitted", () => {
    const { container } = render(
      <svg>
        <GridCellItem gridCell={startCell} rIdx={0} cIdx={0} metrics={dummyMetrics} />
      </svg>,
    );

    const group = container.querySelector("g");
    expect(group).not.toHaveAttribute("role");
    expect(group).not.toHaveAttribute("tabindex");
  });

  it("handles click, keyboard Enter, and keyboard Space events when onCellClick is provided", () => {
    const onClick = vi.fn();
    const { getByRole } = render(
      <svg>
        <GridCellItem
          gridCell={startCell}
          rIdx={2}
          cIdx={3}
          metrics={dummyMetrics}
          onCellClick={onClick}
        />
      </svg>,
    );

    const group = getByRole("button", { name: "Row 3, Column 4: S" });
    expect(group).toHaveAttribute("tabindex", "0");

    // Click
    fireEvent.click(group);
    expect(onClick).toHaveBeenLastCalledWith(2, 3);

    // Keydown Enter
    fireEvent.keyDown(group, { key: "Enter" });
    expect(onClick).toHaveBeenLastCalledWith(2, 3);

    // Keydown Space
    fireEvent.keyDown(group, { key: " " });
    expect(onClick).toHaveBeenLastCalledWith(2, 3);

    // Ignored keydown
    fireEvent.keyDown(group, { key: "Tab" });
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("updates focus styling on focus and blur", () => {
    const onClick = vi.fn();
    const { container, getByRole } = render(
      <svg>
        <GridCellItem
          gridCell={startCell}
          rIdx={0}
          cIdx={0}
          metrics={dummyMetrics}
          onCellClick={onClick}
        />
      </svg>,
    );

    const group = getByRole("button");
    const rect = container.querySelector("rect");

    expect(rect).not.toHaveAttribute("stroke", "var(--border-accent)");

    fireEvent.focus(group);
    expect(rect).toHaveAttribute("stroke", "var(--border-accent)");

    fireEvent.blur(group);
    expect(rect).not.toHaveAttribute("stroke", "var(--border-accent)");
  });
});
