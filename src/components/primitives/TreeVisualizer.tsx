import React from 'react';
import { TreeNodeItem, ElementState } from '../../types/dsa';
import { vizSlotBg, vizSlotColor } from './vizPalette';
import {
  Point,
  clamp,
  fitBox,
  tidyTreeSlots,
  tightViewBox,
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
const MAX_NODE_R = 38;
const GROUP_RING_GAP = 5;
/* The ring is the outermost ink; 3 more units keep the stroke off the viewBox edge. */
const EDGE_MARGIN = 3;
const SHAPE_TRANSITION =
  'fill var(--transition-normal), stroke var(--transition-normal), stroke-width var(--transition-normal), opacity var(--transition-normal)';
const MOVE_TRANSITION = `transform var(--transition-normal), ${SHAPE_TRANSITION}`;

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({
  nodes,
  rootId,
  width = 900,
  height = 560,
  title,
  groups,
}) => {
  /* The width/height props are the fallback box: an unmeasured canvas (jsdom,
     first paint) keeps the layout the old fixed viewBox produced. */
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

  const explicitLayout = (): TreeLayout => {
    const placed: ComputedTreeNode[] = [];
    nodes.forEach((n) => {
      const { x, y } = n;
      if (x === undefined || y === undefined) return;
      placed.push({ ...n, cx: x, cy: y });
    });
    return { nodes: placed, nodeRadius: MIN_NODE_R };
  };

  /* Levels and columns are stretched across the measured box, which is what makes
     a shallow tree fill the canvas height instead of stopping at a fixed 84px per
     level and letting the rest become an empty band. */
  const stretchedLayout = (): TreeLayout => {
    const tidy = tidyTreeSlots(roots, childrenOf);
    const slotWidth = box.width / tidy.leafCount;
    const levelHeight = box.height / (tidy.depth + 1);
    const nodeRadius = clamp(
      Math.min(slotWidth, levelHeight) * 0.36,
      MIN_NODE_R,
      MAX_NODE_R
    );

    const placed: ComputedTreeNode[] = [];
    tidy.slots.forEach((slot) => {
      const item = nodeMap.get(slot.id);
      if (!item) return;
      placed.push({
        ...item,
        cx: (slot.slot + 0.5) * slotWidth,
        cy: (slot.depth + 0.5) * levelHeight,
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

  /* One uniform padding around the real node bounds — no fixed ratio, so the
     viewBox never contains a band the drawing does not use. */
  const points: Point[] = computedNodes.map((node) => ({ x: node.cx, y: node.cy }));
  const viewBox = tightViewBox(points, nodeRadius + GROUP_RING_GAP + EDGE_MARGIN, nodeRadius * 2);
  const svgSize = fitBox({ width: viewBox.width, height: viewBox.height }, box);
  const labelFont = clamp(nodeRadius * 0.55, 9, 20);

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
                  strokeWidth={onPath ? 3 : 1.8}
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
