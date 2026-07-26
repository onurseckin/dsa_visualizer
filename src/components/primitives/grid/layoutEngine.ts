import { Size, clamp, fitSlots } from "../vizGeometry";
import { CellFit, GAP, PAD, MIN_CELL, MAX_CELL } from "./gridTypes";

export const cellFit = (rows: number, cols: number, box: Size): CellFit => {
  const rowFit = fitSlots(rows, box.height - PAD * 2, GAP, MIN_CELL, MAX_CELL);
  const colFit = fitSlots(cols, box.width - PAD * 2, GAP, MIN_CELL, MAX_CELL);
  const cell = Math.min(rowFit.size, colFit.size);
  const fits =
    cell * cols + Math.max(cols - 1, 0) * GAP <= box.width &&
    cell * rows + Math.max(rows - 1, 0) * GAP <= box.height;
  if (fits) return { cell, gap: GAP };

  const gap = Math.min(GAP, Math.min(box.width / (cols * 4), box.height / (rows * 4)));
  return {
    cell: Math.max(
      Math.min(
        (box.width - gap * Math.max(cols - 1, 0)) / cols,
        (box.height - gap * Math.max(rows - 1, 0)) / rows,
      ),
      1,
    ),
    gap,
  };
};

export interface GridMetrics {
  cell: number;
  gap: number;
  gridWidth: number;
  gridHeight: number;
  originX: number;
  originY: number;
  font: number;
  strokeScale: number;
  radius: number;
}

export const computeGridLayout = (rows: number, cols: number, box: Size): GridMetrics => {
  const { cell, gap } = cellFit(rows, cols, box);
  const gridWidth = cols * cell + Math.max(cols - 1, 0) * gap;
  const gridHeight = rows * cell + Math.max(rows - 1, 0) * gap;
  const originX = Math.max((box.width - gridWidth) / 2, 0);
  const originY = Math.max((box.height - gridHeight) / 2, 0);

  const font = clamp(cell * 0.34, 7, 28);
  const strokeScale = clamp(cell / 48, 1, 1.8);
  const radius = clamp(cell * 0.1, 3, 12);

  return {
    cell,
    gap,
    gridWidth,
    gridHeight,
    originX,
    originY,
    font,
    strokeScale,
    radius,
  };
};
