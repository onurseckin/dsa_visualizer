import React from "react";
import { Size, boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";
import { ArrayVisualizerProps, FALLBACK_BAR_W, GAP, PAD_X } from "./array/arrayTypes";
import { computeArrayLayout } from "./array/layoutEngine";
import { ArrayItem } from "./array/ArrayItem";

export type { ArrayVisualizerProps };

export const ArrayVisualizer: React.FC<ArrayVisualizerProps> = ({
  elements,
  mode = "bar",
  maxHeight = 220,
  title,
}) => {
  const count = Math.max(elements.length, 1);

  const fallbackBox: Size = {
    width: count * FALLBACK_BAR_W + (count - 1) * GAP + PAD_X * 2,
    height: maxHeight + 48,
  };
  const { ref, box } = useCanvasBox(fallbackBox);

  const metrics = computeArrayLayout(elements, box, mode);

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
        style={{
          flex: "1 1 auto",
          width: "100%",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
          background: "var(--bg-inset)",
          padding: "32px",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={viewBoxAttr(boxViewBox(box))}
          style={{ display: "block" }}
        >
          {elements.map((item, index) => (
            <ArrayItem
              key={item.id || `arr-node-${index}`}
              item={item}
              index={index}
              metrics={metrics}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

export default ArrayVisualizer;
