import React from 'react';
import { GraphNodeItem, GraphEdgeItem, ElementState } from '../../types/dsa';
import {
  componentTintingAddsInformation,
  deriveConnectedComponents,
  vizSlotBg,
  vizSlotColor,
} from './vizPalette';
import {
  Point,
  boxViewBox,
  clamp,
  ellipsePoints,
  minPointSpacing,
  spreadToBox,
  useCanvasBox,
  viewBoxAttr,
} from './vizGeometry';

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
const MAX_NODE_R = 72;
/* Share of the closest node-to-node distance one node's diameter may take: 0.38
   means two neighbours fill 76% of the gap between them, which is as large as
   they can be drawn while the edge between them stays visible. */
const SPACING_SHARE = 0.38;
const GROUP_RING_GAP = 5;
/* The ring is the outermost ink; 3 more units keep the stroke off the canvas edge. */
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
     first paint) still lays out sensibly. */
  const { ref, box } = useCanvasBox({ width, height });
  /* Markers are shared by id, so two graphs on one page would otherwise inherit
     each other's arrowhead offset once that offset became radius-dependent. */
  const markerScope = React.useId().replace(/:/g, '');

  const needsAutoLayout = nodes.some((node) => node.x === undefined || node.y === undefined);
  const authored: Point[] = nodes.map((node) => ({ x: node.x ?? Number.NaN, y: node.y ?? Number.NaN }));

  /* Both layouts fill the measured box in BOTH axes (DESIGN.md R6.1): authored
     coordinates are spread per-axis so a 300x100 authored drawing reaches the
     edges of a 950x520 panel, and a coordinate-free graph goes on the ellipse
     inscribed in the box — a circle would leave the wide panel's sides empty.
     The radius stays uniform in both, so no node is squashed by the stretch.

     One node missing its coordinates sends the WHOLE graph to the ellipse: the
     old per-node fallback dropped a ring on top of the authored points, and every
     algorithm that authors coordinates authors all of them. */
  const place = (radius: number): Point[] => {
    const pad = radius + GROUP_RING_GAP + EDGE_MARGIN;
    /* The ellipse fixes the angular order; spreading its points afterwards is what
       makes a 3- or 5-node ring touch all four insets instead of leaving the arc
       between two nodes as empty height. An affine stretch of an ellipse is still
       an ellipse, and both axis scales are >= 1, so nothing is brought closer. */
    return spreadToBox(
      needsAutoLayout ? ellipsePoints(nodes.length, box, pad) : authored,
      box,
      pad
    );
  };

  /* Sizing the node off the box alone would let two neighbours grow into each
     other, so the radius comes from the spacing the layout actually produced.
     The two depend on each other (the radius is the layout's inset), so this
     walks DOWN from the cap: a bigger radius always means a tighter layout, so
     each pass is a safe upper bound and the loop settles in two or three. */
  let radius = MAX_NODE_R;
  for (let pass = 0; pass < 4; pass += 1) {
    const spacing = minPointSpacing(place(radius), Math.min(box.width, box.height));
    const supported = clamp(spacing * SPACING_SHARE, MIN_NODE_R, MAX_NODE_R);
    if (supported >= radius) break;
    radius = supported;
  }
  const nodeRadius = radius;
  const positions = place(nodeRadius);

  const nodeMap = new Map<string, NodePosition & GraphNodeItem>();
  nodes.forEach((node, index) => {
    const point = positions[index] ?? { x: box.width / 2, y: box.height / 2 };
    nodeMap.set(node.id, { ...node, x: point.x, y: point.y });
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

  /* Ink weights scale with the node so a big panel gets a proportionally drawn
     graph instead of hairlines between huge circles. Labels also have to fit the
     circle they sit in: ~1.7r of chord at mid-height, ~0.6em per mono glyph, which
     is what keeps a `A (∞)` style label from spilling out of its node. */
  const longestLabel = nodes.reduce(
    (longest, node) => Math.max(longest, String(node.label || node.id).length),
    1
  );
  const longestWeight = edges.reduce(
    (longest, edge) => Math.max(longest, edge.weight === undefined ? 0 : String(edge.weight).length),
    1
  );
  const labelFont = clamp(
    Math.min(nodeRadius * 0.55, (nodeRadius * 2.83) / longestLabel),
    9,
    40
  );
  const weightFont = clamp(nodeRadius * 0.4, 9, 18);
  const weightW = weightFont * (0.62 * longestWeight + 1.1);
  const weightH = weightFont * 1.7;
  const plainStroke = clamp(nodeRadius * 0.06, 1.6, 3);
  const traversedStroke = clamp(nodeRadius * 0.09, 2.5, 4.5);
  const pathStroke = clamp(nodeRadius * 0.13, 4, 7);
  const dash = clamp(nodeRadius * 0.18, 5, 10);
  const nodeStroke = clamp(nodeRadius * 0.07, 2, 3.6);
  /* userSpaceOnUse, because the default markerUnits multiplies by the line's own
     stroke width — one shared marker would then sit at three different distances
     from the node for the plain/traversed/path weights. */
  const arrowW = clamp(nodeRadius * 0.34, 9, 18);
  const arrowH = arrowW * 0.72;
  const arrowRefX = nodeRadius + arrowW;

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
        flex: '1 1 auto',
        alignSelf: 'stretch',
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
            textAlign: 'center',
          }}
        >
          {title}
        </div>
      )}
      {/* The well carries the border and is the measured element: with no padding
          of its own its client box IS the svg viewport, so the viewBox matches it
          exactly and the inset surface reaches every edge of the canvas. */}
      <div
        ref={ref}
        style={{
          flex: '1 1 auto',
          width: '100%',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
          background: 'var(--bg-inset)',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={viewBoxAttr(boxViewBox(box))}
          style={{ display: 'block' }}
        >
          <defs>
            <marker
              id={`arrowhead-${markerScope}`}
              markerUnits="userSpaceOnUse"
              markerWidth={arrowW}
              markerHeight={arrowH}
              refX={arrowRefX}
              refY={arrowH / 2}
              orient="auto"
            >
              <polygon points={`0 0, ${arrowW} ${arrowH / 2}, 0 ${arrowH}`} fill="var(--border-default)" />
            </marker>
            <marker
              id={`arrowhead-traversed-${markerScope}`}
              markerUnits="userSpaceOnUse"
              markerWidth={arrowW}
              markerHeight={arrowH}
              refX={arrowRefX}
              refY={arrowH / 2}
              orient="auto"
            >
              <polygon points={`0 0, ${arrowW} ${arrowH / 2}, 0 ${arrowH}`} fill="var(--state-active)" />
            </marker>
            <marker
              id={`arrowhead-path-${markerScope}`}
              markerUnits="userSpaceOnUse"
              markerWidth={arrowW}
              markerHeight={arrowH}
              refX={arrowRefX}
              refY={arrowH / 2}
              orient="auto"
            >
              <polygon points={`0 0, ${arrowW} ${arrowH / 2}, 0 ${arrowH}`} fill="var(--state-path)" />
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

            const strokeWidth = edge.isPath
              ? pathStroke
              : edge.isTraversed
              ? traversedStroke
              : plainStroke;
            const strokeDasharray = edge.isTraversed || edge.isPath ? undefined : `${dash} ${dash}`;
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
                    strokeWidth={nodeStroke}
                    strokeOpacity="0.9"
                    style={{ transition: SHAPE_TRANSITION }}
                  />
                )}
                <circle
                  r={nodeRadius}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={inSemanticState ? nodeStroke * 1.25 : nodeStroke}
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
