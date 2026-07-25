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
    case 'visited':
      return {
        fill: 'rgba(6, 182, 212, 0.25)',
        stroke: '#06b6d4',
        text: '#06b6d4',
        glow: 'rgba(6, 182, 212, 0.4)',
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

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({
  nodes,
  rootId,
  width = 600,
  height = 360,
  title,
}) => {
  const nodeRadius = 20;
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

    const nextSpread = Math.max(spreadX / 2, 28);
    if (item.leftId) {
      layoutTree(item.leftId, depth + 1, cx - spreadX, cy + 64, nextSpread);
    }
    if (item.rightId) {
      layoutTree(item.rightId, depth + 1, cx + spreadX, cy + 64, nextSpread);
    }
  };

  const initialSpread = Math.min(width / 4, 140);
  layoutTree(computedRootId, 0, width / 2, 50, initialSpread);

  const computedNodes = Array.from(computedNodesMap.values());

  let minX = 0;
  let minY = 0;
  let maxX = width;
  let maxY = height;

  if (computedNodes.length > 0) {
    const xs = computedNodes.map((n) => n.cx);
    const ys = computedNodes.map((n) => n.cy);
    minX = Math.min(0, Math.min(...xs) - nodeRadius - 20);
    minY = Math.min(0, Math.min(...ys) - nodeRadius - 20);
    maxX = Math.max(width, Math.max(...xs) + nodeRadius + 20);
    maxY = Math.max(height, Math.max(...ys) + nodeRadius + 20);
  }
  const viewBoxWidth = maxX - minX;
  const viewBoxHeight = maxY - minY;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
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
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--bg-darkest)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
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
                stroke="var(--border-subtle)"
                strokeWidth="2"
                style={{ transition: 'all 0.3s ease' }}
              />
            );
          });
        })}

        {/* Render Binary Tree Nodes */}
        {computedNodes.map((node) => {
          const style = getNodeStateColors(node.state);

          return (
            <g
              key={`treenode-${node.id}`}
              transform={`translate(${node.cx}, ${node.cy})`}
              style={{ transition: 'transform 0.3s ease' }}
            >
              <circle
                r={nodeRadius}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth="2"
                style={{
                  filter: style.glow !== 'transparent' ? `drop-shadow(0 0 8px ${style.glow})` : undefined,
                  transition: 'all 0.3s ease',
                }}
              />
              <text
                x="0"
                y="4"
                textAnchor="middle"
                fill={style.text}
                fontSize="13"
                fontFamily="var(--font-code)"
                fontWeight="700"
              >
                {node.val}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default TreeVisualizer;
