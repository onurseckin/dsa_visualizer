import React from "react";
import { Size, boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";
import { ArrayVisualizerProps, FALLBACK_BAR_W, GAP, PAD_X } from "./array/arrayTypes";
import { computeArrayLayout } from "./array/layoutEngine";
import { ArrayItem } from "./array/ArrayItem";
import { CanvasAuxiliaryOverlay } from "./CanvasAuxiliaryOverlay";
import { resolvePrimitiveLabel } from "./primitiveLabels";

export type { ArrayVisualizerProps };

const trimLegacyTitle = (title?: string): string | undefined => title?.trim() || undefined;

export const ArrayVisualizer: React.FC<ArrayVisualizerProps> = ({
  elements,
  mode = "bar",
  density,
  maxHeight = 220,
  name,
  title: rawTitle,
  auxiliaryState,
  variables,
}) => {
  const title = resolvePrimitiveLabel("array", name) ?? trimLegacyTitle(rawTitle);
  const count = Math.max(elements.length, 1);

  const fallbackBox: Size = {
    width: count * FALLBACK_BAR_W + (count - 1) * GAP + PAD_X * 2,
    height: maxHeight + 48,
  };
  const { ref, box } = useCanvasBox(fallbackBox);

  const metrics = computeArrayLayout(elements, box, mode, title, density);

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
          role="img"
          aria-label={title ? `Array visualization: ${title}` : "Array visualization"}
          style={{ display: "block" }}
        >
          {title && (
            <text
              x={metrics.startX - 12}
              y={metrics.isBoxMode ? metrics.boxY + metrics.boxSize / 2 : metrics.baselineY - 10}
              textAnchor="end"
              dominantBaseline="central"
              fill="var(--text-muted)"
              fontFamily="var(--font-code)"
              fontSize={density === "compact" ? "11px" : "13px"}
              fontWeight="700"
              letterSpacing="0.02em"
            >
              {title}
            </text>
          )}
          {elements.map((item, index) => (
            <ArrayItem
              key={item.id || `arr-node-${index}`}
              item={item}
              index={index}
              metrics={metrics}
            />
          ))}
          <CanvasAuxiliaryOverlay box={box} state={auxiliaryState} variables={variables} />
        </svg>
      </div>
    </div>
  );
};

export default ArrayVisualizer;
