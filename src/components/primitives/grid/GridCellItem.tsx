import React from "react";
import { GridCellNode } from "../../../types/dsa";
import { GridMetrics } from "./layoutEngine";
import { getCellAppearance } from "./gridTypes";

export interface GridCellItemProps {
  gridCell: GridCellNode;
  rIdx: number;
  cIdx: number;
  metrics: GridMetrics;
  showDistance?: boolean;
  onCellClick?: (row: number, col: number) => void;
}

export const GridCellItem: React.FC<GridCellItemProps> = ({
  gridCell,
  rIdx,
  cIdx,
  metrics,
  showDistance = true,
  onCellClick,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const appearance = getCellAppearance(gridCell);
  const distLabel =
    showDistance && gridCell.distance !== undefined && gridCell.distance !== Infinity
      ? String(gridCell.distance)
      : "";
  const cellText = appearance.symbol ? appearance.symbol : distLabel;

  const x = metrics.originX + cIdx * (metrics.cell + metrics.gap);
  const y = metrics.originY + rIdx * (metrics.cell + metrics.gap);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && onCellClick) {
      e.preventDefault();
      onCellClick(rIdx, cIdx);
    }
  };

  return (
    <g
      role={onCellClick ? "button" : undefined}
      tabIndex={onCellClick ? 0 : undefined}
      aria-label={
        onCellClick
          ? `Row ${rIdx + 1}, Column ${cIdx + 1}${cellText ? `: ${cellText}` : ""}`
          : undefined
      }
      onClick={() => onCellClick?.(rIdx, cIdx)}
      onKeyDown={handleKeyDown}
      onFocus={onCellClick ? () => setIsFocused(true) : undefined}
      onBlur={onCellClick ? () => setIsFocused(false) : undefined}
      style={{ cursor: onCellClick ? "pointer" : "default", outline: "none" }}
    >
      <title>
        {`Row ${rIdx}, Col ${cIdx}${
          gridCell.distance !== undefined ? ` | Dist: ${gridCell.distance}` : ""
        }`}
      </title>
      <rect
        x={x}
        y={y}
        width={metrics.cell}
        height={metrics.cell}
        rx={metrics.radius}
        fill={appearance.bg}
        stroke={isFocused ? "var(--border-accent)" : appearance.border}
        strokeWidth={
          (isFocused ? Math.max(2, appearance.strokeWidth * 1.5) : appearance.strokeWidth) *
          metrics.strokeScale
        }
      />
      {cellText && (
        <text
          x={x + metrics.cell / 2}
          y={y + metrics.cell / 2}
          dominantBaseline="central"
          textAnchor="middle"
          fill={appearance.color}
          fontSize={metrics.font}
          fontFamily="var(--font-code)"
          fontWeight="600"
        >
          {cellText}
        </text>
      )}
    </g>
  );
};
