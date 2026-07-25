import React from 'react';
import { TreeNodeItem, ElementState } from '../../types/dsa';
import { vizSlotBg, vizSlotColor } from './vizPalette';

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

/* ElementState names map 1:1 onto the --state-* token names in theme.css. */
const stateColor = (state: ElementState): string => `var(--state-${state})`;
const stateBg = (state: ElementState): string => `var(--state-${state}-bg)`;

const NODE_RADIUS = 26;
const GROUP_RING_GAP = 5;
const LEVEL_GAP = 84;
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
  if (!nodes || nodes.length === 0) return null;

  const nodeMap = new Map<string, TreeNodeItem>();
  const childIds = new Set<string>();

  nodes.forEach((n) => {
    nodeMap.set(n.id, n);
    if (n.leftId) childIds.add(n.leftId);
    if (n.rightId) childIds.add(n.rightId);
  });

  let computedRootId = rootId;
  if (!computedRootId) {
    const rootCandidate = nodes.find((n) => !childIds.has(n.id));
    computedRootId = rootCandidate ? rootCandidate.id : nodes[0].id;
  }

  const computedNodesMap = new Map<string, ComputedTreeNode>();

  // Tree layout positioning function
  const layoutTree = (
    id: string | undefined,
    depth: number,
    x: number,
    y: number,
    spreadX: number
  ) => {
    if (!id) return;
    const item = nodeMap.get(id);
    if (!item) return;

    const cx = item.x !== undefined ? item.x : x;
    const cy = item.y !== undefined ? item.y : y;

    computedNodesMap.set(id, {
      ...item,
      cx,
      cy,
    });

    const nextSpread = Math.max(spreadX / 2, NODE_RADIUS + 16);
    if (item.leftId) {
      layoutTree(item.leftId, depth + 1, cx - spreadX, cy + LEVEL_GAP, nextSpread);
    }
    if (item.rightId) {
      layoutTree(item.rightId, depth + 1, cx + spreadX, cy + LEVEL_GAP, nextSpread);
    }
  };

  const initialSpread = Math.min(width / 3.4, 200);
  layoutTree(computedRootId, 0, width / 2, 70, initialSpread);

  const computedNodes = Array.from(computedNodesMap.values());

  let minX = 0;
  let minY = 0;
  let maxX = width;
  let maxY = height;

  if (computedNodes.length > 0) {
    const xs = computedNodes.map((n) => n.cx);
    const ys = computedNodes.map((n) => n.cy);
    const padding = NODE_RADIUS + GROUP_RING_GAP + 14;
    minX = Math.min(...xs) - padding;
    minY = Math.min(...ys) - padding;
    maxX = Math.max(...xs) + padding;
    maxY = Math.max(...ys) + padding;
  }
  const viewBoxWidth = Math.max(maxX - minX, 120);
  const viewBoxHeight = Math.max(maxY - minY, 120);

  const groupOf = (id: string): number | undefined => groups?.[id];

  const groupSlots = Array.from(
    new Set(
      computedNodes
        .map((node) => groupOf(node.id))
        .filter((slot): slot is number => slot !== undefined)
    )
  ).sort((a, b) => a - b);

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
        {/* Render Binary Tree Links */}
        {computedNodes.map((parent) => {
          const links: Array<{ childId: string }> = [];
          if (parent.leftId) links.push({ childId: parent.leftId });
          if (parent.rightId) links.push({ childId: parent.rightId });

          return links.map((link) => {
            const child = computedNodesMap.get(link.childId);
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
          });
        })}

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
                {node.val}
              </text>
            </g>
          );
        })}
      </svg>

      {groupSlots.length > 0 && (
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
