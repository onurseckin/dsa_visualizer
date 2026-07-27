import React from "react";
import { TOPIC_FAMILIES, topicFamilyColor } from "../knowledgeGraphData";

export const KnowledgeGraphLegend: React.FC = () => {
  return (
    <ul
      aria-label="Topic family colors"
      className="absolute top-8 left-1/2 -translate-x-1/2 z-10 flex flex-wrap items-center justify-center gap-4 px-8 py-4 bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border-subtle)] shadow-lg rounded-full list-none"
    >
      {TOPIC_FAMILIES.map((family) => (
        <li
          key={family.id}
          className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)] text-center"
        >
          <span
            aria-hidden="true"
            className="w-[10px] h-[10px] rounded-full"
            style={{
              background: topicFamilyColor(family.id),
            }}
          />
          {family.label}
        </li>
      ))}
    </ul>
  );
};
