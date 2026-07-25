import React from 'react';
import { GraphNodeItem, GraphEdgeItem, ElementState } from '../../types/dsa';
import {
  componentTintingAddsInformation,
  deriveConnectedComponents,
  vizSlotBg,
  vizSlotColor,
} from './vizPalette';

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

const NODE_RADIUS = 28;
const GROUP_RING_GAP = 5;
const SHAPE_TRANSITION =
  'fill var(--transition-normal), stroke var(--transition-normal), stroke-width var(--transition-normal), opacity var(--transition-normal)';
const MOVE_TRANSITION = `transform var(--transition-normal), ${SHAPE_TRANSITION}`;

interface LegendEntry {
  key: string;
  label: string;
  color: string;
  kind: 'group' | 'edge';
}

const legendSwatch = (entry: LegendEntry): React.ReactNode =>
  entry.kind === 'group' ? (
    <span
      aria-hidden="true"
      style={{
        width: '10px',
        height: '10px',
        borderRadius: 'var(--radius-full)',
        background: entry.color,
      }}
    />
  ) : (
    <span
      aria-hidden="true"
      style={{
        width: '16px',
        height: '2px',
        borderRadius: 'var(--radius-full)',
        background: entry.color,
      }}
    />
  );

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  nodes,
  edges,
  width = 900,
  height = 560,
  isDirected = false,
  title,
}) => {
  // Auto layout nodes that don't have explicit x, y
  const nodeMap = new Map<string, NodePosition & GraphNodeItem>();
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.42;

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

  const positioned = Array.from(nodeMap.values());

  /* Group identity resolution: an explicit `group` always wins. Falling back to
     derived components is only worth it when the structure actually splits — the
     40 existing algorithms set no group and mostly render one component, so they
     keep their purely semantic --state-* look. */
  const hasExplicitGroups = positioned.some((node) => node.group !== undefined);
  const derived = hasExplicitGroups
    ? null
    : deriveConnectedComponents(
        positioned.map((n) => n.id),
        edges
      );
  const useDerivedGroups = derived !== null && componentTintingAddsInformation(derived);

  const groupOf = (id: string): number | undefined => {
    if (hasExplicitGroups) return nodeMap.get(id)?.group;
    if (useDerivedGroups && derived) return derived.componentOf.get(id);
    return undefined;
  };

  const edgeGroupOf = (edge: GraphEdgeItem): number | undefined => {
    if (edge.group !== undefined) return edge.group;
    const from = groupOf(edge.from);
    const to = groupOf(edge.to);
    return from !== undefined && from === to ? from : undefined;
  };

  // Bounding box calculation for dynamic viewBox scaling
  let minX = 0;
  let minY = 0;
  let maxX = width;
  let maxY = height;

  if (positioned.length > 0) {
    const xs = positioned.map((n) => n.x);
    const ys = positioned.map((n) => n.y);
    const padding = NODE_RADIUS + GROUP_RING_GAP + 14;

    minX = Math.min(...xs) - padding;
    minY = Math.min(...ys) - padding;
    maxX = Math.max(...xs) + padding;
    maxY = Math.max(...ys) + padding;
  }
  const viewBoxWidth = Math.max(maxX - minX, 120);
  const viewBoxHeight = Math.max(maxY - minY, 120);

  const groupSlots = Array.from(
    new Set(
      positioned
        .map((node) => groupOf(node.id))
        .filter((slot): slot is number => slot !== undefined)
    )
  ).sort((a, b) => a - b);

  const hasTraversed = edges.some((edge) => edge.isTraversed && !edge.isPath);
  const hasPath = edges.some((edge) => edge.isPath);
  const hasPlainEdges = edges.some((edge) => !edge.isTraversed && !edge.isPath);

  const legend: LegendEntry[] = [
    ...groupSlots.map((slot) => ({
      key: `group-${slot}`,
      label: useDerivedGroups ? `Component ${slot + 1}` : `Group ${slot + 1}`,
      color: vizSlotColor(slot),
      kind: 'group' as const,
    })),
  ];
  /* Edge legend only earns its space once the run has produced more than one
     kind of edge — a fully untouched graph explains nothing by labelling itself. */
  if ((hasTraversed || hasPath) && hasPlainEdges) {
    legend.push({ key: 'edge-plain', label: 'Unexplored', color: 'var(--border-default)', kind: 'edge' });
  }
  if (hasTraversed) {
    legend.push({ key: 'edge-traversed', label: 'Traversed', color: 'var(--state-active)', kind: 'edge' });
  }
  if (hasPath) {
    legend.push({ key: 'edge-path', label: 'Final path', color: 'var(--state-path)', kind: 'edge' });
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        width: '100%',
        height: '100%',
        minHeight: '300px',
        minWidth: 0,
        padding: 0,
        gap: 'var(--space-2)',
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textAlign: 'center',
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
          flex: '1 1 auto',
          display: 'block',
          width: '100%',
          height: '100%',
          minHeight: 0,
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
            refX={NODE_RADIUS + 10}
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--border-default)" />
          </marker>
          <marker
            id="arrowhead-traversed"
            markerWidth="10"
            markerHeight="7"
            refX={NODE_RADIUS + 10}
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--state-active)" />
          </marker>
          <marker
            id="arrowhead-path"
            markerWidth="11"
            markerHeight="8"
            refX={NODE_RADIUS + 9}
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 11 4, 0 8" fill="var(--state-path)" />
          </marker>
        </defs>

        {/* Render Edges */}
        {edges.map((edge, idx) => {
          const fromNode = nodeMap.get(edge.from);
          const toNode = nodeMap.get(edge.to);

          if (!fromNode || !toNode) return null;

          const edgeGroup = edgeGroupOf(edge);
          const restColor =
            edgeGroup !== undefined ? vizSlotColor(edgeGroup) : 'var(--border-default)';

          const strokeColor = edge.isPath
            ? 'var(--state-path)'
            : edge.isTraversed
            ? 'var(--state-active)'
            : restColor;

          const strokeWidth = edge.isPath ? 4 : edge.isTraversed ? 2.5 : 1.6;
          const strokeDasharray = edge.isTraversed || edge.isPath ? undefined : '5 5';
          const strokeOpacity = edge.isTraversed || edge.isPath ? 1 : 0.75;
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
                strokeOpacity={strokeOpacity}
                strokeLinecap="round"
                markerEnd={isDirected ? markerId : undefined}
                style={{ transition: SHAPE_TRANSITION }}
              />
              {edge.weight !== undefined && (
                /* Halo rect behind the weight keeps it readable over the edge line. */
                <g transform={`translate(${midX}, ${midY})`} style={{ transition: MOVE_TRANSITION }}>
                  <rect
                    x="-15"
                    y="-11"
                    width="30"
                    height="22"
                    rx="6"
                    fill="var(--bg-surface)"
                    stroke={edge.isPath || edge.isTraversed ? strokeColor : 'var(--border-default)'}
                    strokeWidth="1"
                    style={{ transition: SHAPE_TRANSITION }}
                  />
                  <text
                    x="0"
                    y="0"
                    dominantBaseline="central"
                    textAnchor="middle"
                    fill={edge.isPath || edge.isTraversed ? strokeColor : 'var(--text-secondary)'}
                    fontSize="12"
                    fontFamily="var(--font-code)"
                    fontWeight="600"
                    style={{ transition: SHAPE_TRANSITION }}
                  >
                    {edge.weight}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Render Nodes */}
        {positioned.map((node) => {
          const slot = groupOf(node.id);
          const hasGroup = slot !== undefined;
          const inSemanticState = node.state !== 'default';

          /* Algorithm state outranks identity: a node the algorithm just touched
             keeps its --state-* skin and demotes its group to an outer ring. */
          const fill = inSemanticState || !hasGroup ? stateBg(node.state) : vizSlotBg(slot);
          const stroke = inSemanticState || !hasGroup ? stateColor(node.state) : vizSlotColor(slot);
          const showGroupRing = hasGroup && inSemanticState;

          return (
            <g
              key={`node-${node.id}`}
              transform={`translate(${node.x}, ${node.y})`}
              style={{ transition: MOVE_TRANSITION }}
            >
              {showGroupRing && (
                <circle
                  r={NODE_RADIUS + GROUP_RING_GAP}
                  fill="none"
                  stroke={vizSlotColor(slot)}
                  strokeWidth="2.5"
                  strokeOpacity="0.9"
                  style={{ transition: SHAPE_TRANSITION }}
                />
              )}
              <circle
                r={NODE_RADIUS}
                fill={fill}
                stroke={stroke}
                strokeWidth={inSemanticState ? 2.5 : 2}
                style={{ transition: SHAPE_TRANSITION }}
              />
              <text
                x="0"
                y="0"
                dominantBaseline="central"
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="15"
                fontFamily="var(--font-code)"
                fontWeight="600"
              >
                {node.label || node.id}
              </text>
            </g>
          );
        })}
      </svg>

      {legend.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 'var(--space-1) var(--space-3)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
          }}
        >
          {legend.map((entry) => (
            <span
              key={entry.key}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}
            >
              {legendSwatch(entry)}
              {entry.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default GraphVisualizer;
