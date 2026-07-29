import React from "react";
import { ArrayElement } from "../../../types/dsa";
import { PointerChips } from "./PointerChips";
import { ArrayMetrics } from "./layoutEngine";
import { stateBg, stateColor } from "./arrayTypes";

export interface ArrayItemProps {
  item: ArrayElement;
  index: number;
  metrics: ArrayMetrics;
}

export const ArrayItem: React.FC<ArrayItemProps> = ({ item, index, metrics }) => {
  const x = metrics.startX + index * (metrics.barWidth + metrics.run.gap);
  const fill = stateBg(item.state);
  const stroke = stateColor(item.state);
  const strokeWidth = item.state === "default" ? 1.25 : 2.5;
  const pointers = item.pointers;

  if (!metrics.isBoxMode) {
    const numVal = typeof item.value === "number" ? item.value : Number(item.value) || 1;
    const barHeight = Math.max(
      (numVal / metrics.maxVal) * metrics.bandHeight,
      metrics.minBarHeight,
    );
    const y = metrics.baselineY - barHeight;
    const valueInside = barHeight >= metrics.valueFont * 1.9;

    return (
      <g key={item.id ?? `arr-node-${index}`}>
        {pointers && pointers.length > 0 && (
          <PointerChips
            pointers={pointers}
            centerX={x + metrics.barWidth / 2}
            baseY={valueInside ? y : y - metrics.valueFont * 1.4}
            rowHeight={metrics.pointerRowH}
            fontSize={metrics.pointerFont}
          />
        )}

        <rect
          x={x}
          y={y}
          width={metrics.barWidth}
          height={barHeight}
          rx={metrics.barRadius}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        <text
          x={x + metrics.barWidth / 2}
          y={valueInside ? y + barHeight / 2 : y - metrics.valueFont * 0.8}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-primary)"
          fontFamily="var(--font-code)"
          fontWeight="600"
          fontSize={metrics.valueFont}
        >
          {item.value}
        </text>

        {metrics.showIndices && (
          <text
            x={x + metrics.barWidth / 2}
            y={metrics.labelY}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text-muted)"
            fontFamily="var(--font-code)"
            fontSize={metrics.indexFont}
          >
            [{index}]
          </text>
        )}
      </g>
    );
  }

  return (
    <g key={item.id ?? `arr-node-${index}`}>
      {pointers && pointers.length > 0 && (
        <PointerChips
          pointers={pointers}
          centerX={x + metrics.barWidth / 2}
          baseY={metrics.boxY}
          rowHeight={metrics.pointerRowH}
          fontSize={metrics.pointerFont}
        />
      )}

      <rect
        x={x}
        y={metrics.boxY}
        width={metrics.barWidth}
        height={metrics.boxSize}
        rx={metrics.barRadius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <text
        x={x + metrics.barWidth / 2}
        y={metrics.boxY + metrics.boxSize / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-primary)"
        fontFamily="var(--font-code)"
        fontWeight="600"
        fontSize={metrics.valueFont}
      >
        {item.value}
      </text>

      {metrics.showIndices && (
        <text
          x={x + metrics.barWidth / 2}
          y={metrics.labelY}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-muted)"
          fontFamily="var(--font-code)"
          fontSize={metrics.indexFont}
        >
          [{index}]
        </text>
      )}
    </g>
  );
};
