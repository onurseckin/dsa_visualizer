import { TreeNodeItem } from "../../../types/dsa";
import { vizSlotColor } from "../vizPalette";
import { Point, Size, clamp, minPointSpacing, spreadToBox, tidyTreeSlots } from "../vizGeometry";
import {
  ComputedTreeNode,
  TreeLayout,
  TreeLegendEntry,
  MIN_NODE_R,
  MAX_NODE_R,
  SPACING_SHARE,
  layoutPad,
} from "./treeTypes";

export interface TreeMetrics {
  computedNodes: ComputedTreeNode[];
  computedNodesMap: Map<string, ComputedTreeNode>;
  nodeRadius: number;
  labelFont: number;
  nodeStroke: number;
  linkStroke: number;
  pathStroke: number;
  groupOf: (id: string) => number | undefined;
  legend: TreeLegendEntry[];
}

export const computeTreeLayout = (
  nodes: TreeNodeItem[],
  rootId: string | undefined,
  box: Size,
  groups?: Record<string, number>,
): TreeMetrics => {
  const nodeMap = new Map<string, TreeNodeItem>();
  const childIds = new Set<string>();

  nodes.forEach((n) => {
    nodeMap.set(n.id, n);
    if (n.leftId) childIds.add(n.leftId);
    if (n.rightId) childIds.add(n.rightId);
  });

  const childrenOf = (id: string): string[] => {
    const item = nodeMap.get(id)!;
    const kids: string[] = [];
    if (item.leftId && nodeMap.has(item.leftId)) kids.push(item.leftId);
    if (item.rightId && nodeMap.has(item.rightId)) kids.push(item.rightId);
    return kids;
  };

  const roots: string[] = [];
  if (rootId !== undefined && nodeMap.has(rootId)) roots.push(rootId);
  nodes.forEach((n) => {
    if (!childIds.has(n.id)) roots.push(n.id);
  });
  nodes.forEach((n) => roots.push(n.id));

  const allExplicit = nodes.every((n) => n.x !== undefined && n.y !== undefined);

  const explicitLayout = (): TreeLayout => {
    const placed = nodes.filter((n) => n.x !== undefined && n.y !== undefined);
    const authored: Point[] = placed.map((n) => ({ x: n.x!, y: n.y! }));

    let nodeRadius = MAX_NODE_R;
    for (let pass = 0; pass < 4; pass += 1) {
      const spacing = minPointSpacing(
        spreadToBox(authored, box, layoutPad(nodeRadius)),
        Math.min(box.width, box.height),
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

  const stretchedLayout = (): TreeLayout => {
    const tidy = tidyTreeSlots(roots, childrenOf);
    const slotWidth = box.width / tidy.leafCount;
    const levelHeight = box.height / (tidy.depth + 1);
    const nodeRadius = clamp(Math.min(slotWidth, levelHeight) * 0.4, MIN_NODE_R, MAX_NODE_R);
    const abstract: Point[] = tidy.slots.map((slot) => ({ x: slot.slot, y: slot.depth }));
    const points = spreadToBox(abstract, box, layoutPad(nodeRadius));

    const placed: ComputedTreeNode[] = [];
    tidy.slots.forEach((slot, index) => {
      const item = nodeMap.get(slot.id)!;
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
    computedNodes.map((node) => [node.id, node]),
  );

  const longestLabel = computedNodes.reduce(
    (longest, node) => Math.max(longest, String(node.val).length),
    1,
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
        .filter((slot): slot is number => slot !== undefined),
    ),
  ).sort((a, b) => a - b);

  const legend: TreeLegendEntry[] = groupSlots.map((slot) => ({
    key: `group-${slot}`,
    label: `Group ${slot + 1}`,
    color: vizSlotColor(slot),
  }));

  return {
    computedNodes,
    computedNodesMap,
    nodeRadius,
    labelFont,
    nodeStroke,
    linkStroke,
    pathStroke,
    groupOf,
    legend,
  };
};
