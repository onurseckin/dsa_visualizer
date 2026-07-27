import React from "react";
import { Size, boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";
import { GridVisualizerProps, GAP, PAD } from "./grid/gridTypes";
import { computeGridLayout } from "./grid/layoutEngine";
import { GridCellItem } from "./grid/GridCellItem";

export type { GridVisualizerProps };

export const GridVisualizer: React.FC<GridVisualizerProps> = ({
  grid,
  cellSize = 42,
  showDistance = true,
  onCellClick,
  title,
}) => {
  const rows = grid.length;
  const cols = grid.reduce((widest, row) => Math.max(widest, row.length), 0);

  const fallbackBox: Size = {
    width: cols * cellSize + Math.max(cols - 1, 0) * GAP + PAD * 2,
    height: rows * cellSize + Math.max(rows - 1, 0) * GAP + PAD * 2,
  };
  const { ref, box } = useCanvasBox(fallbackBox);

  const metrics = computeGridLayout(rows, cols, box);

  if (rows === 0 || cols === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
        alignSelf: "stretch",
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            color: "var(--text-muted)",
            marginBottom: "var(--space-1)",
            textAlign: "center",
          }}
        >
          {title}
        </div>
      )}
      <div
        ref={ref}
        data-testid="canvas-container"
        style={{
          flex: "1 1 auto",
          width: "100%",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
          background: "var(--bg-inset)",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={viewBoxAttr(boxViewBox(box))}
          style={{ display: "block" }}
        >
          {grid.map((row, rIdx) =>
            row.map((gridCell, cIdx) => (
              <GridCellItem
                key={`grid-cell-${rIdx}-${cIdx}`}
                gridCell={gridCell}
                rIdx={rIdx}
                cIdx={cIdx}
                metrics={metrics}
                showDistance={showDistance}
                onCellClick={onCellClick}
              />
            )),
          )}
        </svg>
      </div>
    </div>
  );
};

export default GridVisualizer;
