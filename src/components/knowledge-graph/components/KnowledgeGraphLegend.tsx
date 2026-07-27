import React from "react";
import { TOPIC_FAMILIES, topicFamilyColor } from "../knowledgeGraphData";

export const KnowledgeGraphLegend: React.FC = () => {
  return (
    <ul
      aria-label="Topic family colors"
      className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 max-w-[1100px] w-full mx-auto p-4 md:p-5 bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] list-none text-center shadow-sm"
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
