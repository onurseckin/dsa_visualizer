import React, { useState } from "react";
import { DSA_TREE_PLACEMENTS } from "../../components/knowledge-graph/knowledgeGraphData";
import { KnowledgeGraphLegend } from "../../components/knowledge-graph/components/KnowledgeGraphLegend";
import { KnowledgeGraphConnections } from "../../components/knowledge-graph/components/KnowledgeGraphConnections";
import { KnowledgeGraphNode } from "../../components/knowledge-graph/components/KnowledgeGraphNode";

export type {
  TopicFamilyId,
  TopicFamily,
  DsaCurriculumPlacement,
} from "../../components/knowledge-graph/knowledgeGraphData";
export {
  TOPIC_FAMILIES,
  DSA_TREE_PLACEMENTS,
  topicFamilyColor,
  topicFamilyLabel,
} from "../../components/knowledge-graph/knowledgeGraphData";

interface KnowledgeGraphProps {
  onSelectTopic: (topicId: string) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ onSelectTopic }) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  return (
    <div
      role="region"
      aria-label="Interactive Data Structures and Algorithms Prerequisite Roadmap"
      className="w-full flex flex-col items-center justify-center mx-auto gap-4 relative"
    >
      <KnowledgeGraphLegend />

      <div className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl p-8 shadow-2xl relative overflow-hidden mx-auto">
        <svg
          viewBox="-20 -60 1380 1060"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-auto max-w-full mx-auto block relative z-0 drop-shadow-sm"
        >
          <KnowledgeGraphConnections hoveredNodeId={hoveredNodeId} />

          {DSA_TREE_PLACEMENTS.map((node) => (
            <KnowledgeGraphNode
              key={node.id}
              node={node}
              hoveredNodeId={hoveredNodeId}
              onSelectTopic={onSelectTopic}
              onHover={setHoveredNodeId}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};
