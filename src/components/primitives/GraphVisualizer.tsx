import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";
import { GraphVisualizerProps } from "./graph/graphTypes";
import { computeGraphLayout } from "./graph/layoutEngine";
import { GraphDefs } from "./graph/GraphDefs";
import { GraphEdge } from "./graph/GraphEdge";
import { GraphNode } from "./graph/GraphNode";
import { GraphLegend } from "./graph/GraphLegend";
import { CanvasAuxiliaryOverlay } from "./CanvasAuxiliaryOverlay";
import { resolvePrimitiveLabel } from "./primitiveLabels";

export type { GraphVisualizerProps };

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  nodes,
  edges,
  width = 900,
  height = 560,
  isDirected = false,
  name,
  title,
  auxiliaryState,
  variables,
}) => {
  const { ref, box } = useCanvasBox({ width, height });
  const markerScope = React.useId().replace(/:/g, "");
  const caption = resolvePrimitiveLabel("graph", name) ?? (title?.trim() || undefined);

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
      <div
        ref={ref}
        data-testid="canvas-container"
        style={{
          flex: "1 1 auto",
          width: "100%",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
          background: "var(--bg-inset)",
          padding: 0,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={viewBoxAttr(boxViewBox(box))}
          role="img"
          aria-label={caption ? `Graph visualization: ${caption}` : "Graph visualization"}
          style={{ display: "block" }}
        >
          {caption && (
            <text
              x={12}
              y={18}
              fill="var(--text-muted)"
              fontFamily="var(--font-code)"
              fontSize="13px"
              fontWeight="700"
              letterSpacing="0.02em"
            >
              {caption}
            </text>
          )}
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

          <CanvasAuxiliaryOverlay box={box} state={auxiliaryState} variables={variables} />
        </svg>
      </div>

      <GraphLegend legend={metrics.legend} />
    </div>
  );
};

export default GraphVisualizer;
