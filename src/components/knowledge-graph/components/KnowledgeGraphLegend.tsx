import React from "react";
import { TOPIC_FAMILIES, topicFamilyColor } from "../knowledgeGraphData";

const SWATCH_SIZE = "10px";

export const KnowledgeGraphLegend: React.FC = () => {
  return (
    <ul
      aria-label="Topic family colors"
      className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 max-w-[1100px] mx-auto pt-3 pb-3 px-6 mb-8 bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] list-none text-center"
    >
      {TOPIC_FAMILIES.map((family) => (
        <li
          key={family.id}
          className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)] text-center"
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
