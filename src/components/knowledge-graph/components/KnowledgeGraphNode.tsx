import React from "react";
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
      transform={`translate(${node.x - 90}, ${node.y - 30})`}
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
      style={{ cursor: "pointer", outline: "none" }}
    >
      <rect
        width="180"
        height="60"
        rx="10"
        fill={activeFocusOrHover ? topicFamilyFillHover(node.family) : topicFamilyFill(node.family)}
        stroke={
          activeFocusOrHover
            ? "var(--border-accent)"
            : isRelated
              ? topicFamilyColor(node.family)
              : "var(--border-default)"
        }
        strokeWidth={activeFocusOrHover ? 2 : 1}
        style={{ transition: "all var(--transition-normal)" }}
      />

      <rect x="7" y="14" width="4" height="32" rx="2" fill={topicFamilyColor(node.family)} />

      <text
        x="90"
        y="24"
        textAnchor="middle"
        fill={isHovered ? "var(--accent)" : "var(--text-primary)"}
        fontSize="11.5"
        fontWeight="600"
        fontFamily="var(--font-ui)"
      >
        {node.title}
      </text>

      <text
        x="90"
        y="44"
        textAnchor="middle"
        fill="var(--text-secondary)"
        fontSize="10"
        fontFamily="var(--font-code)"
      >
        {node.algorithmCount} Algs • {node.difficulty}
      </text>
    </g>
  );
};
