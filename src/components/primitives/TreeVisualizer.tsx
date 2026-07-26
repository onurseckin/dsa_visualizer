import React from 'react';
import { TreeNodeItem, ElementState } from '../../types/dsa';
import { vizSlotBg, vizSlotColor } from './vizPalette';
import {
  Point,
  boxViewBox,
  clamp,
  minPointSpacing,
  spreadToBox,
  tidyTreeSlots,
  useCanvasBox,
  viewBoxAttr,
} from './vizGeometry';

export interface TreeVisualizerProps {
  nodes: TreeNodeItem[];
  rootId?: string;
  width?: number;
  height?: number;
  title?: string;
  /* Optional identity tinting: node id → zero-based --viz-* slot (subtree, heap
     partition, trie branch). Absent for every algorithm that only has state. */
  groups?: Record<string, number>;
}

interface ComputedTreeNode extends TreeNodeItem {
  cx: number;
  cy: number;
}

interface TreeLayout {
  nodes: ComputedTreeNode[];
  nodeRadius: number;
}

/* ElementState names map 1:1 onto the --state-* token names in theme.css. */
const stateColor = (state: ElementState): string => `var(--state-${state})`;
const stateBg = (state: ElementState): string => `var(--state-${state}-bg)`;

/* Radius floor equals the old fixed radius, so a laid-out tree can only grow. */
const MIN_NODE_R = 26;
const MAX_NODE_R = 46;
/* Share of the closest node-to-node distance one node's diameter may take. Higher
   than the graph's, because tree neighbours are joined by a short link that reads
   fine when the circles nearly touch. */
const SPACING_SHARE = 0.45;
const GROUP_RING_GAP = 5;
/* The ring is the outermost ink; 3 more units keep the stroke off the canvas edge. */
const EDGE_MARGIN = 3;
const SHAPE_TRANSITION =
  'fill var(--transition-normal), stroke var(--transition-normal), stroke-width var(--transition-normal), opacity var(--transition-normal)';
const MOVE_TRANSITION = `transform var(--transition-normal), ${SHAPE_TRANSITION}`;

const layoutPad = (radius: number): number => radius + GROUP_RING_GAP + EDGE_MARGIN;

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({
  nodes,
  rootId,
  width = 900,
  height = 560,
  title,
  groups,
}) => {
  /* The width/height props are the fallback box: an unmeasured canvas (jsdom,
     first paint) still lays out sensibly. */
  const { ref, box } = useCanvasBox({ width, height });

  if (!nodes || nodes.length === 0) return null;

  const nodeMap = new Map<string, TreeNodeItem>();
  const childIds = new Set<string>();

  nodes.forEach((n) => {
    nodeMap.set(n.id, n);
    if (n.leftId) childIds.add(n.leftId);
    if (n.rightId) childIds.add(n.rightId);
  });

  const childrenOf = (id: string): string[] => {
    const item = nodeMap.get(id);
    if (!item) return [];
    const kids: string[] = [];
    if (item.leftId && nodeMap.has(item.leftId)) kids.push(item.leftId);
    if (item.rightId && nodeMap.has(item.rightId)) kids.push(item.rightId);
    return kids;
  };

  /* An explicit rootId first, then every node no parent claims, then the rest.
     tidyTreeSlots skips ids it already placed, so a forest keeps all of its trees
     and no node is silently dropped for being unreachable from one root. */
  const roots: string[] = [];
  if (rootId !== undefined && nodeMap.has(rootId)) roots.push(rootId);
  nodes.forEach((n) => {
    if (!childIds.has(n.id)) roots.push(n.id);
  });
  nodes.forEach((n) => roots.push(n.id));

  /* Authored coordinates are honoured only when every node has them: mixing them
     with computed slots would collide, and the algorithms that position trees
     (Huffman) position every node. */
  const allExplicit = nodes.every((n) => n.x !== undefined && n.y !== undefined);

  /* Authored coordinates get the same treatment as an authored graph: spread
     per-axis to the box edges at one uniform radius, sized from the spacing the
     spread actually produced so no two nodes grow into each other. */
  const explicitLayout = (): TreeLayout => {
    const placed = nodes.filter((n) => n.x !== undefined && n.y !== undefined);
    const authored: Point[] = placed.map((n) => ({ x: n.x ?? 0, y: n.y ?? 0 }));
    /* Radius and layout depend on each other (the radius is the inset), so this
       walks DOWN from the cap: a bigger radius always means a tighter spread, so
       every pass is a safe upper bound. The authored Huffman coordinates put
       siblings 34px apart, which the old fixed radius overlapped outright. */
    let nodeRadius = MAX_NODE_R;
    for (let pass = 0; pass < 4; pass += 1) {
      const spacing = minPointSpacing(
        spreadToBox(authored, box, layoutPad(nodeRadius)),
        Math.min(box.width, box.height)
      );
      const supported = clamp(spacing * SPACING_SHARE, MIN_NODE_R, MAX_NODE_R);
      if (supported >= nodeRadius) break;
      nodeRadius = supported;
    }
    const points = spreadToBox(authored, box, layoutPad(nodeRadius));

    return {
      nodes: placed.map((n, index) => ({
        ...n,
        cx: points[index]?.x ?? box.width / 2,
        cy: points[index]?.y ?? box.height / 2,
      })),
      nodeRadius,
    };
  };

  /* The tidy layout is abstract (leaf column, depth); spreading it across the
     measured box is what makes depths own the full HEIGHT and leaf slots the full
     WIDTH, so a shallow tree no longer stops at a fixed 84px per level and leaves
     the rest of the canvas as an empty band (DESIGN.md R6.1). A single-column
     chain or a single level has a degenerate axis, which spreadToBox centres. */
  const stretchedLayout = (): TreeLayout => {
    const tidy = tidyTreeSlots(roots, childrenOf);
    const slotWidth = box.width / tidy.leafCount;
    const levelHeight = box.height / (tidy.depth + 1);
    const nodeRadius = clamp(Math.min(slotWidth, levelHeight) * 0.4, MIN_NODE_R, MAX_NODE_R);
    const abstract: Point[] = tidy.slots.map((slot) => ({ x: slot.slot, y: slot.depth }));
    const points = spreadToBox(abstract, box, layoutPad(nodeRadius));

    const placed: ComputedTreeNode[] = [];
    tidy.slots.forEach((slot, index) => {
      const item = nodeMap.get(slot.id);
      if (!item) return;
      placed.push({
        ...item,
        cx: points[index]?.x ?? box.width / 2,
        cy: points[index]?.y ?? box.height / 2,
      });
    });

    return { nodes: placed, nodeRadius };
  };

  const layout = allExplicit ? explicitLayout() : stretchedLayout();
  const computedNodes = layout.nodes;
  const nodeRadius = layout.nodeRadius;
  const computedNodesMap = new Map<string, ComputedTreeNode>(
    computedNodes.map((node) => [node.id, node])
  );

  /* Ink weights scale with the node, and the label is additionally held to the
     ~1.7r of chord it has at mid-height (~0.6em per mono glyph) so a long value
     cannot spill out of its circle. */
  const longestLabel = computedNodes.reduce(
    (longest, node) => Math.max(longest, String(node.val).length),
    1
  );
  const labelFont = clamp(Math.min(nodeRadius * 0.55, (nodeRadius * 2.83) / longestLabel), 9, 26);
  const nodeStroke = clamp(nodeRadius * 0.07, 2, 3.4);
  const linkStroke = clamp(nodeRadius * 0.06, 1.8, 3);
  const pathStroke = clamp(nodeRadius * 0.1, 3, 5);

  const groupOf = (id: string): number | undefined => groups?.[id];

  const groupSlots = Array.from(
    new Set(
      computedNodes
        .map((node) => groupOf(node.id))
        .filter((slot): slot is number => slot !== undefined)
    )
  ).sort((a, b) => a - b);

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
          {/* Render Binary Tree Links */}
          {computedNodes.map((parent) =>
            childrenOf(parent.id).map((childId) => {
              const child = computedNodesMap.get(childId);
              if (!child) return null;

              /* A link belongs to the child's subtree, so it inherits the child's
                 identity color when both ends agree; otherwise it stays chrome. */
              const parentSlot = groupOf(parent.id);
              const childSlot = groupOf(child.id);
              const onPath = child.state === 'path' && parent.state === 'path';
              const linkColor = onPath
                ? 'var(--state-path)'
                : childSlot !== undefined && childSlot === parentSlot
                ? vizSlotColor(childSlot)
                : 'var(--border-default)';

              return (
                <line
                  key={`link-${parent.id}-${child.id}`}
                  x1={parent.cx}
                  y1={parent.cy}
                  x2={child.cx}
                  y2={child.cy}
                  stroke={linkColor}
                  strokeWidth={onPath ? pathStroke : linkStroke}
                  strokeLinecap="round"
                  style={{ transition: SHAPE_TRANSITION }}
                />
              );
            })
          )}

          {/* Render Binary Tree Nodes */}
          {computedNodes.map((node) => {
            const slot = groupOf(node.id);
            const hasGroup = slot !== undefined;
            const inSemanticState = node.state !== 'default';

            /* Same precedence as GraphVisualizer: state paints the node, identity
               is demoted to an outer ring so nothing regresses without groups. */
            const fill = inSemanticState || !hasGroup ? stateBg(node.state) : vizSlotBg(slot);
            const stroke = inSemanticState || !hasGroup ? stateColor(node.state) : vizSlotColor(slot);
            const showGroupRing = hasGroup && inSemanticState;

            return (
              <g
                key={`treenode-${node.id}`}
                transform={`translate(${node.cx}, ${node.cy})`}
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
                  {node.val}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {groupSlots.length > 0 && (
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
          {groupSlots.map((slot) => (
            <span
              key={`tree-legend-${slot}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: 'var(--radius-full)',
                  background: vizSlotColor(slot),
                }}
              />
              {`Group ${slot + 1}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeVisualizer;
