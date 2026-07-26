import React from "react";
import { TreeLegendEntry } from "./treeTypes";

export interface TreeLegendProps {
  legend: TreeLegendEntry[];
}

export const TreeLegend: React.FC<TreeLegendProps> = ({ legend }) => {
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
          <span
            aria-hidden="true"
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "var(--radius-full)",
              background: entry.color,
            }}
          />
          {entry.label}
        </span>
      ))}
    </div>
  );
};
