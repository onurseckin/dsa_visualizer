import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";
import { TreeVisualizerProps } from "./tree/treeTypes";
import { computeTreeLayout } from "./tree/layoutEngine";
import { TreeLink } from "./tree/TreeLink";
import { TreeNode } from "./tree/TreeNode";
import { TreeLegend } from "./tree/TreeLegend";

export type { TreeVisualizerProps };

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({
  nodes,
  rootId,
  width = 900,
  height = 560,
  title,
  groups,
}) => {
  const { ref, box } = useCanvasBox({ width, height });

  if (!nodes || nodes.length === 0) return null;

  const metrics = computeTreeLayout(nodes, rootId, box, groups);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
        alignSelf: "stretch",
        width: "100%",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            color: "var(--text-muted)",
            marginBottom: "var(--space-1)",
            textAlign: "center",
          }}
        >
          {title}
        </div>
      )}
      <div
        ref={ref}
        style={{
          flex: "1 1 auto",
          width: "100%",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
          background: "var(--bg-inset)",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={viewBoxAttr(boxViewBox(box))}
          style={{ display: "block" }}
        >
          {/* Render links */}
          {metrics.computedNodes.map((parent) => {
            const links: React.ReactNode[] = [];
            if (parent.leftId) {
              const child = metrics.computedNodesMap.get(parent.leftId);
              if (child) {
                links.push(
                  <TreeLink
                    key={`link-${parent.id}-${child.id}`}
                    parent={parent}
                    child={child}
                    nodeRadius={metrics.nodeRadius}
                    linkStroke={metrics.linkStroke}
                    pathStroke={metrics.pathStroke}
                  />,
                );
              }
            }
            if (parent.rightId) {
              const child = metrics.computedNodesMap.get(parent.rightId);
              if (child) {
                links.push(
                  <TreeLink
                    key={`link-${parent.id}-${child.id}`}
                    parent={parent}
                    child={child}
                    nodeRadius={metrics.nodeRadius}
                    linkStroke={metrics.linkStroke}
                    pathStroke={metrics.pathStroke}
                  />,
                );
              }
            }
            return links;
          })}

          {/* Render nodes */}
          {metrics.computedNodes.map((node) => (
            <TreeNode
              key={`node-${node.id}`}
              node={node}
              nodeRadius={metrics.nodeRadius}
              nodeStroke={metrics.nodeStroke}
              labelFont={metrics.labelFont}
              slot={metrics.groupOf(node.id)}
            />
          ))}
        </svg>
      </div>

      <TreeLegend legend={metrics.legend} />
    </div>
  );
};

export default TreeVisualizer;
