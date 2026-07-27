import React, { useState } from "react";
import { TOPIC_ROADMAP_NODES } from "../../components/knowledge-graph/knowledgeGraphData";
import { KnowledgeGraphLegend } from "../../components/knowledge-graph/components/KnowledgeGraphLegend";
import { KnowledgeGraphConnections } from "../../components/knowledge-graph/components/KnowledgeGraphConnections";
import { KnowledgeGraphNode } from "../../components/knowledge-graph/components/KnowledgeGraphNode";

export type {
  TopicFamilyId,
  TopicFamily,
  TopicRoadmapNode,
} from "../../components/knowledge-graph/knowledgeGraphData";
export {
  TOPIC_FAMILIES,
  TOPIC_ROADMAP_NODES,
  topicFamilyColor,
  topicFamilyLabel,
} from "../../components/knowledge-graph/knowledgeGraphData";

interface KnowledgeGraphProps {
  onSelectCategoryFolder: (folder: string) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ onSelectCategoryFolder }) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  return (
    <div
      role="region"
      aria-label="Interactive Data Structures and Algorithms Prerequisite Roadmap"
      className="w-full relative p-6 md:p-8 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-md flex flex-col items-center justify-center mx-auto gap-4"
    >
      <KnowledgeGraphLegend />

      <div className="w-full p-6 md:p-8 bg-gradient-to-b from-[var(--bg-inset)]/80 to-[var(--bg-inset)]/30 backdrop-blur-xl border border-[var(--border-default)] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden mx-auto relative before:absolute before:inset-0 before:pointer-events-none before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiIvPjwvc3ZnPg==')] before:opacity-50">
        <svg
          viewBox="-20 50 1380 950"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-auto max-w-full mx-auto block relative z-0 drop-shadow-sm"
        >
          <KnowledgeGraphConnections hoveredNodeId={hoveredNodeId} />

          {TOPIC_ROADMAP_NODES.map((node) => (
            <KnowledgeGraphNode
              key={node.id}
              node={node}
              hoveredNodeId={hoveredNodeId}
              onSelectCategoryFolder={onSelectCategoryFolder}
              onHover={setHoveredNodeId}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};
