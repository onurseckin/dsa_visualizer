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
      className="flex flex-col items-center p-4 w-full box-border flex-1 overflow-y-auto"
    >
      <div
        role="region"
        aria-label="Interactive Data Structures and Algorithms Prerequisite Roadmap"
        className="w-full overflow-x-auto relative py-4"
      >
        <KnowledgeGraphLegend />

        <svg
          width="1350"
          height="920"
          viewBox="0 0 1350 920"
          className="block mx-auto overflow-visible"
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
