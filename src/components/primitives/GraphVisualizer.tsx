import React from 'react';
import { GraphNodeItem, GraphEdgeItem, ElementState } from '../../types/dsa';

export interface GraphVisualizerProps {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
  width?: number;
  height?: number;
  isDirected?: boolean;
  title?: string;
}

interface NodePosition {
  x: number;
  y: number;
}

/* ElementState names map 1:1 onto the --state-* token names in theme.css. */
const stateColor = (state: ElementState): string => `var(--state-${state})`;
const stateBg = (state: ElementState): string => `var(--state-${state}-bg)`;

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  nodes,
  edges,
  width = 800,
  height = 500,
  isDirected = false,
  title,
}) => {
  const nodeRadius = 24;

  // Auto layout nodes that don't have explicit x, y
  const nodeMap = new Map<string, NodePosition & GraphNodeItem>();
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.38;

  nodes.forEach((node, index) => {
    let px = node.x;
    let py = node.y;

    if (px === undefined || py === undefined) {
      const angle = (2 * Math.PI * index) / Math.max(nodes.length, 1) - Math.PI / 2;
      px = centerX + radius * Math.cos(angle);
      py = centerY + radius * Math.sin(angle);
    }

    nodeMap.set(node.id, {
      ...node,
      x: px,
      y: py,
    });
  });

  // Bounding box calculation for dynamic viewBox scaling
  let minX = 0;
  let minY = 0;
  let maxX = width;
  let maxY = height;

  if (nodeMap.size > 0) {
    const xs = Array.from(nodeMap.values()).map((n) => n.x);
    const ys = Array.from(nodeMap.values()).map((n) => n.y);
    const padding = nodeRadius + 24;

    minX = Math.min(...xs) - padding;
    minY = Math.min(...ys) - padding;
    maxX = Math.max(...xs) + padding;
    maxY = Math.max(...ys) + padding;
  }
  const viewBoxWidth = Math.max(maxX - minX, 100);
  const viewBoxHeight = Math.max(maxY - minY, 100);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        minHeight: '300px',
        padding: 0,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: 'var(--space-2)',
          }}
        >
          {title}
        </div>
      )}
      <svg
        width="100%"
        height="100%"
        viewBox={`${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '100%',
          background: 'var(--bg-inset)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          overflow: 'visible',
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX={nodeRadius + 10}
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--border-strong)" />
          </marker>
          <marker
            id="arrowhead-traversed"
            markerWidth="10"
            markerHeight="7"
            refX={nodeRadius + 10}
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--state-active)" />
          </marker>
          <marker
            id="arrowhead-path"
            markerWidth="10"
            markerHeight="7"
            refX={nodeRadius + 10}
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--state-path)" />
          </marker>
        </defs>

        {/* Render Edges */}
        {edges.map((edge, idx) => {
          const fromNode = nodeMap.get(edge.from);
          const toNode = nodeMap.get(edge.to);

          if (!fromNode || !toNode) return null;

          const strokeColor = edge.isPath
            ? 'var(--state-path)'
            : edge.isTraversed
            ? 'var(--state-active)'
            : 'var(--border-strong)';

          const strokeWidth = edge.isPath ? 3 : edge.isTraversed ? 2 : 1.5;
          const strokeDasharray = edge.isTraversed || edge.isPath ? undefined : '4 4';
          const markerId = edge.isPath
            ? 'url(#arrowhead-path)'
            : edge.isTraversed
            ? 'url(#arrowhead-traversed)'
            : 'url(#arrowhead)';

          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;

          return (
            <g key={`edge-${edge.from}-${edge.to}-${idx}`}>
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                markerEnd={isDirected ? markerId : undefined}
                style={{ transition: 'all 0.3s ease' }}
              />
              {edge.weight !== undefined && (
                /* Halo rect behind the weight keeps it readable over the edge line. */
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x="-12"
                    y="-10"
                    width="24"
                    height="20"
                    rx="4"
                    fill="var(--bg-surface)"
                    stroke="var(--border-subtle)"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="0"
                    dominantBaseline="central"
                    textAnchor="middle"
                    fill="var(--text-secondary)"
                    fontSize="10"
                    fontFamily="var(--font-code)"
                    fontWeight="500"
                  >
                    {edge.weight}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Render Nodes */}
        {Array.from(nodeMap.values()).map((node) => (
          <g
            key={`node-${node.id}`}
            transform={`translate(${node.x}, ${node.y})`}
            style={{ transition: 'transform 0.3s ease' }}
          >
            <circle
              r={nodeRadius}
              fill={stateBg(node.state)}
              stroke={stateColor(node.state)}
              strokeWidth="1.5"
              style={{ transition: 'all 0.3s ease' }}
            />
            <text
              x="0"
              y="0"
              dominantBaseline="central"
              textAnchor="middle"
              fill="var(--text-primary)"
              fontSize="13"
              fontFamily="var(--font-code)"
              fontWeight="600"
            >
              {node.label || node.id}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default GraphVisualizer;
