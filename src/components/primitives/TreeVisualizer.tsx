import React from 'react';
import { TreeNodeItem, ElementState } from '../../types/dsa';

export interface TreeVisualizerProps {
  nodes: TreeNodeItem[];
  rootId?: string;
  width?: number;
  height?: number;
  title?: string;
}

interface ComputedTreeNode extends TreeNodeItem {
  cx: number;
  cy: number;
}

/* ElementState names map 1:1 onto the --state-* token names in theme.css. */
const stateColor = (state: ElementState): string => `var(--state-${state})`;
const stateBg = (state: ElementState): string => `var(--state-${state}-bg)`;

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({
  nodes,
  rootId,
  width = 800,
  height = 500,
  title,
}) => {
  const nodeRadius = 24;
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

    const nextSpread = Math.max(spreadX / 2, 34);
    if (item.leftId) {
      layoutTree(item.leftId, depth + 1, cx - spreadX, cy + 72, nextSpread);
    }
    if (item.rightId) {
      layoutTree(item.rightId, depth + 1, cx + spreadX, cy + 72, nextSpread);
    }
  };

  const initialSpread = Math.min(width / 4, 160);
  layoutTree(computedRootId, 0, width / 2, 60, initialSpread);

  const computedNodes = Array.from(computedNodesMap.values());

  let minX = 0;
  let minY = 0;
  let maxX = width;
  let maxY = height;

  if (computedNodes.length > 0) {
    const xs = computedNodes.map((n) => n.cx);
    const ys = computedNodes.map((n) => n.cy);
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
        {/* Render Binary Tree Links */}
        {computedNodes.map((parent) => {
          const links: Array<{ childId: string }> = [];
          if (parent.leftId) links.push({ childId: parent.leftId });
          if (parent.rightId) links.push({ childId: parent.rightId });

          return links.map((link) => {
            const child = computedNodesMap.get(link.childId);
            if (!child) return null;

            return (
              <line
                key={`link-${parent.id}-${child.id}`}
                x1={parent.cx}
                y1={parent.cy}
                x2={child.cx}
                y2={child.cy}
                stroke="var(--border-strong)"
                strokeWidth="1.5"
                style={{ transition: 'all 0.3s ease' }}
              />
            );
          });
        })}

        {/* Render Binary Tree Nodes */}
        {computedNodes.map((node) => (
          <g
            key={`treenode-${node.id}`}
            transform={`translate(${node.cx}, ${node.cy})`}
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
              {node.val}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default TreeVisualizer;
