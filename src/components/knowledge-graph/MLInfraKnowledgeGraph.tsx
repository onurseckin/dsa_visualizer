import React, { useState, useMemo } from "react";
import { getAllLearningItems } from "../../learning/registry";
import { getLearningItemTopics } from "../../app/topics";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "../primitives/vizGeometry";
import { layoutResponsiveGraph } from "./responsiveGraphLayout";
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

export interface MLInfraKnowledgeGraphProps {
  onSelectTopic?: (topicId: string) => void;
}

const ML_INFRA_CANVAS_FALLBACK = { width: 1200, height: 1 };

export const MLInfraKnowledgeGraph: React.FC<MLInfraKnowledgeGraphProps> = ({ onSelectTopic }) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const { ref: canvasRef, box: measuredBox } = useCanvasBox(ML_INFRA_CANVAS_FALLBACK);

  const problemCountByTopicId = useMemo(() => {
    const counts = new Map<string, number>();
    getAllLearningItems().forEach((item) => {
      getLearningItemTopics(item).forEach((topicId) => {
        counts.set(topicId, (counts.get(topicId) ?? 0) + 1);
      });
    });
    return counts;
  }, []);

  const handleSelectNode = (node: MLInfraCurriculumPlacement) => {
    onSelectTopic?.(node.topicId);
  };

  const hoveredNode = hoveredNodeId ? ML_INFRA_TREE_PLACEMENT_MAP.get(hoveredNodeId) : undefined;
  const positionedPlacements = useMemo(() => {
    return layoutResponsiveGraph(ML_INFRA_TREE_PLACEMENTS, { width: measuredBox.width, height: 0 })
      .nodes;
  }, [measuredBox]);
  const canvasHeight = layoutResponsiveGraph(ML_INFRA_TREE_PLACEMENTS, {
    width: measuredBox.width,
    height: 0,
  }).canvasHeight;
  const canvasBox = { width: measuredBox.width, height: canvasHeight };
  const positionedPlacementMap = useMemo(
    () => new Map(positionedPlacements.map((placement) => [placement.id, placement])),
    [positionedPlacements],
  );

  return (
    <div
      role="region"
      aria-label="ML Infrastructure Knowledge Tree"
      className="w-full flex flex-col items-center justify-center mx-auto gap-4 relative"
    >
      {/* Legend Header */}
      <ul
        aria-label="Topic family colors"
        className="bg-[#141418]/90 backdrop-blur-xl border border-white/15 px-6 py-3 rounded-full shadow-xl mb-6 flex flex-wrap items-center justify-center gap-5 list-none mx-auto relative z-10"
      >
        {ML_INFRA_FAMILIES.map((family: MLInfraFamily) => (
          <li
            key={family.id}
            className="text-xs font-semibold text-neutral-200 tracking-wide inline-flex items-center gap-2"
          >
            <span
              aria-hidden="true"
              className="w-3.5 h-3.5 rounded-full shadow-[0_0_8px_currentColor] opacity-90"
              style={{
                background: mlInfraFamilyColor(family.id),
                color: mlInfraFamilyColor(family.id),
              }}
            />
            {family.label}
          </li>
        ))}
      </ul>

      {/* Main Card Container */}
      <div className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-3 shadow-2xl relative mx-auto">
        <div
          ref={canvasRef}
          data-testid="ml-infra-canvas"
          style={{
            width: "100%",
            height: `${canvasHeight}px`,
            overflow: "hidden",
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

                    <text
                      x={width / 2}
                      y="28"
                      textAnchor="middle"
                      textLength={Math.max(width - 20, 1)}
                      lengthAdjust="spacingAndGlyphs"
                      fill={isHovered ? "var(--accent)" : "var(--text-primary)"}
                      className="font-bold text-[13px] transition-all duration-300"
                    >
                      {node.title}
                    </text>

                    <text
                      x={width / 2}
                      y="48"
                      textAnchor="middle"
                      fill={isHovered ? "var(--text-secondary)" : "var(--text-muted)"}
                      className="font-mono text-[11px] transition-all duration-300"
                    >
                      {problemCount} {problemCount === 1 ? "Problem" : "Problems"} •{" "}
                      {node.difficulty}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default MLInfraKnowledgeGraph;
