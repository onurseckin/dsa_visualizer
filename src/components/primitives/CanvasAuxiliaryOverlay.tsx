import React from "react";
import type { AuxiliaryState, DisplayValue } from "../../types/dsa";

export interface CanvasAuxiliaryOverlayProps {
  box: { width: number; height: number };
  state?: AuxiliaryState;
  variables?: Record<string, DisplayValue>;
}

function formatVal(value: DisplayValue): string {
  if (Array.isArray(value)) {
    return `[${value.map(formatVal).join(", ")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .map(([k, v]) => `${k}:${formatVal(v)}`)
      .join(", ")}}`;
  }
  return String(value);
}

export const CanvasAuxiliaryOverlay: React.FC<CanvasAuxiliaryOverlayProps> = ({
  box,
  state,
  variables,
}) => {
  const stackItems = state?.stack || [];
  const queueItems = state?.queue || [];
  const visitedItems = state?.visited || [];
  const hashMapEntries = Object.entries(state?.hashMap || {});
  const distanceEntries = Object.entries(state?.distanceTable || {});
  const customEntries = Object.entries(state?.customState || {});
  const varEntries = Object.entries(variables || {});

  const items: { label: string; value: string }[] = [];

  if (stackItems.length > 0) {
    items.push({
      label: "Stack",
      value: stackItems.map(formatVal).join(", "),
    });
  }

  if (queueItems.length > 0) {
    items.push({
      label: "Queue",
      value: queueItems.map(formatVal).join(", "),
    });
  }

  if (visitedItems.length > 0) {
    items.push({
      label: "Visited",
      value: visitedItems.map(formatVal).join(", "),
    });
  }

  for (const [k, v] of hashMapEntries) {
    items.push({ label: `Map[${k}]`, value: formatVal(v) });
  }

  for (const [k, v] of distanceEntries) {
    items.push({ label: `Dist[${k}]`, value: v === Infinity ? "∞" : String(v) });
  }

  for (const [k, v] of customEntries) {
    items.push({ label: k, value: formatVal(v) });
  }

  for (const [k, v] of varEntries) {
    items.push({ label: k, value: formatVal(v) });
  }

  if (items.length === 0) return null;

  const width = Math.max(0, box.width);
  const height = Math.max(0, box.height);
  const rowHeight = 20;
  const inset = Math.min(12, width / 2, height / 2);
  const panelWidth = Math.min(220, Math.max(0, width - inset * 2));
  const maxPanelHeight = Math.max(0, height - inset * 2);
  const padding = Math.min(8, maxPanelHeight / 4);
  const maxVisibleRows = Math.floor(Math.max(0, maxPanelHeight - padding * 2) / rowHeight);

  if (panelWidth < 48 || maxVisibleRows === 0) return null;

  const hasOmittedItems = items.length > maxVisibleRows;
  const visibleItems = hasOmittedItems
    ? [
        ...items.slice(0, Math.max(0, maxVisibleRows - 1)),
        { label: "More", value: `+${items.length - Math.max(0, maxVisibleRows - 1)} more` },
      ]
    : items;
  const panelHeight = Math.min(maxPanelHeight, padding * 2 + visibleItems.length * rowHeight);
  const x = Math.max(0, width - panelWidth - inset);
  const y = Math.max(0, inset);

  return (
    <g className="canvas-auxiliary-overlay" data-testid="canvas-auxiliary-overlay">
      <rect
        x={x}
        y={y}
        width={panelWidth}
        height={panelHeight}
        rx={6}
        ry={6}
        fill="var(--bg-surface)"
        fillOpacity={0.9}
        stroke="var(--border-default)"
        strokeWidth={1}
      />
      {visibleItems.map((item, idx) => {
        const itemY = y + padding + idx * rowHeight + 14;
        return (
          <g key={`canvas-aux-${idx}`}>
            <text
              x={x + 8}
              y={itemY}
              fill="var(--text-muted)"
              fontSize="11"
              fontWeight="600"
              fontFamily="var(--font-sans, sans-serif)"
            >
              {item.label}:
            </text>
            <text
              x={x + panelWidth - 8}
              y={itemY}
              fill="var(--text-primary)"
              fontSize="11"
              fontWeight="500"
              textAnchor="end"
              fontFamily="var(--font-mono, monospace)"
            >
              {item.value.length > 20 ? item.value.slice(0, 18) + "…" : item.value}
            </text>
          </g>
        );
      })}
    </g>
  );
};
