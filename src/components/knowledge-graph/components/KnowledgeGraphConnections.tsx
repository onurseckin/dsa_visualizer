import React from "react";
import {
  TOPIC_FAMILIES,
  DSA_TREE_PLACEMENTS,
  topicFamilyColor,
  type DsaCurriculumPlacement,
} from "../knowledgeGraphData";

interface KnowledgeGraphConnectionsProps {
  hoveredNodeId: string | null;
  placements?: readonly (DsaCurriculumPlacement & { width?: number; height?: number })[];
}

type PositionedDsaPlacement = DsaCurriculumPlacement & { width?: number; height?: number };

export const KnowledgeGraphConnections: React.FC<KnowledgeGraphConnectionsProps> = ({
  hoveredNodeId,
  placements = DSA_TREE_PLACEMENTS,
}) => {
  const renderConnections = () => {
    const lines: React.ReactNode[] = [];

    placements.forEach((node: PositionedDsaPlacement) => {
      node.prerequisites.forEach((prereqId) => {
        const parent = placements.find(
          (candidate): candidate is PositionedDsaPlacement => candidate.id === prereqId,
        );
        if (parent) {
          const isHighlighted = hoveredNodeId === node.id || hoveredNodeId === parent.id;
          const strokeColor = isHighlighted ? "var(--accent)" : topicFamilyColor(node.family);
          const strokeWidth = isHighlighted ? 2.5 : 1.75;
          const strokeOpacity = hoveredNodeId ? (isHighlighted ? 1 : 0.25) : 0.8;

          let startX = parent.x;
          const parentWidth = parent.width ?? 190;
          const parentHeight = parent.height ?? 64;
          const nodeWidth = node.width ?? 190;
          const nodeHeight = node.height ?? 64;
          let startY = parent.y + Math.min(parentHeight / 2, 30);
          let endX = node.x;
          let endY = node.y - Math.min(nodeHeight / 2, 30);

          if (parent.y === node.y) {
            if (parent.x < node.x) {
              startX = parent.x + Math.min(parentWidth / 2, 90);
              startY = parent.y;
              endX = node.x - Math.min(nodeWidth / 2, 90);
              endY = node.y;
            } else {
              startX = parent.x - Math.min(parentWidth / 2, 90);
              startY = parent.y;
              endX = node.x + Math.min(nodeWidth / 2, 90);
              endY = node.y;
            }
          }

          const midY = (startY + endY) / 2;
          const pathData = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

          lines.push(
            <g key={`${parent.id}-${node.id}`}>
              <path
                d={pathData}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={isHighlighted ? "none" : "5 5"}
                markerEnd={isHighlighted ? "url(#arrow-active)" : `url(#arrow-${node.family})`}
                style={{
                  opacity: strokeOpacity,
                  transition: "all var(--transition-normal)",
                }}
              />
            </g>,
          );
        }
      });
    });

    return lines;
  };

  return (
    <>
      <defs>
        {TOPIC_FAMILIES.map((family) => (
          <marker
            key={family.id}
            id={`arrow-${family.id}`}
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={topicFamilyColor(family.id)} opacity="0.85" />
          </marker>
        ))}
        <marker
          id="arrow-active"
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

      {renderConnections()}
    </>
  );
};
