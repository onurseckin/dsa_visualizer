import React from "react";
import { getAllAlgorithms } from "../../../algorithms/registry";
import { getAlgorithmCategories } from "../../../app/categories";
import type { CategoryType } from "../../../types/dsa";
import {
  TOPIC_ROADMAP_NODE_MAP,
  TopicRoadmapNode,
  topicFamilyColor,
  topicFamilyFill,
  topicFamilyFillHover,
} from "../knowledgeGraphData";

interface KnowledgeGraphNodeProps {
  node: TopicRoadmapNode;
  hoveredNodeId: string | null;
  onSelectCategoryFolder: (folder: string) => void;
  onHover: (id: string | null) => void;
}

export const KnowledgeGraphNode: React.FC<KnowledgeGraphNodeProps> = ({
  node,
  hoveredNodeId,
  onSelectCategoryFolder,
  onHover,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const isHovered = hoveredNodeId === node.id;
  const hoveredNode =
    hoveredNodeId !== null ? TOPIC_ROADMAP_NODE_MAP.get(hoveredNodeId) : undefined;
  const isRelated =
    hoveredNodeId !== null &&
    (node.prerequisites.includes(hoveredNodeId) ||
      (hoveredNode?.prerequisites.includes(node.id) ?? false));

  const actualCount = React.useMemo(() => {
    const allAlgs = getAllAlgorithms();
    const count = allAlgs.filter((alg) => {
      const cats = getAlgorithmCategories(alg);
      return (
        cats.includes(node.categoryFolder as CategoryType) ||
        alg.category === node.categoryFolder ||
        alg.mlInfraCategory === node.categoryFolder
      );
    }).length;
    return count > 0 ? count : node.algorithmCount;
  }, [node.categoryFolder, node.algorithmCount]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelectCategoryFolder(node.categoryFolder);
    }
  };

  const activeFocusOrHover = isHovered || isFocused;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${node.title}. ${node.description}. Difficulty: ${node.difficulty}. Click or press Enter to view topics.`}
      transform={`translate(${node.x - 95}, ${node.y - 32})`}
      onClick={() => onSelectCategoryFolder(node.categoryFolder)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => {
        setIsFocused(true);
        onHover(node.id);
      }}
      onBlur={() => {
        setIsFocused(false);
        onHover(null);
      }}
      style={{
        cursor: "pointer",
        outline: "none",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      className={isHovered ? "scale-[1.02]" : ""}
    >
      <rect
        width="190"
        height="64"
        rx="12"
        fill={activeFocusOrHover ? topicFamilyFillHover(node.family) : topicFamilyFill(node.family)}
        stroke={
          activeFocusOrHover
            ? "var(--border-accent)"
            : isRelated
              ? topicFamilyColor(node.family)
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
        x="95"
        y="28"
        textAnchor="middle"
        fill={isHovered ? "var(--accent)" : "var(--text-primary)"}
        className="font-bold text-[13px] transition-all duration-300"
      >
        {node.title}
      </text>

      <text
        x="95"
        y="48"
        textAnchor="middle"
        fill={isHovered ? "var(--text-secondary)" : "var(--text-muted)"}
        className="font-mono text-[11px] transition-all duration-300"
      >
        {actualCount} {actualCount === 1 ? "Problem" : "Problems"} • {node.difficulty}
      </text>
    </g>
  );
};
