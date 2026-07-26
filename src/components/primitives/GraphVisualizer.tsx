import React from 'react';
import { GraphNodeItem, GraphEdgeItem, ElementState } from '../../types/dsa';
import {
  componentTintingAddsInformation,
  deriveConnectedComponents,
  vizSlotBg,
  vizSlotColor,
} from './vizPalette';
import { Point, clamp, fitBox, tightViewBox, useCanvasBox, viewBoxAttr } from './vizGeometry';

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

/* Radius floor equals the old fixed radius, so a laid-out graph can only grow. */
const MIN_NODE_R = 28;
const MAX_NODE_R = 44;
const GROUP_RING_GAP = 5;
/* The ring is the outermost ink; 3 more units keep the stroke off the viewBox edge. */
const EDGE_MARGIN = 3;
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
  /* The width/height props are the fallback box: an unmeasured canvas (jsdom,
     first paint) keeps the layout the old fixed viewBox produced. */
  const { ref, box } = useCanvasBox({ width, height });
  /* Markers are shared by id, so two graphs on one page would otherwise inherit
     each other's arrowhead offset once that offset became radius-dependent. */
  const markerScope = React.useId().replace(/:/g, '');

  const needsAutoLayout = nodes.some((node) => node.x === undefined || node.y === undefined);

  /* Only an auto-laid-out graph may resize its nodes: authored coordinates carry
     real geometry (hulls, polygons) that a recomputed radius would misrepresent. */
  const ringRadius = Math.max(Math.min(box.width, box.height) / 2 - MIN_NODE_R - 6, MIN_NODE_R);
  const angularSpacing =
    nodes.length > 1 ? (2 * Math.PI * ringRadius) / nodes.length : ringRadius;
  const nodeRadius = needsAutoLayout
    ? clamp(angularSpacing * 0.42, MIN_NODE_R, MAX_NODE_R)
    : MIN_NODE_R;
  const layoutRadius = needsAutoLayout
    ? Math.max(Math.min(box.width, box.height) / 2 - nodeRadius - 6, nodeRadius)
    : ringRadius;

  const nodeMap = new Map<string, NodePosition & GraphNodeItem>();
  const centerX = box.width / 2;
  const centerY = box.height / 2;

  nodes.forEach((node, index) => {
    let px = node.x;
    let py = node.y;

    if (px === undefined || py === undefined) {
      const angle = (2 * Math.PI * index) / Math.max(nodes.length, 1) - Math.PI / 2;
      px = centerX + layoutRadius * Math.cos(angle);
      py = centerY + layoutRadius * Math.sin(angle);
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

  /* One uniform padding around the real node bounds — no fixed ratio, so the
     viewBox never contains a band the drawing does not use. */
  const points: Point[] = positioned.map((node) => ({ x: node.x, y: node.y }));
  const viewBox = tightViewBox(points, nodeRadius + GROUP_RING_GAP + EDGE_MARGIN, nodeRadius * 2);
  const svgSize = fitBox({ width: viewBox.width, height: viewBox.height }, box);

  const labelFont = clamp(nodeRadius * 0.55, 9, 22);
  const weightFont = clamp(nodeRadius * 0.44, 8, 16);
  const weightW = weightFont * 2.4;
  const weightH = weightFont * 1.7;

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
    // No height of its own: the canvas takes exactly the space the stage hands it.
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: 'var(--space-1)',
          }}
        >
          {title}
        </div>
      )}
      <div
        ref={ref}
        style={{
          flex: '1 1 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <svg
          width={Math.round(svgSize.width)}
          height={Math.round(svgSize.height)}
          viewBox={viewBoxAttr(viewBox)}
          preserveAspectRatio="xMidYMid meet"
          style={{
            display: 'block',
            background: 'var(--bg-inset)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <defs>
            <marker
              id={`arrowhead-${markerScope}`}
              markerWidth="10"
              markerHeight="7"
              refX={nodeRadius + 10}
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--border-default)" />
            </marker>
            <marker
              id={`arrowhead-traversed-${markerScope}`}
              markerWidth="10"
              markerHeight="7"
              refX={nodeRadius + 10}
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--state-active)" />
            </marker>
            <marker
              id={`arrowhead-path-${markerScope}`}
              markerWidth="11"
              markerHeight="8"
              refX={nodeRadius + 9}
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
              ? `url(#arrowhead-path-${markerScope})`
              : edge.isTraversed
              ? `url(#arrowhead-traversed-${markerScope})`
              : `url(#arrowhead-${markerScope})`;

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
                      x={-weightW / 2}
                      y={-weightH / 2}
                      width={weightW}
                      height={weightH}
                      rx={6}
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
                      fontSize={weightFont}
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
                    r={nodeRadius + GROUP_RING_GAP}
                    fill="none"
                    stroke={vizSlotColor(slot)}
                    strokeWidth="2.5"
                    strokeOpacity="0.9"
                    style={{ transition: SHAPE_TRANSITION }}
                  />
                )}
                <circle
                  r={nodeRadius}
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
                  fontSize={labelFont}
                  fontFamily="var(--font-code)"
                  fontWeight="600"
                >
                  {node.label || node.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {legend.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 'var(--space-1) var(--space-3)',
            marginTop: 'var(--space-1)',
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
