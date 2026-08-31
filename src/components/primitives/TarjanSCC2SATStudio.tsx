import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Zap,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Network,
  Split,
  Box,
} from "lucide-react";

import { useCanvasBox, boxViewBox, spreadToBox, viewBoxAttr, type Point } from "./vizGeometry";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type TarjanStudioModality =
  | "tarjan_scc_discovery"
  | "bridges_and_articulation_points"
  | "scc_dag_condensation"
  | "two_sat_implication_engine";

export type TarjanPresetId =
  | "scc_classic_kosaraju_tarjan"
  | "scc_interconnected_rings"
  | "scc_dag_chain_diamonds"
  | "scc_dense_strongly_connected"
  | "bridges_bowtie_graph"
  | "bridges_tree_articulations"
  | "bridges_cycle_with_antennas"
  | "twosat_satisfiable_3var"
  | "twosat_unsatisfiable_contradiction"
  | "twosat_graph_coloring_scheduling"
  | "twosat_pigeonhole_conflict";

// --- Graph Primitives ---
export interface TarjanGraphNode {
  readonly id: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly color?: string;
  readonly literal?: string;
  readonly variableName?: string;
  readonly isNegated?: boolean;
}

export interface TarjanGraphEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly directed: boolean;
  readonly label?: string;
  readonly type?: "tree" | "back" | "cross" | "forward" | "implication" | "undirected";
  readonly isBridge?: boolean;
  readonly clauseId?: string;
}

export interface TarjanGraph {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly nodes: readonly TarjanGraphNode[];
  readonly edges: readonly TarjanGraphEdge[];
  readonly directed: boolean;
}

// --- Modality 1: Tarjan SCC Discovery ---
export interface TarjanSCCResult {
  readonly sccList: readonly (readonly string[])[];
  readonly nodeToSccIndex: Readonly<Record<string, number>>;
  readonly tin: Readonly<Record<string, number>>;
  readonly low: Readonly<Record<string, number>>;
  readonly visitedOrder: readonly string[];
  readonly treeEdges: readonly string[];
  readonly backEdges: readonly string[];
  readonly crossEdges: readonly string[];
  readonly sccCount: number;
}

// --- Modality 2: Bridges & Articulation Points ---
export interface BridgeEdgeInfo {
  readonly u: string;
  readonly v: string;
  readonly edgeId: string;
}

export interface BridgesArticulationResult {
  readonly bridges: readonly BridgeEdgeInfo[];
  readonly articulationPoints: readonly string[];
  readonly tin: Readonly<Record<string, number>>;
  readonly low: Readonly<Record<string, number>>;
  readonly treeEdges: readonly string[];
  readonly backEdges: readonly string[];
  readonly rootNodes: readonly string[];
  readonly childrenCount: Readonly<Record<string, number>>;
}

// --- Modality 3: Condensation DAG ---
export interface CondensationNode {
  readonly id: string;
  readonly sccIndex: number;
  readonly members: readonly string[];
  readonly label: string;
  readonly color: string;
  readonly topologicalRank: number;
  readonly x: number;
  readonly y: number;
}

export interface CondensationEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly sourceMembers: readonly string[];
  readonly targetMembers: readonly string[];
  readonly originalEdges: readonly { u: string; v: string }[];
}

export interface CondensationGraphResult {
  readonly nodes: readonly CondensationNode[];
  readonly edges: readonly CondensationEdge[];
  readonly topologicalOrder: readonly string[];
  readonly isDAG: boolean;
  readonly nodeToSuperNode: Readonly<Record<string, string>>;
}

// --- Modality 4: 2-SAT Implication Engine ---
export interface TwoSATLiteral {
  readonly name: string;
  readonly negated: boolean;
}

export interface TwoSATClause {
  readonly id: string;
  readonly literalA: TwoSATLiteral;
  readonly literalB: TwoSATLiteral;
  readonly rawString?: string;
}

export interface TwoSATFormula {
  readonly variables: readonly string[];
  readonly clauses: readonly TwoSATClause[];
  readonly rawFormula?: string;
}

export interface TwoSATImplicationEdge {
  readonly from: string;
  readonly to: string;
  readonly clauseId: string;
  readonly reason: string;
}

export interface TwoSATImplicationGraph {
  readonly graph: TarjanGraph;
  readonly implications: readonly TwoSATImplicationEdge[];
  readonly variableMap: Readonly<Record<string, { posId: string; negId: string }>>;
}

export interface TwoSATContradiction {
  readonly variable: string;
  readonly posNode: string;
  readonly negNode: string;
  readonly sccIndex: number;
}

export interface TwoSATClauseEvaluation {
  readonly clause: TwoSATClause;
  readonly isSatisfied: boolean;
  readonly litAVal: boolean;
  readonly litBVal: boolean;
}

export interface TwoSATSolverResult {
  readonly isSatisfiable: boolean;
  readonly assignment: Readonly<Record<string, boolean>>;
  readonly implicationGraph: TarjanGraph;
  readonly sccResult: TarjanSCCResult;
  readonly contradictions: readonly TwoSATContradiction[];
  readonly clauseEvaluations: readonly TwoSATClauseEvaluation[];
  readonly variableSCCs: Readonly<
    Record<
      string,
      {
        posSCC: number;
        negSCC: number;
        assignedValue: boolean;
      }
    >
  >;
}

// --- Animation Steps & Trace ---
export type TarjanStepAction =
  | "dfs_enter"
  | "dfs_explore_edge"
  | "dfs_update_low_child"
  | "dfs_update_low_backedge"
  | "dfs_bridge_detected"
  | "dfs_cut_vertex_detected"
  | "dfs_scc_root_found"
  | "dfs_scc_pop_node"
  | "dfs_scc_completed"
  | "dfs_exit"
  | "condensation_shrink"
  | "two_sat_construct_clause"
  | "two_sat_check_satisfiability"
  | "two_sat_assign_truth"
  | "complete";

export interface TarjanTelemetry {
  readonly totalVertices: number;
  readonly totalEdges: number;
  readonly sccCount: number;
  readonly maxSCCSize: number;
  readonly bridgeCount: number;
  readonly articulationPointCount: number;
  readonly isSatisfiable?: boolean;
  readonly recursionDepth: number;
  readonly maxRecursionDepth: number;
  readonly dfsVisits: number;
  readonly lowLinkUpdates: number;
  readonly condensedNodeCount?: number;
  readonly condensedEdgeCount?: number;
  readonly isDAG?: boolean;
}

export interface TarjanAnimationStep {
  readonly stepIndex: number;
  readonly modality: TarjanStudioModality;
  readonly action: TarjanStepAction;
  readonly description: string;
  readonly activeNodeId?: string;
  readonly targetNodeId?: string;
  readonly activeEdgeId?: string;
  readonly stack: readonly string[];
  readonly onStack: Readonly<Record<string, boolean>>;
  readonly tin: Readonly<Record<string, number>>;
  readonly low: Readonly<Record<string, number>>;
  readonly currentTimer: number;
  readonly sccsFound: readonly (readonly string[])[];
  readonly nodeToScc: Readonly<Record<string, number>>;
  readonly bridges: readonly string[];
  readonly cutVertices: readonly string[];
  readonly currentSCC?: readonly string[];
  readonly isSCCRoot?: boolean;
  readonly twoSATAssignments?: Readonly<Record<string, boolean>>;
  readonly twoSATContradictions?: readonly TwoSATContradiction[];
  readonly telemetry: TarjanTelemetry;
}

export interface TarjanPreset {
  readonly id: TarjanPresetId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly defaultModality: TarjanStudioModality;
  readonly graph?: TarjanGraph;
  readonly twoSATFormula?: TwoSATFormula;
  readonly theoryNotes: string;
  readonly tags: readonly string[];
}

export interface ModalityConfig {
  readonly id: TarjanStudioModality;
  readonly title: string;
  readonly subtitle: string;
  readonly theory: string;
  readonly badgeColor: string;
  readonly iconName: string;
}

export interface TarjanSCC2SATStudioProps {
  readonly initialModality?: TarjanStudioModality;
  readonly initialPreset?: TarjanPresetId;
  readonly customGraph?: TarjanGraph;
  readonly custom2SATFormula?: TwoSATFormula;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onStepChange?: (step: TarjanAnimationStep) => void;
  readonly onModalityChange?: (modality: TarjanStudioModality) => void;
  readonly onPresetChange?: (presetId: TarjanPresetId) => void;
}

// ============================================================================
// 2. CONSTANTS & PALETTES
// ============================================================================

export const SCC_PALETTE: readonly string[] = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#14b8a6", // Teal
  "#a855f7", // Violet
  "#84cc16", // Lime
  "#e11d48", // Rose
  "#6366f1", // Indigo
];

export const MODALITY_CONFIGS: Record<TarjanStudioModality, ModalityConfig> = {
  tarjan_scc_discovery: {
    id: "tarjan_scc_discovery",
    title: "Tarjan's SCC Discovery",
    subtitle: "O(V + E) Linear Low-Link Strongly Connected Components",
    theory:
      "Tarjan's algorithm executes a single Depth-First Search maintaining entry time tin[u] and lowest reachable ancestor low[u]. Vertices remain on an active stack; when low[u] == tin[u], vertex u is identified as an SCC root and its component is popped in reverse topological order.",
    badgeColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    iconName: "Network",
  },
  bridges_and_articulation_points: {
    id: "bridges_and_articulation_points",
    title: "Bridges & Cut Vertices",
    subtitle: "Biconnectivity Analysis & Critical Infrastructure Vulnerabilities",
    theory:
      "On undirected graphs, an edge (u, v) is a Bridge iff low[v] > tin[u] (no back-edge connects the subtree to u or its ancestors). A non-root vertex u is an Articulation Point iff low[v] >= tin[u] for some DFS child v; the root is a cut vertex iff it has >= 2 DFS children.",
    badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    iconName: "Split",
  },
  scc_dag_condensation: {
    id: "scc_dag_condensation",
    title: "Condensation DAG",
    subtitle: "Component Shrinking & Topological Super-Graph G^SCC",
    theory:
      "Condenses each maximal strongly connected component into an individual super-node C_i, collapsing internal cycles and retaining only directed inter-component bridges. Yields a strict Directed Acyclic Graph (DAG) with an induced topological sort order.",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    iconName: "Box",
  },
  two_sat_implication_engine: {
    id: "two_sat_implication_engine",
    title: "2-SAT Implication Engine",
    subtitle: "2-CNF Satisfiability via SCC Reachability & Implication Graph",
    theory:
      "Transforms 2-CNF clauses (A v B) into directed implication arcs (~A -> B) & (~B -> A). By running Tarjan's SCC, the formula is satisfiable iff no variable X shares an SCC with its negation ~X. Valid truth assignments are directly assigned by component topological order: val[X] = (scc[X] < scc[~X]).",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    iconName: "Zap",
  },
};

// ============================================================================
// 3. PURE GRAPH & 2-SAT ALGORITHMIC FUNCTIONS
// ============================================================================

/**
 * Executes Tarjan's linear O(V + E) Strongly Connected Components algorithm.
 */
export function runTarjanSCC(graph: TarjanGraph): TarjanSCCResult {
  const tin: Record<string, number> = {};
  const low: Record<string, number> = {};
  const onStack: Record<string, boolean> = {};
  const stack: string[] = [];
  const sccList: string[][] = [];
  const nodeToSccIndex: Record<string, number> = {};
  const visitedOrder: string[] = [];
  const treeEdges: string[] = [];
  const backEdges: string[] = [];
  const crossEdges: string[] = [];

  let timer = 0;

  // Build adjacency list
  const adj: Record<string, string[]> = {};
  for (const node of graph.nodes) {
    adj[node.id] = [];
    tin[node.id] = -1;
    low[node.id] = -1;
    onStack[node.id] = false;
  }
  for (const edge of graph.edges) {
    if (adj[edge.source]) {
      adj[edge.source].push(edge.target);
    }
  }

  function dfs(u: string): void {
    timer++;
    tin[u] = timer;
    low[u] = timer;
    stack.push(u);
    onStack[u] = true;
    visitedOrder.push(u);

    const neighbors = adj[u] || [];
    for (const v of neighbors) {
      if (tin[v] === -1) {
        // Tree edge
        treeEdges.push(`${u}->${v}`);
        dfs(v);
        low[u] = Math.min(low[u], low[v]);
      } else if (onStack[v]) {
        // Back-edge or cross-edge within current SCC candidate
        backEdges.push(`${u}->${v}`);
        low[u] = Math.min(low[u], tin[v]);
      } else {
        // Cross edge to an already completed SCC
        crossEdges.push(`${u}->${v}`);
      }
    }

    // Root of SCC detected
    if (low[u] === tin[u]) {
      const currentSCC: string[] = [];
      while (stack.length > 0) {
        const w = stack.pop()!;
        onStack[w] = false;
        currentSCC.push(w);
        nodeToSccIndex[w] = sccList.length;
        if (w === u) break;
      }
      sccList.push(currentSCC);
    }
  }

  for (const node of graph.nodes) {
    if (tin[node.id] === -1) {
      dfs(node.id);
    }
  }

  return {
    sccList,
    nodeToSccIndex,
    tin,
    low,
    visitedOrder,
    treeEdges,
    backEdges,
    crossEdges,
    sccCount: sccList.length,
  };
}

/**
 * Finds all Bridge edges and Articulation Points (Cut Vertices) on an undirected graph.
 */
export function findBridgesAndArticulationPoints(graph: TarjanGraph): BridgesArticulationResult {
  const tin: Record<string, number> = {};
  const low: Record<string, number> = {};
  const bridges: BridgeEdgeInfo[] = [];
  const articulationPointsSet = new Set<string>();
  const treeEdges: string[] = [];
  const backEdges: string[] = [];
  const rootNodes: string[] = [];
  const childrenCount: Record<string, number> = {};

  let timer = 0;

  // Build adjacency list for undirected graph with edge IDs
  const adj: Record<string, { neighbor: string; edgeId: string }[]> = {};
  for (const node of graph.nodes) {
    adj[node.id] = [];
    tin[node.id] = -1;
    low[node.id] = -1;
    childrenCount[node.id] = 0;
  }

  for (const edge of graph.edges) {
    if (adj[edge.source]) {
      adj[edge.source].push({ neighbor: edge.target, edgeId: edge.id });
    }
    if (adj[edge.target]) {
      adj[edge.target].push({ neighbor: edge.source, edgeId: edge.id });
    }
  }

  function dfs(u: string, parentEdgeId: string | null): void {
    timer++;
    tin[u] = timer;
    low[u] = timer;
    let localChildren = 0;

    const neighbors = adj[u] || [];
    for (const { neighbor: v, edgeId } of neighbors) {
      if (edgeId === parentEdgeId) {
        // Skip direct back-edge through parent tree edge
        continue;
      }

      if (tin[v] !== -1) {
        // Back-edge to an ancestor
        backEdges.push(`${u}-${v}`);
        low[u] = Math.min(low[u], tin[v]);
      } else {
        // Tree edge
        localChildren++;
        treeEdges.push(`${u}-${v}`);
        dfs(v, edgeId);
        low[u] = Math.min(low[u], low[v]);

        // Bridge condition: no back-edge from subtree v to u or above
        if (low[v] > tin[u]) {
          bridges.push({ u, v, edgeId });
        }

        // Articulation point condition for non-root
        if (parentEdgeId !== null && low[v] >= tin[u]) {
          articulationPointsSet.add(u);
        }
      }
    }

    childrenCount[u] = localChildren;

    // Root articulation point condition: >= 2 DFS tree children
    if (parentEdgeId === null && localChildren >= 2) {
      articulationPointsSet.add(u);
    }
  }

  for (const node of graph.nodes) {
    if (tin[node.id] === -1) {
      rootNodes.push(node.id);
      dfs(node.id, null);
    }
  }

  return {
    bridges,
    articulationPoints: Array.from(articulationPointsSet).sort(),
    tin,
    low,
    treeEdges,
    backEdges,
    rootNodes,
    childrenCount,
  };
}

/**
 * Builds the Condensation DAG shrinking each SCC into a single super-node.
 */
export function buildCondensationGraph(
  graph: TarjanGraph,
  sccResult: TarjanSCCResult,
): CondensationGraphResult {
  const { sccList, nodeToSccIndex } = sccResult;
  const numSCC = sccList.length;

  // Build condensed nodes
  const nodes: CondensationNode[] = sccList.map((members, idx) => {
    const color = SCC_PALETTE[idx % SCC_PALETTE.length];
    const label = `C${idx} [${members.join(", ")}]`;
    // Approximate positioning based on member average
    let avgX = 0;
    let avgY = 0;
    let count = 0;
    for (const memId of members) {
      const origNode = graph.nodes.find((n) => n.id === memId);
      if (origNode) {
        avgX += origNode.x;
        avgY += origNode.y;
        count++;
      }
    }
    const x = count > 0 ? avgX / count : 100 + idx * 80;
    const y = count > 0 ? avgY / count : 150;

    return {
      id: `C${idx}`,
      sccIndex: idx,
      members,
      label,
      color,
      topologicalRank: numSCC - 1 - idx, // Tarjan naturally outputs reverse topological sort
      x,
      y,
    };
  });

  // Track super edges between distinct SCCs (deduplicated)
  const edgeMap = new Map<
    string,
    { uSCC: number; vSCC: number; originalEdges: { u: string; v: string }[] }
  >();

  for (const edge of graph.edges) {
    const uSCC = nodeToSccIndex[edge.source];
    const vSCC = nodeToSccIndex[edge.target];
    if (uSCC !== undefined && vSCC !== undefined && uSCC !== vSCC) {
      const key = `${uSCC}->${vSCC}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, { uSCC, vSCC, originalEdges: [] });
      }
      edgeMap.get(key)!.originalEdges.push({ u: edge.source, v: edge.target });
    }
  }

  const edges: CondensationEdge[] = Array.from(edgeMap.entries()).map(([key, data], idx) => {
    return {
      id: `cond_edge_${idx}_${key}`,
      source: `C${data.uSCC}`,
      target: `C${data.vSCC}`,
      sourceMembers: sccList[data.uSCC] || [],
      targetMembers: sccList[data.vSCC] || [],
      originalEdges: data.originalEdges,
    };
  });

  // Topological order: Reversing sccList produces a valid topological sort of the condensation DAG
  const topologicalOrder = nodes
    .slice()
    .sort((a, b) => b.sccIndex - a.sccIndex) // Source to sink
    .map((n) => n.id);

  const nodeToSuperNode: Record<string, string> = {};
  for (const [nodeId, sccIdx] of Object.entries(nodeToSccIndex)) {
    nodeToSuperNode[nodeId] = `C${sccIdx}`;
  }

  return {
    nodes,
    edges,
    topologicalOrder,
    isDAG: true, // Condensation graph is guaranteed to be a DAG
    nodeToSuperNode,
  };
}

/**
 * Normalizes literal representation and parses raw 2-SAT text formulas.
 * Supports formulas like: "(A | B) & (~A | C) & (~B | ~C)" or "x1 v ~x2, x2 v x3".
 */
export function parse2SATFormula(rawFormula: string): TwoSATFormula {
  const clean = rawFormula.trim();
  if (!clean) {
    return { variables: [], clauses: [] };
  }

  // Split by top-level clause separators (&, ^, and, newline, comma, semicolon)
  const rawClauses = clean
    .split(/[\n,;&]|\band\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const variablesSet = new Set<string>();
  const clauses: TwoSATClause[] = [];

  const parseLiteral = (litStr: string): TwoSATLiteral => {
    let s = litStr.trim();
    // Strip surrounding parens if present
    s = s.replace(/^\(+|\)+$/g, "").trim();
    let negated = false;
    if (s.startsWith("~") || s.startsWith("!") || s.startsWith("-") || s.startsWith("¬")) {
      negated = true;
      s = s.slice(1).trim();
    } else if (s.toLowerCase().startsWith("not ")) {
      negated = true;
      s = s.slice(4).trim();
    }
    const name = s.replace(/[^a-zA-Z0-9_]/g, "");
    if (name) {
      variablesSet.add(name);
    }
    return { name: name || "x", negated };
  };

  rawClauses.forEach((cStr, idx) => {
    // Strip outer parens
    let inner = cStr.trim();
    if (inner.startsWith("(") && inner.endsWith(")")) {
      inner = inner.slice(1, -1).trim();
    }
    // Split by OR operators (|, v, V, or, +)
    const literals = inner.split(/\||(?<=\s)v(?=\s)|(?<=\s)V(?=\s)|\bor\b|\+/i);
    if (literals.length === 1) {
      // Unit clause (u) => equivalent to (u v u)
      const lit = parseLiteral(literals[0]);
      clauses.push({
        id: `clause_${idx + 1}`,
        literalA: lit,
        literalB: lit,
        rawString: cStr,
      });
    } else if (literals.length >= 2) {
      const litA = parseLiteral(literals[0]);
      const litB = parseLiteral(literals[1]);
      clauses.push({
        id: `clause_${idx + 1}`,
        literalA: litA,
        literalB: litB,
        rawString: cStr,
      });
    }
  });

  const variables = Array.from(variablesSet).sort();
  return {
    variables,
    clauses,
    rawFormula: clean,
  };
}

/**
 * Builds the directed 2-SAT implication graph from variables and clauses.
 * Clause (A v B) => (~A -> B) and (~B -> A).
 */
export function build2SATImplicationGraph(
  variables: readonly string[],
  clauses: readonly TwoSATClause[],
): TwoSATImplicationGraph {
  const nodes: TarjanGraphNode[] = [];
  const edges: TarjanGraphEdge[] = [];
  const implications: TwoSATImplicationEdge[] = [];
  const variableMap: Record<string, { posId: string; negId: string }> = {};

  const numVars = variables.length;
  const radius = Math.min(220, 40 + numVars * 28);
  const centerX = 260;
  const centerY = 200;

  variables.forEach((varName, idx) => {
    const anglePos = (idx / numVars) * 2 * Math.PI - Math.PI / 2;
    const angleNeg = anglePos + Math.PI / numVars;

    const posId = `pos_${varName}`;
    const negId = `neg_${varName}`;
    variableMap[varName] = { posId, negId };

    nodes.push({
      id: posId,
      label: varName,
      x: centerX + radius * Math.cos(anglePos),
      y: centerY + radius * Math.sin(anglePos),
      literal: varName,
      variableName: varName,
      isNegated: false,
      color: "#3b82f6",
    });

    nodes.push({
      id: negId,
      label: `¬${varName}`,
      x: centerX + radius * 0.65 * Math.cos(angleNeg),
      y: centerY + radius * 0.65 * Math.sin(angleNeg),
      literal: `¬${varName}`,
      variableName: varName,
      isNegated: true,
      color: "#ec4899",
    });
  });

  // Helper to map literal to graph node ID
  const getNodeForLiteral = (lit: TwoSATLiteral): string => {
    const v = variableMap[lit.name];
    if (!v) return lit.negated ? `neg_${lit.name}` : `pos_${lit.name}`;
    return lit.negated ? v.negId : v.posId;
  };

  // Helper to map negation of a literal to graph node ID
  const getNodeForNegatedLiteral = (lit: TwoSATLiteral): string => {
    const v = variableMap[lit.name];
    if (!v) return lit.negated ? `pos_${lit.name}` : `neg_${lit.name}`;
    return lit.negated ? v.posId : v.negId;
  };

  clauses.forEach((clause) => {
    const notA = getNodeForNegatedLiteral(clause.literalA);
    const litB = getNodeForLiteral(clause.literalB);
    const notB = getNodeForNegatedLiteral(clause.literalB);
    const litA = getNodeForLiteral(clause.literalA);

    // Implication 1: ~A -> B
    const edge1Id = `imp_${clause.id}_1`;
    edges.push({
      id: edge1Id,
      source: notA,
      target: litB,
      directed: true,
      type: "implication",
      clauseId: clause.id,
      label: `${format2SATLiteral(negateLiteral(clause.literalA))} → ${format2SATLiteral(clause.literalB)}`,
    });
    implications.push({
      from: notA,
      to: litB,
      clauseId: clause.id,
      reason: `From clause (${format2SATClause(clause)}): ~(${format2SATLiteral(clause.literalA)}) → ${format2SATLiteral(clause.literalB)}`,
    });

    // Implication 2: ~B -> A (avoid duplicate edge if A and B are identical)
    if (notB !== notA || litA !== litB) {
      const edge2Id = `imp_${clause.id}_2`;
      edges.push({
        id: edge2Id,
        source: notB,
        target: litA,
        directed: true,
        type: "implication",
        clauseId: clause.id,
        label: `${format2SATLiteral(negateLiteral(clause.literalB))} → ${format2SATLiteral(clause.literalA)}`,
      });
      implications.push({
        from: notB,
        to: litA,
        clauseId: clause.id,
        reason: `From clause (${format2SATClause(clause)}): ~(${format2SATLiteral(clause.literalB)}) → ${format2SATLiteral(clause.literalA)}`,
      });
    }
  });

  const graph: TarjanGraph = {
    id: "twosat_implication_graph",
    name: "2-SAT Implication Graph",
    description: "Directed graph of logical implications constructed from 2-CNF clauses",
    nodes,
    edges,
    directed: true,
  };

  return {
    graph,
    implications,
    variableMap,
  };
}

export function negateLiteral(lit: TwoSATLiteral): TwoSATLiteral {
  return { name: lit.name, negated: !lit.negated };
}

export function format2SATLiteral(lit: TwoSATLiteral): string {
  return lit.negated ? `¬${lit.name}` : lit.name;
}

export function format2SATClause(clause: TwoSATClause): string {
  return `(${format2SATLiteral(clause.literalA)} ∨ ${format2SATLiteral(clause.literalB)})`;
}

export function format2SATFormula(formula: TwoSATFormula): string {
  if (formula.clauses.length === 0) return "∅";
  return formula.clauses.map(format2SATClause).join(" ∧ ");
}

/**
 * Solves 2-SAT completely by constructing the implication graph, running Tarjan SCC,
 * detecting satisfiability contradictions (SCC(X) == SCC(~X)), and assigning truth values.
 */
export function solve2SAT(
  variables: readonly string[],
  clauses: readonly TwoSATClause[],
): TwoSATSolverResult {
  const impResult = build2SATImplicationGraph(variables, clauses);
  const sccResult = runTarjanSCC(impResult.graph);
  const { nodeToSccIndex } = sccResult;

  const contradictions: TwoSATContradiction[] = [];
  const assignment: Record<string, boolean> = {};
  const variableSCCs: Record<string, { posSCC: number; negSCC: number; assignedValue: boolean }> =
    {};

  let isSatisfiable = true;

  for (const varName of variables) {
    const posId = `pos_${varName}`;
    const negId = `neg_${varName}`;

    const posSCC = nodeToSccIndex[posId] ?? -1;
    const negSCC = nodeToSccIndex[negId] ?? -1;

    if (posSCC !== -1 && posSCC === negSCC) {
      isSatisfiable = false;
      contradictions.push({
        variable: varName,
        posNode: posId,
        negNode: negId,
        sccIndex: posSCC,
      });
    }

    // Tarjan generates SCCs in reverse topological sort order:
    // If posSCC < negSCC, then ~X can reach X, so X must be TRUE.
    // If posSCC > negSCC, then X can reach ~X, so X must be FALSE.
    const assignedValue = posSCC < negSCC;
    assignment[varName] = assignedValue;
    variableSCCs[varName] = {
      posSCC,
      negSCC,
      assignedValue,
    };
  }

  // Evaluate clauses with the computed assignment
  const clauseEvaluations: TwoSATClauseEvaluation[] = clauses.map((clause) => {
    const getVal = (lit: TwoSATLiteral): boolean => {
      const v = assignment[lit.name] ?? false;
      return lit.negated ? !v : v;
    };
    const litAVal = getVal(clause.literalA);
    const litBVal = getVal(clause.literalB);
    const isSatisfied = litAVal || litBVal;

    return {
      clause,
      isSatisfied,
      litAVal,
      litBVal,
    };
  });

  return {
    isSatisfiable,
    assignment,
    implicationGraph: impResult.graph,
    sccResult,
    contradictions,
    clauseEvaluations,
    variableSCCs,
  };
}

/**
 * Pure evaluator verifying whether a boolean assignment satisfies all 2-CNF clauses.
 */
export function evaluate2SATFormula(
  clauses: readonly TwoSATClause[],
  assignment: Readonly<Record<string, boolean>>,
): boolean {
  if (clauses.length === 0) return true;
  for (const clause of clauses) {
    const valA = clause.literalA.negated
      ? !(assignment[clause.literalA.name] ?? false)
      : (assignment[clause.literalA.name] ?? false);
    const valB = clause.literalB.negated
      ? !(assignment[clause.literalB.name] ?? false)
      : (assignment[clause.literalB.name] ?? false);
    if (!valA && !valB) {
      return false;
    }
  }
  return true;
}

// ============================================================================
// 4. ANIMATION STEP GENERATOR & TRACE RECORDER
// ============================================================================

export function generateTarjanSteps(
  modality: TarjanStudioModality,
  graph: TarjanGraph,
  twoSATFormula?: TwoSATFormula,
): readonly TarjanAnimationStep[] {
  const steps: TarjanAnimationStep[] = [];

  if (modality === "tarjan_scc_discovery") {
    generateSCCDiscoverySteps(graph, steps);
  } else if (modality === "bridges_and_articulation_points") {
    generateBridgesAndCutVerticesSteps(graph, steps);
  } else if (modality === "scc_dag_condensation") {
    generateCondensationSteps(graph, steps);
  } else if (modality === "two_sat_implication_engine") {
    const formula = twoSATFormula || parse2SATFormula("(A | B) & (~A | C) & (~B | C)");
    generate2SATSteps(formula, steps);
  }

  return steps;
}

function generateSCCDiscoverySteps(graph: TarjanGraph, steps: TarjanAnimationStep[]): void {
  const tin: Record<string, number> = {};
  const low: Record<string, number> = {};
  const onStack: Record<string, boolean> = {};
  const stack: string[] = [];
  const sccsFound: string[][] = [];
  const nodeToScc: Record<string, number> = {};

  let timer = 0;
  let dfsVisits = 0;
  let lowLinkUpdates = 0;
  let maxRecursionDepth = 0;

  for (const node of graph.nodes) {
    tin[node.id] = -1;
    low[node.id] = -1;
    onStack[node.id] = false;
  }

  const adj: Record<string, { target: string; edgeId: string }[]> = {};
  for (const node of graph.nodes) adj[node.id] = [];
  for (const edge of graph.edges) {
    if (adj[edge.source]) {
      adj[edge.source].push({ target: edge.target, edgeId: edge.id });
    }
  }

  const makeTelemetry = (depth: number): TarjanTelemetry => ({
    totalVertices: graph.nodes.length,
    totalEdges: graph.edges.length,
    sccCount: sccsFound.length,
    maxSCCSize: sccsFound.reduce((m, c) => Math.max(m, c.length), 0),
    bridgeCount: 0,
    articulationPointCount: 0,
    recursionDepth: depth,
    maxRecursionDepth,
    dfsVisits,
    lowLinkUpdates,
  });

  function dfs(u: string, depth: number): void {
    timer++;
    dfsVisits++;
    maxRecursionDepth = Math.max(maxRecursionDepth, depth);
    tin[u] = timer;
    low[u] = timer;
    stack.push(u);
    onStack[u] = true;

    steps.push({
      stepIndex: steps.length,
      modality: "tarjan_scc_discovery",
      action: "dfs_enter",
      description: `Enter node ${u}: assigned tin[${u}] = ${timer}, low[${u}] = ${timer}. Pushed ${u} onto the DFS call stack.`,
      activeNodeId: u,
      stack: [...stack],
      onStack: { ...onStack },
      tin: { ...tin },
      low: { ...low },
      currentTimer: timer,
      sccsFound: sccsFound.map((c) => [...c]),
      nodeToScc: { ...nodeToScc },
      bridges: [],
      cutVertices: [],
      telemetry: makeTelemetry(depth),
    });

    const neighbors = adj[u] || [];
    for (const { target: v, edgeId } of neighbors) {
      steps.push({
        stepIndex: steps.length,
        modality: "tarjan_scc_discovery",
        action: "dfs_explore_edge",
        description: `Explore outgoing edge (${u} → ${v}).`,
        activeNodeId: u,
        targetNodeId: v,
        activeEdgeId: edgeId,
        stack: [...stack],
        onStack: { ...onStack },
        tin: { ...tin },
        low: { ...low },
        currentTimer: timer,
        sccsFound: sccsFound.map((c) => [...c]),
        nodeToScc: { ...nodeToScc },
        bridges: [],
        cutVertices: [],
        telemetry: makeTelemetry(depth),
      });

      if (tin[v] === -1) {
        // Tree edge
        dfs(v, depth + 1);
        const oldLow = low[u];
        low[u] = Math.min(low[u], low[v]);
        if (low[u] !== oldLow) lowLinkUpdates++;

        steps.push({
          stepIndex: steps.length,
          modality: "tarjan_scc_discovery",
          action: "dfs_update_low_child",
          description: `Backtrack from child ${v}: updated low[${u}] = min(low[${u}], low[${v}]) = min(${oldLow}, ${low[v]}) = ${low[u]}.`,
          activeNodeId: u,
          targetNodeId: v,
          activeEdgeId: edgeId,
          stack: [...stack],
          onStack: { ...onStack },
          tin: { ...tin },
          low: { ...low },
          currentTimer: timer,
          sccsFound: sccsFound.map((c) => [...c]),
          nodeToScc: { ...nodeToScc },
          bridges: [],
          cutVertices: [],
          telemetry: makeTelemetry(depth),
        });
      } else if (onStack[v]) {
        // Back-edge
        const oldLow = low[u];
        low[u] = Math.min(low[u], tin[v]);
        if (low[u] !== oldLow) lowLinkUpdates++;

        steps.push({
          stepIndex: steps.length,
          modality: "tarjan_scc_discovery",
          action: "dfs_update_low_backedge",
          description: `Back-edge / Cross-edge to ancestor ${v} (currently on stack): low[${u}] = min(low[${u}], tin[${v}]) = min(${oldLow}, ${tin[v]}) = ${low[u]}.`,
          activeNodeId: u,
          targetNodeId: v,
          activeEdgeId: edgeId,
          stack: [...stack],
          onStack: { ...onStack },
          tin: { ...tin },
          low: { ...low },
          currentTimer: timer,
          sccsFound: sccsFound.map((c) => [...c]),
          nodeToScc: { ...nodeToScc },
          bridges: [],
          cutVertices: [],
          telemetry: makeTelemetry(depth),
        });
      }
    }

    // Root check
    if (low[u] === tin[u]) {
      steps.push({
        stepIndex: steps.length,
        modality: "tarjan_scc_discovery",
        action: "dfs_scc_root_found",
        description: `SCC Root Detected at node ${u}! (low[${u}] == tin[${u}] == ${tin[u]}). Ready to pop component from active stack.`,
        activeNodeId: u,
        isSCCRoot: true,
        stack: [...stack],
        onStack: { ...onStack },
        tin: { ...tin },
        low: { ...low },
        currentTimer: timer,
        sccsFound: sccsFound.map((c) => [...c]),
        nodeToScc: { ...nodeToScc },
        bridges: [],
        cutVertices: [],
        telemetry: makeTelemetry(depth),
      });

      const currentSCC: string[] = [];
      const sccIndex = sccsFound.length;
      while (stack.length > 0) {
        const w = stack.pop()!;
        onStack[w] = false;
        currentSCC.push(w);
        nodeToScc[w] = sccIndex;

        steps.push({
          stepIndex: steps.length,
          modality: "tarjan_scc_discovery",
          action: "dfs_scc_pop_node",
          description: `Popped node ${w} into SCC #${sccIndex + 1}.`,
          activeNodeId: w,
          currentSCC: [...currentSCC],
          stack: [...stack],
          onStack: { ...onStack },
          tin: { ...tin },
          low: { ...low },
          currentTimer: timer,
          sccsFound: sccsFound.map((c) => [...c]),
          nodeToScc: { ...nodeToScc },
          bridges: [],
          cutVertices: [],
          telemetry: makeTelemetry(depth),
        });

        if (w === u) break;
      }

      sccsFound.push(currentSCC);

      steps.push({
        stepIndex: steps.length,
        modality: "tarjan_scc_discovery",
        action: "dfs_scc_completed",
        description: `Completed SCC #${sccIndex + 1}: { ${currentSCC.join(", ")} }.`,
        activeNodeId: u,
        currentSCC: [...currentSCC],
        stack: [...stack],
        onStack: { ...onStack },
        tin: { ...tin },
        low: { ...low },
        currentTimer: timer,
        sccsFound: sccsFound.map((c) => [...c]),
        nodeToScc: { ...nodeToScc },
        bridges: [],
        cutVertices: [],
        telemetry: makeTelemetry(depth),
      });
    }

    steps.push({
      stepIndex: steps.length,
      modality: "tarjan_scc_discovery",
      action: "dfs_exit",
      description: `Exit DFS frame for node ${u}.`,
      activeNodeId: u,
      stack: [...stack],
      onStack: { ...onStack },
      tin: { ...tin },
      low: { ...low },
      currentTimer: timer,
      sccsFound: sccsFound.map((c) => [...c]),
      nodeToScc: { ...nodeToScc },
      bridges: [],
      cutVertices: [],
      telemetry: makeTelemetry(depth),
    });
  }

  for (const node of graph.nodes) {
    if (tin[node.id] === -1) {
      dfs(node.id, 1);
    }
  }

  steps.push({
    stepIndex: steps.length,
    modality: "tarjan_scc_discovery",
    action: "complete",
    description: `Tarjan SCC discovery complete! Discovered ${sccsFound.length} strongly connected components across ${graph.nodes.length} vertices.`,
    stack: [],
    onStack: { ...onStack },
    tin: { ...tin },
    low: { ...low },
    currentTimer: timer,
    sccsFound: sccsFound.map((c) => [...c]),
    nodeToScc: { ...nodeToScc },
    bridges: [],
    cutVertices: [],
    telemetry: makeTelemetry(0),
  });
}

function generateBridgesAndCutVerticesSteps(
  graph: TarjanGraph,
  steps: TarjanAnimationStep[],
): void {
  const tin: Record<string, number> = {};
  const low: Record<string, number> = {};
  const bridges: string[] = [];
  const cutVertices = new Set<string>();

  let timer = 0;
  let dfsVisits = 0;
  let lowLinkUpdates = 0;
  let maxRecursionDepth = 0;

  for (const node of graph.nodes) {
    tin[node.id] = -1;
    low[node.id] = -1;
  }

  const adj: Record<string, { neighbor: string; edgeId: string }[]> = {};
  for (const node of graph.nodes) adj[node.id] = [];
  for (const edge of graph.edges) {
    if (adj[edge.source]) adj[edge.source].push({ neighbor: edge.target, edgeId: edge.id });
    if (adj[edge.target]) adj[edge.target].push({ neighbor: edge.source, edgeId: edge.id });
  }

  const makeTelemetry = (depth: number): TarjanTelemetry => ({
    totalVertices: graph.nodes.length,
    totalEdges: graph.edges.length,
    sccCount: 0,
    maxSCCSize: 0,
    bridgeCount: bridges.length,
    articulationPointCount: cutVertices.size,
    recursionDepth: depth,
    maxRecursionDepth,
    dfsVisits,
    lowLinkUpdates,
  });

  function dfs(u: string, parentEdgeId: string | null, depth: number): void {
    timer++;
    dfsVisits++;
    maxRecursionDepth = Math.max(maxRecursionDepth, depth);
    tin[u] = timer;
    low[u] = timer;
    let children = 0;

    steps.push({
      stepIndex: steps.length,
      modality: "bridges_and_articulation_points",
      action: "dfs_enter",
      description: `Enter vertex ${u}: assigned tin[${u}] = ${timer}, low[${u}] = ${timer}.`,
      activeNodeId: u,
      stack: [],
      onStack: {},
      tin: { ...tin },
      low: { ...low },
      currentTimer: timer,
      sccsFound: [],
      nodeToScc: {},
      bridges: [...bridges],
      cutVertices: Array.from(cutVertices),
      telemetry: makeTelemetry(depth),
    });

    const neighbors = adj[u] || [];
    for (const { neighbor: v, edgeId } of neighbors) {
      if (edgeId === parentEdgeId) continue;

      if (tin[v] !== -1) {
        // Back-edge
        const oldLow = low[u];
        low[u] = Math.min(low[u], tin[v]);
        if (low[u] !== oldLow) lowLinkUpdates++;

        steps.push({
          stepIndex: steps.length,
          modality: "bridges_and_articulation_points",
          action: "dfs_update_low_backedge",
          description: `Back-edge (${u} - ${v}): updated low[${u}] = min(low[${u}], tin[${v}]) = min(${oldLow}, ${tin[v]}) = ${low[u]}.`,
          activeNodeId: u,
          targetNodeId: v,
          activeEdgeId: edgeId,
          stack: [],
          onStack: {},
          tin: { ...tin },
          low: { ...low },
          currentTimer: timer,
          sccsFound: [],
          nodeToScc: {},
          bridges: [...bridges],
          cutVertices: Array.from(cutVertices),
          telemetry: makeTelemetry(depth),
        });
      } else {
        // Tree edge
        children++;
        steps.push({
          stepIndex: steps.length,
          modality: "bridges_and_articulation_points",
          action: "dfs_explore_edge",
          description: `Traverse tree edge (${u} - ${v}).`,
          activeNodeId: u,
          targetNodeId: v,
          activeEdgeId: edgeId,
          stack: [],
          onStack: {},
          tin: { ...tin },
          low: { ...low },
          currentTimer: timer,
          sccsFound: [],
          nodeToScc: {},
          bridges: [...bridges],
          cutVertices: Array.from(cutVertices),
          telemetry: makeTelemetry(depth),
        });

        dfs(v, edgeId, depth + 1);

        const oldLow = low[u];
        low[u] = Math.min(low[u], low[v]);
        if (low[u] !== oldLow) lowLinkUpdates++;

        steps.push({
          stepIndex: steps.length,
          modality: "bridges_and_articulation_points",
          action: "dfs_update_low_child",
          description: `Returned from child ${v}: low[${u}] = min(low[${u}], low[${v}]) = min(${oldLow}, ${low[v]}) = ${low[u]}.`,
          activeNodeId: u,
          targetNodeId: v,
          activeEdgeId: edgeId,
          stack: [],
          onStack: {},
          tin: { ...tin },
          low: { ...low },
          currentTimer: timer,
          sccsFound: [],
          nodeToScc: {},
          bridges: [...bridges],
          cutVertices: Array.from(cutVertices),
          telemetry: makeTelemetry(depth),
        });

        // Bridge check
        if (low[v] > tin[u]) {
          bridges.push(edgeId);
          steps.push({
            stepIndex: steps.length,
            modality: "bridges_and_articulation_points",
            action: "dfs_bridge_detected",
            description: `⚡ BRIDGE DETECTED: Edge (${u} - ${v}) is a bridge because low[${v}] (${low[v]}) > tin[${u}] (${tin[u]}).`,
            activeNodeId: u,
            targetNodeId: v,
            activeEdgeId: edgeId,
            stack: [],
            onStack: {},
            tin: { ...tin },
            low: { ...low },
            currentTimer: timer,
            sccsFound: [],
            nodeToScc: {},
            bridges: [...bridges],
            cutVertices: Array.from(cutVertices),
            telemetry: makeTelemetry(depth),
          });
        }

        // Non-root cut vertex check
        if (parentEdgeId !== null && low[v] >= tin[u]) {
          cutVertices.add(u);
          steps.push({
            stepIndex: steps.length,
            modality: "bridges_and_articulation_points",
            action: "dfs_cut_vertex_detected",
            description: `🛑 CUT VERTEX DETECTED: Vertex ${u} is an articulation point because child ${v} has low[${v}] (${low[v]}) >= tin[${u}] (${tin[u]}).`,
            activeNodeId: u,
            targetNodeId: v,
            stack: [],
            onStack: {},
            tin: { ...tin },
            low: { ...low },
            currentTimer: timer,
            sccsFound: [],
            nodeToScc: {},
            bridges: [...bridges],
            cutVertices: Array.from(cutVertices),
            telemetry: makeTelemetry(depth),
          });
        }
      }
    }

    // Root cut vertex check
    if (parentEdgeId === null && children >= 2) {
      cutVertices.add(u);
      steps.push({
        stepIndex: steps.length,
        modality: "bridges_and_articulation_points",
        action: "dfs_cut_vertex_detected",
        description: `🛑 ROOT CUT VERTEX: Root vertex ${u} has ${children} DFS children (>= 2), making it an articulation point.`,
        activeNodeId: u,
        stack: [],
        onStack: {},
        tin: { ...tin },
        low: { ...low },
        currentTimer: timer,
        sccsFound: [],
        nodeToScc: {},
        bridges: [...bridges],
        cutVertices: Array.from(cutVertices),
        telemetry: makeTelemetry(depth),
      });
    }

    steps.push({
      stepIndex: steps.length,
      modality: "bridges_and_articulation_points",
      action: "dfs_exit",
      description: `Exit DFS frame for vertex ${u}.`,
      activeNodeId: u,
      stack: [],
      onStack: {},
      tin: { ...tin },
      low: { ...low },
      currentTimer: timer,
      sccsFound: [],
      nodeToScc: {},
      bridges: [...bridges],
      cutVertices: Array.from(cutVertices),
      telemetry: makeTelemetry(depth),
    });
  }

  for (const node of graph.nodes) {
    if (tin[node.id] === -1) {
      dfs(node.id, null, 1);
    }
  }

  steps.push({
    stepIndex: steps.length,
    modality: "bridges_and_articulation_points",
    action: "complete",
    description: `Biconnectivity analysis complete! Identified ${bridges.length} bridge(s) and ${cutVertices.size} cut vertex/vertices.`,
    stack: [],
    onStack: {},
    tin: { ...tin },
    low: { ...low },
    currentTimer: timer,
    sccsFound: [],
    nodeToScc: {},
    bridges: [...bridges],
    cutVertices: Array.from(cutVertices),
    telemetry: makeTelemetry(0),
  });
}

function generateCondensationSteps(graph: TarjanGraph, steps: TarjanAnimationStep[]): void {
  // First run SCC discovery steps
  generateSCCDiscoverySteps(graph, steps);

  // Then shrink into super-nodes
  const sccResult = runTarjanSCC(graph);
  const condResult = buildCondensationGraph(graph, sccResult);

  steps.push({
    stepIndex: steps.length,
    modality: "scc_dag_condensation",
    action: "condensation_shrink",
    description: `Condensation step: Collapsed ${sccResult.sccCount} strongly connected components into super-nodes { ${condResult.nodes.map((n) => n.id).join(", ")} }.`,
    stack: [],
    onStack: {},
    tin: sccResult.tin,
    low: sccResult.low,
    currentTimer: Object.keys(sccResult.tin).length,
    sccsFound: sccResult.sccList,
    nodeToScc: sccResult.nodeToSccIndex,
    bridges: [],
    cutVertices: [],
    telemetry: {
      totalVertices: graph.nodes.length,
      totalEdges: graph.edges.length,
      sccCount: sccResult.sccCount,
      maxSCCSize: Math.max(...sccResult.sccList.map((c) => c.length)),
      bridgeCount: 0,
      articulationPointCount: 0,
      recursionDepth: 0,
      maxRecursionDepth: 0,
      dfsVisits: graph.nodes.length,
      lowLinkUpdates: 0,
      condensedNodeCount: condResult.nodes.length,
      condensedEdgeCount: condResult.edges.length,
      isDAG: true,
    },
  });

  steps.push({
    stepIndex: steps.length,
    modality: "scc_dag_condensation",
    action: "complete",
    description: `Condensation DAG G^SCC constructed successfully! Topological order of super-nodes: ${condResult.topologicalOrder.join(" → ")}.`,
    stack: [],
    onStack: {},
    tin: sccResult.tin,
    low: sccResult.low,
    currentTimer: Object.keys(sccResult.tin).length,
    sccsFound: sccResult.sccList,
    nodeToScc: sccResult.nodeToSccIndex,
    bridges: [],
    cutVertices: [],
    telemetry: {
      totalVertices: graph.nodes.length,
      totalEdges: graph.edges.length,
      sccCount: sccResult.sccCount,
      maxSCCSize: Math.max(...sccResult.sccList.map((c) => c.length)),
      bridgeCount: 0,
      articulationPointCount: 0,
      recursionDepth: 0,
      maxRecursionDepth: 0,
      dfsVisits: graph.nodes.length,
      lowLinkUpdates: 0,
      condensedNodeCount: condResult.nodes.length,
      condensedEdgeCount: condResult.edges.length,
      isDAG: true,
    },
  });
}

function generate2SATSteps(formula: TwoSATFormula, steps: TarjanAnimationStep[]): void {
  const impResult = build2SATImplicationGraph(formula.variables, formula.clauses);
  const solverResult = solve2SAT(formula.variables, formula.clauses);

  // Step 1: Implication graph construction
  steps.push({
    stepIndex: steps.length,
    modality: "two_sat_implication_engine",
    action: "two_sat_construct_clause",
    description: `Constructed 2-SAT implication graph with ${impResult.graph.nodes.length} literal nodes and ${impResult.graph.edges.length} implication edges from ${formula.clauses.length} clauses.`,
    stack: [],
    onStack: {},
    tin: {},
    low: {},
    currentTimer: 0,
    sccsFound: [],
    nodeToScc: {},
    bridges: [],
    cutVertices: [],
    twoSATAssignments: {},
    twoSATContradictions: [],
    telemetry: {
      totalVertices: impResult.graph.nodes.length,
      totalEdges: impResult.graph.edges.length,
      sccCount: 0,
      maxSCCSize: 0,
      bridgeCount: 0,
      articulationPointCount: 0,
      isSatisfiable: undefined,
      recursionDepth: 0,
      maxRecursionDepth: 0,
      dfsVisits: 0,
      lowLinkUpdates: 0,
    },
  });

  // Step 2: Run Tarjan steps on the implication graph
  generateSCCDiscoverySteps(impResult.graph, steps);

  // Step 3: Satisfiability check
  steps.push({
    stepIndex: steps.length,
    modality: "two_sat_implication_engine",
    action: "two_sat_check_satisfiability",
    description: solverResult.isSatisfiable
      ? `Satisfiability Verification: PASSED. No variable X shares an SCC with ¬X.`
      : `Satisfiability Contradiction: UNSATISFIABLE! Contradiction found for variable(s): ${solverResult.contradictions.map((c) => c.variable).join(", ")}. Both X and ¬X are in the same SCC #${solverResult.contradictions[0]?.sccIndex ?? 0}.`,
    stack: [],
    onStack: {},
    tin: solverResult.sccResult.tin,
    low: solverResult.sccResult.low,
    currentTimer: Object.keys(solverResult.sccResult.tin).length,
    sccsFound: solverResult.sccResult.sccList,
    nodeToScc: solverResult.sccResult.nodeToSccIndex,
    bridges: [],
    cutVertices: [],
    twoSATAssignments: solverResult.assignment,
    twoSATContradictions: solverResult.contradictions,
    telemetry: {
      totalVertices: impResult.graph.nodes.length,
      totalEdges: impResult.graph.edges.length,
      sccCount: solverResult.sccResult.sccCount,
      maxSCCSize: Math.max(...solverResult.sccResult.sccList.map((c) => c.length)),
      bridgeCount: 0,
      articulationPointCount: 0,
      isSatisfiable: solverResult.isSatisfiable,
      recursionDepth: 0,
      maxRecursionDepth: 0,
      dfsVisits: impResult.graph.nodes.length,
      lowLinkUpdates: 0,
    },
  });

  // Step 4: Truth assignment
  if (solverResult.isSatisfiable) {
    const assignmentText = Object.entries(solverResult.assignment)
      .map(([k, v]) => `${k} = ${v ? "TRUE" : "FALSE"}`)
      .join(", ");

    steps.push({
      stepIndex: steps.length,
      modality: "two_sat_implication_engine",
      action: "two_sat_assign_truth",
      description: `Computed valid truth assignment: ${assignmentText}. (Rule: val[X] = (scc[X] < scc[¬X])).`,
      stack: [],
      onStack: {},
      tin: solverResult.sccResult.tin,
      low: solverResult.sccResult.low,
      currentTimer: Object.keys(solverResult.sccResult.tin).length,
      sccsFound: solverResult.sccResult.sccList,
      nodeToScc: solverResult.sccResult.nodeToSccIndex,
      bridges: [],
      cutVertices: [],
      twoSATAssignments: solverResult.assignment,
      twoSATContradictions: [],
      telemetry: {
        totalVertices: impResult.graph.nodes.length,
        totalEdges: impResult.graph.edges.length,
        sccCount: solverResult.sccResult.sccCount,
        maxSCCSize: Math.max(...solverResult.sccResult.sccList.map((c) => c.length)),
        bridgeCount: 0,
        articulationPointCount: 0,
        isSatisfiable: true,
        recursionDepth: 0,
        maxRecursionDepth: 0,
        dfsVisits: impResult.graph.nodes.length,
        lowLinkUpdates: 0,
      },
    });
  }

  // Step 5: Complete
  steps.push({
    stepIndex: steps.length,
    modality: "two_sat_implication_engine",
    action: "complete",
    description: solverResult.isSatisfiable
      ? `2-SAT Solver Finished: SATISFIABLE. All ${formula.clauses.length} 2-CNF clauses satisfied.`
      : `2-SAT Solver Finished: UNSATISFIABLE. Formula has no satisfying boolean assignment.`,
    stack: [],
    onStack: {},
    tin: solverResult.sccResult.tin,
    low: solverResult.sccResult.low,
    currentTimer: Object.keys(solverResult.sccResult.tin).length,
    sccsFound: solverResult.sccResult.sccList,
    nodeToScc: solverResult.sccResult.nodeToSccIndex,
    bridges: [],
    cutVertices: [],
    twoSATAssignments: solverResult.assignment,
    twoSATContradictions: solverResult.contradictions,
    telemetry: {
      totalVertices: impResult.graph.nodes.length,
      totalEdges: impResult.graph.edges.length,
      sccCount: solverResult.sccResult.sccCount,
      maxSCCSize: Math.max(...solverResult.sccResult.sccList.map((c) => c.length)),
      bridgeCount: 0,
      articulationPointCount: 0,
      isSatisfiable: solverResult.isSatisfiable,
      recursionDepth: 0,
      maxRecursionDepth: 0,
      dfsVisits: impResult.graph.nodes.length,
      lowLinkUpdates: 0,
    },
  });
}

// ============================================================================
// 5. PRESETS DEFINITION
// ============================================================================

export const TARJAN_2SAT_PRESETS: Record<TarjanPresetId, TarjanPreset> = {
  scc_classic_kosaraju_tarjan: {
    id: "scc_classic_kosaraju_tarjan",
    name: "Classic Textbook 3-SCC Graph",
    subtitle: "3-Cycle, 2-Cycle, and Singleton Components",
    description:
      "A classic directed graph with 8 nodes and 3 distinct strongly connected components: {A, B, C}, {D, E}, and {F, G, H}.",
    defaultModality: "tarjan_scc_discovery",
    theoryNotes:
      "Demonstrates Tarjan's stack popping order. Notice how component {F, G, H} is completed first, followed by {D, E}, and finally {A, B, C}, reflecting the reverse topological ordering of the condensation DAG.",
    tags: ["SCC", "Tarjan", "LowLink", "Cycle"],
    graph: {
      id: "classic_3scc",
      name: "Classic 3-SCC Graph",
      description: "8 vertices, 3 SCCs",
      directed: true,
      nodes: [
        { id: "A", label: "A", x: 60, y: 70 },
        { id: "B", label: "B", x: 160, y: 70 },
        { id: "C", label: "C", x: 110, y: 170 },
        { id: "D", label: "D", x: 260, y: 70 },
        { id: "E", label: "E", x: 260, y: 170 },
        { id: "F", label: "F", x: 380, y: 70 },
        { id: "G", label: "G", x: 460, y: 120 },
        { id: "H", label: "H", x: 380, y: 170 },
      ],
      edges: [
        // SCC 1: A -> B -> C -> A
        { id: "e_ab", source: "A", target: "B", directed: true },
        { id: "e_bc", source: "B", target: "C", directed: true },
        { id: "e_ca", source: "C", target: "A", directed: true },
        // Bridge to SCC 2: B -> D
        { id: "e_bd", source: "B", target: "D", directed: true },
        // SCC 2: D <-> E
        { id: "e_de", source: "D", target: "E", directed: true },
        { id: "e_ed", source: "E", target: "D", directed: true },
        // Bridge to SCC 3: E -> F
        { id: "e_ef", source: "E", target: "F", directed: true },
        // SCC 3: F -> G -> H -> F
        { id: "e_fg", source: "F", target: "G", directed: true },
        { id: "e_gh", source: "G", target: "H", directed: true },
        { id: "e_hf", source: "H", target: "F", directed: true },
      ],
    },
  },

  scc_interconnected_rings: {
    id: "scc_interconnected_rings",
    name: "Interconnected Ring Topology",
    subtitle: "Nested feedback loops with cross-component chords",
    description: "A 9-node directed graph featuring overlapping rings and chordal feedback loops.",
    defaultModality: "tarjan_scc_discovery",
    theoryNotes:
      "Explores complex cross-edges and back-edges where low[u] is updated through multiple ancestor paths.",
    tags: ["SCC", "Rings", "ComplexCycles"],
    graph: {
      id: "interconnected_rings",
      name: "Interconnected Rings",
      description: "9 vertices, multi-ring topology",
      directed: true,
      nodes: [
        { id: "N1", label: "N1", x: 70, y: 60 },
        { id: "N2", label: "N2", x: 170, y: 60 },
        { id: "N3", label: "N3", x: 120, y: 150 },
        { id: "N4", label: "N4", x: 260, y: 100 },
        { id: "N5", label: "N5", x: 350, y: 60 },
        { id: "N6", label: "N6", x: 430, y: 100 },
        { id: "N7", label: "N7", x: 350, y: 160 },
        { id: "N8", label: "N8", x: 220, y: 220 },
        { id: "N9", label: "N9", x: 320, y: 220 },
      ],
      edges: [
        { id: "e1", source: "N1", target: "N2", directed: true },
        { id: "e2", source: "N2", target: "N3", directed: true },
        { id: "e3", source: "N3", target: "N1", directed: true },
        { id: "e4", source: "N2", target: "N4", directed: true },
        { id: "e5", source: "N4", target: "N5", directed: true },
        { id: "e6", source: "N5", target: "N6", directed: true },
        { id: "e7", source: "N6", target: "N7", directed: true },
        { id: "e8", source: "N7", target: "N5", directed: true }, // Inner cycle (N5, N6, N7)
        { id: "e9", source: "N4", target: "N8", directed: true },
        { id: "e10", source: "N8", target: "N9", directed: true },
        { id: "e11", source: "N9", target: "N8", directed: true }, // Inner cycle (N8, N9)
      ],
    },
  },

  scc_dag_chain_diamonds: {
    id: "scc_dag_chain_diamonds",
    name: "Diamond DAG (Trivial SCCs)",
    subtitle: "Pure acyclic DAG where every vertex is an SCC of size 1",
    description:
      "A 6-node directed acyclic graph. Every node forms its own singleton SCC, yielding a trivial 1-to-1 Condensation DAG.",
    defaultModality: "scc_dag_condensation",
    theoryNotes:
      "When a graph is a DAG, low[u] == tin[u] for every node immediately upon returning from all its children. The Condensation DAG G^SCC is isomorphic to the original graph.",
    tags: ["DAG", "Condensation", "TopologicalSort"],
    graph: {
      id: "diamond_dag",
      name: "Diamond DAG",
      description: "6 vertices, 0 cycles",
      directed: true,
      nodes: [
        { id: "S", label: "S", x: 60, y: 120 },
        { id: "A", label: "A", x: 170, y: 60 },
        { id: "B", label: "B", x: 170, y: 180 },
        { id: "C", label: "C", x: 300, y: 60 },
        { id: "D", label: "D", x: 300, y: 180 },
        { id: "T", label: "T", x: 420, y: 120 },
      ],
      edges: [
        { id: "d1", source: "S", target: "A", directed: true },
        { id: "d2", source: "S", target: "B", directed: true },
        { id: "d3", source: "A", target: "C", directed: true },
        { id: "d4", source: "A", target: "D", directed: true },
        { id: "d5", source: "B", target: "D", directed: true },
        { id: "d6", source: "C", target: "T", directed: true },
        { id: "d7", source: "D", target: "T", directed: true },
      ],
    },
  },

  scc_dense_strongly_connected: {
    id: "scc_dense_strongly_connected",
    name: "Dense Single-SCC Monster",
    subtitle: "Highly connected graph forming 1 massive component",
    description:
      "A 6-node dense graph where every vertex can reach every other vertex. Shrinks to 1 super-node.",
    defaultModality: "tarjan_scc_discovery",
    theoryNotes:
      "The DFS root node retains low[root] == tin[root] = 1, and all 6 nodes remain on the stack until the root exits.",
    tags: ["SCC", "Dense", "SingleComponent"],
    graph: {
      id: "dense_single_scc",
      name: "Dense Single-SCC",
      description: "6 vertices, 1 large SCC",
      directed: true,
      nodes: [
        { id: "U1", label: "U1", x: 80, y: 80 },
        { id: "U2", label: "U2", x: 200, y: 60 },
        { id: "U3", label: "U3", x: 340, y: 80 },
        { id: "U4", label: "U4", x: 340, y: 180 },
        { id: "U5", label: "U5", x: 200, y: 200 },
        { id: "U6", label: "U6", x: 80, y: 180 },
      ],
      edges: [
        { id: "m1", source: "U1", target: "U2", directed: true },
        { id: "m2", source: "U2", target: "U3", directed: true },
        { id: "m3", source: "U3", target: "U4", directed: true },
        { id: "m4", source: "U4", target: "U5", directed: true },
        { id: "m5", source: "U5", target: "U6", directed: true },
        { id: "m6", source: "U6", target: "U1", directed: true },
        { id: "m7", source: "U1", target: "U4", directed: true },
        { id: "m8", source: "U3", target: "U6", directed: true },
      ],
    },
  },

  bridges_bowtie_graph: {
    id: "bridges_bowtie_graph",
    name: "Bowtie / Barbell Graph",
    subtitle: "2 Triangles connected by a single bottleneck bridge edge",
    description:
      "A classic undirected biconnectivity benchmark: Triangle 1 (A, B, C) and Triangle 2 (E, F, G) joined by central edge (C - E).",
    defaultModality: "bridges_and_articulation_points",
    theoryNotes:
      "Edge (C - E) is a Bridge because low[E] > tin[C]. Vertices C and E are Articulation Points because removing either disconnects the triangles.",
    tags: ["Bridges", "ArticulationPoints", "Bottleneck", "Undirected"],
    graph: {
      id: "bowtie_graph",
      name: "Bowtie Graph",
      description: "6 vertices, 1 bridge, 2 cut vertices",
      directed: false,
      nodes: [
        { id: "A", label: "A", x: 60, y: 60 },
        { id: "B", label: "B", x: 60, y: 180 },
        { id: "C", label: "C", x: 170, y: 120 },
        { id: "E", label: "E", x: 290, y: 120 },
        { id: "F", label: "F", x: 400, y: 60 },
        { id: "G", label: "G", x: 400, y: 180 },
      ],
      edges: [
        { id: "b_ab", source: "A", target: "B", directed: false },
        { id: "b_bc", source: "B", target: "C", directed: false },
        { id: "b_ca", source: "C", target: "A", directed: false },
        // Bridge edge: C - E
        { id: "b_ce", source: "C", target: "E", directed: false },
        { id: "b_ef", source: "E", target: "F", directed: false },
        { id: "b_fg", source: "F", target: "G", directed: false },
        { id: "b_ge", source: "G", target: "E", directed: false },
      ],
    },
  },

  bridges_tree_articulations: {
    id: "bridges_tree_articulations",
    name: "Tree Topology (All Bridges)",
    subtitle: "Every edge is a bridge; every internal vertex is a cut vertex",
    description:
      "An 8-node undirected tree. In any tree, all edges are bridges and all non-leaf nodes are articulation points.",
    defaultModality: "bridges_and_articulation_points",
    theoryNotes:
      "Since there are no cycles or back-edges, for every tree child v of u, low[v] == tin[v] > tin[u]. Thus every edge is a bridge.",
    tags: ["Bridges", "Tree", "CutVertices"],
    graph: {
      id: "tree_bridges",
      name: "Tree Bridges",
      description: "8 vertices, 7 bridges, 3 cut vertices",
      directed: false,
      nodes: [
        { id: "R", label: "Root", x: 230, y: 40 },
        { id: "A", label: "A", x: 120, y: 110 },
        { id: "B", label: "B", x: 340, y: 110 },
        { id: "A1", label: "A1", x: 60, y: 190 },
        { id: "A2", label: "A2", x: 160, y: 190 },
        { id: "B1", label: "B1", x: 280, y: 190 },
        { id: "B2", label: "B2", x: 380, y: 190 },
      ],
      edges: [
        { id: "t_ra", source: "R", target: "A", directed: false },
        { id: "t_rb", source: "R", target: "B", directed: false },
        { id: "t_a1", source: "A", target: "A1", directed: false },
        { id: "t_a2", source: "A", target: "A2", directed: false },
        { id: "t_b1", source: "B", target: "B1", directed: false },
        { id: "t_b2", source: "B", target: "B2", directed: false },
      ],
    },
  },

  bridges_cycle_with_antennas: {
    id: "bridges_cycle_with_antennas",
    name: "Cycle with Antenna Leaves",
    subtitle: "Central 4-cycle with dangling leaf nodes",
    description:
      "A 4-node central cycle (no bridges inside) with 3 dangling antenna leaves (each antenna is a bridge).",
    defaultModality: "bridges_and_articulation_points",
    theoryNotes:
      "Highlights how back-edges protect cycle edges from being bridges, while antenna attachments become articulation points.",
    tags: ["Bridges", "Cycle", "Leaves", "Antenna"],
    graph: {
      id: "cycle_antennas",
      name: "Cycle with Antennas",
      description: "7 vertices, 3 bridges, 3 cut vertices",
      directed: false,
      nodes: [
        { id: "C1", label: "C1", x: 180, y: 90 },
        { id: "C2", label: "C2", x: 300, y: 90 },
        { id: "C3", label: "C3", x: 300, y: 190 },
        { id: "C4", label: "C4", x: 180, y: 190 },
        { id: "L1", label: "L1", x: 80, y: 90 },
        { id: "L2", label: "L2", x: 400, y: 90 },
        { id: "L3", label: "L3", x: 180, y: 270 },
      ],
      edges: [
        // Cycle edges
        { id: "cy_12", source: "C1", target: "C2", directed: false },
        { id: "cy_23", source: "C2", target: "C3", directed: false },
        { id: "cy_34", source: "C3", target: "C4", directed: false },
        { id: "cy_41", source: "C4", target: "C1", directed: false },
        // Antenna bridge edges
        { id: "ant_1", source: "C1", target: "L1", directed: false },
        { id: "ant_2", source: "C2", target: "L2", directed: false },
        { id: "ant_3", source: "C4", target: "L3", directed: false },
      ],
    },
  },

  twosat_satisfiable_3var: {
    id: "twosat_satisfiable_3var",
    name: "2-SAT Satisfiable (3 Variables)",
    subtitle: "Formula: (A ∨ B) ∧ (¬A ∨ C) ∧ (¬B ∨ C) ∧ (B ∨ ¬C)",
    description:
      "A 3-variable 2-CNF formula with 4 clauses. Satisfiable with truth assignment A = True, B = True, C = True.",
    defaultModality: "two_sat_implication_engine",
    theoryNotes:
      "Implication graph has separate SCCs for positive and negative literals: no variable X is in the same component as ¬X.",
    tags: ["2SAT", "Satisfiable", "ImplicationGraph"],
    twoSATFormula: parse2SATFormula("(A | B) & (~A | C) & (~B | C) & (B | ~C)"),
  },

  twosat_unsatisfiable_contradiction: {
    id: "twosat_unsatisfiable_contradiction",
    name: "2-SAT Unsatisfiable (Contradiction)",
    subtitle: "Formula: (A ∨ B) ∧ (A ∨ ¬B) ∧ (¬A ∨ B) ∧ (¬A ∨ ¬B)",
    description:
      "A 2-variable 4-clause formula representing all 4 combinations, creating a contradiction where A ⇒ ¬A and ¬A ⇒ A.",
    defaultModality: "two_sat_implication_engine",
    theoryNotes:
      "The implication graph contains directed cycles A → ¬A → A and B → ¬B → B. Tarjan detects SCC(A) == SCC(¬A), proving unsatisfiability in linear time.",
    tags: ["2SAT", "UNSAT", "Contradiction"],
    twoSATFormula: parse2SATFormula("(A | B) & (A | ~B) & (~A | B) & (~A | ~B)"),
  },

  twosat_graph_coloring_scheduling: {
    id: "twosat_graph_coloring_scheduling",
    name: "2-SAT 2-Coloring & Mutex Scheduling",
    subtitle: "Formula: (A ∨ B) ∧ (¬A ∨ ¬B) ∧ (B ∨ C) ∧ (¬B ∨ ¬C) ∧ (C ∨ D) ∧ (¬C ∨ ¬D)",
    description:
      "Models mutual exclusion constraints (A ⊕ B) ∧ (B ⊕ C) ∧ (C ⊕ D) as 2-CNF clauses. Fully satisfiable.",
    defaultModality: "two_sat_implication_engine",
    theoryNotes:
      "XOR constraints (X ⊕ Y) decompose into (X ∨ Y) ∧ (¬X ∨ ¬Y). 2-SAT computes a valid 2-coloring in linear time.",
    tags: ["2SAT", "2Coloring", "Scheduling", "Satisfiable"],
    twoSATFormula: parse2SATFormula(
      "(A | B) & (~A | ~B) & (B | C) & (~B | ~C) & (C | D) & (~C | ~D)",
    ),
  },

  twosat_pigeonhole_conflict: {
    id: "twosat_pigeonhole_conflict",
    name: "2-SAT Pigeonhole Conflict",
    subtitle: "Formula: (P ∨ Q) ∧ (¬P ∨ R) ∧ (¬Q ∨ R) ∧ (¬R ∨ ¬P) ∧ (¬R ∨ ¬Q) ∧ (P ∨ ¬R)",
    description:
      "A 3-variable conflict instance where pushing R forces both P and Q to be false, violating (P ∨ Q).",
    defaultModality: "two_sat_implication_engine",
    theoryNotes:
      "Demonstrates how cascading implications force a variable and its negation into a single strong cycle.",
    tags: ["2SAT", "Pigeonhole", "UNSAT", "Conflict"],
    twoSATFormula: parse2SATFormula(
      "(P | Q) & (~P | R) & (~Q | R) & (~R | ~P) & (~R | ~Q) & (P | ~R)",
    ),
  },
};

// ============================================================================
// 6. MAIN REACT COMPONENT: TarjanSCC2SATStudio
// ============================================================================

export const TarjanSCC2SATStudio: React.FC<TarjanSCC2SATStudioProps> = ({
  initialModality = "tarjan_scc_discovery",
  initialPreset = "scc_classic_kosaraju_tarjan",
  customGraph,
  custom2SATFormula,
  standalone = true,
  title = "Tarjan's Low-Link & 2-SAT Implication Studio",
  onStepChange,
  onModalityChange,
  onPresetChange,
}) => {
  // --- State ---
  const [modality, setModality] = useState<TarjanStudioModality>(initialModality);
  const [selectedPresetId, setSelectedPresetId] = useState<TarjanPresetId>(initialPreset);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [activeSideTab, setActiveSideTab] = useState<
    "stack" | "clauses" | "condensation" | "telemetry"
  >("stack");

  // 2-SAT custom formula text input
  const [formulaInput, setFormulaInput] = useState<string>(
    "(A | B) & (~A | C) & (~B | C) & (B | ~C)",
  );

  // Canvas hook from vizGeometry
  const { ref: canvasContainerRef, box: canvasBox } = useCanvasBox({ width: 800, height: 500 });

  // Active preset
  const currentPreset =
    TARJAN_2SAT_PRESETS[selectedPresetId] || TARJAN_2SAT_PRESETS.scc_classic_kosaraju_tarjan;

  // Active graph
  const activeGraph = useMemo<TarjanGraph>(() => {
    if (customGraph) return customGraph;
    if (modality === "two_sat_implication_engine") {
      const formula = custom2SATFormula || parse2SATFormula(formulaInput);
      return build2SATImplicationGraph(formula.variables, formula.clauses).graph;
    }
    return currentPreset.graph || TARJAN_2SAT_PRESETS.scc_classic_kosaraju_tarjan.graph!;
  }, [customGraph, custom2SATFormula, formulaInput, modality, currentPreset]);

  // Active 2-SAT formula
  const active2SATFormula = useMemo<TwoSATFormula>(() => {
    if (custom2SATFormula) return custom2SATFormula;
    if (currentPreset.twoSATFormula) return currentPreset.twoSATFormula;
    return parse2SATFormula(formulaInput);
  }, [custom2SATFormula, currentPreset, formulaInput]);

  // Generate simulation animation steps
  const steps = useMemo<readonly TarjanAnimationStep[]>(() => {
    return generateTarjanSteps(modality, activeGraph, active2SATFormula);
  }, [modality, activeGraph, active2SATFormula]);

  // Current step
  const currentStep = steps[Math.min(stepIndex, Math.max(0, steps.length - 1))] || steps[0];

  // 2-SAT solver result
  const twoSATResult = useMemo<TwoSATSolverResult | null>(() => {
    if (modality !== "two_sat_implication_engine") return null;
    return solve2SAT(active2SATFormula.variables, active2SATFormula.clauses);
  }, [modality, active2SATFormula]);

  // Condensation result
  const condensationResult = useMemo<CondensationGraphResult | null>(() => {
    if (modality !== "scc_dag_condensation") return null;
    const sccRes = runTarjanSCC(activeGraph);
    return buildCondensationGraph(activeGraph, sccRes);
  }, [modality, activeGraph]);

  // Bridges result
  const bridgesResult = useMemo<BridgesArticulationResult | null>(() => {
    if (modality !== "bridges_and_articulation_points") return null;
    return findBridgesAndArticulationPoints(activeGraph);
  }, [modality, activeGraph]);

  // Notify parent on step change
  useEffect(() => {
    if (currentStep && onStepChange) {
      onStepChange(currentStep);
    }
  }, [currentStep, onStepChange]);

  // Reset step index when steps change or preset/modality changes
  useEffect(() => {
    setStepIndex(0);
    setIsPlaying(false);
  }, [modality, selectedPresetId, formulaInput]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(80, Math.floor(650 / playbackSpeed));
    const timer = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, steps.length]);

  // Handlers
  const handleModalitySelect = useCallback(
    (newMod: TarjanStudioModality) => {
      setModality(newMod);
      if (onModalityChange) onModalityChange(newMod);
      // Pick suitable tab for this modality
      if (newMod === "two_sat_implication_engine") {
        setActiveSideTab("clauses");
      } else if (newMod === "scc_dag_condensation") {
        setActiveSideTab("condensation");
      } else {
        setActiveSideTab("stack");
      }
    },
    [onModalityChange],
  );

  const handlePresetSelect = useCallback(
    (presetId: TarjanPresetId) => {
      setSelectedPresetId(presetId);
      const targetPreset = TARJAN_2SAT_PRESETS[presetId];
      if (targetPreset) {
        setModality(targetPreset.defaultModality);
        if (targetPreset.twoSATFormula?.rawFormula) {
          setFormulaInput(targetPreset.twoSATFormula.rawFormula);
        }
      }
      if (onPresetChange) onPresetChange(presetId);
    },
    [onPresetChange],
  );

  const handleStepForward = useCallback(() => {
    setIsPlaying(false);
    setStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
  }, [steps.length]);

  const handleStepBack = useCallback(() => {
    setIsPlaying(false);
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setStepIndex(0);
  }, []);

  // Node position mapping into canvas box
  const nodePositions = useMemo(() => {
    const rawPoints: Point[] = activeGraph.nodes.map((n) => ({ x: n.x, y: n.y }));
    const spread = spreadToBox(rawPoints, canvasBox, 48);
    const posMap: Record<string, Point> = {};
    activeGraph.nodes.forEach((n, i) => {
      posMap[n.id] = spread[i] || { x: n.x, y: n.y };
    });
    return posMap;
  }, [activeGraph.nodes, canvasBox]);

  // Color lookup for node in current step
  const getNodeColor = useCallback(
    (nodeId: string): string => {
      if (currentStep?.nodeToScc[nodeId] !== undefined) {
        const sccIdx = currentStep.nodeToScc[nodeId];
        return SCC_PALETTE[sccIdx % SCC_PALETTE.length];
      }
      if (currentStep?.onStack[nodeId]) {
        return "#f59e0b"; // On active stack
      }
      if (currentStep?.tin[nodeId] !== undefined && currentStep.tin[nodeId] > 0) {
        return "#6366f1"; // Visited in DFS
      }
      return "#475569"; // Unvisited
    },
    [currentStep],
  );

  const modalityConfig = MODALITY_CONFIGS[modality];

  return (
    <div
      className={`flex flex-col w-full bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-sans ${
        standalone ? "min-h-[780px]" : "h-full"
      }`}
    >
      {/* ==================================================================== */}
      {/* 1. TOP HEADER & MODALITY SWITCHER */}
      {/* ==================================================================== */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Network className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">{title}</h1>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${modalityConfig.badgeColor}`}
            >
              {modalityConfig.title}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{modalityConfig.subtitle}</p>
        </div>

        {/* Modality Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
          {(Object.keys(MODALITY_CONFIGS) as TarjanStudioModality[]).map((modKey) => {
            const config = MODALITY_CONFIGS[modKey];
            const isSelected = modality === modKey;
            return (
              <button
                key={modKey}
                onClick={() => handleModalitySelect(modKey)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {modKey === "tarjan_scc_discovery" && <Network className="w-3.5 h-3.5" />}
                {modKey === "bridges_and_articulation_points" && <Split className="w-3.5 h-3.5" />}
                {modKey === "scc_dag_condensation" && <Box className="w-3.5 h-3.5" />}
                {modKey === "two_sat_implication_engine" && <Zap className="w-3.5 h-3.5" />}
                <span>{config.title.replace("Tarjan's ", "")}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. PRESET & CONTROL BAR */}
      {/* ==================================================================== */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Preset:</span>
            <select
              value={selectedPresetId}
              onChange={(e) => handlePresetSelect(e.target.value as TarjanPresetId)}
              className="bg-slate-800 text-slate-200 text-xs rounded-md px-3 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {Object.values(TARJAN_2SAT_PRESETS).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2-SAT Quick Clause Input when in 2-SAT mode */}
          {modality === "two_sat_implication_engine" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-amber-400">2-CNF:</span>
              <input
                type="text"
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                placeholder="(A | B) & (~A | C)"
                className="bg-slate-800 text-slate-200 text-xs rounded-md px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 w-56 font-mono"
              />
            </div>
          )}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            title="Reset Simulation"
            className="p-1.5 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleStepBack}
            disabled={stepIndex <= 0}
            title="Step Back"
            className="p-1.5 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 transition"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause" : "Play"}
            className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </button>
          <button
            onClick={handleStepForward}
            disabled={stepIndex >= steps.length - 1}
            title="Step Forward"
            className="p-1.5 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 transition"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700 ml-2">
            <span className="text-[11px] text-slate-400">Speed:</span>
            {[0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`text-[11px] px-1.5 py-0.5 rounded ${
                  playbackSpeed === spd
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step Scrubber Slider */}
      <div className="bg-slate-900/40 px-5 py-1.5 border-b border-slate-800/60 flex items-center gap-3 text-xs text-slate-400">
        <span>
          Step <strong className="text-indigo-400">{stepIndex + 1}</strong> of {steps.length}
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(0, steps.length - 1)}
          value={stepIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setStepIndex(Number(e.target.value));
          }}
          className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <span className="font-mono text-[11px] text-slate-500">
          Action: <span className="text-slate-300">{currentStep?.action}</span>
        </span>
      </div>

      {/* ==================================================================== */}
      {/* 3. MAIN WORKSPACE: SVG CANVAS + SIDE PANELS */}
      {/* ==================================================================== */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[520px]">
        {/* SVG Canvas Area (8 Cols on LG) */}
        <div
          ref={canvasContainerRef}
          className="lg:col-span-8 bg-slate-950 p-4 relative flex flex-col items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800"
        >
          {/* Canvas Box / Dynamic SVG */}
          <svg
            viewBox={viewBoxAttr(boxViewBox(canvasBox))}
            className="w-full h-full max-h-[540px] select-none"
          >
            {/* SVG Arrow Marker Definitions */}
            <defs>
              <marker
                id="arrowhead-directed"
                markerWidth="8"
                markerHeight="6"
                refX="22"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
              </marker>
              <marker
                id="arrowhead-active"
                markerWidth="10"
                markerHeight="7"
                refX="24"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#818cf8" />
              </marker>
              <marker
                id="arrowhead-implication"
                markerWidth="8"
                markerHeight="6"
                refX="22"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#60a5fa" />
              </marker>
            </defs>

            {/* Edges Layer */}
            {activeGraph.edges.map((edge) => {
              const uPos = nodePositions[edge.source];
              const vPos = nodePositions[edge.target];
              if (!uPos || !vPos) return null;

              const isActive =
                currentStep?.activeEdgeId === edge.id ||
                (currentStep?.activeNodeId === edge.source &&
                  currentStep?.targetNodeId === edge.target);

              const isBridge =
                currentStep?.bridges.includes(edge.id) ||
                (bridgesResult && bridgesResult.bridges.some((b) => b.edgeId === edge.id));

              let strokeColor = "#475569";
              let strokeWidth = 1.8;
              let strokeDasharray = "none";
              let markerEnd = edge.directed ? "url(#arrowhead-directed)" : undefined;

              if (isActive) {
                strokeColor = "#818cf8";
                strokeWidth = 3.5;
                markerEnd = edge.directed ? "url(#arrowhead-active)" : undefined;
              } else if (isBridge) {
                strokeColor = "#f43f5e"; // Rose Bridge
                strokeWidth = 3.5;
                strokeDasharray = "5,4";
              } else if (edge.type === "implication") {
                strokeColor = "#3b82f6";
                markerEnd = "url(#arrowhead-implication)";
              }

              // Compute mid point for bridge label
              const midX = (uPos.x + vPos.x) / 2;
              const midY = (uPos.y + vPos.y) / 2;

              return (
                <g key={edge.id} className="transition-all duration-300">
                  <line
                    x1={uPos.x}
                    y1={uPos.y}
                    x2={vPos.x}
                    y2={vPos.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    markerEnd={markerEnd}
                    strokeLinecap="round"
                  />

                  {/* Bridge Warning Badge on Canvas */}
                  {isBridge && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-24"
                        y="-10"
                        width="48"
                        height="20"
                        rx="4"
                        fill="#881337"
                        stroke="#f43f5e"
                        strokeWidth="1.2"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#ffe4e6"
                      >
                        BRIDGE
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Nodes Layer */}
            {activeGraph.nodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const isActive = currentStep?.activeNodeId === node.id;
              const onStack = currentStep?.onStack[node.id];
              const sccIndex = currentStep?.nodeToScc[node.id];
              const nodeColor = getNodeColor(node.id);

              const isCutVertex =
                currentStep?.cutVertices.includes(node.id) ||
                (bridgesResult && bridgesResult.articulationPoints.includes(node.id));

              const nodeTin = currentStep?.tin[node.id];
              const nodeLow = currentStep?.low[node.id];
              const hasTimes = nodeTin !== undefined && nodeTin !== -1;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer transition-all duration-300"
                >
                  {/* Outer Glow / Halo for Active Node */}
                  {isActive && (
                    <circle
                      r="26"
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="3"
                      strokeDasharray="4,3"
                      className="animate-spin"
                    />
                  )}

                  {/* Articulation Point Warning Halo */}
                  {isCutVertex && (
                    <circle
                      r="24"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      className="animate-pulse"
                    />
                  )}

                  {/* Stack Highlight Ring */}
                  {onStack && <circle r="20" fill="none" stroke="#f59e0b" strokeWidth="2" />}

                  {/* Main Node Circle */}
                  <circle
                    r="16"
                    fill={nodeColor}
                    stroke={isActive ? "#ffffff" : isCutVertex ? "#f43f5e" : "#1e293b"}
                    strokeWidth={isActive || isCutVertex ? 2.5 : 1.5}
                    className="shadow-lg"
                  />

                  {/* Node Label */}
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {node.label}
                  </text>

                  {/* Low-Link Badge [tin / low] */}
                  {hasTimes && (
                    <g transform="translate(0, -22)">
                      <rect
                        x="-20"
                        y="-8"
                        width="40"
                        height="14"
                        rx="3"
                        fill="#0f172a"
                        stroke="#334155"
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="2.5"
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill={nodeLow === nodeTin ? "#34d399" : "#38bdf8"}
                      >
                        {nodeTin}/{nodeLow}
                      </text>
                    </g>
                  )}

                  {/* SCC Index Badge when popped */}
                  {sccIndex !== undefined && (
                    <g transform="translate(14, 14)">
                      <circle r="7" fill="#0f172a" stroke={nodeColor} strokeWidth="1.5" />
                      <text
                        x="0"
                        y="2.5"
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="bold"
                        fill="#ffffff"
                      >
                        {sccIndex + 1}
                      </text>
                    </g>
                  )}

                  {/* Articulation Point Badge */}
                  {isCutVertex && (
                    <g transform="translate(-14, 14)">
                      <circle r="7" fill="#e11d48" stroke="#ffffff" strokeWidth="1" />
                      <text
                        x="0"
                        y="2.5"
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="bold"
                        fill="#ffffff"
                      >
                        !
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Canvas Overlay Legend */}
          <div className="absolute bottom-3 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-lg text-[11px] flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-slate-300">tin/low Badge</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-300">On Stack</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-300">Bridge / Cut Vertex</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-300">SCC Root (low==tin)</span>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 4. SIDEBAR & TELEMETRY PANEL (4 Cols on LG) */}
        {/* ================================================================== */}
        <div className="lg:col-span-4 bg-slate-900/70 flex flex-col justify-between border-slate-800">
          {/* Sidebar Tabs */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950/40 text-xs">
            <button
              onClick={() => setActiveSideTab("stack")}
              className={`flex-1 py-2.5 text-center font-medium border-b-2 transition ${
                activeSideTab === "stack"
                  ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Call Stack
            </button>
            <button
              onClick={() => setActiveSideTab("clauses")}
              className={`flex-1 py-2.5 text-center font-medium border-b-2 transition ${
                activeSideTab === "clauses"
                  ? "border-amber-500 text-amber-400 bg-amber-500/10"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              2-SAT Clauses
            </button>
            <button
              onClick={() => setActiveSideTab("condensation")}
              className={`flex-1 py-2.5 text-center font-medium border-b-2 transition ${
                activeSideTab === "condensation"
                  ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Condensation
            </button>
            <button
              onClick={() => setActiveSideTab("telemetry")}
              className={`flex-1 py-2.5 text-center font-medium border-b-2 transition ${
                activeSideTab === "telemetry"
                  ? "border-cyan-500 text-cyan-400 bg-cyan-500/10"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Telemetry
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-4 flex-1 overflow-y-auto max-h-[380px] space-y-3">
            {/* TAB 1: DFS CALL STACK */}
            {activeSideTab === "stack" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Active DFS Stack</span>
                  <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-amber-400 font-mono">
                    Size: {currentStep?.stack.length || 0}
                  </span>
                </div>

                {/* Stack Visualizer (Top to Bottom) */}
                <div className="space-y-1.5 min-h-[120px] bg-slate-950 p-2 rounded-lg border border-slate-800">
                  {currentStep?.stack.length === 0 ? (
                    <div className="text-xs text-slate-500 italic text-center py-6">
                      DFS stack is currently empty
                    </div>
                  ) : (
                    currentStep?.stack
                      .slice()
                      .reverse()
                      .map((nodeId, idx) => {
                        const isTop = idx === 0;
                        const tinVal = currentStep.tin[nodeId];
                        const lowVal = currentStep.low[nodeId];
                        const isRoot = tinVal === lowVal;

                        return (
                          <div
                            key={nodeId}
                            className={`flex items-center justify-between px-3 py-1.5 rounded text-xs border transition ${
                              isTop
                                ? "bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold"
                                : "bg-slate-800/70 border-slate-700 text-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-slate-700 text-[10px] flex items-center justify-center font-mono">
                                {nodeId}
                              </span>
                              <span>Node {nodeId}</span>
                              {isTop && (
                                <span className="text-[9px] bg-amber-500 text-slate-950 px-1 py-0.2 rounded font-bold uppercase">
                                  TOP
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <span>tin: {tinVal}</span>
                              <span>low: {lowVal}</span>
                              {isRoot && (
                                <span className="text-[10px] text-emerald-400 font-bold">ROOT</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Discovered SCCs so far */}
                <div>
                  <span className="text-xs font-semibold text-slate-300">Discovered SCCs</span>
                  <div className="mt-1.5 space-y-1">
                    {currentStep?.sccsFound.length === 0 ? (
                      <div className="text-xs text-slate-500 italic">No SCC popped yet</div>
                    ) : (
                      currentStep?.sccsFound.map((scc, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800 text-xs border border-slate-700"
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: SCC_PALETTE[i % SCC_PALETTE.length] }}
                          />
                          <span className="font-bold text-slate-200">SCC #{i + 1}:</span>
                          <span className="font-mono text-slate-300">{`{ ${scc.join(", ")} }`}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 2-SAT CLAUSE ENGINE */}
            {activeSideTab === "clauses" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">2-CNF Clauses</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                      twoSATResult?.isSatisfiable
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {twoSATResult?.isSatisfiable ? "SATISFIABLE" : "UNSATISFIABLE"}
                  </span>
                </div>

                {/* Clauses Table */}
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto bg-slate-950 p-2 rounded-lg border border-slate-800">
                  {twoSATResult?.clauseEvaluations.map((evalItem, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs"
                    >
                      <span className="font-mono font-bold text-indigo-300">
                        {format2SATClause(evalItem.clause)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({evalItem.litAVal ? "T" : "F"} ∨ {evalItem.litBVal ? "T" : "F"})
                        </span>
                        {evalItem.isSatisfied ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Truth Assignment Readout */}
                <div>
                  <span className="text-xs font-semibold text-slate-300">Boolean Assignment</span>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    {twoSATResult &&
                      Object.entries(twoSATResult.assignment).map(([varName, val]) => (
                        <div
                          key={varName}
                          className="flex items-center justify-between px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs"
                        >
                          <span className="font-bold text-slate-200">{varName}</span>
                          <span
                            className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                              val
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-rose-500/20 text-rose-300"
                            }`}
                          >
                            {val ? "TRUE" : "FALSE"}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Contradictions list if UNSAT */}
                {twoSATResult && !twoSATResult.isSatisfiable && (
                  <div className="bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-lg text-xs text-rose-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Contradiction Detected:</span>
                    </div>
                    {twoSATResult.contradictions.map((c, i) => (
                      <p key={i} className="text-[11px]">
                        Variable <strong>{c.variable}</strong> and <strong>¬{c.variable}</strong>{" "}
                        belong to the same SCC #{c.sccIndex + 1}.
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CONDENSATION DAG */}
            {activeSideTab === "condensation" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Condensation DAG G^SCC
                  </span>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                    DAG: Strict Acyclic
                  </span>
                </div>

                {/* Super-Nodes List */}
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto bg-slate-950 p-2 rounded-lg border border-slate-800">
                  {condensationResult?.nodes.map((cNode) => (
                    <div
                      key={cNode.id}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cNode.color }}
                        />
                        <span className="font-bold text-slate-200">{cNode.id}</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {`{ ${cNode.members.join(", ")} }`}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Rank: {cNode.topologicalRank}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Topological Ordering Chain */}
                <div>
                  <span className="text-xs font-semibold text-slate-300">
                    Topological Sort Order
                  </span>
                  <div className="mt-1.5 p-2 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-300 flex flex-wrap items-center gap-1.5">
                    {condensationResult?.topologicalOrder.map((superId, idx) => (
                      <React.Fragment key={superId}>
                        <span className="font-bold">{superId}</span>
                        {idx < condensationResult.topologicalOrder.length - 1 && (
                          <span className="text-slate-500">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TELEMETRY HUD */}
            {activeSideTab === "telemetry" && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Algorithmic Telemetry</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Vertices |V|</span>
                    <strong className="text-sm text-slate-100">
                      {currentStep?.telemetry.totalVertices}
                    </strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Edges |E|</span>
                    <strong className="text-sm text-slate-100">
                      {currentStep?.telemetry.totalEdges}
                    </strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">SCC Count</span>
                    <strong className="text-sm text-indigo-400">
                      {currentStep?.telemetry.sccCount}
                    </strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Bridges Found</span>
                    <strong className="text-sm text-rose-400">
                      {currentStep?.telemetry.bridgeCount}
                    </strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Cut Vertices</span>
                    <strong className="text-sm text-rose-400">
                      {currentStep?.telemetry.articulationPointCount}
                    </strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">DFS Visits</span>
                    <strong className="text-sm text-amber-400">
                      {currentStep?.telemetry.dfsVisits}
                    </strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 col-span-2">
                    <span className="text-slate-400 text-[10px] block">Low-Link Updates</span>
                    <strong className="text-sm text-cyan-400">
                      {currentStep?.telemetry.lowLinkUpdates}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step Explanation Log Banner */}
          <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
              <Info className="w-3.5 h-3.5" />
              <span>Step Narrative</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-3">
              {currentStep?.description || "Ready to execute graph algorithm."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
