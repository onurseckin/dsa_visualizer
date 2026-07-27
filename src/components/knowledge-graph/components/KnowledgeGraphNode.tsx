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
      transform={`translate(${node.x - 100}, ${node.y - 36})`}
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
      style={{ cursor: "pointer", outline: "none", transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
      className={isHovered ? "scale-[1.02]" : ""}
    >
      <rect
        width="200"
        height="72"
        rx="16"
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
            : "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" 
        }}
      />

      <rect x="10" y="16" width="6" height="40" rx="3" fill={topicFamilyColor(node.family)} 
            style={{ filter: activeFocusOrHover ? "brightness(1.2)" : "none" }} />

      <text
        x="105"
        y="30"
        textAnchor="middle"
        fill={isHovered ? "var(--accent)" : "var(--text-primary)"}
        fontSize="13.5"
        fontWeight="700"
        letterSpacing="0.01em"
        fontFamily="var(--font-ui)"
        style={{ transition: "all 0.3s ease" }}
      >
        {node.title}
      </text>

      <text
        x="105"
        y="54"
        textAnchor="middle"
        fill={isHovered ? "var(--text-primary)" : "var(--text-secondary)"}
        fontSize="11"
        fontWeight="500"
        fontFamily="var(--font-code)"
        letterSpacing="0.04em"
        style={{ transition: "all 0.3s ease" }}
      >
        {node.algorithmCount} Algs • {node.difficulty}
      </text>
    </g>
  );
};
