import React from "react";
import { TOPIC_FAMILIES, topicFamilyColor } from "../knowledgeGraphData";

const SWATCH_SIZE = "10px";

export const KnowledgeGraphLegend: React.FC = () => {
  return (
    <ul
      aria-label="Topic family colors"
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "var(--space-2) var(--space-4)",
        listStyle: "none",
        margin: "0 auto var(--space-4)",
        padding: 0,
        maxWidth: "1100px",
      }}
    >
      {TOPIC_FAMILIES.map((family) => (
        <li
          key={family.id}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            fontSize: "var(--text-xs)",
            color: "var(--text-secondary)",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: SWATCH_SIZE,
              height: SWATCH_SIZE,
              borderRadius: "var(--radius-full)",
              background: topicFamilyColor(family.id),
            }}
          />
          {family.label}
        </li>
      ))}
    </ul>
  );
};
