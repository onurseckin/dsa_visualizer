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

      <div className="w-full p-6 md:p-8 bg-[var(--bg-inset)]/50 backdrop-blur-md border border-[var(--border-subtle)] rounded-[var(--radius-lg)] overflow-hidden mx-auto">
        <svg
          viewBox="-20 50 1380 950"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-auto max-w-full mx-auto block"
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
