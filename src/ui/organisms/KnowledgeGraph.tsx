import React, { useMemo, useState } from "react";
import { DSA_TREE_PLACEMENTS } from "../../components/knowledge-graph/knowledgeGraphData";
import { KnowledgeGraphLegend } from "../../components/knowledge-graph/components/KnowledgeGraphLegend";
import { KnowledgeGraphConnections } from "../../components/knowledge-graph/components/KnowledgeGraphConnections";
import { KnowledgeGraphNode } from "../../components/knowledge-graph/components/KnowledgeGraphNode";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "../../components/primitives/vizGeometry";
import { layoutResponsiveGraph } from "../../components/knowledge-graph/responsiveGraphLayout";

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
  const { ref: canvasRef, box: measuredBox } = useCanvasBox({ width: 1200, height: 1 });
  const layout = useMemo(
    () => layoutResponsiveGraph(DSA_TREE_PLACEMENTS, { width: measuredBox.width, height: 0 }),
    [measuredBox.width],
  );
  const positionedPlacements = layout.nodes;
  const canvasBox = { width: measuredBox.width, height: layout.canvasHeight };

  return (
    <div
      role="region"
      aria-label="Interactive Data Structures and Algorithms Prerequisite Roadmap"
      className="w-full flex flex-col items-center justify-center mx-auto gap-4 relative"
    >
      <KnowledgeGraphLegend />

      <div className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-3 shadow-2xl relative mx-auto">
        <div ref={canvasRef} style={{ width: "100%", height: `${layout.canvasHeight}px` }}>
          <svg
            width="100%"
            height="100%"
            viewBox={viewBoxAttr(boxViewBox(canvasBox))}
            className="block relative z-0 drop-shadow-sm"
          >
            <KnowledgeGraphConnections
              hoveredNodeId={hoveredNodeId}
              placements={positionedPlacements}
            />

            {positionedPlacements.map((node) => (
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
    </div>
  );
};
