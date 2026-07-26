import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GridVisualizer from "../GridVisualizer";
import type { GridCellNode } from "../../../types/dsa";

describe("GridVisualizer", () => {
  it("returns null when grid is empty", () => {
    const { container } = render(<GridVisualizer grid={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders cells with start, end, wall, path, visited, and distance labels", () => {
    const sampleGrid: GridCellNode[][] = [
      [
        { row: 0, col: 0, isStart: true, distance: 0 },
        { row: 0, col: 1, isEnd: true, distance: 3 },
      ],
      [
        { row: 1, col: 0, isWall: true },
        { row: 1, col: 1, isPath: true, distance: 2 },
      ],
      [
        { row: 2, col: 0, isVisited: true, distance: 1 },
        { row: 2, col: 1, state: "active", distance: 4 },
      ],
    ];

    render(<GridVisualizer grid={sampleGrid} title="Grid Sample" showDistance={true} />);

    expect(screen.getByText("Grid Sample")).toBeInTheDocument();
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("handles cell click events", () => {
    const onCellClick = vi.fn();
    const sampleGrid: GridCellNode[][] = [[{ row: 0, col: 0, state: "default" }]];

    const { container } = render(<GridVisualizer grid={sampleGrid} onCellClick={onCellClick} />);

    const cellRect = container.querySelector("rect");
    expect(cellRect).not.toBeNull();
    if (cellRect) fireEvent.click(cellRect);
    expect(onCellClick).toHaveBeenCalledWith(0, 0);
  });
});
