import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";
import {
  elementStateToken,
  MatrixVisualSnapshot,
  AuxiliaryState,
  DisplayValue,
} from "../../types/dsa";
import { CanvasAuxiliaryOverlay } from "./CanvasAuxiliaryOverlay";

export interface MatrixVisualizerProps {
  rows: number;
  cols: number;
  cells: MatrixVisualSnapshot["cells"];
  rowHeaders?: string[];
  colHeaders?: string[];
  title?: string;
  auxiliaryState?: AuxiliaryState;
  variables?: Record<string, DisplayValue>;
}

export const MatrixVisualizer: React.FC<MatrixVisualizerProps> = ({
  rows,
  cols,
  cells,
  rowHeaders,
  colHeaders,
  title,
  auxiliaryState,
  variables,
}) => {
  const { ref, box } = useCanvasBox({ width: 800, height: 500 });

  const numRows = Math.max(rows, 1);
  const numCols = Math.max(cols, 1);

  const startX = rowHeaders ? 80 : 40;
  const startY = colHeaders ? 60 : 40;
  const availW = Math.max(box.width - startX - 40, 1);
  const availH = Math.max(box.height - startY - 40, 1);

  const cellW = Math.max(40, availW / numCols);
  const cellH = Math.max(30, availH / numRows);

  const cellMap = new Map<string, MatrixVisualSnapshot["cells"][0]>();
  cells.forEach((c) => cellMap.set(`${c.row}-${c.col}`, c));

  const getCellFill = (state: MatrixVisualSnapshot["cells"][number]["state"]) => {
    const token = state ? elementStateToken(state) : "default";
    switch (token) {
      case "active":
        return "rgba(59, 130, 246, 0.25)";
      case "compare":
        return "rgba(245, 158, 11, 0.25)";
      case "sorted":
      case "pivot":
        return "rgba(16, 185, 129, 0.25)";
      default:
        return "var(--bg-surface)";
    }
  };

  const getCellStroke = (state: MatrixVisualSnapshot["cells"][number]["state"]) => {
    const token = state ? elementStateToken(state) : "default";
    switch (token) {
      case "active":
        return "var(--accent)";
      case "compare":
        return "#f59e0b";
      case "sorted":
      case "pivot":
        return "#10b981";
      default:
        return "var(--border-default)";
    }
  };

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
          padding: 0,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={viewBoxAttr(boxViewBox(box))}
          style={{ display: "block" }}
        >
          {/* Col Headers */}
          {colHeaders &&
            colHeaders.map((header, cIdx) => (
              <text
                key={`col-${cIdx}`}
                x={startX + cIdx * cellW + cellW / 2}
                y={startY - 12}
                fill="var(--text-muted)"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
              >
                {header}
              </text>
            ))}

          {/* Row Headers */}
          {rowHeaders &&
            rowHeaders.map((header, rIdx) => (
              <text
                key={`row-${rIdx}`}
                x={startX - 12}
                y={startY + rIdx * cellH + cellH / 2 + 4}
                fill="var(--text-muted)"
                fontSize="12"
                fontWeight="bold"
                textAnchor="end"
              >
                {header}
              </text>
            ))}

          {/* Grid Cells */}
          {Array.from({ length: numRows }).map((_, r) =>
            Array.from({ length: numCols }).map((_, c) => {
              const cell = cellMap.get(`${r}-${c}`);
              const cx = startX + c * cellW;
              const cy = startY + r * cellH;

              return (
                <g key={`cell-${r}-${c}`}>
                  <rect
                    x={cx}
                    y={cy}
                    width={cellW - 4}
                    height={cellH - 4}
                    rx={6}
                    fill={getCellFill(cell?.state)}
                    stroke={getCellStroke(cell?.state)}
                    strokeWidth={cell?.state && cell.state !== "default" ? 2 : 1}
                  />
                  <text
                    x={cx + (cellW - 4) / 2}
                    y={cy + (cellH - 4) / 2 + 5}
                    fill="var(--text-primary)"
                    fontSize="13"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {cell ? cell.value : "-"}
                  </text>
                </g>
              );
            }),
          )}
          <CanvasAuxiliaryOverlay box={box} state={auxiliaryState} variables={variables} />
        </svg>
      </div>
    </div>
  );
};
