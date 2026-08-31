import React, { useState, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  GitBranch,
  Layers,
  Zap,
  TrendingUp,
  Activity,
  Info,
  ArrowRight,
  Table,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";

// ============================================================================
// 1. TYPES & CONTRACTS
// ============================================================================

export type DPTreeStudioModality =
  | "tree_diameter_dp"
  | "heavy_light_decomposition"
  | "lca_binary_lifting"
  | "convex_hull_trick_dp";

// --- Tree Data Structures ---
export interface TreeNode {
  readonly id: number;
  readonly label?: string;
  readonly parent?: number;
  readonly children: readonly number[];
  readonly depth?: number;
  readonly value?: number;
  readonly x?: number;
  readonly y?: number;
}

export interface TreeEdge {
  readonly u: number;
  readonly v: number;
  readonly weight?: number;
  readonly isHeavy?: boolean;
}

export interface TreeGraph {
  readonly id?: string;
  readonly name: string;
  readonly description: string;
  readonly root: number;
  readonly nodes: readonly TreeNode[];
  readonly edges?: readonly TreeEdge[];
}

// --- 1. Tree Diameter Contracts ---
export interface TreeDiameterDPResult {
  readonly diameter: number;
  readonly path: readonly number[];
  readonly deepestBranch: Readonly<Record<number, number>>;
  readonly secondDeepestBranch: Readonly<Record<number, number>>;
  readonly subtreeDiameter: Readonly<Record<number, number>>;
  readonly diameterRoot: number;
  readonly bestChild1: Readonly<Record<number, number | null>>;
  readonly bestChild2: Readonly<Record<number, number | null>>;
  readonly postOrder: readonly number[];
}

export interface TwoDFSResult {
  readonly startNode: number;
  readonly farthestA: number;
  readonly farthestB: number;
  readonly distA: number;
  readonly diameter: number;
  readonly pathAtoB: readonly number[];
  readonly dfs1Distances: Readonly<Record<number, number>>;
  readonly dfs2Distances: Readonly<Record<number, number>>;
  readonly dfs1VisitedOrder: readonly number[];
  readonly dfs2VisitedOrder: readonly number[];
}

// --- 2. Heavy-Light Decomposition Contracts ---
export interface HLDResult {
  readonly subtreeSizes: Readonly<Record<number, number>>;
  readonly heavyChild: Readonly<Record<number, number | null>>;
  readonly chainHead: Readonly<Record<number, number>>;
  readonly chainId: Readonly<Record<number, number>>;
  readonly posInBase: Readonly<Record<number, number>>;
  readonly nodeAtPos: readonly number[];
  readonly chainCount: number;
  readonly chains: readonly (readonly number[])[];
  readonly depths: Readonly<Record<number, number>>;
  readonly parents: Readonly<Record<number, number>>;
}

export interface HLDPathInterval {
  readonly chainId: number;
  readonly chainHead: number;
  readonly u: number;
  readonly v: number;
  readonly fromPos: number;
  readonly toPos: number;
}

export interface HLDPathQueryResult {
  readonly u: number;
  readonly v: number;
  readonly lca: number;
  readonly intervals: readonly HLDPathInterval[];
  readonly pathNodes: readonly number[];
  readonly totalNodesCovered: number;
  readonly hopCount: number;
}

// --- 3. LCA Binary Lifting Contracts ---
export interface BinaryLiftingTable {
  readonly maxK: number;
  readonly up: readonly (readonly number[])[];
  readonly depths: readonly number[];
  readonly root: number;
  readonly nodeCount: number;
}

export interface LCAJumpStep {
  readonly node: number;
  readonly from: number;
  readonly to: number;
  readonly stride: number;
  readonly k: number;
}

export interface LCASimultaneousJumpStep {
  readonly uFrom: number;
  readonly uTo: number;
  readonly vFrom: number;
  readonly vTo: number;
  readonly stride: number;
  readonly k: number;
}

export interface LCAQueryResult {
  readonly u: number;
  readonly v: number;
  readonly lca: number;
  readonly depthU: number;
  readonly depthV: number;
  readonly lcaDepth: number;
  readonly equalizingJumps: readonly LCAJumpStep[];
  readonly simultaneousJumps: readonly LCASimultaneousJumpStep[];
  readonly pathUtoV: readonly number[];
  readonly totalJumpsCount: number;
}

// --- 4. Convex Hull Trick Contracts ---
export interface CHTLine {
  readonly id: string | number;
  readonly m: number;
  readonly c: number;
  readonly label?: string;
  readonly color?: string;
}

export interface CHTIntersection {
  readonly x: number;
  readonly y: number;
  readonly line1: CHTLine;
  readonly line2: CHTLine;
}

export interface CHTPoppedLine {
  readonly line: CHTLine;
  readonly reason: string;
  readonly poppedAtStep: number;
}

export interface CHTHistoryStep {
  readonly stepIndex: number;
  readonly line: CHTLine;
  readonly action: "push" | "pop" | "skip";
  readonly description: string;
  readonly stackState: readonly CHTLine[];
}

export interface CHTEnvelopeResult {
  readonly mode: "min" | "max";
  readonly allLines: readonly CHTLine[];
  readonly sortedLines: readonly CHTLine[];
  readonly envelopeLines: readonly CHTLine[];
  readonly intersections: readonly CHTIntersection[];
  readonly poppedLines: readonly CHTPoppedLine[];
  readonly stepHistory: readonly CHTHistoryStep[];
}

export interface CHTLineEvaluation {
  readonly line: CHTLine;
  readonly y: number;
  readonly isOptimal: boolean;
}

export interface CHTQueryResult {
  readonly x: number;
  readonly optY: number;
  readonly optLine: CHTLine;
  readonly optIndex: number;
  readonly evaluations: readonly CHTLineEvaluation[];
}

// Studio Props
export interface DPTreeDecompositionStudioProps {
  readonly initialModality?: DPTreeStudioModality;
  readonly initialPreset?: string;
  readonly width?: number;
  readonly height?: number;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onModalityChange?: (modality: DPTreeStudioModality) => void;
}

// ============================================================================
// 2. PURE ALGORITHMIC SOLVERS & COMPUTATIONS
// ============================================================================

/**
 * Builds a TreeGraph from an edge list and node count.
 */
export function buildTreeFromEdges(
  nodeCount: number,
  edges: readonly [number, number][],
  root: number = 0,
  labels?: readonly string[],
): TreeGraph {
  const adj: number[][] = Array.from({ length: nodeCount }, () => []);
  for (const [u, v] of edges) {
    if (u >= 0 && u < nodeCount && v >= 0 && v < nodeCount) {
      adj[u].push(v);
      adj[v].push(u);
    }
  }

  const children: number[][] = Array.from({ length: nodeCount }, () => []);
  const parents: number[] = Array.from({ length: nodeCount }, () => -1);
  const depths: number[] = Array.from({ length: nodeCount }, () => 0);
  const visited = new Uint8Array(nodeCount);

  const queue: number[] = [root];
  visited[root] = 1;
  depths[root] = 0;
  parents[root] = root;

  while (queue.length > 0) {
    const u = queue.shift()!;
    for (const v of adj[u]) {
      if (!visited[v]) {
        visited[v] = 1;
        parents[v] = u;
        depths[v] = depths[u] + 1;
        children[u].push(v);
        queue.push(v);
      }
    }
  }

  const nodes: TreeNode[] = [];
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: i,
      label: labels && labels[i] ? labels[i] : `Node ${i}`,
      parent: parents[i],
      children: children[i],
      depth: depths[i],
    });
  }

  const treeEdges: TreeEdge[] = edges.map(([u, v]) => ({ u, v, weight: 1 }));

  return {
    name: "Tree Graph",
    description: "Undirected rooted tree structure",
    root,
    nodes,
    edges: treeEdges,
  };
}

/**
 * Compute 2-DFS algorithm for tree diameter.
 * DFS 1: Find node A farthest from arbitrary start node.
 * DFS 2: Find node B farthest from A. Path A -> B is the diameter.
 */
export function computeTwoDFS(tree: TreeGraph, startNode: number = 0): TwoDFSResult {
  const n = tree.nodes.length;
  if (n === 0) {
    return {
      startNode: 0,
      farthestA: 0,
      farthestB: 0,
      distA: 0,
      diameter: 0,
      pathAtoB: [],
      dfs1Distances: {},
      dfs2Distances: {},
      dfs1VisitedOrder: [],
      dfs2VisitedOrder: [],
    };
  }

  // Build full undirected adjacency
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const node of tree.nodes) {
    if (node.parent !== undefined && node.parent !== node.id && node.parent >= 0) {
      adj[node.id].push(node.parent);
      adj[node.parent].push(node.id);
    }
    for (const c of node.children) {
      adj[node.id].push(c);
      adj[c].push(node.id);
    }
  }

  // Deduplicate adjacency list
  for (let i = 0; i < n; i++) {
    adj[i] = Array.from(new Set(adj[i]));
  }

  const runBFS = (src: number) => {
    const dist: number[] = Array(n).fill(-1);
    const prev: number[] = Array(n).fill(-1);
    const order: number[] = [];
    const q: number[] = [src];
    dist[src] = 0;
    prev[src] = src;

    while (q.length > 0) {
      const u = q.shift()!;
      order.push(u);
      for (const v of adj[u]) {
        if (dist[v] === -1) {
          dist[v] = dist[u] + 1;
          prev[v] = u;
          q.push(v);
        }
      }
    }

    let maxNode = src;
    let maxD = 0;
    for (let i = 0; i < n; i++) {
      if (dist[i] > maxD) {
        maxD = dist[i];
        maxNode = i;
      }
    }

    return { maxNode, maxD, dist, prev, order };
  };

  const start = Math.min(Math.max(0, startNode), n - 1);
  const bfs1 = runBFS(start);
  const nodeA = bfs1.maxNode;
  const distA = bfs1.maxD;

  const bfs2 = runBFS(nodeA);
  const nodeB = bfs2.maxNode;
  const diameter = bfs2.maxD;

  // Reconstruct path A -> B
  const path: number[] = [];
  let curr = nodeB;
  while (curr !== nodeA && curr !== -1 && path.length <= n) {
    path.push(curr);
    curr = bfs2.prev[curr];
  }
  path.push(nodeA);
  path.reverse();

  const dfs1Distances: Record<number, number> = {};
  const dfs2Distances: Record<number, number> = {};
  for (let i = 0; i < n; i++) {
    dfs1Distances[i] = bfs1.dist[i];
    dfs2Distances[i] = bfs2.dist[i];
  }

  return {
    startNode: start,
    farthestA: nodeA,
    farthestB: nodeB,
    distA,
    diameter,
    pathAtoB: path,
    dfs1Distances,
    dfs2Distances,
    dfs1VisitedOrder: bfs1.order,
    dfs2VisitedOrder: bfs2.order,
  };
}

/**
 * Compute Tree Diameter via Bottom-Up Dynamic Programming.
 * For each node u:
 *   h1(u) = max branch height among children (0 if leaf)
 *   h2(u) = second max branch height among children (0 if <2 children)
 *   d_local(u) = h1(u) + h2(u)
 *   d_subtree(u) = max(d_local(u), max_{v in children} d_subtree(v))
 */
export function computeTreeDiameterDP(tree: TreeGraph): TreeDiameterDPResult {
  const n = tree.nodes.length;
  if (n === 0) {
    return {
      diameter: 0,
      path: [],
      deepestBranch: {},
      secondDeepestBranch: {},
      subtreeDiameter: {},
      diameterRoot: 0,
      bestChild1: {},
      bestChild2: {},
      postOrder: [],
    };
  }

  const h1: Record<number, number> = {};
  const h2: Record<number, number> = {};
  const dSub: Record<number, number> = {};
  const bestChild1: Record<number, number | null> = {};
  const bestChild2: Record<number, number | null> = {};
  const postOrder: number[] = [];

  // Post-order traversal
  const visited = new Uint8Array(n);
  const traverse = (u: number) => {
    visited[u] = 1;
    for (const v of tree.nodes[u].children) {
      if (!visited[v]) {
        traverse(v);
      }
    }
    postOrder.push(u);
  };

  traverse(tree.root);

  let globalDiameter = 0;
  let diameterCenter = tree.root;

  for (const u of postOrder) {
    const children = tree.nodes[u].children;
    if (children.length === 0) {
      h1[u] = 0;
      h2[u] = 0;
      dSub[u] = 0;
      bestChild1[u] = null;
      bestChild2[u] = null;
    } else {
      let max1 = 0;
      let max2 = 0;
      let c1: number | null = null;
      let c2: number | null = null;

      for (const v of children) {
        const branchLen = (h1[v] ?? 0) + 1;
        if (branchLen > max1) {
          max2 = max1;
          c2 = c1;
          max1 = branchLen;
          c1 = v;
        } else if (branchLen > max2) {
          max2 = branchLen;
          c2 = v;
        }
      }

      h1[u] = max1;
      h2[u] = max2;
      bestChild1[u] = c1;
      bestChild2[u] = c2;

      const localD = max1 + max2;
      let maxChildSubD = 0;
      for (const v of children) {
        maxChildSubD = Math.max(maxChildSubD, dSub[v] ?? 0);
      }
      dSub[u] = Math.max(localD, maxChildSubD);

      if (localD >= globalDiameter) {
        globalDiameter = localD;
        diameterCenter = u;
      }
    }
  }

  // Reconstruct diameter path from diameterCenter
  const getDownwardPath = (firstChild: number | null): number[] => {
    const p: number[] = [];
    let curr = firstChild;
    while (curr !== null && curr !== undefined) {
      p.push(curr);
      curr = bestChild1[curr];
    }
    return p;
  };

  const leftBranch = getDownwardPath(bestChild1[diameterCenter]);
  const rightBranch = getDownwardPath(bestChild2[diameterCenter]);

  const fullPath = [...leftBranch.reverse(), diameterCenter, ...rightBranch];

  return {
    diameter: globalDiameter,
    path: fullPath,
    deepestBranch: h1,
    secondDeepestBranch: h2,
    subtreeDiameter: dSub,
    diameterRoot: diameterCenter,
    bestChild1,
    bestChild2,
    postOrder,
  };
}

/**
 * Heavy-Light Decomposition (HLD)
 * DFS 1 (dfs_sz): computes sz[u], depth[u], parent[u], heavy[u] (child with max sz).
 * DFS 2 (dfs_hld): decomposes tree into contiguous heavy chains, assigns posInBase[u].
 */
export function computeHLD(tree: TreeGraph): HLDResult {
  const n = tree.nodes.length;
  if (n === 0) {
    return {
      subtreeSizes: {},
      heavyChild: {},
      chainHead: {},
      chainId: {},
      posInBase: {},
      nodeAtPos: [],
      chainCount: 0,
      chains: [],
      depths: {},
      parents: {},
    };
  }

  const sz: Record<number, number> = {};
  const heavy: Record<number, number | null> = {};
  const depths: Record<number, number> = {};
  const parents: Record<number, number> = {};

  // DFS 1: Subtree sizes & Heavy child identification
  const dfsSz = (u: number, p: number, d: number) => {
    sz[u] = 1;
    depths[u] = d;
    parents[u] = p;
    heavy[u] = null;
    let maxChildSz = 0;

    for (const v of tree.nodes[u].children) {
      if (v !== p) {
        dfsSz(v, u, d + 1);
        sz[u] += sz[v];
        if (sz[v] > maxChildSz) {
          maxChildSz = sz[v];
          heavy[u] = v;
        }
      }
    }
  };

  dfsSz(tree.root, tree.root, 0);

  const chainHead: Record<number, number> = {};
  const chainId: Record<number, number> = {};
  const posInBase: Record<number, number> = {};
  const nodeAtPos: number[] = Array(n).fill(0);
  const chainsMap: Map<number, number[]> = new Map();

  let timer = 0;
  let currentChainId = 0;

  // DFS 2: Base Array Indexing & Heavy Chains
  const dfsHld = (u: number, head: number, cId: number) => {
    posInBase[u] = timer;
    nodeAtPos[timer] = u;
    timer++;

    chainHead[u] = head;
    chainId[u] = cId;

    if (!chainsMap.has(cId)) {
      chainsMap.set(cId, []);
    }
    chainsMap.get(cId)!.push(u);

    // 1. Visit Heavy child first to maintain contiguous range in base array!
    const hChild = heavy[u];
    if (hChild !== null && hChild !== undefined) {
      dfsHld(hChild, head, cId);
    }

    // 2. Visit Light children, each initiating a new heavy chain
    for (const v of tree.nodes[u].children) {
      if (v !== parents[u] && v !== hChild) {
        currentChainId++;
        dfsHld(v, v, currentChainId);
      }
    }
  };

  dfsHld(tree.root, tree.root, 0);

  const chains: number[][] = [];
  const sortedChainKeys = Array.from(chainsMap.keys()).sort((a, b) => a - b);
  for (const k of sortedChainKeys) {
    chains.push(chainsMap.get(k)!);
  }

  return {
    subtreeSizes: sz,
    heavyChild: heavy,
    chainHead,
    chainId,
    posInBase,
    nodeAtPos,
    chainCount: chains.length,
    chains,
    depths,
    parents,
  };
}

/**
 * Path Query on HLD: Decomposes arbitrary (u, v) tree path into O(log N) contiguous intervals.
 */
export function queryHLDPath(
  tree: TreeGraph,
  hld: HLDResult,
  u: number,
  v: number,
): HLDPathQueryResult {
  const intervals: HLDPathInterval[] = [];
  let currU = u;
  let currV = v;
  let hopCount = 0;

  // Hop heavy chain heads until both nodes share the same heavy chain
  while (hld.chainHead[currU] !== hld.chainHead[currV]) {
    hopCount++;
    const headU = hld.chainHead[currU];
    const headV = hld.chainHead[currV];

    if ((hld.depths[headU] ?? 0) >= (hld.depths[headV] ?? 0)) {
      const p1 = hld.posInBase[headU];
      const p2 = hld.posInBase[currU];
      intervals.push({
        chainId: hld.chainId[currU],
        chainHead: headU,
        u: headU,
        v: currU,
        fromPos: Math.min(p1, p2),
        toPos: Math.max(p1, p2),
      });
      currU = hld.parents[headU] ?? tree.root;
    } else {
      const p1 = hld.posInBase[headV];
      const p2 = hld.posInBase[currV];
      intervals.push({
        chainId: hld.chainId[currV],
        chainHead: headV,
        u: headV,
        v: currV,
        fromPos: Math.min(p1, p2),
        toPos: Math.max(p1, p2),
      });
      currV = hld.parents[headV] ?? tree.root;
    }
  }

  // Final interval on the shared heavy chain
  const pU = hld.posInBase[currU];
  const pV = hld.posInBase[currV];
  intervals.push({
    chainId: hld.chainId[currU],
    chainHead: hld.chainHead[currU],
    u: (hld.depths[currU] ?? 0) <= (hld.depths[currV] ?? 0) ? currU : currV,
    v: (hld.depths[currU] ?? 0) > (hld.depths[currV] ?? 0) ? currU : currV,
    fromPos: Math.min(pU, pV),
    toPos: Math.max(pU, pV),
  });

  const lca = (hld.depths[currU] ?? 0) <= (hld.depths[currV] ?? 0) ? currU : currV;

  // Collect all unique nodes in the path
  const pathSet = new Set<number>();
  for (const interval of intervals) {
    for (let p = interval.fromPos; p <= interval.toPos; p++) {
      pathSet.add(hld.nodeAtPos[p]);
    }
  }

  // Reconstruct ordered path from u -> LCA -> v
  const uPath: number[] = [];
  let tempU = u;
  while (tempU !== lca) {
    uPath.push(tempU);
    tempU = hld.parents[tempU];
  }
  uPath.push(lca);

  const vPath: number[] = [];
  let tempV = v;
  while (tempV !== lca) {
    vPath.push(tempV);
    tempV = hld.parents[tempV];
  }
  vPath.reverse();

  const fullPath = [...uPath, ...vPath];

  return {
    u,
    v,
    lca,
    intervals,
    pathNodes: fullPath,
    totalNodesCovered: pathSet.size,
    hopCount,
  };
}

/**
 * Builds Sparse Jump Table for Binary Lifting LCA: up[u][k] = 2^k-th ancestor of u.
 */
export function buildBinaryLiftingTable(tree: TreeGraph): BinaryLiftingTable {
  const n = tree.nodes.length;
  if (n === 0) {
    return {
      maxK: 1,
      up: [],
      depths: [],
      root: 0,
      nodeCount: 0,
    };
  }

  const maxK = Math.max(1, Math.ceil(Math.log2(Math.max(2, n))) + 1);
  const depths: number[] = Array(n).fill(0);
  const up: number[][] = Array.from({ length: n }, () => Array(maxK).fill(0));

  // Compute depths & immediate parent (k = 0)
  const computeDepths = (u: number, p: number, d: number) => {
    depths[u] = d;
    up[u][0] = p;
    for (const v of tree.nodes[u].children) {
      if (v !== p) {
        computeDepths(v, u, d + 1);
      }
    }
  };

  computeDepths(tree.root, tree.root, 0);

  // Fill sparse table: up[u][k] = up[up[u][k-1]][k-1]
  for (let k = 1; k < maxK; k++) {
    for (let u = 0; u < n; u++) {
      const prevAncestor = up[u][k - 1];
      up[u][k] = up[prevAncestor][k - 1];
    }
  }

  return {
    maxK,
    up,
    depths,
    root: tree.root,
    nodeCount: n,
  };
}

/**
 * Lowest Common Ancestor (LCA) via Binary Lifting Jump Sequence.
 */
export function queryLCA(
  table: BinaryLiftingTable,
  _tree: TreeGraph,
  u: number,
  v: number,
): LCAQueryResult {
  const origU = u;
  const origV = v;
  const equalizingJumps: LCAJumpStep[] = [];
  const simultaneousJumps: LCASimultaneousJumpStep[] = [];

  let currU = u;
  let currV = v;

  // Step 1: Ensure currU is the deeper node
  if (table.depths[currU] < table.depths[currV]) {
    const tmp = currU;
    currU = currV;
    currV = tmp;
  }

  // Step 2: Equalize depths using binary jumps
  const depthDiff = table.depths[currU] - table.depths[currV];
  for (let k = table.maxK - 1; k >= 0; k--) {
    if ((depthDiff & (1 << k)) !== 0) {
      const nextU = table.up[currU][k];
      equalizingJumps.push({
        node: currU,
        from: currU,
        to: nextU,
        stride: 1 << k,
        k,
      });
      currU = nextU;
    }
  }

  // Step 3: If currU == currV, currU is the LCA!
  let lca = currU;
  if (currU !== currV) {
    // Step 4: Binary lift both nodes together
    for (let k = table.maxK - 1; k >= 0; k--) {
      if (table.up[currU][k] !== table.up[currV][k]) {
        const uNext = table.up[currU][k];
        const vNext = table.up[currV][k];
        simultaneousJumps.push({
          uFrom: currU,
          uTo: uNext,
          vFrom: currV,
          vTo: vNext,
          stride: 1 << k,
          k,
        });
        currU = uNext;
        currV = vNext;
      }
    }
    // After loop, nodes are direct children of the LCA
    lca = table.up[currU][0];
  }

  // Construct path from origU -> LCA -> origV
  const uPath: number[] = [];
  let tempU = origU;
  while (tempU !== lca) {
    uPath.push(tempU);
    tempU = table.up[tempU][0];
  }
  uPath.push(lca);

  const vPath: number[] = [];
  let tempV = origV;
  while (tempV !== lca) {
    vPath.push(tempV);
    tempV = table.up[tempV][0];
  }
  vPath.reverse();

  const fullPath = [...uPath, ...vPath];

  return {
    u: origU,
    v: origV,
    lca,
    depthU: table.depths[origU],
    depthV: table.depths[origV],
    lcaDepth: table.depths[lca],
    equalizingJumps,
    simultaneousJumps,
    pathUtoV: fullPath,
    totalJumpsCount: equalizingJumps.length + simultaneousJumps.length,
  };
}

/**
 * Convex Hull Trick: Line Intersection x = (c1 - c2) / (m2 - m1).
 */
export function computeLineIntersection(l1: CHTLine, l2: CHTLine): number | null {
  if (l1.m === l2.m) {
    return null; // Parallel or identical lines
  }
  return (l1.c - l2.c) / (l2.m - l1.m);
}

/**
 * Builds Convex Hull Trick Envelope with Step History & Popped Lines Tracking.
 */
export function buildConvexHullTrick(
  lines: readonly CHTLine[],
  mode: "min" | "max" = "min",
): CHTEnvelopeResult {
  if (lines.length === 0) {
    return {
      mode,
      allLines: [],
      sortedLines: [],
      envelopeLines: [],
      intersections: [],
      poppedLines: [],
      stepHistory: [],
    };
  }

  // Sort lines:
  // For min query: decreasing slopes m, breaking ties with smaller intercept c.
  // For upper envelope (max), sort by increasing slope m, breaking ties with larger intercept c.
  const sorted = [...lines].sort((a, b) => {
    if (mode === "min") {
      if (b.m !== a.m) return b.m - a.m; // Decreasing slope
      return a.c - b.c; // Smaller intercept preferred
    } else {
      if (a.m !== b.m) return a.m - b.m; // Increasing slope
      return b.c - a.c; // Larger intercept preferred
    }
  });

  // Filter parallel lines with same slope (keep the optimal intercept)
  const uniqueSlopeLines: CHTLine[] = [];
  for (const l of sorted) {
    if (uniqueSlopeLines.length === 0) {
      uniqueSlopeLines.push(l);
    } else {
      const last = uniqueSlopeLines[uniqueSlopeLines.length - 1];
      if (last.m === l.m) {
        // Parallel line with worse intercept is redundant
        continue;
      }
      uniqueSlopeLines.push(l);
    }
  }

  const stack: CHTLine[] = [];
  const popped: CHTPoppedLine[] = [];
  const history: CHTHistoryStep[] = [];
  let stepCounter = 0;

  for (const line of uniqueSlopeLines) {
    while (stack.length >= 2) {
      const l1 = stack[stack.length - 2];
      const l2 = stack[stack.length - 1];
      const x12 = computeLineIntersection(l1, l2);
      const x23 = computeLineIntersection(l2, line);

      if (x12 === null || x23 === null) break;

      // Condition for popping middle line l2:
      // In lower envelope (min) with decreasing slopes, x23 <= x12 means l2 is redundant
      // In upper envelope (max) with increasing slopes, x23 <= x12 means l2 is redundant
      if (x23 <= x12) {
        const poppedLine = stack.pop()!;
        stepCounter++;
        popped.push({
          line: poppedLine,
          reason: `Intersection with new line (x=${x23.toFixed(2)}) is ≤ previous intersection (x=${x12.toFixed(2)})`,
          poppedAtStep: stepCounter,
        });
        history.push({
          stepIndex: stepCounter,
          line: poppedLine,
          action: "pop",
          description: `Popped redundant line y = ${poppedLine.m}x + ${poppedLine.c} (subsumed by envelope)`,
          stackState: [...stack],
        });
      } else {
        break;
      }
    }

    stack.push(line);
    stepCounter++;
    history.push({
      stepIndex: stepCounter,
      line,
      action: "push",
      description: `Added line y = ${line.m}x + ${line.c} to envelope stack`,
      stackState: [...stack],
    });
  }

  // Calculate intersection vertices of envelope lines
  const intersections: CHTIntersection[] = [];
  for (let i = 0; i < stack.length - 1; i++) {
    const l1 = stack[i];
    const l2 = stack[i + 1];
    const x = computeLineIntersection(l1, l2);
    if (x !== null) {
      const y = l1.m * x + l1.c;
      intersections.push({ x, y, line1: l1, line2: l2 });
    }
  }

  return {
    mode,
    allLines: lines,
    sortedLines: uniqueSlopeLines,
    envelopeLines: stack,
    intersections,
    poppedLines: popped,
    stepHistory: history,
  };
}

/**
 * Evaluates CHT Envelope at query point x: y*(x) = min_i (m_i x + c_i).
 */
export function queryCHT(envelope: CHTEnvelopeResult, x: number): CHTQueryResult {
  if (envelope.envelopeLines.length === 0) {
    const dummy: CHTLine = { id: "none", m: 0, c: 0, label: "Empty" };
    return {
      x,
      optY: 0,
      optLine: dummy,
      optIndex: -1,
      evaluations: [],
    };
  }

  let optY = envelope.mode === "min" ? Infinity : -Infinity;
  let optIndex = 0;
  const evaluations: CHTLineEvaluation[] = [];

  for (let i = 0; i < envelope.envelopeLines.length; i++) {
    const l = envelope.envelopeLines[i];
    const y = l.m * x + l.c;
    const isBetter = envelope.mode === "min" ? y < optY : y > optY;
    if (isBetter) {
      optY = y;
      optIndex = i;
    }
    evaluations.push({
      line: l,
      y,
      isOptimal: false, // Updated below
    });
  }

  // Mark optimal
  const updatedEvals = evaluations.map((e, idx) => ({
    ...e,
    isOptimal: idx === optIndex,
  }));

  return {
    x,
    optY,
    optLine: envelope.envelopeLines[optIndex],
    optIndex,
    evaluations: updatedEvals,
  };
}

/**
 * Computes Reingold-Tilford hierarchy tree layout mapping node id -> (x, y).
 */
export function computeTreeLayout(
  tree: TreeGraph,
  width: number,
  height: number,
): Map<number, { x: number; y: number }> {
  const layout = new Map<number, { x: number; y: number }>();
  const n = tree.nodes.length;
  if (n === 0) return layout;

  const depths: number[] = Array(n).fill(0);
  let maxDepth = 0;

  const computeDepth = (u: number, d: number) => {
    depths[u] = d;
    maxDepth = Math.max(maxDepth, d);
    for (const v of tree.nodes[u].children) {
      computeDepth(v, d + 1);
    }
  };

  computeDepth(tree.root, 0);

  // Group nodes by depth
  const nodesByDepth: number[][] = Array.from({ length: maxDepth + 1 }, () => []);
  for (let i = 0; i < n; i++) {
    nodesByDepth[depths[i]].push(i);
  }

  // Post-order bottom-up leaf positioning
  let leafCounter = 0;
  const leafPositions = new Map<number, number>();

  const assignLeaves = (u: number) => {
    if (tree.nodes[u].children.length === 0) {
      leafPositions.set(u, leafCounter++);
    } else {
      for (const v of tree.nodes[u].children) {
        assignLeaves(v);
      }
      const first = leafPositions.get(tree.nodes[u].children[0])!;
      const last = leafPositions.get(tree.nodes[u].children[tree.nodes[u].children.length - 1])!;
      leafPositions.set(u, (first + last) / 2);
    }
  };

  assignLeaves(tree.root);

  const totalLeaves = Math.max(1, leafCounter);
  const padX = 60;
  const padY = 50;
  const usableW = Math.max(100, width - 2 * padX);
  const usableH = Math.max(100, height - 2 * padY);
  const levelSpacing = maxDepth > 0 ? usableH / maxDepth : 0;

  for (let i = 0; i < n; i++) {
    const leafFrac = (leafPositions.get(i) ?? 0) / Math.max(1, totalLeaves - 1 || 1);
    const x = padX + leafFrac * usableW;
    const y = padY + depths[i] * levelSpacing;
    layout.set(i, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }

  return layout;
}

// ============================================================================
// 3. PRESET DEFINITIONS & METADATA
// ============================================================================

export interface DPTreePresetConfig {
  readonly id: string;
  readonly name: string;
  readonly modality: DPTreeStudioModality;
  readonly description: string;
  readonly tree?: TreeGraph;
  readonly lines?: readonly CHTLine[];
  readonly mode?: "min" | "max";
  readonly defaultU?: number;
  readonly defaultV?: number;
  readonly defaultX?: number;
}

export const TREE_DIAMETER_PRESETS: Record<string, DPTreePresetConfig> = {
  balanced_binary: {
    id: "balanced_binary",
    name: "Balanced Binary Tree (15 nodes)",
    modality: "tree_diameter_dp",
    description: "Complete binary tree where diameter passes symmetrically near the root.",
    tree: buildTreeFromEdges(15, [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [2, 5],
      [2, 6],
      [3, 7],
      [3, 8],
      [4, 9],
      [4, 10],
      [5, 11],
      [5, 12],
      [6, 13],
      [6, 14],
    ]),
  },
  deep_skewed: {
    id: "deep_skewed",
    name: "Deep Skewed Spine Tree (14 nodes)",
    modality: "tree_diameter_dp",
    description: "Long skewed spine with side branches testing non-root diameter.",
    tree: buildTreeFromEdges(14, [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [2, 9],
      [9, 10],
      [10, 11],
      [11, 12],
      [12, 13],
    ]),
  },
  caterpillar_star: {
    id: "caterpillar_star",
    name: "Caterpillar Multi-Spur Tree (13 nodes)",
    modality: "tree_diameter_dp",
    description: "Backbone spine with multiple star bursts branching off.",
    tree: buildTreeFromEdges(13, [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [0, 5],
      [0, 6],
      [2, 7],
      [2, 8],
      [4, 9],
      [4, 10],
      [4, 11],
      [4, 12],
    ]),
  },
  asymmetric_tree: {
    id: "asymmetric_tree",
    name: "Asymmetric Multi-Fork (12 nodes)",
    modality: "tree_diameter_dp",
    description: "Uneven depths showing bottom-up DP branch pruning.",
    tree: buildTreeFromEdges(12, [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 4],
      [1, 5],
      [4, 6],
      [4, 7],
      [7, 8],
      [2, 9],
      [3, 10],
      [10, 11],
    ]),
  },
};

export const HLD_PRESETS: Record<string, DPTreePresetConfig> = {
  standard_tree_16: {
    id: "standard_tree_16",
    name: "Standard HLD Tree (16 nodes)",
    modality: "heavy_light_decomposition",
    description: "Subtree-size driven heavy chains with multiple light branch hops.",
    tree: buildTreeFromEdges(16, [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [3, 5],
      [3, 6],
      [5, 7],
      [5, 8],
      [4, 9],
      [4, 10],
      [2, 11],
      [2, 12],
      [11, 13],
      [11, 14],
      [13, 15],
    ]),
    defaultU: 8,
    defaultV: 15,
  },
  deep_chain_tree: {
    id: "deep_chain_tree",
    name: "Deep Backbone Chain (15 nodes)",
    modality: "heavy_light_decomposition",
    description: "Dominant heavy trunk chain with small attached light subtrees.",
    tree: buildTreeFromEdges(15, [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [0, 6],
      [1, 7],
      [2, 8],
      [3, 9],
      [4, 10],
      [6, 11],
      [7, 12],
      [8, 13],
      [9, 14],
    ]),
    defaultU: 5,
    defaultV: 14,
  },
  wide_fork: {
    id: "wide_fork",
    name: "Wide 3-Way Fork (14 nodes)",
    modality: "heavy_light_decomposition",
    description: "Wide branching at root showing distinct heavy and light subtrees.",
    tree: buildTreeFromEdges(14, [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 4],
      [1, 5],
      [4, 6],
      [4, 7],
      [6, 8],
      [2, 9],
      [2, 10],
      [9, 11],
      [3, 12],
      [3, 13],
    ]),
    defaultU: 8,
    defaultV: 11,
  },
};

export const LCA_PRESETS: Record<string, DPTreePresetConfig> = {
  tournament_tree_15: {
    id: "tournament_tree_15",
    name: "Tournament Binary Tree (15 nodes)",
    modality: "lca_binary_lifting",
    description: "Symmetric binary tree for testing 2^k power-of-two jumps.",
    tree: buildTreeFromEdges(15, [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [2, 5],
      [2, 6],
      [3, 7],
      [3, 8],
      [4, 9],
      [4, 10],
      [5, 11],
      [5, 12],
      [6, 13],
      [6, 14],
    ]),
    defaultU: 7,
    defaultV: 14,
  },
  deep_hierarchy_18: {
    id: "deep_hierarchy_18",
    name: "Deep File-System Hierarchy (18 nodes)",
    modality: "lca_binary_lifting",
    description: "Deep organizational hierarchy with varying node depths up to 6.",
    tree: buildTreeFromEdges(18, [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [3, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [4, 9],
      [9, 10],
      [2, 11],
      [11, 12],
      [12, 13],
      [13, 14],
      [14, 15],
      [2, 16],
      [16, 17],
    ]),
    defaultU: 8,
    defaultV: 15,
  },
  skewed_zigzag: {
    id: "skewed_zigzag",
    name: "Skewed Zigzag Tree (13 nodes)",
    modality: "lca_binary_lifting",
    description: "Zigzag tree testing depth equalization jumps before binary lifting.",
    tree: buildTreeFromEdges(13, [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [0, 7],
      [7, 8],
      [8, 9],
      [2, 10],
      [4, 11],
      [6, 12],
    ]),
    defaultU: 12,
    defaultV: 9,
  },
};

export const CHT_PRESETS: Record<string, DPTreePresetConfig> = {
  classic_dp_lines: {
    id: "classic_dp_lines",
    name: "Classic DP Lower Envelope (Min)",
    modality: "convex_hull_trick_dp",
    mode: "min",
    description: "Monotonically decreasing slopes forming standard convex lower envelope.",
    lines: [
      { id: "L0", m: 4, c: 4, label: "L0: y = 4x + 4", color: "#38bdf8" },
      { id: "L1", m: 2, c: 0, label: "L1: y = 2x + 0", color: "#818cf8" },
      { id: "L2", m: 1, c: 0, label: "L2: y = 1x + 0", color: "#a855f7" },
      { id: "L3", m: -1, c: 4, label: "L3: y = -1x + 4", color: "#ec4899" },
      { id: "L4", m: -3, c: 12, label: "L4: y = -3x + 12", color: "#f43f5e" },
    ],
    defaultX: 1,
  },
  machine_scheduling: {
    id: "machine_scheduling",
    name: "Machine Scheduling Batch Optimization",
    modality: "convex_hull_trick_dp",
    mode: "min",
    description: "Cost minimization with steep and gentle cost curves.",
    lines: [
      { id: "M0", m: 5, c: -10, label: "M0: y = 5x - 10", color: "#38bdf8" },
      { id: "M1", m: 3, c: -2, label: "M1: y = 3x - 2", color: "#818cf8" },
      { id: "M2", m: 2, c: 3, label: "M2: y = 2x + 3", color: "#34d399" },
      { id: "M3", m: 0, c: 8, label: "M3: y = 0x + 8", color: "#fbbf24" },
      { id: "M4", m: -2, c: 14, label: "M4: y = -2x + 14", color: "#f97316" },
      { id: "M5", m: -4, c: 22, label: "M5: y = -4x + 22", color: "#f43f5e" },
    ],
    defaultX: 3,
  },
  redundant_lines: {
    id: "redundant_lines",
    name: "Redundant Line Pruning Demo",
    modality: "convex_hull_trick_dp",
    mode: "min",
    description: "Includes a line (L1: y=4x+3) completely dominated and popped from envelope.",
    lines: [
      { id: "R0", m: 6, c: 1, label: "R0: y = 6x + 1", color: "#38bdf8" },
      { id: "R1", m: 4, c: 3, label: "R1: y = 4x + 3 (Redundant)", color: "#94a3b8" },
      { id: "R2", m: 2, c: 5, label: "R2: y = 2x + 5", color: "#a855f7" },
      { id: "R3", m: -1, c: 10, label: "R3: y = -1x + 10", color: "#34d399" },
      { id: "R4", m: -3, c: 16, label: "R4: y = -3x + 16", color: "#f43f5e" },
    ],
    defaultX: 1.5,
  },
  upper_envelope_max: {
    id: "upper_envelope_max",
    name: "Upper Envelope Profit Maximization (Max)",
    modality: "convex_hull_trick_dp",
    mode: "max",
    description: "Upper convex envelope optimization for maximum payoff queries.",
    lines: [
      { id: "U0", m: -3, c: -12, label: "U0: y = -3x - 12", color: "#f43f5e" },
      { id: "U1", m: -1, c: -4, label: "U1: y = -1x - 4", color: "#fb923c" },
      { id: "U2", m: 1, c: 0, label: "U2: y = 1x + 0", color: "#fbbf24" },
      { id: "U3", m: 3, c: 0, label: "U3: y = 3x + 0", color: "#34d399" },
      { id: "U4", m: 5, c: -4, label: "U4: y = 5x - 4", color: "#38bdf8" },
    ],
    defaultX: 0,
  },
};

export const DP_TREE_PRESETS: Record<string, DPTreePresetConfig> = {
  ...TREE_DIAMETER_PRESETS,
  ...HLD_PRESETS,
  ...LCA_PRESETS,
  ...CHT_PRESETS,
};

export const DP_TREE_MODALITIES: readonly {
  readonly id: DPTreeStudioModality;
  readonly name: string;
  readonly shortName: string;
  readonly badge: string;
  readonly description: string;
  readonly formulaTeX: string;
}[] = [
  {
    id: "tree_diameter_dp",
    name: "Tree Diameter DP & 2-DFS",
    shortName: "Tree Diameter",
    badge: "O(V + E)",
    description: "Compare 2-DFS double traversal vs Bottom-Up Subtree DP for diameter computation.",
    formulaTeX: "d(u) = \\max(d(v), h_1(u) + h_2(u))",
  },
  {
    id: "heavy_light_decomposition",
    name: "Heavy-Light Decomposition (HLD)",
    shortName: "HLD Chains",
    badge: "O(log² N)",
    description:
      "Decompose tree paths into O(log N) contiguous heavy chain intervals on a 1D base array.",
    formulaTeX: "\\text{heavy}(u) = \\arg\\max_{v} sz[v]",
  },
  {
    id: "lca_binary_lifting",
    name: "LCA Binary Lifting (Sparse Jump Table)",
    shortName: "Binary Lifting LCA",
    badge: "O(log N)",
    description:
      "Precompute 2^k ancestors to equalize depths and binary jump simultaneously to LCA.",
    formulaTeX: "up[u][k] = up[up[u][k-1]][k-1]",
  },
  {
    id: "convex_hull_trick_dp",
    name: "Convex Hull Trick (CHT) DP",
    shortName: "Convex Hull Trick",
    badge: "O(1) / O(log N)",
    description: "Maintain lower/upper line envelope for dynamic programming optimization.",
    formulaTeX: "x_{\\text{intersect}} = \\frac{c_1 - c_2}{m_2 - m_1}",
  },
];

// Color palette for heavy chains
const CHAIN_COLORS = [
  "#f59e0b", // Amber / Gold
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#3b82f6", // Blue
  "#f97316", // Orange
  "#14b8a6", // Teal
];

// ============================================================================
// 4. MAIN STUDIO COMPONENT
// ============================================================================

export const DPTreeDecompositionStudio: React.FC<DPTreeDecompositionStudioProps> = ({
  initialModality = "tree_diameter_dp",
  initialPreset,
  width = 960,
  height = 580,
  standalone = true,
  title = "Dynamic Programming & Tree Decomposition Studio",
  onModalityChange,
}) => {
  // Modality state
  const [modality, setModality] = useState<DPTreeStudioModality>(initialModality);

  // Preset state
  const currentPresets = useMemo(() => {
    switch (modality) {
      case "tree_diameter_dp":
        return TREE_DIAMETER_PRESETS;
      case "heavy_light_decomposition":
        return HLD_PRESETS;
      case "lca_binary_lifting":
        return LCA_PRESETS;
      case "convex_hull_trick_dp":
        return CHT_PRESETS;
    }
  }, [modality]);

  const defaultPresetId = useMemo(() => {
    const keys = Object.keys(currentPresets);
    if (initialPreset && currentPresets[initialPreset]) {
      return initialPreset;
    }
    return keys[0];
  }, [currentPresets, initialPreset]);

  const [presetId, setPresetId] = useState<string>(defaultPresetId);

  // Update preset when modality changes
  useEffect(() => {
    const keys = Object.keys(currentPresets);
    if (!currentPresets[presetId]) {
      setPresetId(keys[0]);
    }
  }, [modality, currentPresets, presetId]);

  const activePreset = currentPresets[presetId] || Object.values(currentPresets)[0];

  // Modality 1 (Diameter) specific states
  const [twoDfsStart, setTwoDfsStart] = useState<number>(0);

  // Modality 2 (HLD) specific states
  const [hldU, setHldU] = useState<number>(activePreset.defaultU ?? 0);
  const [hldV, setHldV] = useState<number>(activePreset.defaultV ?? 1);
  const [show1DArray, setShow1DArray] = useState<boolean>(true);

  // Modality 3 (LCA) specific states
  const [lcaU, setLcaU] = useState<number>(activePreset.defaultU ?? 0);
  const [lcaV, setLcaV] = useState<number>(activePreset.defaultV ?? 1);
  const [showMatrixTable, setShowMatrixTable] = useState<boolean>(true);

  // Modality 4 (CHT) specific states
  const [chtX, setChtX] = useState<number>(activePreset.defaultX ?? 2);
  const [chtMode, setChtMode] = useState<"min" | "max">(activePreset.mode ?? "min");
  const [customLines, setCustomLines] = useState<CHTLine[]>(
    activePreset.lines ? [...activePreset.lines] : [],
  );
  const [newLineM, setNewLineM] = useState<string>("2");
  const [newLineC, setNewLineC] = useState<string>("4");

  // Step Playback state
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000);

  // Sync custom lines with preset change
  useEffect(() => {
    if (activePreset.lines) {
      setCustomLines([...activePreset.lines]);
    }
    if (activePreset.defaultX !== undefined) {
      setChtX(activePreset.defaultX);
    }
    if (activePreset.defaultU !== undefined) {
      setHldU(activePreset.defaultU);
      setLcaU(activePreset.defaultU);
    }
    if (activePreset.defaultV !== undefined) {
      setHldV(activePreset.defaultV);
      setLcaV(activePreset.defaultV);
    }
    if (activePreset.mode !== undefined) {
      setChtMode(activePreset.mode);
    }
    setCurrentStep(0);
    setIsPlaying(false);
  }, [activePreset]);

  // Tree graph for current preset
  const treeGraph: TreeGraph = useMemo(() => {
    if (activePreset.tree) return activePreset.tree;
    return buildTreeFromEdges(8, [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [2, 5],
      [2, 6],
      [3, 7],
    ]);
  }, [activePreset]);

  // Algorithm Results Memoization
  const diameterDP = useMemo(() => computeTreeDiameterDP(treeGraph), [treeGraph]);
  const twoDFS = useMemo(() => computeTwoDFS(treeGraph, twoDfsStart), [treeGraph, twoDfsStart]);
  const hldResult = useMemo(() => computeHLD(treeGraph), [treeGraph]);
  const hldQuery = useMemo(
    () => queryHLDPath(treeGraph, hldResult, hldU, hldV),
    [treeGraph, hldResult, hldU, hldV],
  );
  const binaryTable = useMemo(() => buildBinaryLiftingTable(treeGraph), [treeGraph]);
  const lcaQuery = useMemo(
    () => queryLCA(binaryTable, treeGraph, lcaU, lcaV),
    [binaryTable, treeGraph, lcaU, lcaV],
  );
  const chtEnvelope = useMemo(
    () => buildConvexHullTrick(customLines, chtMode),
    [customLines, chtMode],
  );
  const chtQuery = useMemo(() => queryCHT(chtEnvelope, chtX), [chtEnvelope, chtX]);

  // SVG Layout computation for tree
  const treeLayout = useMemo(() => {
    const canvasW = Math.min(width, 680);
    const canvasH = Math.max(300, Math.min(height - 200, 360));
    return computeTreeLayout(treeGraph, canvasW, canvasH);
  }, [treeGraph, width, height]);

  // Total steps for current modality animation
  const maxSteps = useMemo(() => {
    switch (modality) {
      case "tree_diameter_dp":
        return diameterDP.postOrder.length + twoDFS.pathAtoB.length;
      case "heavy_light_decomposition":
        return hldQuery.intervals.length + 1;
      case "lca_binary_lifting":
        return lcaQuery.equalizingJumps.length + lcaQuery.simultaneousJumps.length + 1;
      case "convex_hull_trick_dp":
        return chtEnvelope.stepHistory.length;
    }
  }, [modality, diameterDP, twoDFS, hldQuery, lcaQuery, chtEnvelope]);

  // Auto playback effect
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= maxSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);
    return () => clearInterval(timer);
  }, [isPlaying, maxSteps, playbackSpeed]);

  const handleModalityChange = (m: DPTreeStudioModality) => {
    setModality(m);
    setCurrentStep(0);
    setIsPlaying(false);
    onModalityChange?.(m);
  };

  const handleAddLine = () => {
    const m = parseFloat(newLineM);
    const c = parseFloat(newLineC);
    if (isNaN(m) || isNaN(c)) return;
    const newId = `L${customLines.length}`;
    const colors = ["#38bdf8", "#818cf8", "#a855f7", "#ec4899", "#f43f5e", "#fbbf24", "#34d399"];
    const color = colors[customLines.length % colors.length];
    setCustomLines([
      ...customLines,
      { id: newId, m, c, label: `${newId}: y = ${m}x + ${c}`, color },
    ]);
  };

  const handleRemoveLine = (id: string | number) => {
    if (customLines.length <= 1) return;
    setCustomLines(customLines.filter((l) => l.id !== id));
  };

  // ==========================================================================
  // RENDER: Tree SVG Canvas
  // ==========================================================================
  const renderTreeSVG = () => {
    const canvasW = Math.min(width, 680);
    const canvasH = 340;

    // Determine edge highlight state based on modality
    const isEdgeInDiameter = (u: number, v: number): boolean => {
      if (modality !== "tree_diameter_dp") return false;
      const path = diameterDP.path;
      for (let i = 0; i < path.length - 1; i++) {
        if ((path[i] === u && path[i + 1] === v) || (path[i] === v && path[i + 1] === u)) {
          return true;
        }
      }
      return false;
    };

    const isEdgeInHLDQuery = (u: number, v: number): boolean => {
      if (modality !== "heavy_light_decomposition") return false;
      const pNodes = hldQuery.pathNodes;
      for (let i = 0; i < pNodes.length - 1; i++) {
        if ((pNodes[i] === u && pNodes[i + 1] === v) || (pNodes[i] === v && pNodes[i + 1] === u)) {
          return true;
        }
      }
      return false;
    };

    const isEdgeInLCAPath = (u: number, v: number): boolean => {
      if (modality !== "lca_binary_lifting") return false;
      const pNodes = lcaQuery.pathUtoV;
      for (let i = 0; i < pNodes.length - 1; i++) {
        if ((pNodes[i] === u && pNodes[i + 1] === v) || (pNodes[i] === v && pNodes[i + 1] === u)) {
          return true;
        }
      }
      return false;
    };

    return (
      <svg
        viewBox={`0 0 ${canvasW} ${canvasH}`}
        className="w-full h-[340px] bg-slate-950/80 rounded-xl border border-slate-800 shadow-inner select-none"
      >
        <defs>
          <linearGradient id="goldHeavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.8" />
          </filter>
          <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.8" />
          </filter>
          <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#06b6d4" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* 1. Render Tree Edges */}
        <g className="edges">
          {treeGraph.nodes.map((node) => {
            const p1 = treeLayout.get(node.id);
            if (!p1) return null;

            return node.children.map((childId) => {
              const p2 = treeLayout.get(childId);
              if (!p2) return null;

              const isHeavy = hldResult.heavyChild[node.id] === childId;
              const inDiameter = isEdgeInDiameter(node.id, childId);
              const inHLD = isEdgeInHLDQuery(node.id, childId);
              const inLCA = isEdgeInLCAPath(node.id, childId);

              let strokeColor = "#334155"; // Default light slate
              let strokeWidth = 2;
              let strokeDash: string | undefined = undefined;
              let filter = undefined;

              if (modality === "heavy_light_decomposition") {
                if (isHeavy) {
                  strokeColor = "#f59e0b"; // Gold for heavy edge
                  strokeWidth = 4.5;
                  filter = "url(#glowGold)";
                } else {
                  strokeColor = "#64748b";
                  strokeDash = "4 4";
                  strokeWidth = 1.8;
                }
                if (inHLD) {
                  strokeColor = "#38bdf8"; // Highlighted query edge
                  strokeWidth = 5;
                  filter = "url(#glowCyan)";
                }
              } else if (modality === "tree_diameter_dp" && inDiameter) {
                strokeColor = "#10b981"; // Emerald green for diameter
                strokeWidth = 4.5;
                filter = "url(#glowGreen)";
              } else if (modality === "lca_binary_lifting" && inLCA) {
                strokeColor = "#06b6d4";
                strokeWidth = 4;
                filter = "url(#glowCyan)";
              }

              return (
                <line
                  key={`edge-${node.id}-${childId}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  strokeLinecap="round"
                  filter={filter}
                  className="transition-all duration-300"
                />
              );
            });
          })}
        </g>

        {/* 2. Render Tree Nodes */}
        <g className="nodes">
          {treeGraph.nodes.map((node) => {
            const pos = treeLayout.get(node.id);
            if (!pos) return null;

            const isRoot = node.id === treeGraph.root;
            const isHLDChainHead = hldResult.chainHead[node.id] === node.id;
            const chainColor =
              CHAIN_COLORS[(hldResult.chainId[node.id] ?? 0) % CHAIN_COLORS.length];

            // Highlights
            const isDiameterCenter =
              diameterDP.diameterRoot === node.id && modality === "tree_diameter_dp";
            const isTwoDfsA = twoDFS.farthestA === node.id && modality === "tree_diameter_dp";
            const isTwoDfsB = twoDFS.farthestB === node.id && modality === "tree_diameter_dp";
            const isQueryU =
              (modality === "heavy_light_decomposition" && hldU === node.id) ||
              (modality === "lca_binary_lifting" && lcaU === node.id);
            const isQueryV =
              (modality === "heavy_light_decomposition" && hldV === node.id) ||
              (modality === "lca_binary_lifting" && lcaV === node.id);
            const isLCA = modality === "lca_binary_lifting" && lcaQuery.lca === node.id;

            let fill = "#1e293b";
            let stroke = "#475569";
            let strokeWidth = 2;
            let radius = 17;

            if (modality === "heavy_light_decomposition") {
              stroke = chainColor;
              strokeWidth = isHLDChainHead ? 3.5 : 2;
              if (isQueryU || isQueryV) {
                fill = "#0369a1";
                stroke = "#38bdf8";
                radius = 20;
              }
            } else if (modality === "tree_diameter_dp") {
              if (isDiameterCenter) {
                fill = "#065f46";
                stroke = "#10b981";
                radius = 20;
              } else if (isTwoDfsA || isTwoDfsB) {
                fill = "#7c2d12";
                stroke = "#f97316";
                radius = 19;
              }
            } else if (modality === "lca_binary_lifting") {
              if (isLCA) {
                fill = "#0e7490";
                stroke = "#22d3ee";
                radius = 21;
              } else if (isQueryU || isQueryV) {
                fill = "#4338ca";
                stroke = "#818cf8";
                radius = 19;
              }
            }

            return (
              <g
                key={`node-${node.id}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer group"
                onClick={() => {
                  if (modality === "heavy_light_decomposition") {
                    if (hldU !== node.id) setHldV(node.id);
                    else setHldU(node.id);
                  } else if (modality === "lca_binary_lifting") {
                    if (lcaU !== node.id) setLcaV(node.id);
                    else setLcaU(node.id);
                  } else if (modality === "tree_diameter_dp") {
                    setTwoDfsStart(node.id);
                  }
                }}
              >
                {/* Outer Glow Ring for Query / Root Nodes */}
                {(isQueryU || isQueryV || isLCA || isDiameterCenter) && (
                  <circle
                    r={radius + 5}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    className="animate-spin-slow opacity-80"
                  />
                )}

                {/* Node Circle */}
                <circle
                  r={radius}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  className="transition-all duration-200 group-hover:scale-110"
                />

                {/* Root Badge Flag */}
                {isRoot && (
                  <circle
                    cx={radius - 4}
                    cy={-radius + 4}
                    r="4"
                    fill="#10b981"
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                )}

                {/* Node ID Label */}
                <text
                  textAnchor="middle"
                  dy=".35em"
                  fill="#f8fafc"
                  fontSize="12"
                  fontWeight="600"
                  className="pointer-events-none"
                >
                  {node.id}
                </text>

                {/* Auxiliary Telemetry Badge underneath */}
                <text
                  textAnchor="middle"
                  y={radius + 13}
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontWeight="500"
                  className="pointer-events-none"
                >
                  {modality === "heavy_light_decomposition" &&
                    `sz:${hldResult.subtreeSizes[node.id] ?? 1}`}
                  {modality === "tree_diameter_dp" &&
                    `h1:${diameterDP.deepestBranch[node.id] ?? 0}`}
                  {modality === "lca_binary_lifting" && `d:${binaryTable.depths[node.id] ?? 0}`}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    );
  };

  // ==========================================================================
  // RENDER: Convex Hull Trick 2D Cartesian SVG Canvas
  // ==========================================================================
  const renderCHTSVG = () => {
    const canvasW = Math.min(width, 680);
    const canvasH = 340;
    const pad = 45;

    // Compute bounding domain
    const xMin = -5;
    const xMax = 6;
    const yMin = -20;
    const yMax = 35;

    const toSvgX = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * (canvasW - 2 * pad);
    const toSvgY = (y: number) =>
      canvasH - pad - ((y - yMin) / (yMax - yMin)) * (canvasH - 2 * pad);

    const zeroX = toSvgX(0);
    const zeroY = toSvgY(0);

    return (
      <svg
        viewBox={`0 0 ${canvasW} ${canvasH}`}
        className="w-full h-[340px] bg-slate-950/80 rounded-xl border border-slate-800 shadow-inner select-none"
      >
        <defs>
          <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Coordinate Grid Lines */}
        {[-4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((xVal) => (
          <line
            key={`grid-x-${xVal}`}
            x1={toSvgX(xVal)}
            y1={pad}
            x2={toSvgX(xVal)}
            y2={canvasH - pad}
            stroke="#1e293b"
            strokeWidth={xVal === 0 ? 1.5 : 0.8}
            strokeDasharray={xVal === 0 ? undefined : "3 3"}
          />
        ))}
        {[-10, 0, 10, 20, 30].map((yVal) => (
          <line
            key={`grid-y-${yVal}`}
            x1={pad}
            y1={toSvgY(yVal)}
            x2={canvasW - pad}
            y2={toSvgY(yVal)}
            stroke="#1e293b"
            strokeWidth={yVal === 0 ? 1.5 : 0.8}
            strokeDasharray={yVal === 0 ? undefined : "3 3"}
          />
        ))}

        {/* Axes */}
        <line
          x1={pad}
          y1={zeroY}
          x2={canvasW - pad}
          y2={zeroY}
          stroke="#475569"
          strokeWidth="1.5"
        />
        <line
          x1={zeroX}
          y1={pad}
          x2={zeroX}
          y2={canvasH - pad}
          stroke="#475569"
          strokeWidth="1.5"
        />

        <text x={canvasW - pad + 6} y={zeroY + 4} fill="#94a3b8" fontSize="11" fontWeight="600">
          x
        </text>
        <text
          x={zeroX - 4}
          y={pad - 8}
          fill="#94a3b8"
          fontSize="11"
          fontWeight="600"
          textAnchor="end"
        >
          y
        </text>

        {/* Render All Candidate Lines */}
        {customLines.map((l) => {
          const y1 = l.m * xMin + l.c;
          const y2 = l.m * xMax + l.c;
          const isPopped = chtEnvelope.poppedLines.some((p) => p.line.id === l.id);

          return (
            <line
              key={`line-${l.id}`}
              x1={toSvgX(xMin)}
              y1={toSvgY(y1)}
              x2={toSvgX(xMax)}
              y2={toSvgY(y2)}
              stroke={isPopped ? "#475569" : l.color || "#38bdf8"}
              strokeWidth={isPopped ? 1 : 1.5}
              strokeDasharray={isPopped ? "4 4" : undefined}
              opacity={isPopped ? 0.35 : 0.65}
            />
          );
        })}

        {/* Render Convex Hull Envelope Segments */}
        {chtEnvelope.envelopeLines.map((l, idx) => {
          // Determine x bounds for this envelope line segment
          const prevInter = idx > 0 ? chtEnvelope.intersections[idx - 1] : null;
          const nextInter =
            idx < chtEnvelope.intersections.length ? chtEnvelope.intersections[idx] : null;

          const segX1 = prevInter ? prevInter.x : xMin;
          const segX2 = nextInter ? nextInter.x : xMax;

          const segY1 = l.m * segX1 + l.c;
          const segY2 = l.m * segX2 + l.c;

          return (
            <line
              key={`env-seg-${l.id}`}
              x1={toSvgX(segX1)}
              y1={toSvgY(segY1)}
              x2={toSvgX(segX2)}
              y2={toSvgY(segY2)}
              stroke={chtMode === "min" ? "#38bdf8" : "#f43f5e"}
              strokeWidth="3.5"
              filter="url(#glowBlue)"
            />
          );
        })}

        {/* Envelope Intersection Nodes */}
        {chtEnvelope.intersections.map((inter, idx) => (
          <g key={`inter-${idx}`} transform={`translate(${toSvgX(inter.x)}, ${toSvgY(inter.y)})`}>
            <circle r="4.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <text y="-8" textAnchor="middle" fill="#7dd3fc" fontSize="9" fontWeight="600">
              ({inter.x.toFixed(1)}, {inter.y.toFixed(1)})
            </text>
          </g>
        ))}

        {/* Query Probe Line at x = chtX */}
        <line
          x1={toSvgX(chtX)}
          y1={pad}
          x2={toSvgX(chtX)}
          y2={canvasH - pad}
          stroke="#f59e0b"
          strokeWidth="1.8"
          strokeDasharray="4 4"
        />

        {/* Optimal Touchpoint Query y*(x) */}
        {chtQuery.optLine && (
          <g transform={`translate(${toSvgX(chtX)}, ${toSvgY(chtQuery.optY)})`}>
            <circle
              r="6"
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth="2"
              className="animate-pulse"
            />
            <rect
              x="8"
              y="-12"
              width="90"
              height="22"
              rx="4"
              fill="#0f172a"
              stroke="#f59e0b"
              strokeWidth="1"
            />
            <text x="14" y="2" fill="#fbbf24" fontSize="10" fontWeight="700">
              y* = {chtQuery.optY.toFixed(2)}
            </text>
          </g>
        )}
      </svg>
    );
  };

  // ==========================================================================
  // RENDER: Modality-Specific Secondary View (1D Array or Sparse Matrix)
  // ==========================================================================
  const renderSecondaryPanel = () => {
    if (modality === "heavy_light_decomposition" && show1DArray) {
      return (
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                1D Segment Tree Base Array Mapping (Contiguous Heavy Chains)
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Length: {hldResult.nodeAtPos.length} nodes • Chains: {hldResult.chainCount}
            </span>
          </div>

          {/* Base Array Cells */}
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-2">
            {hldResult.nodeAtPos.map((nodeId, pos) => {
              const chainId = hldResult.chainId[nodeId] ?? 0;
              const chainColor = CHAIN_COLORS[chainId % CHAIN_COLORS.length];
              const isInQuery = hldQuery.intervals.some(
                (inv) => pos >= inv.fromPos && pos <= inv.toPos,
              );

              return (
                <div
                  key={`base-pos-${pos}`}
                  className={`flex flex-col items-center justify-center min-w-[42px] h-[52px] rounded-lg border text-xs transition-all ${
                    isInQuery
                      ? "bg-sky-950/80 border-sky-400 text-sky-200 shadow-md scale-105"
                      : "bg-slate-800/80 border-slate-700 text-slate-300"
                  }`}
                  style={{ borderTopColor: chainColor, borderTopWidth: 3 }}
                >
                  <span className="font-mono font-bold text-slate-100">N{nodeId}</span>
                  <span className="text-[10px] text-slate-400">pos:{pos}</span>
                </div>
              );
            })}
          </div>

          {/* Path Query Intervals Breakdown */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-2 items-center text-xs">
            <span className="text-slate-400 font-medium">
              Path ({hldU} → {hldV}) SegTree Intervals:
            </span>
            {hldQuery.intervals.map((inv, idx) => (
              <span
                key={`inv-${idx}`}
                className="px-2 py-0.5 rounded bg-sky-900/50 border border-sky-500 text-sky-300 font-mono font-semibold"
              >
                [{inv.fromPos}, {inv.toPos}] (Chain {inv.chainId})
              </span>
            ))}
            <span className="text-emerald-400 font-medium ml-auto">
              Total Hops: {hldQuery.hopCount} ≤ O(log N)
            </span>
          </div>
        </div>
      );
    }

    if (modality === "lca_binary_lifting" && showMatrixTable) {
      return (
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Binary Lifting Sparse Jump Table [up[u][k]] (2^k-th Ancestor)
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Nodes: {binaryTable.nodeCount} • Max Power K: {binaryTable.maxK}
            </span>
          </div>

          <table className="w-full text-xs font-mono text-center border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-1 px-2 text-left">Node u</th>
                <th className="py-1 px-2">Depth</th>
                {Array.from({ length: binaryTable.maxK }, (_, k) => (
                  <th key={`head-k-${k}`} className="py-1 px-2 text-cyan-400">
                    2^{k} ({1 << k})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {treeGraph.nodes.map((node) => {
                const isSelected = node.id === lcaU || node.id === lcaV;
                const isLCA = node.id === lcaQuery.lca;

                return (
                  <tr
                    key={`sparse-row-${node.id}`}
                    className={`border-b border-slate-800/60 transition-colors ${
                      isLCA
                        ? "bg-cyan-950/40 text-cyan-200"
                        : isSelected
                          ? "bg-indigo-950/30 text-indigo-200"
                          : "hover:bg-slate-800/40 text-slate-300"
                    }`}
                  >
                    <td className="py-1 px-2 text-left font-bold text-slate-100">Node {node.id}</td>
                    <td className="py-1 px-2 text-slate-400">{binaryTable.depths[node.id]}</td>
                    {Array.from({ length: binaryTable.maxK }, (_, k) => {
                      const anc = binaryTable.up[node.id]?.[k] ?? node.id;
                      return (
                        <td key={`cell-${node.id}-${k}`} className="py-1 px-2">
                          {anc}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={`flex flex-col gap-4 text-slate-100 font-sans ${
        standalone ? "p-6 max-w-7xl mx-auto" : "w-full"
      }`}
    >
      {/* ======================================================================
          TOP HEADER & MODALITY TABS
      ====================================================================== */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <GitBranch className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-50">{title}</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Interactive DP & Decomposition
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tree Diameter DP vs 2-DFS • Heavy-Light Decomposition (HLD) • Binary Lifting LCA •
            Convex Hull Trick (CHT)
          </p>
        </div>

        {/* Modality Selector Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {DP_TREE_MODALITIES.map((mod) => {
            const isActive = modality === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => handleModalityChange(mod.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-slate-800 text-emerald-400 shadow border border-slate-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                {mod.id === "tree_diameter_dp" && (
                  <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                )}
                {mod.id === "heavy_light_decomposition" && (
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                )}
                {mod.id === "lca_binary_lifting" && <Zap className="w-3.5 h-3.5 text-cyan-400" />}
                {mod.id === "convex_hull_trick_dp" && (
                  <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                )}
                {mod.shortName}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================================
          CONTROLS BAR: PRESET & PARAMETERS
      ====================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 items-center">
        {/* Presets dropdown */}
        <div className="lg:col-span-4 flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Topology Preset:
          </span>
          <select
            value={presetId}
            onChange={(e) => setPresetId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-emerald-500"
          >
            {Object.values(currentPresets).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Modality Specific Controls */}
        <div className="lg:col-span-5 flex flex-wrap items-center gap-2">
          {modality === "tree_diameter_dp" && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">2-DFS Start:</span>
              <select
                value={twoDfsStart}
                onChange={(e) => setTwoDfsStart(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
              >
                {treeGraph.nodes.map((n) => (
                  <option key={`opt-dfs-${n.id}`} value={n.id}>
                    Node {n.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {modality === "heavy_light_decomposition" && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Query Path:</span>
              <select
                value={hldU}
                onChange={(e) => setHldU(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
              >
                {treeGraph.nodes.map((n) => (
                  <option key={`opt-hld-u-${n.id}`} value={n.id}>
                    u: Node {n.id}
                  </option>
                ))}
              </select>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={hldV}
                onChange={(e) => setHldV(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
              >
                {treeGraph.nodes.map((n) => (
                  <option key={`opt-hld-v-${n.id}`} value={n.id}>
                    v: Node {n.id}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShow1DArray(!show1DArray)}
                className="ml-2 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-amber-400 text-xs font-semibold hover:bg-slate-700"
              >
                {show1DArray ? "Hide Array" : "Show Array"}
              </button>
            </div>
          )}

          {modality === "lca_binary_lifting" && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">LCA Nodes:</span>
              <select
                value={lcaU}
                onChange={(e) => setLcaU(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
              >
                {treeGraph.nodes.map((n) => (
                  <option key={`opt-lca-u-${n.id}`} value={n.id}>
                    u: Node {n.id}
                  </option>
                ))}
              </select>
              <span className="text-slate-400">&</span>
              <select
                value={lcaV}
                onChange={(e) => setLcaV(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
              >
                {treeGraph.nodes.map((n) => (
                  <option key={`opt-lca-v-${n.id}`} value={n.id}>
                    v: Node {n.id}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowMatrixTable(!showMatrixTable)}
                className="ml-2 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-400 text-xs font-semibold hover:bg-slate-700"
              >
                {showMatrixTable ? "Hide Sparse Matrix" : "Show Sparse Matrix"}
              </button>
            </div>
          )}

          {modality === "convex_hull_trick_dp" && (
            <div className="flex items-center gap-3 text-xs w-full">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Mode:</span>
                <button
                  onClick={() => setChtMode(chtMode === "min" ? "max" : "min")}
                  className={`px-2 py-0.5 rounded font-bold uppercase ${
                    chtMode === "min"
                      ? "bg-sky-500/20 text-sky-400 border border-sky-500"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500"
                  }`}
                >
                  {chtMode}
                </button>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-slate-400">Query x:</span>
                <input
                  type="range"
                  min="-4"
                  max="5"
                  step="0.1"
                  value={chtX}
                  onChange={(e) => setChtX(parseFloat(e.target.value))}
                  className="w-24 accent-amber-400"
                />
                <span className="font-mono font-bold text-amber-400 min-w-[36px]">
                  {chtX.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Playback Controls */}
        <div className="lg:col-span-3 flex items-center justify-end gap-1.5">
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-slate-300 text-[11px]"
          >
            <option value={1500}>0.7x</option>
            <option value={1000}>1.0x</option>
            <option value={500}>2.0x</option>
          </select>
          <button
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            title="Step Back"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => setCurrentStep((s) => Math.min(maxSteps - 1, s + 1))}
            disabled={currentStep >= maxSteps - 1}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            title="Step Forward"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setCurrentStep(0);
              setIsPlaying(false);
            }}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ======================================================================
          MAIN WORKSPACE: VISUALIZER CANVAS (LEFT) & TELEMETRY PANEL (RIGHT)
      ====================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Canvas & Optional Secondary Views */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Main Visualizer Canvas */}
          {modality === "convex_hull_trick_dp" ? renderCHTSVG() : renderTreeSVG()}

          {/* Secondary Array / Table Panel */}
          {renderSecondaryPanel()}

          {/* CHT Line Insertion Controls & Lines List */}
          {modality === "convex_hull_trick_dp" && (
            <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-slate-300">Add Line:</span>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400">m =</span>
                  <input
                    type="number"
                    value={newLineM}
                    onChange={(e) => setNewLineM(e.target.value)}
                    className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                  />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400">c =</span>
                  <input
                    type="number"
                    value={newLineC}
                    onChange={(e) => setNewLineC(e.target.value)}
                    className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                  />
                </div>
                <button
                  onClick={handleAddLine}
                  className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Insert Line
                </button>
              </div>

              {/* Line Chips with Delete */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                {customLines.map((l) => {
                  const isPopped = chtEnvelope.poppedLines.some((p) => p.line.id === l.id);
                  return (
                    <div
                      key={`chip-${l.id}`}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono border ${
                        isPopped
                          ? "bg-slate-900/60 border-slate-800 text-slate-500 line-through"
                          : "bg-slate-800 border-slate-700 text-slate-200"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: l.color || "#38bdf8" }}
                      />
                      <span>{l.label || `y=${l.m}x+${l.c}`}</span>
                      {customLines.length > 1 && (
                        <button
                          onClick={() => handleRemoveLine(l.id)}
                          className="text-slate-500 hover:text-rose-400 ml-1"
                          title="Remove line"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Telemetry & Educational Formula Breakdown */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Active Formula & Complexity Card */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Mathematical Framework
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {DP_TREE_MODALITIES.find((m) => m.id === modality)?.badge}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              {DP_TREE_MODALITIES.find((m) => m.id === modality)?.description}
            </p>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-xs text-emerald-300">
              {DP_TREE_MODALITIES.find((m) => m.id === modality)?.formulaTeX}
            </div>
          </div>

          {/* Telemetry Metrics Card */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Execution Telemetry
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {modality === "tree_diameter_dp" && (
                <>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Tree Diameter
                    </span>
                    <span className="text-emerald-400 font-mono font-bold text-base">
                      {diameterDP.diameter} edges
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">2-DFS Match</span>
                    <span className="text-emerald-400 font-mono font-bold text-base">
                      {twoDFS.diameter === diameterDP.diameter ? "100% Equal" : "Mismatch"}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Diameter Path
                    </span>
                    <span className="text-slate-200 font-mono text-xs font-medium">
                      {diameterDP.path.join(" → ")}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase">
                      2-DFS Endpoints
                    </span>
                    <span className="text-amber-300 font-mono text-xs">
                      A: Node {twoDFS.farthestA} ⟷ B: Node {twoDFS.farthestB}
                    </span>
                  </div>
                </>
              )}

              {modality === "heavy_light_decomposition" && (
                <>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Path Length</span>
                    <span className="text-sky-400 font-mono font-bold text-base">
                      {hldQuery.pathNodes.length} nodes
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Heavy Chains</span>
                    <span className="text-amber-400 font-mono font-bold text-base">
                      {hldResult.chainCount} chains
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase">
                      LCA of ({hldU}, {hldV})
                    </span>
                    <span className="text-emerald-400 font-mono text-xs font-bold">
                      Node {hldQuery.lca} (Depth {hldResult.depths[hldQuery.lca]})
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Path Intervals
                    </span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {hldQuery.intervals.map((i) => `[${i.fromPos},${i.toPos}]`).join(", ")}
                    </span>
                  </div>
                </>
              )}

              {modality === "lca_binary_lifting" && (
                <>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Computed LCA</span>
                    <span className="text-cyan-400 font-mono font-bold text-base">
                      Node {lcaQuery.lca}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Total Jumps</span>
                    <span className="text-indigo-400 font-mono font-bold text-base">
                      {lcaQuery.totalJumpsCount} hops
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Depth Equalization
                    </span>
                    <span className="text-slate-300 font-mono text-xs">
                      |depth({lcaU}) - depth({lcaV})| ={" "}
                      {Math.abs(lcaQuery.depthU - lcaQuery.depthV)}
                    </span>
                  </div>
                </>
              )}

              {modality === "convex_hull_trick_dp" && (
                <>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Active Envelope
                    </span>
                    <span className="text-sky-400 font-mono font-bold text-base">
                      {chtEnvelope.envelopeLines.length} lines
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Popped Lines</span>
                    <span className="text-rose-400 font-mono font-bold text-base">
                      {chtEnvelope.poppedLines.length} pruned
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Optimal Line @ x={chtX}
                    </span>
                    <span className="text-amber-400 font-mono text-xs font-semibold">
                      {chtQuery.optLine.label ||
                        `y = ${chtQuery.optLine.m}x + ${chtQuery.optLine.c}`}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Step History / Walkthrough Logs */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 max-h-[190px] overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Algorithm Progress & Trace
              </span>
            </div>

            {modality === "convex_hull_trick_dp" ? (
              <div className="flex flex-col gap-1 text-xs">
                {chtEnvelope.stepHistory.map((step, idx) => (
                  <div
                    key={`step-${idx}`}
                    className={`px-2 py-1 rounded text-[11px] font-mono ${
                      step.action === "pop"
                        ? "bg-rose-950/40 text-rose-300 border border-rose-900/50"
                        : "bg-slate-800/60 text-slate-300"
                    }`}
                  >
                    {step.description}
                  </div>
                ))}
              </div>
            ) : modality === "lca_binary_lifting" ? (
              <div className="flex flex-col gap-1 text-xs">
                {lcaQuery.equalizingJumps.map((jump, idx) => (
                  <div
                    key={`eq-${idx}`}
                    className="px-2 py-1 rounded bg-indigo-950/40 text-indigo-300 text-[11px] font-mono"
                  >
                    Depth Equalize: Node {jump.from} → Node {jump.to} (stride 2^{jump.k} ={" "}
                    {jump.stride})
                  </div>
                ))}
                {lcaQuery.simultaneousJumps.map((jump, idx) => (
                  <div
                    key={`sim-${idx}`}
                    className="px-2 py-1 rounded bg-cyan-950/40 text-cyan-300 text-[11px] font-mono"
                  >
                    Binary Lift: u({jump.uFrom}→{jump.uTo}) & v({jump.vFrom}→{jump.vTo}) (stride 2^
                    {jump.k})
                  </div>
                ))}
                <div className="px-2 py-1 rounded bg-emerald-950/40 text-emerald-300 text-[11px] font-mono font-bold">
                  ✓ Reached LCA: Node {lcaQuery.lca}
                </div>
              </div>
            ) : modality === "heavy_light_decomposition" ? (
              <div className="flex flex-col gap-1 text-xs font-mono">
                {hldQuery.intervals.map((inv, idx) => (
                  <div
                    key={`hld-log-${idx}`}
                    className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[11px]"
                  >
                    Hop {idx + 1}: Chain {inv.chainId} (Head {inv.chainHead}) • Pos Range [
                    {inv.fromPos}, {inv.toPos}]
                  </div>
                ))}
                <div className="px-2 py-1 rounded bg-sky-950/40 text-sky-300 text-[11px] font-bold">
                  ✓ Path Decomposed into {hldQuery.intervals.length} Contiguous Array Slices
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1 text-xs font-mono">
                <div className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[11px]">
                  1. DFS 1 from start {twoDFS.startNode}: Farthest node A = {twoDFS.farthestA} (dist
                  = {twoDFS.distA})
                </div>
                <div className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[11px]">
                  2. DFS 2 from node A: Farthest node B = {twoDFS.farthestB} (diameter ={" "}
                  {twoDFS.diameter})
                </div>
                <div className="px-2 py-1 rounded bg-emerald-950/40 text-emerald-300 text-[11px] font-bold">
                  3. Bottom-Up DP: Diameter Center = Node {diameterDP.diameterRoot}, Subtree Max ={" "}
                  {diameterDP.diameter}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DPTreeDecompositionStudio;
