import React from "react";
import { TOPIC_FAMILIES, topicFamilyColor } from "../knowledgeGraphData";

export const KnowledgeGraphLegend: React.FC = () => {
  return (
    <ul
      aria-label="Topic family colors"
      className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 max-w-[1100px] w-full mx-auto mb-2 mt-0 p-4 md:p-5 bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] list-none shadow-sm"
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
