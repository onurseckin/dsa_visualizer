import React, { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "../../ui";
import {
  ML_INFRA_FAMILIES,
  ML_INFRA_NODES,
  ML_INFRA_NODE_MAP,
  MLInfraFamily,
  MLInfraNode,
  MLInfraQuestionItem,
  mlInfraFamilyColor,
  mlInfraFamilyFill,
  mlInfraFamilyFillHover,
} from "./mlInfraGraphData";

export {
  ML_INFRA_FAMILIES,
  ML_INFRA_NODES,
  ML_INFRA_NODE_MAP,
  mlInfraFamilyColor,
  mlInfraFamilyFill,
  mlInfraFamilyFillHover,
  mlInfraFamilyLabel,
} from "./mlInfraGraphData";
export type {
  MLInfraNode,
  MLInfraFamily,
  MLInfraFamilyId,
  MLInfraQuestionItem,
} from "./mlInfraGraphData";

export interface MLInfraKnowledgeGraphProps {
  onSelectCategoryFolder?: (folder: string) => void;
  onNavigateToAlgorithm?: (algorithmId: string) => void;
}

export const MLInfraKnowledgeGraph: React.FC<MLInfraKnowledgeGraphProps> = ({
  onSelectCategoryFolder,
  onNavigateToAlgorithm,
}) => {
  let navigate: ((opts: { to: string; params?: Record<string, string> }) => void) | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navigate = useNavigate();
  } catch {
    navigate = null;
  }

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [drawerTopicId, setDrawerTopicId] = useState<string | null>(null);

  const activeDrawerTopic = useMemo(() => {
    return drawerTopicId ? ML_INFRA_NODE_MAP.get(drawerTopicId) || null : null;
  }, [drawerTopicId]);

  const handleSelectNode = (node: MLInfraNode) => {
    setDrawerTopicId(node.id);
    if (onSelectCategoryFolder) {
      onSelectCategoryFolder(node.categoryFolder || node.id);
    }
  };

  const handleNavigateQuestion = (algorithmId: string) => {
    if (onNavigateToAlgorithm) {
      onNavigateToAlgorithm(algorithmId);
    } else if (navigate) {
      navigate({ to: "/workspace/$algorithmId", params: { algorithmId } });
    } else if (typeof window !== "undefined") {
      window.location.href = `/workspace/${algorithmId}`;
    }
  };

  const hoveredNode = hoveredNodeId ? ML_INFRA_NODE_MAP.get(hoveredNodeId) : undefined;

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

      {/* Slide-Over Topic Sidebar Drawer */}
      {activeDrawerTopic && (
        <div
          role="dialog"
          aria-label={`${activeDrawerTopic.title} Drawer`}
          className="absolute right-0 top-0 bottom-0 z-30 w-full max-w-md bg-[var(--bg-surface)] border-l border-[var(--border-default)] p-6 shadow-2xl overflow-y-auto flex flex-col gap-5 rounded-r-3xl"
        >
          {/* Drawer Header */}
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border-default)] pb-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {activeDrawerTopic.title}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                {activeDrawerTopic.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDrawerTopicId(null)}
              aria-label="Close Topic Drawer"
              className="p-1.5 rounded-lg bg-[var(--bg-inset)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-page)] transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>

          <Button
            onClick={() =>
              onSelectCategoryFolder?.(activeDrawerTopic.categoryFolder || activeDrawerTopic.id)
            }
          >
            View {activeDrawerTopic.title} Problems in Problem List →
          </Button>

          {/* Prerequisite Topics if any */}
          {activeDrawerTopic.prerequisites.length > 0 && (
            <div className="text-xs text-[var(--text-muted)] flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-[var(--text-secondary)]">Prerequisites:</span>
              {activeDrawerTopic.prerequisites.map((pId: string) => {
                const pTopic = ML_INFRA_NODE_MAP.get(pId);
                return (
                  <span
                    key={pId}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--bg-inset)] text-[var(--accent)] border border-[var(--border-default)]"
                  >
                    {pTopic?.title || pId}
                  </span>
                );
              })}
            </div>
          )}

          {/* Curated Questions List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Curated Problems ({activeDrawerTopic.questions.length})
            </h3>

            {activeDrawerTopic.questions.map((q: MLInfraQuestionItem) => {
              const isFoundational = q.type === "Foundational Math & DSA";

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-default)] hover:border-[var(--border-accent)] transition-all flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        isFoundational
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                          : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                      }`}
                    >
                      {q.type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        q.difficulty === "Easy"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : q.difficulty === "Medium"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">{q.title}</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                      {q.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleNavigateQuestion(q.algorithmId)}
                    className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all cursor-pointer text-center"
                  >
                    Visualize {q.algorithmId} in Workspace →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Card Container */}
      <div className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl p-8 shadow-2xl relative overflow-hidden mx-auto">
        <svg
          width="100%"
          height="100%"
          viewBox="-40 -60 1680 1150"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-auto max-w-full mx-auto block relative z-0 drop-shadow-sm"
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
            {ML_INFRA_NODES.map((node: MLInfraNode) =>
              node.prerequisites.map((prereqId: string) => {
                const parent = ML_INFRA_NODE_MAP.get(prereqId);
                if (!parent) return null;

                const isConnectedToDrawer =
                  drawerTopicId === node.id || drawerTopicId === parent.id;
                const isHovered = hoveredNodeId === node.id || hoveredNodeId === parent.id;
                const isHighlighted = isConnectedToDrawer || isHovered;

                const strokeColor = isHighlighted
                  ? "var(--accent)"
                  : mlInfraFamilyColor(node.family);
                const strokeWidth = isHighlighted ? 2.5 : 1.75;
                const strokeOpacity = hoveredNodeId ? (isHighlighted ? 1 : 0.25) : 0.8;

                let startX = parent.x;
                let startY = parent.y + 32;
                let endX = node.x;
                let endY = node.y - 32;

                if (parent.y === node.y) {
                  const parentWidth = Math.max(190, parent.title.length * 8.5 + 40);
                  const nodeWidth = Math.max(190, node.title.length * 8.5 + 40);
                  if (parent.x < node.x) {
                    startX = parent.x + parentWidth / 2;
                    startY = parent.y;
                    endX = node.x - nodeWidth / 2;
                    endY = node.y;
                  } else {
                    startX = parent.x - parentWidth / 2;
                    startY = parent.y;
                    endX = node.x + nodeWidth / 2;
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
            {ML_INFRA_NODES.map((node: MLInfraNode) => {
              const isHovered = hoveredNodeId === node.id;
              const isFocused = focusedNodeId === node.id;
              const activeFocusOrHover = isHovered || isFocused;
              const isRelated =
                hoveredNodeId !== null &&
                (node.prerequisites.includes(hoveredNodeId) ||
                  (hoveredNode?.prerequisites.includes(node.id) ?? false));

              const width = Math.max(190, node.title.length * 8.5 + 40);

              const handleKeyDown = (e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectNode(node);
                }
              };

              return (
                <g
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.title}. ${node.description}. Difficulty: ${node.difficulty}. Click or press Enter to view topics.`}
                  transform={`translate(${node.x - width / 2}, ${node.y - 32})`}
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
                    height="64"
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
                    {node.algorithmCount} Problems • {node.difficulty}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default MLInfraKnowledgeGraph;
