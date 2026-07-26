import React from "react";

export interface PointerChipsProps {
  pointers: string[];
  centerX: number;
  baseY: number;
  rowHeight: number;
  fontSize: number;
}

export const PointerChips: React.FC<PointerChipsProps> = ({
  pointers,
  centerX,
  baseY,
  rowHeight,
  fontSize,
}) => {
  const top = Math.max(baseY - pointers.length * rowHeight, 1);

  return (
    <g>
      {pointers.map((ptr, pIdx) => {
        const chipHeight = rowHeight - 4;
        const chipWidth = ptr.length * fontSize * 0.68 + fontSize;
        const chipY = top + pIdx * rowHeight;
        return (
          <g key={`${ptr}-${pIdx}`}>
            <rect
              x={centerX - chipWidth / 2}
              y={chipY}
              width={chipWidth}
              height={chipHeight}
              rx={4}
              fill="var(--accent-soft)"
              stroke="var(--border-accent)"
              strokeWidth={1}
            />
            <text
              x={centerX}
              y={chipY + chipHeight / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--accent)"
              fontSize={fontSize}
              fontFamily="var(--font-code)"
              fontWeight="600"
            >
              {ptr}
            </text>
          </g>
        );
      })}
    </g>
  );
};
