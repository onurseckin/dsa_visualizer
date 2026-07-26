import React from "react";
import { LegendEntry } from "./graphTypes";

export interface GraphLegendProps {
  legend: LegendEntry[];
}

const legendSwatch = (entry: LegendEntry): React.ReactNode =>
  entry.kind === "group" ? (
    <span
      aria-hidden="true"
      style={{
        width: "10px",
        height: "10px",
        borderRadius: "var(--radius-full)",
        background: entry.color,
      }}
    />
  ) : (
    <span
      aria-hidden="true"
      style={{
        width: "16px",
        height: "2px",
        borderRadius: "var(--radius-full)",
        background: entry.color,
      }}
    />
  );

export const GraphLegend: React.FC<GraphLegendProps> = ({ legend }) => {
  if (legend.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "var(--space-1) var(--space-3)",
        marginTop: "var(--space-1)",
        fontSize: "var(--text-xs)",
        color: "var(--text-secondary)",
      }}
    >
      {legend.map((entry) => (
        <span
          key={entry.key}
          style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}
        >
          {legendSwatch(entry)}
          {entry.label}
        </span>
      ))}
    </div>
  );
};
