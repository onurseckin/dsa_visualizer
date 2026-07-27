import React from "react";
import { TOPIC_FAMILIES, topicFamilyColor } from "../knowledgeGraphData";

export const KnowledgeGraphLegend: React.FC = () => {
  return (
    <ul
      aria-label="Topic family colors"
      className="bg-[#141418]/90 backdrop-blur-xl border border-white/15 px-6 py-3 rounded-full shadow-xl mb-6 flex flex-wrap items-center justify-center gap-5 list-none mx-auto relative z-10"
    >
      {TOPIC_FAMILIES.map((family) => (
        <li
          key={family.id}
          className="text-xs font-semibold text-neutral-200 tracking-wide inline-flex items-center gap-2"
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
