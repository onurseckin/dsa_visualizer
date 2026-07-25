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

const getNodeStateColors = (state: ElementState) => {
  switch (state) {
    case 'compare':
      return {
        fill: 'var(--state-compare-bg)',
        stroke: 'var(--state-compare)',
        text: 'var(--state-compare)',
        glow: 'rgba(245, 158, 11, 0.5)',
      };
    case 'swap':
      return {
        fill: 'var(--state-swap-bg)',
        stroke: 'var(--state-swap)',
        text: 'var(--state-swap)',
        glow: 'rgba(239, 68, 68, 0.6)',
      };
    case 'sorted':
      return {
        fill: 'var(--state-sorted-bg)',
        stroke: 'var(--state-sorted)',
        text: 'var(--state-sorted)',
        glow: 'rgba(0, 255, 157, 0.6)',
      };
    case 'active':
      return {
        fill: 'var(--state-active-bg)',
        stroke: 'var(--state-active)',
        text: 'var(--state-active)',
        glow: 'rgba(59, 130, 246, 0.6)',
      };
    case 'pivot':
      return {
        fill: 'var(--state-pivot-bg)',
        stroke: 'var(--state-pivot)',
        text: 'var(--state-pivot)',
        glow: 'rgba(168, 85, 247, 0.6)',
      };
    case 'visited':
      return {
        fill: 'rgba(6, 182, 212, 0.25)',
        stroke: '#06b6d4',
        text: '#06b6d4',
        glow: 'rgba(6, 182, 212, 0.4)',
      };
    case 'queued':
      return {
        fill: 'rgba(234, 179, 8, 0.25)',
        stroke: '#eab308',
        text: '#eab308',
        glow: 'rgba(234, 179, 8, 0.4)',
      };
    case 'in-stack':
      return {
        fill: 'rgba(236, 72, 153, 0.25)',
        stroke: '#ec4899',
        text: '#ec4899',
        glow: 'rgba(236, 72, 153, 0.4)',
      };
    case 'path':
      return {
        fill: 'rgba(16, 185, 129, 0.3)',
        stroke: '#10b981',
        text: '#10b981',
        glow: 'rgba(16, 185, 129, 0.6)',
      };
    case 'default':
    default:
      return {
        fill: 'var(--bg-surface)',
        stroke: 'var(--border-subtle)',
        text: 'var(--text-main)',
        glow: 'transparent',
      };
  }
};

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
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--accent-mint)',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
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
          background: 'var(--bg-darkest)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
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
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent-mint)" />
          </marker>
          <marker
            id="arrowhead-path"
            markerWidth="10"
            markerHeight="7"
            refX={nodeRadius + 10}
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
          </marker>
        </defs>

        {/* Render Edges */}
        {edges.map((edge, idx) => {
          const fromNode = nodeMap.get(edge.from);
          const toNode = nodeMap.get(edge.to);

          if (!fromNode || !toNode) return null;

          const strokeColor = edge.isPath
            ? '#f59e0b'
            : edge.isTraversed
            ? 'var(--accent-emerald)'
            : 'var(--border-muted)';

          const strokeWidth = edge.isPath ? 3.5 : edge.isTraversed ? 2.5 : 2;
          const strokeDasharray = edge.isTraversed || edge.isPath ? undefined : '4 4';

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
                markerEnd={
                  isDirected
                    ? edge.isPath
                      ? 'url(#arrowhead-path)'
                      : 'url(#arrowhead)'
                    : undefined
                }
                style={{ transition: 'all 0.3s ease' }}
              />
              {edge.weight !== undefined && (
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
                    fill="var(--accent-mint)"
                    fontSize="11"
                    fontFamily="var(--font-code)"
                    fontWeight="700"
                  >
                    {edge.weight}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Render Nodes */}
        {Array.from(nodeMap.values()).map((node) => {
          const style = getNodeStateColors(node.state);

          return (
            <g
              key={`node-${node.id}`}
              transform={`translate(${node.x}, ${node.y})`}
              style={{ transition: 'transform 0.3s ease' }}
            >
              <circle
                r={nodeRadius}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth="2.5"
                style={{
                  filter: style.glow !== 'transparent' ? `drop-shadow(0 0 8px ${style.glow})` : undefined,
                  transition: 'all 0.3s ease',
                }}
              />
              <text
                x="0"
                y="0"
                dominantBaseline="central"
                textAnchor="middle"
                fill={style.text}
                fontSize="13"
                fontFamily="var(--font-code)"
                fontWeight="700"
              >
                {node.label || node.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default GraphVisualizer;
