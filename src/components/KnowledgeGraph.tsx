import React, { useState } from "react";
import { TOPIC_ROADMAP_NODES } from "./knowledge-graph/knowledgeGraphData";
import { KnowledgeGraphLegend } from "./knowledge-graph/components/KnowledgeGraphLegend";
import { KnowledgeGraphConnections } from "./knowledge-graph/components/KnowledgeGraphConnections";
import { KnowledgeGraphNode } from "./knowledge-graph/components/KnowledgeGraphNode";

export type {
  TopicFamilyId,
  TopicFamily,
  TopicRoadmapNode,
} from "./knowledge-graph/knowledgeGraphData";
export {
  TOPIC_FAMILIES,
  TOPIC_ROADMAP_NODES,
  topicFamilyColor,
  topicFamilyLabel,
} from "./knowledge-graph/knowledgeGraphData";

interface KnowledgeGraphProps {
  onSelectCategoryFolder: (folder: string) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ onSelectCategoryFolder }) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  return (
    <main
      aria-label="Algorithm Roadmap"
      className="flex flex-col items-center justify-start text-center p-6 md:p-10 lg:p-12 w-full max-w-full mx-auto box-border flex-1 gap-8 overflow-y-auto"
    >
      <div className="flex flex-col items-center justify-center text-center mx-auto w-full max-w-3xl gap-3 py-6 px-10 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-sm mb-2">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Knowledge Tree</h1>
        <p className="text-base text-[var(--text-secondary)]">
          Interactive Data Structures and Algorithms Prerequisite Roadmap
        </p>
      </div>

      <div
        role="region"
        aria-label="Interactive Data Structures and Algorithms Prerequisite Roadmap"
        className="w-full relative p-6 md:p-8 lg:p-10 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-md flex flex-col items-center justify-center mx-auto gap-6"
      >
        <KnowledgeGraphLegend />

        <div className="w-full p-6 md:p-10 bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] flex items-center justify-center overflow-auto mx-auto">
          <svg
            viewBox="-60 -60 1550 1220"
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
    </main>
  );
};
