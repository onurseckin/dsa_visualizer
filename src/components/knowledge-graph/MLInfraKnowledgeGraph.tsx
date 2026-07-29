import React, { useState, useMemo } from "react";
import { getAllLearningItems } from "../../learning/registry";
import { getLearningItemTopics } from "../../app/topics";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "../primitives/vizGeometry";
import { layoutResponsiveGraph } from "./responsiveGraphLayout";
import { usePanZoom } from "./usePanZoom";
import {
  ML_INFRA_FAMILIES,
  ML_INFRA_TREE_PLACEMENTS,
  ML_INFRA_TREE_PLACEMENT_MAP,
  MLInfraFamily,
  MLInfraCurriculumPlacement,
  mlInfraFamilyColor,
  mlInfraFamilyFill,
  mlInfraFamilyFillHover,
} from "./mlInfraTree";

export {
  ML_INFRA_FAMILIES,
  ML_INFRA_TREE_PLACEMENTS,
  ML_INFRA_TREE_PLACEMENT_MAP,
  mlInfraFamilyColor,
  mlInfraFamilyFill,
  mlInfraFamilyFillHover,
  mlInfraFamilyLabel,
} from "./mlInfraTree";
export type { MLInfraCurriculumPlacement, MLInfraFamily, MLInfraFamilyId } from "./mlInfraTree";

interface MLInfraKnowledgeGraphProps {
  onSelectTopic?: (topicId: string) => void;
}

export const MLInfraKnowledgeGraph: React.FC<MLInfraKnowledgeGraphProps> = ({ onSelectTopic }) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const { ref: canvasRef, box: measuredBox } = useCanvasBox({ width: 1200, height: 1 });
  const { scale, pan, isPanning, containerProps, controls } = usePanZoom();

  const problemCountByTopicId = useMemo(() => {
    const counts = new Map<string, number>();
    getAllLearningItems().forEach((item) => {
      const topics = getLearningItemTopics(item);
      topics.forEach((topicId) => {
        counts.set(topicId, (counts.get(topicId) ?? 0) + 1);
      });
    });
    return counts;
  }, []);

  const handleSelectNode = (node: MLInfraCurriculumPlacement) => {
    onSelectTopic?.(node.topicId);
  };

  const hoveredNode = hoveredNodeId ? ML_INFRA_TREE_PLACEMENT_MAP.get(hoveredNodeId) : undefined;
  const layout = useMemo(() => {
    return layoutResponsiveGraph(ML_INFRA_TREE_PLACEMENTS, { width: measuredBox.width, height: 0 });
  }, [measuredBox.width]);

  const positionedPlacements = layout.nodes;
  const canvasHeight = layout.canvasHeight;
  const canvasWidth = layout.canvasWidth;
  const canvasBox = { width: canvasWidth, height: canvasHeight };
  const positionedPlacementMap = useMemo(
    () => new Map(positionedPlacements.map((placement) => [placement.id, placement])),
    [positionedPlacements],
  );

  return (
    <div
      role="region"
      aria-label="Interactive Machine Learning Systems & Infrastructure Prerequisite Roadmap"
      className="w-full flex flex-col items-center justify-center mx-auto gap-4 relative"
    >
      {/* Legend Header */}
      <ul
        aria-label="Topic Family Legend"
        className="w-full flex flex-wrap items-center justify-center gap-3 md:gap-6 px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-xs font-medium text-[var(--text-secondary)] shadow-sm list-none"
      >
        {ML_INFRA_FAMILIES.map((family: MLInfraFamily) => (
          <li key={family.id} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full border shadow-sm"
              style={{
                backgroundColor: mlInfraFamilyFill(family.id),
                borderColor: mlInfraFamilyColor(family.id),
              }}
            />
            {family.label}
          </li>
        ))}
      </ul>

      {/* Main Card Container */}
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
          data-testid="ml-infra-canvas"
          {...containerProps}
          className={`w-full overflow-hidden select-none ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
          style={{
            width: "100%",
            height: `${canvasHeight}px`,
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
              <defs>
                {ML_INFRA_FAMILIES.map((family: MLInfraFamily) => (
                  <marker
                    key={family.id}
                    id={`ml-arrow-${family.id}`}
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path
                      d="M 0 1.5 L 8 5 L 0 8.5 z"
                      fill={mlInfraFamilyColor(family.id)}
                      opacity="0.85"
                    />
                  </marker>
                ))}
                <marker
                  id="ml-arrow-active"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--accent)" />
                </marker>
              </defs>

              {/* Connectors Group */}
              <g className="connectors">
                {positionedPlacements.map((node) =>
                  node.prerequisites.map((prereqId: string) => {
                    const parent = positionedPlacementMap.get(prereqId);
                    if (!parent) return null;

                    const isHovered = hoveredNodeId === node.id || hoveredNodeId === parent.id;
                    const isHighlighted = isHovered;

                    const strokeColor = isHighlighted
                      ? "var(--accent)"
                      : mlInfraFamilyColor(node.family);
                    const strokeWidth = isHighlighted ? 2.5 : 1.75;
                    const strokeOpacity = hoveredNodeId ? (isHighlighted ? 1 : 0.25) : 0.8;

                    let startX = parent.x;
                    let startY = parent.y + parent.height / 2;
                    let endX = node.x;
                    let endY = node.y - node.height / 2;

                    if (parent.y === node.y) {
                      if (parent.x < node.x) {
                        startX = parent.x + parent.width / 2;
                        startY = parent.y;
                        endX = node.x - node.width / 2;
                        endY = node.y;
                      } else {
                        startX = parent.x - parent.width / 2;
                        startY = parent.y;
                        endX = node.x + node.width / 2;
                        endY = node.y;
                      }
                    }

                    const midY = (startY + endY) / 2;

                    const pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

                    return (
                      <path
                        key={`${prereqId}->${node.id}`}
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={isHighlighted ? "none" : "5 5"}
                        markerEnd={
                          isHighlighted ? "url(#ml-arrow-active)" : `url(#ml-arrow-${node.family})`
                        }
                        style={{
                          opacity: strokeOpacity,
                          transition: "all var(--transition-normal)",
                        }}
                      />
                    );
                  }),
                )}
              </g>

              {/* Nodes Group */}
              <g className="nodes">
                {positionedPlacements.map((node) => {
                  const isHovered = hoveredNodeId === node.id;
                  const isFocused = focusedNodeId === node.id;
                  const activeFocusOrHover = isHovered || isFocused;
                  const isRelated =
                    hoveredNodeId !== null &&
                    (node.prerequisites.includes(hoveredNodeId) ||
                      (hoveredNode?.prerequisites.includes(node.id) ?? false));

                  const width = node.width;
                  const height = node.height;

                  const handleKeyDown = (e: React.KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectNode(node);
                    }
                  };

                  const problemCount = problemCountByTopicId.get(node.topicId) ?? 0;

                  return (
                    <g
                      key={node.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${node.title}. ${node.description}. Difficulty: ${node.difficulty}. Click or press Enter to view topics.`}
                      transform={`translate(${node.x - width / 2}, ${node.y - node.height / 2})`}
                      onClick={() => handleSelectNode(node)}
                      onKeyDown={handleKeyDown}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onFocus={() => {
                        setFocusedNodeId(node.id);
                        setHoveredNodeId(node.id);
                      }}
                      onBlur={() => {
                        setFocusedNodeId(null);
                        setHoveredNodeId(null);
                      }}
                      style={{
                        cursor: "pointer",
                        outline: "none",
                        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                      className={isHovered ? "scale-[1.02]" : ""}
                    >
                      <rect
                        width={width}
                        height={node.height}
                        rx="12"
                        fill={
                          activeFocusOrHover
                            ? mlInfraFamilyFillHover(node.family)
                            : mlInfraFamilyFill(node.family)
                        }
                        stroke={
                          activeFocusOrHover
                            ? "var(--border-accent)"
                            : isRelated
                              ? mlInfraFamilyColor(node.family)
                              : "var(--border-default)"
                        }
                        strokeWidth={activeFocusOrHover ? 2.5 : 1.5}
                        style={{
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          filter: activeFocusOrHover
                            ? "drop-shadow(0 12px 24px rgba(0,0,0,0.5))"
                            : "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
                        }}
                      />

                      <foreignObject
                        x="0"
                        y="0"
                        width={width}
                        height={height}
                        className="overflow-visible pointer-events-none"
                      >
                        <div className="w-full h-full p-3 flex flex-col justify-between items-center text-center box-border select-none overflow-hidden">
                          <span
                            className={`font-bold text-[12.5px] leading-snug break-words transition-colors duration-300 ${
                              isHovered ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                            }`}
                          >
                            {node.title}
                          </span>
                          <span
                            className={`font-mono text-[10.5px] whitespace-nowrap transition-colors duration-300 mt-auto pt-1.5 shrink-0 ${
                              isHovered
                                ? "text-[var(--text-secondary)]"
                                : "text-[var(--text-muted)]"
                            }`}
                          >
                            {problemCount} {problemCount === 1 ? "Problem" : "Problems"} •{" "}
                            {node.difficulty}
                          </span>
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLInfraKnowledgeGraph;
