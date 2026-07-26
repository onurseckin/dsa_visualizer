import { GridCellNode, ElementState } from "../../../types/dsa";

export interface GridVisualizerProps {
  grid: GridCellNode[][];
  cellSize?: number;
  showDistance?: boolean;
  onCellClick?: (row: number, col: number) => void;
  title?: string;
}

export interface CellAppearance {
  bg: string;
  border: string;
  color: string;
  symbol: string;
  strokeWidth: number;
}

export const GAP = 4;
export const PAD = 4;
export const MIN_CELL = 8;
export const MAX_CELL = 180;

export interface CellFit {
  cell: number;
  gap: number;
}

export const getCellAppearance = (cell: GridCellNode): CellAppearance => {
  if (cell.isStart) {
    return {
      bg: "var(--state-sorted-bg)",
      border: "var(--state-sorted)",
      color: "var(--state-sorted)",
      symbol: "S",
      strokeWidth: 2,
    };
  }
  if (cell.isEnd) {
    return {
      bg: "var(--state-swap-bg)",
      border: "var(--state-swap)",
      color: "var(--state-swap)",
      symbol: "E",
      strokeWidth: 2,
    };
  }
  if (cell.isWall) {
    return {
      bg: "var(--bg-pressed)",
      border: "var(--border-strong)",
      color: "var(--text-secondary)",
      symbol: "",
      strokeWidth: 1,
    };
  }
  if (cell.isPath) {
    return {
      bg: "var(--state-path-bg)",
      border: "var(--state-path)",
      color: "var(--text-primary)",
      symbol: "",
      strokeWidth: 2,
    };
  }
  if (cell.isVisited) {
    return {
      bg: "var(--state-visited-bg)",
      border: "var(--state-visited)",
      color: "var(--text-secondary)",
      symbol: "",
      strokeWidth: 2,
    };
  }

  const state: ElementState = cell.state || "default";
  return {
    bg: `var(--state-${state}-bg)`,
    border: `var(--state-${state})`,
    color: state === "default" ? "var(--text-muted)" : "var(--text-primary)",
    symbol: "",
    strokeWidth: state === "default" ? 1 : 2,
  };
};
