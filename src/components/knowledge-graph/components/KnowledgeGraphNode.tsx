import React from "react";
import { getAllLearningItems } from "../../../learning/registry";
import { getLearningItemTopics } from "../../../app/topics";
import {
  DSA_TREE_PLACEMENT_MAP,
  DsaCurriculumPlacement,
  topicFamilyColor,
  topicFamilyFill,
  topicFamilyFillHover,
} from "../knowledgeGraphData";

interface KnowledgeGraphNodeProps {
  node: DsaCurriculumPlacement & { width?: number; height?: number };
  hoveredNodeId: string | null;
  onSelectTopic: (topicId: string) => void;
  onHover: (id: string | null) => void;
}

export const KnowledgeGraphNode: React.FC<KnowledgeGraphNodeProps> = ({
  node,
  hoveredNodeId,
  onSelectTopic,
  onHover,
}) => {
  const width = node.width ?? 190;
  const height = node.height ?? 64;
  const [isFocused, setIsFocused] = React.useState(false);
  const isHovered = hoveredNodeId === node.id;
  const hoveredNode =
    hoveredNodeId !== null ? DSA_TREE_PLACEMENT_MAP.get(hoveredNodeId) : undefined;
  const isRelated =
    hoveredNodeId !== null &&
    (node.prerequisites.includes(hoveredNodeId) ||
      (hoveredNode?.prerequisites.includes(node.id) ?? false));

  const actualCount = React.useMemo(() => {
    return getAllLearningItems().filter((item) =>
      getLearningItemTopics(item).includes(node.topicId),
    ).length;
  }, [node.topicId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelectTopic(node.topicId);
    }
  };

  const activeFocusOrHover = isHovered || isFocused;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${node.title}. ${node.description}. Difficulty: ${node.difficulty}. Click or press Enter to view topics.`}
      transform={`translate(${node.x - width / 2}, ${node.y - height / 2})`}
      onClick={() => onSelectTopic(node.topicId)}
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
        width={width}
        height={height}
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
              isHovered ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
            }`}
          >
            {actualCount} {actualCount === 1 ? "Problem" : "Problems"} • {node.difficulty}
          </span>
        </div>
      </foreignObject>
    </g>
  );
};
