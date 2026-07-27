import React from "react";
import { TOPIC_FAMILIES, topicFamilyColor } from "../knowledgeGraphData";

export const KnowledgeGraphLegend: React.FC = () => {
  return (
    <ul
      aria-label="Topic family colors"
      className="absolute top-8 left-1/2 -translate-x-1/2 z-10 flex flex-wrap items-center justify-center gap-5 px-8 py-4 bg-[var(--bg-surface)]/90 backdrop-blur-xl border border-[var(--border-accent)]/30 shadow-2xl rounded-full list-none transition-all duration-300 hover:shadow-[var(--accent)]/10"
    >
      {TOPIC_FAMILIES.map((family) => (
        <li
          key={family.id}
          className="inline-flex items-center gap-2.5 text-sm text-[var(--text-primary)] font-medium text-center tracking-wide"
        >
          <span
            aria-hidden="true"
            className="w-3.5 h-3.5 rounded-full shadow-[0_0_8px_currentColor] opacity-90"
            style={{
              background: topicFamilyColor(family.id),
              color: topicFamilyColor(family.id),
            }}
          />
          {family.label}
        </li>
      ))}
    </ul>
  );
};
