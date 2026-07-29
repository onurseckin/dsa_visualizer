import React, { useMemo, useState } from "react";
import { DSA_TREE_PLACEMENTS } from "../../components/knowledge-graph/knowledgeGraphData";
import { KnowledgeGraphLegend } from "../../components/knowledge-graph/components/KnowledgeGraphLegend";
import { KnowledgeGraphConnections } from "../../components/knowledge-graph/components/KnowledgeGraphConnections";
import { KnowledgeGraphNode } from "../../components/knowledge-graph/components/KnowledgeGraphNode";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "../../components/primitives/vizGeometry";
import { layoutResponsiveGraph } from "../../components/knowledge-graph/responsiveGraphLayout";
import { usePanZoom } from "../../components/knowledge-graph/usePanZoom";

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
  const { scale, pan, isPanning, containerProps, controls } = usePanZoom();

  const layout = useMemo(
    () =>
      layoutResponsiveGraph(
        DSA_TREE_PLACEMENTS,
        { width: measuredBox.width, height: 0 },
      ),
    [measuredBox.width],
  );
  const positionedPlacements = layout.nodes;
  const canvasBox = { width: layout.canvasWidth, height: layout.canvasHeight };

  return (
    <div
      role="region"
      aria-label="Interactive Data Structures and Algorithms Prerequisite Roadmap"
      className="w-full flex flex-col items-center justify-center mx-auto gap-4 relative"
    >
      <KnowledgeGraphLegend />

      <div className="w-full overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 shadow-2xl relative mx-auto min-h-[800px]">
        {/* Floating Zoom Controls HUD */}
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-1.5 bg-[var(--bg-page)]/90 backdrop-blur-md border border-[var(--border-default)] rounded-xl p-1.5 shadow-xl select-none">
          <button
            type="button"
            onClick={controls.zoomOut}
            title="Zoom Out"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-surface)] active:scale-95 text-sm font-bold text-[var(--text-primary)] transition-all cursor-pointer"
          >
            −
          </button>
          <span className="px-2 text-xs font-mono font-semibold text-[var(--text-muted)] min-w-[48px] text-center">
            {controls.scalePercentage}%
          </span>
          <button
            type="button"
            onClick={controls.zoomIn}
            title="Zoom In"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-surface)] active:scale-95 text-sm font-bold text-[var(--text-primary)] transition-all cursor-pointer"
          >
            +
          </button>
          <div className="w-[1px] h-4 bg-[var(--border-default)] mx-1" />
          <button
            type="button"
            onClick={controls.resetPanZoom}
            title="Reset Zoom & Pan"
            className="px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-[var(--bg-surface)] active:scale-95 text-[var(--accent)] transition-all cursor-pointer"
          >
            Reset
          </button>
        </div>

        <div
          ref={canvasRef}
          data-testid="knowledge-graph-canvas"
          {...containerProps}
          className={`w-full overflow-hidden select-none ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
          style={{
            width: "100%",
            height: `${layout.canvasHeight}px`,
          }}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: "top center",
              transition: isPanning ? "none" : "transform 0.15s ease-out",
              width: "100%",
              height: "100%",
            }}
          >
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
    </div>
  );
};
