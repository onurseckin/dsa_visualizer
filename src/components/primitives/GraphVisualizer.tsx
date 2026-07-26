import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";
import { GraphVisualizerProps } from "./graph/graphTypes";
import { computeGraphLayout } from "./graph/layoutEngine";
import { GraphDefs } from "./graph/GraphDefs";
import { GraphEdge } from "./graph/GraphEdge";
import { GraphNode } from "./graph/GraphNode";
import { GraphLegend } from "./graph/GraphLegend";

export type { GraphVisualizerProps };

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  nodes,
  edges,
  width = 900,
  height = 560,
  isDirected = false,
  title,
}) => {
  const { ref, box } = useCanvasBox({ width, height });
  const markerScope = React.useId().replace(/:/g, "");

  const metrics = computeGraphLayout(nodes, edges, box);

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
          <GraphDefs
            markerScope={markerScope}
            arrowW={metrics.arrowW}
            arrowH={metrics.arrowH}
            arrowRefX={metrics.arrowRefX}
          />

          {edges.map((edge, idx) => {
            const fromNode = metrics.nodeMap.get(edge.from);
            const toNode = metrics.nodeMap.get(edge.to);
            if (!fromNode || !toNode) return null;
            return (
              <GraphEdge
                key={`edge-${edge.from}-${edge.to}-${idx}`}
                edge={edge}
                fromNode={fromNode}
                toNode={toNode}
                edgeGroup={metrics.edgeGroupOf(edge)}
                nodeRadius={metrics.nodeRadius}
                isDirected={isDirected}
                markerScope={markerScope}
                plainStroke={metrics.plainStroke}
                traversedStroke={metrics.traversedStroke}
                pathStroke={metrics.pathStroke}
                dash={metrics.dash}
                weightFont={metrics.weightFont}
                weightW={metrics.weightW}
                weightH={metrics.weightH}
              />
            );
          })}

          {metrics.positioned.map((node) => (
            <GraphNode
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

      <GraphLegend legend={metrics.legend} />
    </div>
  );
};

export default GraphVisualizer;
