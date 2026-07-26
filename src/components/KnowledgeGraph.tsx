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
      className="flex flex-col items-center p-6 w-full max-w-[1400px] mx-auto box-border flex-1 overflow-y-auto"
    >
      <div className="w-full mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Knowledge Tree</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Interactive Data Structures and Algorithms Prerequisite Roadmap
        </p>
      </div>

      <div
        role="region"
        aria-label="Interactive Data Structures and Algorithms Prerequisite Roadmap"
        className="w-full overflow-x-auto relative p-6 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-md flex flex-col items-center"
      >
        <KnowledgeGraphLegend />

        <svg
          width="1350"
          height="920"
          viewBox="0 0 1350 920"
          className="block mx-auto max-w-full h-auto overflow-visible"
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
    </main>
  );
};
