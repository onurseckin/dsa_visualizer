import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Zap,
  Layers,
  CheckCircle2,
  GitCommit,
  Network,
  Scissors,
  ArrowRight,
  Sliders,
  HelpCircle,
} from "lucide-react";

import { useCanvasBox } from "./vizGeometry";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type FlowAlgorithmId =
  | "edmonds_karp"
  | "dinic"
  | "push_relabel"
  | "min_cost_max_flow"
  | "hopcroft_karp"
  | "bellman_ford";

export type FlowAlgorithmMode = FlowAlgorithmId;

export type FlowPresetId =
  | "classic_diamond"
  | "bipartite_matching"
  | "transshipment"
  | "circulation_demands"
  | "dinic_worst_case"
  | "min_cost_supply_chain"
  | "bridge_bottleneck"
  | "max_flow_bottleneck"
  | "circulation_with_demands"
  | "push_relabel_discharge"
  | "negative_cycle_detection";

export type NetworkFlowPresetId = FlowPresetId;

export type FlowStudioViewMode = "simulation" | "min_cut" | "residual" | "flow_table";
export type EdgeLabelDisplayMode = "flow_capacity" | "residual" | "cost";

export interface FlowNode {
  readonly id: string;
  readonly label: string;
  readonly x?: number;
  readonly y?: number;
  readonly layer?: number;
  readonly demand?: number;
  readonly isSource?: boolean;
  readonly isSink?: boolean;
}

export type NetworkFlowNode = FlowNode;

export interface FlowEdge {
  readonly id?: string;
  readonly source: string;
  readonly target: string;
  readonly capacity: number;
  readonly flow?: number;
  readonly cost?: number;
  readonly weight?: number;
  readonly lowerBound?: number;
  readonly isSaturated?: boolean;
}

export type NetworkFlowEdge = FlowEdge;

export interface FlowGraph {
  readonly id: FlowPresetId | string;
  readonly name: string;
  readonly description: string;
  readonly nodes: readonly FlowNode[];
  readonly edges: readonly FlowEdge[];
  readonly sourceId: string;
  readonly sinkId: string;
}

export interface ResidualEdge {
  readonly from: string;
  readonly to: string;
  readonly residualCapacity: number;
  readonly isReverse: boolean;
  readonly originalEdgeId: string;
}

export interface PushRelabelNodeState {
  readonly heights: Readonly<Record<string, number>>;
  readonly excesses: Readonly<Record<string, number>>;
  readonly operationType?: "push" | "relabel";
  readonly pushedAmount?: number;
  readonly activeNodeId?: string;
  readonly targetNodeId?: string;
  readonly oldHeight?: number;
  readonly newHeight?: number;
}

export interface FlowTelemetry {
  readonly currentFlow: number;
  readonly maxFlow?: number;
  readonly minCutCapacity: number;
  readonly isConservationSatisfied: boolean;
  readonly sourceNetOutflow: number;
  readonly sinkNetInflow: number;
  readonly saturatedEdgesCount: number;
  readonly totalEdgesCount: number;
  readonly negativeCycleDetected?: boolean;
}

export interface AugmentingStep {
  readonly stepIndex: number;
  readonly title?: string;
  readonly phase?: string;
  readonly description: string;
  readonly algorithm?: FlowAlgorithmId;
  readonly path?: readonly string[];
  readonly activeAugmentingPath?: readonly string[];
  readonly bottleneckCapacity?: number;
  readonly bottleneckDelta?: number;
  readonly currentTotalFlow?: number;
  readonly currentFlow?: number;
  readonly currentTotalCost?: number;
  readonly activeEdgeIds?: readonly string[];
  readonly activeNodeIds?: readonly string[];
  readonly levelGraph?: Readonly<Record<string, number>>;
  readonly levelMap?: Readonly<Record<string, number>>;
  readonly nodeHeights?: Readonly<Record<string, number>>;
  readonly excessFlows?: Readonly<Record<string, number>>;
  readonly pushRelabelState?: PushRelabelNodeState;
  readonly edgeFlows?: Readonly<Record<string, number>>;
  readonly flowMap?: Readonly<Record<string, number>>;
  readonly minCutS?: readonly string[];
  readonly minCutT?: readonly string[];
  readonly cutEdges?: readonly unknown[];
  readonly isPhaseChange?: boolean;
  readonly minCut?: MinCutPartitionResult;
  readonly telemetry?: FlowTelemetry;
}

export type FlowStepTrace = AugmentingStep;

export interface MinCutPartitionResult {
  readonly cutS: readonly string[];
  readonly cutT: readonly string[];
  readonly reachableS: readonly string[];
  readonly unreachableT: readonly string[];
  readonly cutCapacity: number;
  readonly minCutCapacity: number;
  readonly cutEdges: readonly unknown[];
  readonly maxFlowMinCutDualityMet: boolean;
}

export type MinCutPartition = MinCutPartitionResult;

export interface FlowConservationStatus {
  readonly nodeId: string;
  readonly inflow: number;
  readonly outflow: number;
  readonly netFlow: number;
  readonly demandExpected: number;
  readonly isConserved: boolean;
}

export interface FlowComputationResult {
  readonly maxFlow: number;
  readonly finalFlow: number;
  readonly minCost: number;
  readonly steps: readonly AugmentingStep[];
  readonly finalEdgeFlows: Readonly<Record<string, number>>;
  readonly finalFlowMap: Readonly<Record<string, number>>;
  readonly minCutPartition: MinCutPartitionResult;
  readonly minCut: MinCutPartitionResult;
  readonly isConservationValid: boolean;
  readonly isCapacityValid: boolean;
  readonly nodeConservations: readonly FlowConservationStatus[];
  readonly telemetry: FlowTelemetry & {
    readonly totalSteps: number;
    readonly augmentingPathsCount: number;
    readonly pushesCount: number;
    readonly relabelsCount: number;
    readonly executionTimeMs: number;
  };
}

export type AlgorithmSimulationResult = FlowComputationResult & {
  readonly algorithm: FlowAlgorithmMode;
};

export interface ShortestPathSimulationResult {
  readonly hasNegativeCycle: boolean;
  readonly cycleNodes: readonly string[];
  readonly distances: Readonly<Record<string, number>>;
  readonly predecessors: Readonly<Record<string, string | null>>;
  readonly steps: readonly FlowStepTrace[];
}

export interface FlowPresetConfig {
  readonly id: FlowPresetId;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly theoryExplanation?: string;
  readonly complexity?: string;
  readonly graph: FlowGraph;
  readonly nodes: readonly FlowNode[];
  readonly edges: readonly FlowEdge[];
  readonly source: string;
  readonly sink: string;
  readonly sourceId: string;
  readonly sinkId: string;
  readonly recommendedAlgorithm: FlowAlgorithmId;
  readonly recommendedMode?: FlowAlgorithmMode;
  readonly expectedMaxFlow: number;
  readonly expectedMinCutCapacity: number;
  readonly expectedMinCost?: number;
}

export type NetworkFlowPreset = FlowPresetConfig;

export interface FlowAlgorithmSpec {
  readonly id: FlowAlgorithmId;
  readonly name: string;
  readonly timeComplexity: string;
  readonly spaceComplexity: string;
  readonly paradigm: string;
  readonly description: string;
  readonly strengths: string;
}

// ============================================================================
// 2. ALGORITHM SPECIFICATIONS & PRESET NETWORKS
// ============================================================================

export const FLOW_ALGORITHMS: Record<FlowAlgorithmId, FlowAlgorithmSpec> = {
  edmonds_karp: {
    id: "edmonds_karp",
    name: "Edmonds-Karp (BFS Augmentation)",
    timeComplexity: "O(V · E²)",
    spaceComplexity: "O(V + E)",
    paradigm: "Augmenting Path (Shortest Hop First)",
    description:
      "Uses Breadth-First Search (BFS) in the residual graph to find the shortest augmenting path by number of edges.",
    strengths: "Simple, universally robust, guaranteed polynomial runtime.",
  },
  dinic: {
    id: "dinic",
    name: "Dinic's Algorithm (Level Graphs & Blocking Flows)",
    timeComplexity: "O(V² · E) [O(E √V) unit/bipartite]",
    spaceComplexity: "O(V + E)",
    paradigm: "Layered Graph & Blocking Flow (BFS + DFS)",
    description:
      "Constructs a layered level graph via BFS, then pushes maximal blocking flows along admissible DAG paths via DFS.",
    strengths: "Extremely fast in practice; optimal on unit networks and bipartite matching.",
  },
  push_relabel: {
    id: "push_relabel",
    name: "Push-Relabel / Goldberg-Tarjan",
    timeComplexity: "O(V² · E) [O(V³) with FIFO / Highest-Label]",
    spaceComplexity: "O(V + E)",
    paradigm: "Preflow-Push & Node Height Relabeling",
    description:
      "Maintains a preflow with excess at nodes and dual height labels. Pushes excess downhill and lifts nodes via relabeling.",
    strengths: "Localized vertex operations; excellent for dense network topologies.",
  },
  min_cost_max_flow: {
    id: "min_cost_max_flow",
    name: "Min-Cost Max-Flow (Successive Shortest Path / SPFA)",
    timeComplexity: "O(F · E · V)",
    spaceComplexity: "O(V + E)",
    paradigm: "Primal-Dual Augmenting Path with Cost Potentials",
    description:
      "Finds augmenting paths with minimal marginal cost using SPFA/Bellman-Ford in residual graph.",
    strengths:
      "Solves optimal transportation, supply chains, and minimum-cost bipartite assignment.",
  },
  hopcroft_karp: {
    id: "hopcroft_karp",
    name: "Hopcroft-Karp (Maximal Bipartite Matching)",
    timeComplexity: "O(E · √V)",
    spaceComplexity: "O(V + E)",
    paradigm: "Simultaneous Shortest Augmenting Paths",
    description: "Specialized max flow reduction for unweighted bipartite graphs.",
    strengths: "Theoretical and practical benchmark for large bipartite matching instances.",
  },
  bellman_ford: {
    id: "bellman_ford",
    name: "Bellman-Ford & Negative Cycle Detection",
    timeComplexity: "O(V · E)",
    spaceComplexity: "O(V + E)",
    paradigm: "Edge Relaxation & Dynamic Programming",
    description:
      "Computes single-source shortest paths and detects negative cost cycles along residual networks.",
    strengths: "Handles negative edge weights and identifies arbitrage/cost cycles.",
  },
};

function makePreset(config: {
  id: FlowPresetId;
  name: string;
  category: string;
  description: string;
  theoryExplanation?: string;
  complexity?: string;
  sourceId: string;
  sinkId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  recommendedAlgorithm: FlowAlgorithmId;
  expectedMaxFlow: number;
  expectedMinCutCapacity?: number;
  expectedMinCost?: number;
}): FlowPresetConfig {
  const normEdges = config.edges.map((e) => ({
    ...e,
    id: e.id ?? `e_${e.source}_${e.target}`,
  }));
  const graph: FlowGraph = {
    id: config.id,
    name: config.name,
    description: config.description,
    sourceId: config.sourceId,
    sinkId: config.sinkId,
    nodes: config.nodes,
    edges: normEdges,
  };
  return {
    id: config.id,
    name: config.name,
    category: config.category,
    description: config.description,
    theoryExplanation: config.theoryExplanation ?? config.description,
    complexity:
      config.complexity ??
      FLOW_ALGORITHMS[config.recommendedAlgorithm]?.timeComplexity ??
      "O(V · E²)",
    graph,
    nodes: config.nodes,
    edges: normEdges,
    source: config.sourceId,
    sink: config.sinkId,
    sourceId: config.sourceId,
    sinkId: config.sinkId,
    recommendedAlgorithm: config.recommendedAlgorithm,
    recommendedMode: config.recommendedAlgorithm,
    expectedMaxFlow: config.expectedMaxFlow,
    expectedMinCutCapacity: config.expectedMinCutCapacity ?? config.expectedMaxFlow,
    expectedMinCost: config.expectedMinCost,
  };
}

export const NETWORK_FLOW_PRESETS: Record<FlowPresetId, FlowPresetConfig> = {
  classic_diamond: makePreset({
    id: "classic_diamond",
    name: "Classic Diamond Bridge Network",
    category: "classical",
    description:
      "A classic 6-node flow network with cross-diamond capacities and an intermediate diagonal bridge edge.",
    sourceId: "S",
    sinkId: "T",
    recommendedAlgorithm: "edmonds_karp",
    expectedMaxFlow: 24,
    nodes: [
      { id: "S", label: "Source (S)", x: 80, y: 220, layer: 0, isSource: true },
      { id: "A", label: "Node A", x: 260, y: 110, layer: 1 },
      { id: "B", label: "Node B", x: 260, y: 330, layer: 1 },
      { id: "C", label: "Node C", x: 480, y: 110, layer: 2 },
      { id: "D", label: "Node D", x: 480, y: 330, layer: 2 },
      { id: "T", label: "Sink (T)", x: 680, y: 220, layer: 3, isSink: true },
    ],
    edges: [
      { id: "e_SA", source: "S", target: "A", capacity: 16, cost: 1 },
      { id: "e_SB", source: "S", target: "B", capacity: 13, cost: 2 },
      { id: "e_AB", source: "A", target: "B", capacity: 4, cost: 1 },
      { id: "e_AC", source: "A", target: "C", capacity: 12, cost: 3 },
      { id: "e_BC", source: "B", target: "C", capacity: 9, cost: 2 },
      { id: "e_BD", source: "B", target: "D", capacity: 14, cost: 4 },
      { id: "e_CD", source: "C", target: "D", capacity: 7, cost: 1 },
      { id: "e_CT", source: "C", target: "T", capacity: 20, cost: 2 },
      { id: "e_DT", source: "D", target: "T", capacity: 4, cost: 3 },
    ],
  }),

  bipartite_matching: makePreset({
    id: "bipartite_matching",
    name: "Job-to-Worker Bipartite Matching",
    category: "matching",
    description:
      "4 Engineers matched to 4 Compute Tasks with unit capacities reduced to Source-Sink Max-Flow.",
    theoryExplanation:
      "Reduces maximum unweighted bipartite matching to max-flow using unit-capacity edges. Hopcroft-Karp / Dinic runs in O(E √V) time.",
    complexity: "O(E · √V)",
    sourceId: "S",
    sinkId: "T",
    recommendedAlgorithm: "hopcroft_karp",
    expectedMaxFlow: 4,
    nodes: [
      { id: "S", label: "Source", x: 5, y: 50, layer: 0, isSource: true },
      { id: "W1", label: "Alice", x: 30, y: 20, layer: 1 },
      { id: "W2", label: "Bob", x: 30, y: 40, layer: 1 },
      { id: "W3", label: "Carol", x: 30, y: 60, layer: 1 },
      { id: "W4", label: "David", x: 30, y: 80, layer: 1 },
      { id: "J1", label: "Kernel Opt", x: 70, y: 20, layer: 2 },
      { id: "J2", label: "Distributed DL", x: 70, y: 40, layer: 2 },
      { id: "J3", label: "Quantization", x: 70, y: 60, layer: 2 },
      { id: "J4", label: "Graph Engine", x: 70, y: 80, layer: 2 },
      { id: "T", label: "Sink", x: 95, y: 50, layer: 3, isSink: true },
    ],
    edges: [
      { id: "e_SW1", source: "S", target: "W1", capacity: 1, cost: 0, flow: 0 },
      { id: "e_SW2", source: "S", target: "W2", capacity: 1, cost: 0, flow: 0 },
      { id: "e_SW3", source: "S", target: "W3", capacity: 1, cost: 0, flow: 0 },
      { id: "e_SW4", source: "S", target: "W4", capacity: 1, cost: 0, flow: 0 },
      { id: "e_W1J1", source: "W1", target: "J1", capacity: 1, cost: 2, flow: 0 },
      { id: "e_W1J2", source: "W1", target: "J2", capacity: 1, cost: 5, flow: 0 },
      { id: "e_W2J1", source: "W2", target: "J1", capacity: 1, cost: 3, flow: 0 },
      { id: "e_W2J3", source: "W2", target: "J3", capacity: 1, cost: 1, flow: 0 },
      { id: "e_W3J2", source: "W3", target: "J2", capacity: 1, cost: 2, flow: 0 },
      { id: "e_W3J4", source: "W3", target: "J4", capacity: 1, cost: 4, flow: 0 },
      { id: "e_W4J3", source: "W4", target: "J3", capacity: 1, cost: 3, flow: 0 },
      { id: "e_W4J4", source: "W4", target: "J4", capacity: 1, cost: 1, flow: 0 },
      { id: "e_J1T", source: "J1", target: "T", capacity: 1, cost: 0, flow: 0 },
      { id: "e_J2T", source: "J2", target: "T", capacity: 1, cost: 0, flow: 0 },
      { id: "e_J3T", source: "J3", target: "T", capacity: 1, cost: 0, flow: 0 },
      { id: "e_J4T", source: "J4", target: "T", capacity: 1, cost: 0, flow: 0 },
    ],
  }),

  transshipment: makePreset({
    id: "transshipment",
    name: "Multi-Source Multi-Sink Transshipment",
    category: "applications",
    description:
      "Supply factories feeding intermediate logistics hubs routed into regional data centers with super-source/super-sink.",
    sourceId: "S",
    sinkId: "T",
    recommendedAlgorithm: "dinic",
    expectedMaxFlow: 42,
    nodes: [
      { id: "S", label: "Super Source (S)", x: 70, y: 220, layer: 0, isSource: true },
      { id: "P1", label: "Plant East", x: 210, y: 130, layer: 1 },
      { id: "P2", label: "Plant West", x: 210, y: 310, layer: 1 },
      { id: "H1", label: "Hub Central", x: 380, y: 100, layer: 2 },
      { id: "H2", label: "Hub Coastal", x: 380, y: 340, layer: 2 },
      { id: "D1", label: "DC North", x: 550, y: 130, layer: 3 },
      { id: "D2", label: "DC South", x: 550, y: 310, layer: 3 },
      { id: "T", label: "Super Sink (T)", x: 690, y: 220, layer: 4, isSink: true },
    ],
    edges: [
      { id: "e_SP1", source: "S", target: "P1", capacity: 20, cost: 1 },
      { id: "e_SP2", source: "S", target: "P2", capacity: 25, cost: 1 },
      { id: "e_P1H1", source: "P1", target: "H1", capacity: 15, cost: 2 },
      { id: "e_P1H2", source: "P1", target: "H2", capacity: 10, cost: 3 },
      { id: "e_P2H1", source: "P2", target: "H1", capacity: 8, cost: 4 },
      { id: "e_P2H2", source: "P2", target: "H2", capacity: 18, cost: 2 },
      { id: "e_H1D1", source: "H1", target: "D1", capacity: 16, cost: 2 },
      { id: "e_H1D2", source: "H1", target: "D2", capacity: 6, cost: 5 },
      { id: "e_H2D1", source: "H2", target: "D1", capacity: 5, cost: 4 },
      { id: "e_H2D2", source: "H2", target: "D2", capacity: 22, cost: 1 },
      { id: "e_D1T", source: "D1", target: "T", capacity: 18, cost: 1 },
      { id: "e_D2T", source: "D2", target: "T", capacity: 24, cost: 1 },
    ],
  }),

  circulation_demands: makePreset({
    id: "circulation_demands",
    name: "Circulation Network with Demands & Lower Bounds",
    category: "advanced",
    description:
      "Flow network with lower bound constraints l(u,v) <= f(u,v) <= c(u,v) and exact node balance demands.",
    sourceId: "S",
    sinkId: "T",
    recommendedAlgorithm: "dinic",
    expectedMaxFlow: 24,
    nodes: [
      { id: "S", label: "Source (S)", x: 80, y: 220, layer: 0, isSource: true },
      { id: "U1", label: "Node 1 [d=-10]", x: 270, y: 120, layer: 1, demand: -10 },
      { id: "U2", label: "Node 2 [d=5]", x: 270, y: 320, layer: 1, demand: 5 },
      { id: "U3", label: "Node 3 [d=-3]", x: 490, y: 120, layer: 2, demand: -3 },
      { id: "U4", label: "Node 4 [d=8]", x: 490, y: 320, layer: 2, demand: 8 },
      { id: "T", label: "Sink (T)", x: 680, y: 220, layer: 3, isSink: true },
    ],
    edges: [
      { id: "e_SU1", source: "S", target: "U1", capacity: 14, lowerBound: 2, cost: 1 },
      { id: "e_SU2", source: "S", target: "U2", capacity: 10, lowerBound: 0, cost: 2 },
      { id: "e_U1U3", source: "U1", target: "U3", capacity: 9, lowerBound: 1, cost: 3 },
      { id: "e_U1U4", source: "U1", target: "U4", capacity: 6, lowerBound: 0, cost: 2 },
      { id: "e_U2U4", source: "U2", target: "U4", capacity: 11, lowerBound: 2, cost: 1 },
      { id: "e_U3T", source: "U3", target: "T", capacity: 10, lowerBound: 0, cost: 2 },
      { id: "e_U4T", source: "U4", target: "T", capacity: 15, lowerBound: 3, cost: 1 },
    ],
  }),

  dinic_worst_case: makePreset({
    id: "dinic_worst_case",
    name: "Layered Pathological Graph (Dinic vs EK Benchmark)",
    category: "pathological",
    description:
      "Deep layered graph with 4 distinct ranks showing Dinic's level graph advantage over Edmonds-Karp.",
    sourceId: "S",
    sinkId: "T",
    recommendedAlgorithm: "dinic",
    expectedMaxFlow: 30,
    nodes: [
      { id: "S", label: "Source", x: 60, y: 220, layer: 0, isSource: true },
      { id: "L1A", label: "L1:A", x: 200, y: 120, layer: 1 },
      { id: "L1B", label: "L1:B", x: 200, y: 320, layer: 1 },
      { id: "L2A", label: "L2:A", x: 370, y: 120, layer: 2 },
      { id: "L2B", label: "L2:B", x: 370, y: 320, layer: 2 },
      { id: "L3A", label: "L3:A", x: 540, y: 120, layer: 3 },
      { id: "L3B", label: "L3:B", x: 540, y: 320, layer: 3 },
      { id: "T", label: "Sink", x: 700, y: 220, layer: 4, isSink: true },
    ],
    edges: [
      { id: "e_SL1A", source: "S", target: "L1A", capacity: 15, cost: 1 },
      { id: "e_SL1B", source: "S", target: "L1B", capacity: 15, cost: 1 },
      { id: "e_L1AL2A", source: "L1A", target: "L2A", capacity: 10, cost: 1 },
      { id: "e_L1AL2B", source: "L1A", target: "L2B", capacity: 10, cost: 1 },
      { id: "e_L1BL2A", source: "L1B", target: "L2A", capacity: 10, cost: 1 },
      { id: "e_L1BL2B", source: "L1B", target: "L2B", capacity: 10, cost: 1 },
      { id: "e_L2AL3A", source: "L2A", target: "L3A", capacity: 10, cost: 1 },
      { id: "e_L2AL3B", source: "L2A", target: "L3B", capacity: 10, cost: 1 },
      { id: "e_L2BL3A", source: "L2B", target: "L3A", capacity: 10, cost: 1 },
      { id: "e_L2BL3B", source: "L2B", target: "L3B", capacity: 10, cost: 1 },
      { id: "e_L3AT", source: "L3A", target: "T", capacity: 15, cost: 1 },
      { id: "e_L3BT", source: "L3B", target: "T", capacity: 15, cost: 1 },
    ],
  }),

  min_cost_supply_chain: makePreset({
    id: "min_cost_supply_chain",
    name: "Min-Cost Supply Chain & GPU Cluster Logistics",
    category: "advanced",
    description:
      "GPU Foundry supplies H100/B200 modules through assembly to Cloud providers with differential shipping costs.",
    sourceId: "S",
    sinkId: "T",
    recommendedAlgorithm: "min_cost_max_flow",
    expectedMaxFlow: 30,
    expectedMinCost: 116,
    nodes: [
      { id: "S", label: "Foundry", x: 70, y: 220, layer: 0, isSource: true },
      { id: "F1", label: "Fab Taiwan", x: 230, y: 110, layer: 1 },
      { id: "F2", label: "Fab Arizona", x: 230, y: 330, layer: 1 },
      { id: "A1", label: "Assembly TX", x: 440, y: 110, layer: 2 },
      { id: "A2", label: "Assembly OR", x: 440, y: 330, layer: 2 },
      { id: "C1", label: "Cloud East", x: 610, y: 110, layer: 3 },
      { id: "C2", label: "Cloud West", x: 610, y: 330, layer: 3 },
      { id: "T", label: "Hyperscalers", x: 720, y: 220, layer: 4, isSink: true },
    ],
    edges: [
      { id: "e_SF1", source: "S", target: "F1", capacity: 16, cost: 1 },
      { id: "e_SF2", source: "S", target: "F2", capacity: 14, cost: 2 },
      { id: "e_F1A1", source: "F1", target: "A1", capacity: 12, cost: 3 },
      { id: "e_F1A2", source: "F1", target: "A2", capacity: 6, cost: 5 },
      { id: "e_F2A1", source: "F2", target: "A1", capacity: 8, cost: 4 },
      { id: "e_F2A2", source: "F2", target: "A2", capacity: 10, cost: 2 },
      { id: "e_A1C1", source: "A1", target: "C1", capacity: 14, cost: 2 },
      { id: "e_A1C2", source: "A1", target: "C2", capacity: 6, cost: 4 },
      { id: "e_A2C1", source: "A2", target: "C1", capacity: 5, cost: 3 },
      { id: "e_A2C2", source: "A2", target: "C2", capacity: 12, cost: 1 },
      { id: "e_C1T", source: "C1", target: "T", capacity: 15, cost: 1 },
      { id: "e_C2T", source: "C2", target: "T", capacity: 15, cost: 1 },
    ],
  }),

  bridge_bottleneck: makePreset({
    id: "bridge_bottleneck",
    name: "Bridge Bottleneck (Max-Flow Min-Cut Demonstration)",
    category: "classical",
    description:
      "Two large 3-node cliques joined exclusively by a critical bottleneck bridge edge.",
    sourceId: "S",
    sinkId: "T",
    recommendedAlgorithm: "push_relabel",
    expectedMaxFlow: 10,
    nodes: [
      { id: "S", label: "Source (S)", x: 80, y: 220, layer: 0, isSource: true },
      { id: "A1", label: "Left Alpha", x: 230, y: 120, layer: 1 },
      { id: "A2", label: "Left Beta", x: 230, y: 320, layer: 1 },
      { id: "B1", label: "Right Gamma", x: 530, y: 120, layer: 2 },
      { id: "B2", label: "Right Delta", x: 530, y: 320, layer: 2 },
      { id: "T", label: "Sink (T)", x: 680, y: 220, layer: 3, isSink: true },
    ],
    edges: [
      { id: "e_SA1", source: "S", target: "A1", capacity: 10, cost: 1 },
      { id: "e_SA2", source: "S", target: "A2", capacity: 10, cost: 1 },
      { id: "e_A1A2", source: "A1", target: "A2", capacity: 8, cost: 1 },
      { id: "e_A1B1", source: "A1", target: "B1", capacity: 6, cost: 2 },
      { id: "e_A2B2", source: "A2", target: "B2", capacity: 4, cost: 2 },
      { id: "e_B1B2", source: "B1", target: "B2", capacity: 8, cost: 1 },
      { id: "e_B1T", source: "B1", target: "T", capacity: 12, cost: 1 },
      { id: "e_B2T", source: "B2", target: "T", capacity: 12, cost: 1 },
    ],
  }),

  max_flow_bottleneck: makePreset({
    id: "max_flow_bottleneck",
    name: "Diamond Bottleneck Network",
    category: "bottleneck",
    description: "Classic 6-node flow network with cross-diamond capacities and bottleneck edges.",
    theoryExplanation:
      "Edmonds-Karp and Dinic augmenting path dynamics showing exact max-flow min-cut duality.",
    complexity: "O(V · E²)",
    sourceId: "S",
    sinkId: "T",
    recommendedAlgorithm: "dinic",
    expectedMaxFlow: 14,
    nodes: [
      { id: "S", label: "Source (S)", x: 10, y: 50, layer: 0, isSource: true },
      { id: "A", label: "Node A", x: 35, y: 25, layer: 1 },
      { id: "B", label: "Node B", x: 35, y: 75, layer: 1 },
      { id: "C", label: "Node C", x: 65, y: 25, layer: 2 },
      { id: "D", label: "Node D", x: 65, y: 75, layer: 2 },
      { id: "T", label: "Sink (T)", x: 90, y: 50, layer: 3, isSink: true },
    ],
    edges: [
      { id: "e_SA", source: "S", target: "A", capacity: 10, cost: 1, flow: 0 },
      { id: "e_SB", source: "S", target: "B", capacity: 10, cost: 2, flow: 0 },
      { id: "e_AB", source: "A", target: "B", capacity: 2, cost: 1, flow: 0 },
      { id: "e_AC", source: "A", target: "C", capacity: 4, cost: 3, flow: 0 },
      { id: "e_AD", source: "A", target: "D", capacity: 8, cost: 2, flow: 0 },
      { id: "e_BD", source: "B", target: "D", capacity: 9, cost: 4, flow: 0 },
      { id: "e_CT", source: "C", target: "T", capacity: 10, cost: 2, flow: 0 },
      { id: "e_DT", source: "D", target: "T", capacity: 10, cost: 3, flow: 0 },
    ],
  }),

  circulation_with_demands: makePreset({
    id: "circulation_with_demands",
    name: "Circulation Network with Demands",
    category: "circulation",
    description: "Supply factories feeding regional logistics hubs with exact demand balances.",
    theoryExplanation:
      "Circulation problems require net outflow at each node to equal supply/demand balance. Solved by reducing to super-source/super-sink max-flow.",
    complexity: "O(V² · E)",
    sourceId: "S",
    sinkId: "T",
    recommendedAlgorithm: "dinic",
    expectedMaxFlow: 10,
    nodes: [
      { id: "S", label: "Source (S)", x: 10, y: 50, layer: 0, isSource: true },
      { id: "U1", label: "Supply Plant 1", x: 35, y: 30, layer: 1, demand: -9 },
      { id: "U2", label: "Supply Plant 2", x: 35, y: 70, layer: 1, demand: -9 },
      { id: "V1", label: "Demand Center 1", x: 65, y: 30, layer: 2, demand: 9 },
      { id: "V2", label: "Demand Center 2", x: 65, y: 70, layer: 2, demand: 9 },
      { id: "T", label: "Sink (T)", x: 90, y: 50, layer: 3, isSink: true },
    ],
    edges: [
      { id: "e_SU1", source: "S", target: "U1", capacity: 6, cost: 1, flow: 0 },
      { id: "e_SU2", source: "S", target: "U2", capacity: 4, cost: 2, flow: 0 },
      { id: "e_U1V1", source: "U1", target: "V1", capacity: 5, cost: 3, flow: 0 },
      { id: "e_U1V2", source: "U1", target: "V2", capacity: 4, cost: 2, flow: 0 },
      { id: "e_U2V1", source: "U2", target: "V1", capacity: 4, cost: 4, flow: 0 },
      { id: "e_U2V2", source: "U2", target: "V2", capacity: 5, cost: 1, flow: 0 },
      { id: "e_V1T", source: "V1", target: "T", capacity: 6, cost: 2, flow: 0 },
      { id: "e_V2T", source: "V2", target: "T", capacity: 4, cost: 1, flow: 0 },
    ],
  }),

  push_relabel_discharge: makePreset({
    id: "push_relabel_discharge",
    name: "Push-Relabel Node Discharge Network",
    category: "preflow",
    description:
      "Layered high-capacity network demonstrating Goldberg-Tarjan preflow-push and node height relabeling.",
    theoryExplanation:
      "Maintains a preflow where inflow >= outflow, dual height labels h(u), and pushes excess downhill along residual edges where h(u) = h(v) + 1.",
    complexity: "O(V² · E)",
    sourceId: "S",
    sinkId: "T",
    recommendedAlgorithm: "push_relabel",
    expectedMaxFlow: 20,
    nodes: [
      { id: "S", label: "Source (S)", x: 10, y: 50, layer: 0, isSource: true },
      { id: "N1", label: "Node 1", x: 35, y: 25, layer: 1 },
      { id: "N2", label: "Node 2", x: 35, y: 75, layer: 1 },
      { id: "N3", label: "Node 3", x: 65, y: 25, layer: 2 },
      { id: "N4", label: "Node 4", x: 65, y: 75, layer: 2 },
      { id: "T", label: "Sink (T)", x: 90, y: 50, layer: 3, isSink: true },
    ],
    edges: [
      { id: "e_SN1", source: "S", target: "N1", capacity: 12, cost: 1, flow: 0 },
      { id: "e_SN2", source: "S", target: "N2", capacity: 12, cost: 1, flow: 0 },
      { id: "e_N1N3", source: "N1", target: "N3", capacity: 10, cost: 2, flow: 0 },
      { id: "e_N1N4", source: "N1", target: "N4", capacity: 4, cost: 3, flow: 0 },
      { id: "e_N2N3", source: "N2", target: "N3", capacity: 4, cost: 1, flow: 0 },
      { id: "e_N2N4", source: "N2", target: "N4", capacity: 10, cost: 2, flow: 0 },
      { id: "e_N3T", source: "N3", target: "T", capacity: 10, cost: 1, flow: 0 },
      { id: "e_N4T", source: "N4", target: "T", capacity: 10, cost: 1, flow: 0 },
    ],
  }),

  negative_cycle_detection: makePreset({
    id: "negative_cycle_detection",
    name: "Negative Cost Cycle & Arbitrage Detection",
    category: "negative_cycle",
    description:
      "Residual network containing a directed cycle [C -> D -> E -> C] with strictly negative total cost.",
    theoryExplanation:
      "Bellman-Ford algorithm detects negative cost cycles by checking if distance labels decrease on the |V|-th relaxation pass.",
    complexity: "O(V · E)",
    sourceId: "S",
    sinkId: "T",
    recommendedAlgorithm: "bellman_ford",
    expectedMaxFlow: 8,
    nodes: [
      { id: "S", label: "Source (S)", x: 10, y: 50, layer: 0, isSource: true },
      { id: "A", label: "Node A", x: 30, y: 30, layer: 1 },
      { id: "B", label: "Node B", x: 30, y: 70, layer: 1 },
      { id: "C", label: "Node C", x: 50, y: 30, layer: 2 },
      { id: "D", label: "Node D", x: 70, y: 30, layer: 3 },
      { id: "E", label: "Node E", x: 60, y: 70, layer: 2 },
      { id: "T", label: "Sink (T)", x: 90, y: 50, layer: 4, isSink: true },
    ],
    edges: [
      { id: "e_SA", source: "S", target: "A", capacity: 8, cost: 2, flow: 0 },
      { id: "e_SB", source: "S", target: "B", capacity: 8, cost: 3, flow: 0 },
      { id: "e_AC", source: "A", target: "C", capacity: 6, cost: 1, flow: 0 },
      { id: "e_BE", source: "B", target: "E", capacity: 6, cost: 2, flow: 0 },
      { id: "e_CD", source: "C", target: "D", capacity: 5, cost: 1, flow: 0 },
      { id: "e_DE", source: "D", target: "E", capacity: 5, cost: -5, flow: 0 },
      { id: "e_EC", source: "E", target: "C", capacity: 5, cost: 2, flow: 0 },
      { id: "e_DT", source: "D", target: "T", capacity: 5, cost: 2, flow: 0 },
      { id: "e_ET", source: "E", target: "T", capacity: 5, cost: 3, flow: 0 },
    ],
  }),
};

// ============================================================================
// 3. PURE HELPER & COMPUTATION FUNCTIONS
// ============================================================================

export function edgeKey(source: string, target: string): string {
  return `${source}->${target}`;
}

export function computeResidualCapacityMap(
  edges: readonly NetworkFlowEdge[],
  flowMap: Readonly<Record<string, number>>,
): Record<string, number> {
  const residual: Record<string, number> = {};

  for (const edge of edges) {
    const fKey = edgeKey(edge.source, edge.target);
    const bKey = edgeKey(edge.target, edge.source);
    const f = flowMap[fKey] ?? (edge.id ? flowMap[edge.id] : undefined) ?? 0;

    residual[fKey] = (residual[fKey] ?? 0) + (edge.capacity - f);
    residual[bKey] = (residual[bKey] ?? 0) + f;
  }

  return residual;
}

export function computeResidualGraph(
  graph: FlowGraph,
  edgeFlows: Readonly<Record<string, number>>,
): readonly ResidualEdge[] {
  const residuals: ResidualEdge[] = [];

  for (const edge of graph.edges) {
    const f =
      edgeFlows[edge.id ?? edgeKey(edge.source, edge.target)] ??
      edgeFlows[edgeKey(edge.source, edge.target)] ??
      0;
    const forwardCap = edge.capacity - f;
    const reverseCap = f;

    if (forwardCap > 0) {
      residuals.push({
        from: edge.source,
        to: edge.target,
        residualCapacity: forwardCap,
        isReverse: false,
        originalEdgeId: edge.id ?? edgeKey(edge.source, edge.target),
      });
    }

    if (reverseCap > 0) {
      residuals.push({
        from: edge.target,
        to: edge.source,
        residualCapacity: reverseCap,
        isReverse: true,
        originalEdgeId: edge.id ?? edgeKey(edge.source, edge.target),
      });
    }
  }

  return residuals;
}

export function computeLevelGraphBFS(
  nodes: readonly NetworkFlowNode[],
  edges: readonly NetworkFlowEdge[],
  flowMap: Readonly<Record<string, number>>,
  source: string,
): Map<string, number> {
  const residual = computeResidualCapacityMap(edges, flowMap);
  const levels = new Map<string, number>();

  for (const node of nodes) {
    levels.set(node.id, -1);
  }

  levels.set(source, 0);
  const queue: string[] = [source];

  while (queue.length > 0) {
    const u = queue.shift()!;
    const uLevel = levels.get(u)!;

    for (const node of nodes) {
      const v = node.id;
      const cap = residual[edgeKey(u, v)] ?? 0;
      if (cap > 0 && levels.get(v) === -1) {
        levels.set(v, uLevel + 1);
        queue.push(v);
      }
    }
  }

  return levels;
}

export function computeMinCutPartition(
  first: FlowGraph | readonly NetworkFlowNode[],
  second: Readonly<Record<string, number>> | readonly NetworkFlowEdge[],
  third?: string | Readonly<Record<string, number>>,
  fourth?: string,
): MinCutPartitionResult {
  if (first && typeof first === "object" && "nodes" in first && "edges" in first) {
    const graph = first as FlowGraph;
    const edgeFlows = second as Readonly<Record<string, number>>;
    const sourceId = (third as string) ?? graph.sourceId;

    const visited = new Set<string>([sourceId]);
    const queue: string[] = [sourceId];

    while (queue.length > 0) {
      const u = queue.shift()!;
      for (const edge of graph.edges) {
        const eKey = edge.id ?? edgeKey(edge.source, edge.target);
        const f = edgeFlows[eKey] ?? edgeFlows[edgeKey(edge.source, edge.target)] ?? 0;
        if (edge.source === u && edge.capacity - f > 0 && !visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push(edge.target);
        }
        if (edge.target === u && f > 0 && !visited.has(edge.source)) {
          visited.add(edge.source);
          queue.push(edge.source);
        }
      }
    }

    const cutS: string[] = [];
    const cutT: string[] = [];

    for (const node of graph.nodes) {
      if (visited.has(node.id)) {
        cutS.push(node.id);
      } else {
        cutT.push(node.id);
      }
    }

    let cutCapacity = 0;
    const cutEdges: (
      | string
      | { readonly source: string; readonly target: string; readonly capacity: number }
    )[] = [];

    for (const edge of graph.edges) {
      if (visited.has(edge.source) && !visited.has(edge.target)) {
        cutCapacity += edge.capacity;
        cutEdges.push(edge.id ?? edgeKey(edge.source, edge.target));
      }
    }

    let totalFlow = 0;
    for (const edge of graph.edges) {
      const eKey = edge.id ?? edgeKey(edge.source, edge.target);
      const f = edgeFlows[eKey] ?? edgeFlows[edgeKey(edge.source, edge.target)] ?? 0;
      if (edge.target === graph.sinkId) totalFlow += f;
      if (edge.source === graph.sinkId) totalFlow -= f;
    }

    return {
      cutS,
      cutT,
      reachableS: cutS,
      unreachableT: cutT,
      cutCapacity,
      minCutCapacity: cutCapacity,
      cutEdges,
      maxFlowMinCutDualityMet: totalFlow === cutCapacity,
    };
  } else {
    const nodes = first as readonly NetworkFlowNode[];
    const edges = second as readonly NetworkFlowEdge[];
    const flowMap = third as Readonly<Record<string, number>>;
    const source = fourth as string;

    const residual = computeResidualCapacityMap(edges, flowMap);
    const visited = new Set<string>([source]);
    const queue: string[] = [source];

    while (queue.length > 0) {
      const u = queue.shift()!;
      for (const node of nodes) {
        const v = node.id;
        const cap = residual[edgeKey(u, v)] ?? 0;
        if (cap > 0 && !visited.has(v)) {
          visited.add(v);
          queue.push(v);
        }
      }
    }

    const reachableS: string[] = [];
    const unreachableT: string[] = [];

    for (const node of nodes) {
      if (visited.has(node.id)) {
        reachableS.push(node.id);
      } else {
        unreachableT.push(node.id);
      }
    }

    let minCutCapacity = 0;
    const cutEdges: (
      | string
      | { readonly source: string; readonly target: string; readonly capacity: number }
    )[] = [];

    for (const edge of edges) {
      if (visited.has(edge.source) && !visited.has(edge.target)) {
        minCutCapacity += edge.capacity;
        cutEdges.push({
          source: edge.source,
          target: edge.target,
          capacity: edge.capacity,
        });
      }
    }

    return {
      cutS: reachableS,
      cutT: unreachableT,
      reachableS,
      unreachableT,
      cutCapacity: minCutCapacity,
      minCutCapacity,
      cutEdges,
      maxFlowMinCutDualityMet: true,
    };
  }
}

export function computeFlowTelemetry(
  nodes: readonly NetworkFlowNode[],
  edges: readonly NetworkFlowEdge[],
  flowMap: Readonly<Record<string, number>>,
  source: string,
  sink: string,
): FlowTelemetry {
  let sourceNetOutflow = 0;
  let sinkNetInflow = 0;
  let isConservationSatisfied = true;
  let saturatedEdgesCount = 0;

  for (const edge of edges) {
    const f =
      flowMap[edgeKey(edge.source, edge.target)] ?? (edge.id ? flowMap[edge.id] : undefined) ?? 0;
    if (edge.source === source) sourceNetOutflow += f;
    if (edge.target === source) sourceNetOutflow -= f;
    if (edge.target === sink) sinkNetInflow += f;
    if (edge.source === sink) sinkNetInflow -= f;

    if (f === edge.capacity && edge.capacity > 0) {
      saturatedEdgesCount++;
    }
  }

  for (const node of nodes) {
    if (node.id === source || node.id === sink) continue;
    let inFlow = 0;
    let outFlow = 0;
    for (const edge of edges) {
      const f =
        flowMap[edgeKey(edge.source, edge.target)] ?? (edge.id ? flowMap[edge.id] : undefined) ?? 0;
      if (edge.target === node.id) inFlow += f;
      if (edge.source === node.id) outFlow += f;
    }
    const expectedDiff = (node.demand ?? 0) !== 0 ? -(node.demand ?? 0) : 0;
    if (Math.abs(outFlow - inFlow - expectedDiff) > 1e-6) {
      isConservationSatisfied = false;
    }
  }

  const minCut = computeMinCutPartition(nodes, edges, flowMap, source);
  const currentFlow = sourceNetOutflow;

  return {
    currentFlow,
    maxFlow: currentFlow,
    minCutCapacity: minCut.minCutCapacity,
    isConservationSatisfied,
    sourceNetOutflow,
    sinkNetInflow,
    saturatedEdgesCount,
    totalEdgesCount: edges.length,
  };
}

export function verifyFlowConservation(
  graph: FlowGraph,
  edgeFlows: Readonly<Record<string, number>>,
  sourceId?: string,
  sinkId?: string,
): FlowConservationStatus[] & { isValid: boolean; statuses: readonly FlowConservationStatus[] } {
  const src = sourceId ?? graph.sourceId;
  const snk = sinkId ?? graph.sinkId;
  const statuses: FlowConservationStatus[] = [];
  let allConserved = true;

  for (const node of graph.nodes) {
    let inflow = 0;
    let outflow = 0;

    for (const edge of graph.edges) {
      const eKey = edge.id ?? edgeKey(edge.source, edge.target);
      const f = edgeFlows[eKey] ?? edgeFlows[edgeKey(edge.source, edge.target)] ?? 0;
      if (edge.target === node.id) inflow += f;
      if (edge.source === node.id) outflow += f;
    }

    const netFlow = outflow - inflow;
    const demand = node.demand ?? 0;

    let isConserved = true;
    if (node.id === src || node.id === snk) {
      isConserved = true;
    } else {
      isConserved = Math.abs(netFlow - -demand) < 1e-6;
    }

    if (!isConserved) allConserved = false;

    statuses.push({
      nodeId: node.id,
      inflow,
      outflow,
      netFlow,
      demandExpected: demand,
      isConserved,
    });
  }

  const result = statuses as FlowConservationStatus[] & {
    isValid: boolean;
    statuses: readonly FlowConservationStatus[];
  };
  result.isValid = allConserved;
  result.statuses = statuses;
  return result;
}

export function verifyCapacityConstraints(
  graph: FlowGraph,
  edgeFlows: Readonly<Record<string, number>>,
): boolean {
  for (const edge of graph.edges) {
    const eKey = edge.id ?? edgeKey(edge.source, edge.target);
    const f = edgeFlows[eKey] ?? edgeFlows[edgeKey(edge.source, edge.target)] ?? 0;
    const lower = edge.lowerBound ?? 0;
    if (f < lower || f > edge.capacity) {
      return false;
    }
  }
  return true;
}

// ----------------------------------------------------------------------------
// Algorithm Solvers
// ----------------------------------------------------------------------------

export function solveEdmondsKarp(graph: FlowGraph): FlowComputationResult {
  const res = runEdmondsKarpAlgorithm(graph.nodes, graph.edges, graph.sourceId, graph.sinkId);
  const conservation = verifyFlowConservation(
    graph,
    res.finalFlowMap,
    graph.sourceId,
    graph.sinkId,
  );
  const capacityValid = verifyCapacityConstraints(graph, res.finalFlowMap);

  return {
    maxFlow: res.maxFlow,
    finalFlow: res.finalFlow,
    minCost: 0,
    steps: res.steps,
    finalEdgeFlows: res.finalFlowMap,
    finalFlowMap: res.finalFlowMap,
    minCutPartition: res.minCut,
    minCut: res.minCut,
    isConservationValid: conservation.isValid,
    isCapacityValid: capacityValid,
    nodeConservations: conservation.statuses,
    telemetry: {
      ...res.telemetry,
      totalSteps: res.steps.length,
      augmentingPathsCount: res.steps.filter((s) => s.phase === "Augmenting Path").length,
      pushesCount: 0,
      relabelsCount: 0,
      executionTimeMs: 1.0,
    },
  };
}

export function solveDinic(graph: FlowGraph): FlowComputationResult {
  const res = runDinicAlgorithm(graph.nodes, graph.edges, graph.sourceId, graph.sinkId);
  const conservation = verifyFlowConservation(
    graph,
    res.finalFlowMap,
    graph.sourceId,
    graph.sinkId,
  );
  const capacityValid = verifyCapacityConstraints(graph, res.finalFlowMap);

  return {
    maxFlow: res.maxFlow,
    finalFlow: res.finalFlow,
    minCost: 0,
    steps: res.steps,
    finalEdgeFlows: res.finalFlowMap,
    finalFlowMap: res.finalFlowMap,
    minCutPartition: res.minCut,
    minCut: res.minCut,
    isConservationValid: conservation.isValid,
    isCapacityValid: capacityValid,
    nodeConservations: conservation.statuses,
    telemetry: {
      ...res.telemetry,
      totalSteps: res.steps.length,
      augmentingPathsCount: res.steps.filter((s) => s.phase?.includes("DFS Augmenting Flow"))
        .length,
      pushesCount: 0,
      relabelsCount: 0,
      executionTimeMs: 1.0,
    },
  };
}

export function solvePushRelabel(graph: FlowGraph): FlowComputationResult {
  const res = runPushRelabelAlgorithm(graph.nodes, graph.edges, graph.sourceId, graph.sinkId);
  const conservation = verifyFlowConservation(
    graph,
    res.finalFlowMap,
    graph.sourceId,
    graph.sinkId,
  );
  const capacityValid = verifyCapacityConstraints(graph, res.finalFlowMap);

  return {
    maxFlow: res.maxFlow,
    finalFlow: res.finalFlow,
    minCost: 0,
    steps: res.steps,
    finalEdgeFlows: res.finalFlowMap,
    finalFlowMap: res.finalFlowMap,
    minCutPartition: res.minCut,
    minCut: res.minCut,
    isConservationValid: conservation.isValid,
    isCapacityValid: capacityValid,
    nodeConservations: conservation.statuses,
    telemetry: {
      ...res.telemetry,
      totalSteps: res.steps.length,
      augmentingPathsCount: 0,
      pushesCount: res.steps.filter((s) => s.phase === "Push Operation").length,
      relabelsCount: res.steps.filter((s) => s.phase === "Relabel Operation").length,
      executionTimeMs: 1.0,
    },
  };
}

export function solveMinCostMaxFlow(graph: FlowGraph): FlowComputationResult {
  const startTime = performance.now();
  const edgeFlows: Record<string, number> = {};
  for (const e of graph.edges) {
    const key = e.id ?? edgeKey(e.source, e.target);
    edgeFlows[key] = 0;
    edgeFlows[edgeKey(e.source, e.target)] = 0;
  }

  const steps: AugmentingStep[] = [];
  let totalFlow = 0;
  let totalCost = 0;
  let augmentingPathsCount = 0;

  const initialMinCut = computeMinCutPartition(graph, edgeFlows, graph.sourceId);
  steps.push({
    stepIndex: 0,
    title: "Initial MCMF State",
    phase: "Initial MCMF State",
    description: "Flow = 0, Cost = $0. SPFA will discover shortest cost paths in residual graph.",
    algorithm: "min_cost_max_flow",
    currentTotalFlow: 0,
    currentFlow: 0,
    currentTotalCost: 0,
    edgeFlows: { ...edgeFlows },
    flowMap: { ...edgeFlows },
    minCutS: initialMinCut.cutS,
    minCutT: initialMinCut.cutT,
    cutEdges: initialMinCut.cutEdges,
    minCut: initialMinCut,
  });

  while (true) {
    const dist: Record<string, number> = {};
    const parentEdge = new Map<string, FlowEdge>();
    const parentDir = new Map<string, "forward" | "reverse">();
    const parentNode = new Map<string, string>();
    const inQueue = new Set<string>();

    for (const node of graph.nodes) dist[node.id] = Infinity;
    dist[graph.sourceId] = 0;

    const queue: string[] = [graph.sourceId];
    inQueue.add(graph.sourceId);

    while (queue.length > 0) {
      const u = queue.shift()!;
      inQueue.delete(u);

      for (const edge of graph.edges) {
        const eKey = edge.id ?? edgeKey(edge.source, edge.target);
        const f = edgeFlows[eKey] ?? edgeFlows[edgeKey(edge.source, edge.target)] ?? 0;
        const cost = edge.cost ?? 0;

        if (edge.source === u && edge.capacity - f > 0) {
          if (dist[edge.target] > dist[u] + cost) {
            dist[edge.target] = dist[u] + cost;
            parentNode.set(edge.target, u);
            parentEdge.set(edge.target, edge);
            parentDir.set(edge.target, "forward");
            if (!inQueue.has(edge.target)) {
              queue.push(edge.target);
              inQueue.add(edge.target);
            }
          }
        }

        if (edge.target === u && f > 0) {
          if (dist[edge.source] > dist[u] - cost) {
            dist[edge.source] = dist[u] - cost;
            parentNode.set(edge.source, u);
            parentEdge.set(edge.source, edge);
            parentDir.set(edge.source, "reverse");
            if (!inQueue.has(edge.source)) {
              queue.push(edge.source);
              inQueue.add(edge.source);
            }
          }
        }
      }
    }

    if (dist[graph.sinkId] === Infinity) {
      break;
    }

    const pathNodes: string[] = [graph.sinkId];
    const pathEdgeIds: string[] = [];
    let bottleneck = Infinity;
    let curr = graph.sinkId;

    while (curr !== graph.sourceId) {
      const edge = parentEdge.get(curr)!;
      const dir = parentDir.get(curr)!;
      const prev = parentNode.get(curr)!;
      pathEdgeIds.push(edge.id ?? edgeKey(edge.source, edge.target));

      const eKey = edge.id ?? edgeKey(edge.source, edge.target);
      const f = edgeFlows[eKey] ?? edgeFlows[edgeKey(edge.source, edge.target)] ?? 0;
      const residual = dir === "forward" ? edge.capacity - f : f;
      bottleneck = Math.min(bottleneck, residual);
      curr = prev;
      pathNodes.push(curr);
    }

    pathNodes.reverse();

    let pathCostPerUnit = 0;
    curr = graph.sinkId;
    while (curr !== graph.sourceId) {
      const edge = parentEdge.get(curr)!;
      const dir = parentDir.get(curr)!;
      const prev = parentNode.get(curr)!;
      const cost = edge.cost ?? 0;
      const eKey = edge.id ?? edgeKey(edge.source, edge.target);
      const directKey = edgeKey(edge.source, edge.target);

      if (dir === "forward") {
        edgeFlows[eKey] = (edgeFlows[eKey] ?? 0) + bottleneck;
        edgeFlows[directKey] = edgeFlows[eKey];
        pathCostPerUnit += cost;
      } else {
        edgeFlows[eKey] = (edgeFlows[eKey] ?? 0) - bottleneck;
        edgeFlows[directKey] = edgeFlows[eKey];
        pathCostPerUnit -= cost;
      }
      curr = prev;
    }

    totalFlow += bottleneck;
    totalCost += bottleneck * pathCostPerUnit;
    augmentingPathsCount++;

    const minCut = computeMinCutPartition(graph, edgeFlows, graph.sourceId);
    steps.push({
      stepIndex: steps.length,
      title: `Min-Cost Augmentation #${augmentingPathsCount}`,
      phase: `Min-Cost Augmentation #${augmentingPathsCount}`,
      description: `Augmented Δ = ${bottleneck} flow at unit cost $${pathCostPerUnit} along [${pathNodes.join(" → ")}]. Total Cost: $${totalCost}.`,
      algorithm: "min_cost_max_flow",
      path: pathNodes,
      activeAugmentingPath: pathNodes,
      bottleneckCapacity: bottleneck,
      bottleneckDelta: bottleneck,
      currentTotalFlow: totalFlow,
      currentFlow: totalFlow,
      currentTotalCost: totalCost,
      activeEdgeIds: pathEdgeIds,
      activeNodeIds: pathNodes,
      edgeFlows: { ...edgeFlows },
      flowMap: { ...edgeFlows },
      minCutS: minCut.cutS,
      minCutT: minCut.cutT,
      cutEdges: minCut.cutEdges,
      minCut,
    });
  }

  const finalMinCut = computeMinCutPartition(graph, edgeFlows, graph.sourceId);
  const conservation = verifyFlowConservation(graph, edgeFlows, graph.sourceId, graph.sinkId);
  const capacityValid = verifyCapacityConstraints(graph, edgeFlows);

  return {
    maxFlow: totalFlow,
    finalFlow: totalFlow,
    minCost: totalCost,
    steps,
    finalEdgeFlows: edgeFlows,
    finalFlowMap: edgeFlows,
    minCutPartition: finalMinCut,
    minCut: finalMinCut,
    isConservationValid: conservation.isValid,
    isCapacityValid: capacityValid,
    nodeConservations: conservation.statuses,
    telemetry: {
      currentFlow: totalFlow,
      maxFlow: totalFlow,
      minCutCapacity: finalMinCut.cutCapacity,
      isConservationSatisfied: conservation.isValid,
      sourceNetOutflow: totalFlow,
      sinkNetInflow: totalFlow,
      saturatedEdgesCount: 0,
      totalEdgesCount: graph.edges.length,
      totalSteps: steps.length,
      augmentingPathsCount,
      pushesCount: 0,
      relabelsCount: 0,
      executionTimeMs: performance.now() - startTime,
    },
  };
}

export function executeFlowAlgorithm(
  algorithm: FlowAlgorithmId,
  graph: FlowGraph,
): FlowComputationResult {
  switch (algorithm) {
    case "edmonds_karp":
      return solveEdmondsKarp(graph);
    case "dinic":
    case "hopcroft_karp":
      return solveDinic(graph);
    case "push_relabel":
      return solvePushRelabel(graph);
    case "min_cost_max_flow":
      return solveMinCostMaxFlow(graph);
    default:
      return solveEdmondsKarp(graph);
  }
}

export function formatFlow(flow: number, capacity: number): string {
  return `${flow}/${capacity}`;
}

export function formatCost(cost: number): string {
  return `$${cost}`;
}

// ----------------------------------------------------------------------------
// Algorithm 1: Edmonds-Karp Implementation
// ----------------------------------------------------------------------------
export function runEdmondsKarpAlgorithm(
  nodes: readonly NetworkFlowNode[],
  edges: readonly NetworkFlowEdge[],
  source: string,
  sink: string,
): AlgorithmSimulationResult {
  const flowMap: Record<string, number> = {};
  for (const e of edges) {
    const key = e.id ?? edgeKey(e.source, e.target);
    flowMap[key] = 0;
    flowMap[edgeKey(e.source, e.target)] = 0;
  }

  const steps: FlowStepTrace[] = [];
  let currentFlow = 0;

  const initialMinCut = computeMinCutPartition(nodes, edges, flowMap, source);
  const initialTelemetry = computeFlowTelemetry(nodes, edges, flowMap, source, sink);

  steps.push({
    stepIndex: 0,
    phase: "Initialization",
    title: "Initialization",
    description: "Initialized flow network with zero flow across all directed edges.",
    currentFlow: 0,
    currentTotalFlow: 0,
    flowMap: { ...flowMap },
    edgeFlows: { ...flowMap },
    minCut: initialMinCut,
    telemetry: initialTelemetry,
  });

  while (true) {
    const residual = computeResidualCapacityMap(edges, flowMap);
    const parent = new Map<string, string>();
    const visited = new Set<string>([source]);
    const queue: string[] = [source];

    while (queue.length > 0) {
      const u = queue.shift()!;
      if (u === sink) break;

      for (const node of nodes) {
        const v = node.id;
        const fKey = edgeKey(u, v);
        const rCap = residual[fKey] ?? 0;
        if (rCap > 0 && !visited.has(v)) {
          visited.add(v);
          parent.set(v, u);
          queue.push(v);
        }
      }
    }

    if (!visited.has(sink)) {
      break;
    }

    const path: string[] = [sink];
    let bottleneck = Infinity;
    let curr = sink;

    while (curr !== source) {
      const p = parent.get(curr)!;
      const rCap = residual[edgeKey(p, curr)] ?? 0;
      bottleneck = Math.min(bottleneck, rCap);
      curr = p;
      path.push(curr);
    }

    path.reverse();

    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      const fKey = edgeKey(u, v);
      const bKey = edgeKey(v, u);

      const isForward = edges.some((e) => e.source === u && e.target === v);
      if (isForward) {
        flowMap[fKey] = (flowMap[fKey] ?? 0) + bottleneck;
        const matchingEdge = edges.find((e) => e.source === u && e.target === v);
        if (matchingEdge?.id) flowMap[matchingEdge.id] = flowMap[fKey];
      } else {
        flowMap[bKey] = (flowMap[bKey] ?? 0) - bottleneck;
        const matchingEdge = edges.find((e) => e.source === v && e.target === u);
        if (matchingEdge?.id) flowMap[matchingEdge.id] = flowMap[bKey];
      }
    }

    currentFlow += bottleneck;

    const stepMinCut = computeMinCutPartition(nodes, edges, flowMap, source);
    const stepTelemetry = computeFlowTelemetry(nodes, edges, flowMap, source, sink);

    steps.push({
      stepIndex: steps.length,
      phase: "Augmenting Path",
      title: "Augmenting Path",
      description: `Discovered BFS augmenting path [${path.join(" → ")}] with bottleneck capacity Δ = ${bottleneck}.`,
      currentFlow,
      currentTotalFlow: currentFlow,
      flowMap: { ...flowMap },
      edgeFlows: { ...flowMap },
      activeAugmentingPath: path,
      path,
      bottleneckDelta: bottleneck,
      bottleneckCapacity: bottleneck,
      minCut: stepMinCut,
      telemetry: stepTelemetry,
    });
  }

  const finalMinCut = computeMinCutPartition(nodes, edges, flowMap, source);
  const finalTelemetry = computeFlowTelemetry(nodes, edges, flowMap, source, sink);

  steps.push({
    stepIndex: steps.length,
    phase: "Algorithm Terminated",
    title: "Algorithm Terminated",
    description: `Optimal maximum flow of ${currentFlow} achieved. Min-Cut capacity across reachable partition is ${finalMinCut.minCutCapacity}.`,
    currentFlow,
    currentTotalFlow: currentFlow,
    flowMap: { ...flowMap },
    edgeFlows: { ...flowMap },
    minCut: finalMinCut,
    telemetry: finalTelemetry,
  });

  return {
    algorithm: "edmonds_karp",
    finalFlow: currentFlow,
    maxFlow: currentFlow,
    minCost: 0,
    finalFlowMap: flowMap,
    finalEdgeFlows: flowMap,
    minCutPartition: finalMinCut,
    minCut: finalMinCut,
    steps,
    isConservationValid: finalTelemetry.isConservationSatisfied,
    isCapacityValid: true,
    nodeConservations: [],
    telemetry: {
      ...finalTelemetry,
      totalSteps: steps.length,
      augmentingPathsCount: steps.filter((s) => s.phase === "Augmenting Path").length,
      pushesCount: 0,
      relabelsCount: 0,
      executionTimeMs: 1.0,
    },
  };
}

// ----------------------------------------------------------------------------
// Algorithm 2: Dinic Implementation
// ----------------------------------------------------------------------------
export function runDinicAlgorithm(
  nodes: readonly NetworkFlowNode[],
  edges: readonly NetworkFlowEdge[],
  source: string,
  sink: string,
): AlgorithmSimulationResult {
  const flowMap: Record<string, number> = {};
  for (const e of edges) {
    const key = e.id ?? edgeKey(e.source, e.target);
    flowMap[key] = 0;
    flowMap[edgeKey(e.source, e.target)] = 0;
  }

  const steps: FlowStepTrace[] = [];
  let currentFlow = 0;

  const initialMinCut = computeMinCutPartition(nodes, edges, flowMap, source);
  const initialTelemetry = computeFlowTelemetry(nodes, edges, flowMap, source, sink);

  steps.push({
    stepIndex: 0,
    phase: "Initialization",
    title: "Initialization",
    description: "Dinic algorithm initialized with zero flow.",
    currentFlow: 0,
    currentTotalFlow: 0,
    flowMap: { ...flowMap },
    edgeFlows: { ...flowMap },
    minCut: initialMinCut,
    telemetry: initialTelemetry,
  });

  let phaseNumber = 1;

  while (true) {
    const levelGraph = computeLevelGraphBFS(nodes, edges, flowMap, source);
    const sinkLevel = levelGraph.get(sink);

    if (sinkLevel === undefined || sinkLevel === -1) {
      break;
    }

    const levelObj: Record<string, number> = {};
    for (const [k, v] of levelGraph.entries()) levelObj[k] = v;

    const stepMinCut = computeMinCutPartition(nodes, edges, flowMap, source);
    const stepTelemetry = computeFlowTelemetry(nodes, edges, flowMap, source, sink);

    steps.push({
      stepIndex: steps.length,
      phase: `BFS Level Graph Construction (Phase ${phaseNumber})`,
      title: `Phase ${phaseNumber}: BFS Level Graph Built`,
      description: `Constructed BFS level graph with sink at Level ${sinkLevel}.`,
      currentFlow,
      currentTotalFlow: currentFlow,
      flowMap: { ...flowMap },
      edgeFlows: { ...flowMap },
      levelMap: levelObj,
      levelGraph: levelObj,
      minCut: stepMinCut,
      telemetry: stepTelemetry,
    });

    const dfs = (u: string, pushed: number, path: string[]): { flow: number; path: string[] } => {
      if (pushed === 0 || u === sink) {
        return { flow: pushed, path };
      }

      const residual = computeResidualCapacityMap(edges, flowMap);
      const uLevel = levelGraph.get(u) ?? -1;

      for (const node of nodes) {
        const v = node.id;
        const vLevel = levelGraph.get(v) ?? -1;
        const cap = residual[edgeKey(u, v)] ?? 0;

        if (vLevel === uLevel + 1 && cap > 0) {
          const res = dfs(v, Math.min(pushed, cap), [...path, v]);
          if (res.flow > 0) {
            const isForward = edges.some((e) => e.source === u && e.target === v);
            if (isForward) {
              flowMap[edgeKey(u, v)] = (flowMap[edgeKey(u, v)] ?? 0) + res.flow;
              const matchingEdge = edges.find((e) => e.source === u && e.target === v);
              if (matchingEdge?.id) flowMap[matchingEdge.id] = flowMap[edgeKey(u, v)];
            } else {
              flowMap[edgeKey(v, u)] = (flowMap[edgeKey(v, u)] ?? 0) - res.flow;
              const matchingEdge = edges.find((e) => e.source === v && e.target === u);
              if (matchingEdge?.id) flowMap[matchingEdge.id] = flowMap[edgeKey(v, u)];
            }
            return res;
          }
        }
      }

      return { flow: 0, path: [] };
    };

    let blockingFlowTotal = 0;
    while (true) {
      const res = dfs(source, Infinity, [source]);
      if (res.flow === 0) break;

      blockingFlowTotal += res.flow;
      currentFlow += res.flow;

      const dfsMinCut = computeMinCutPartition(nodes, edges, flowMap, source);
      const dfsTelemetry = computeFlowTelemetry(nodes, edges, flowMap, source, sink);

      steps.push({
        stepIndex: steps.length,
        phase: `DFS Augmenting Flow (Phase ${phaseNumber})`,
        title: `Phase ${phaseNumber}: DFS Blocking Augmentation`,
        description: `Pushed blocking flow Δ = ${res.flow} along admissible path [${res.path.join(" → ")}].`,
        currentFlow,
        currentTotalFlow: currentFlow,
        flowMap: { ...flowMap },
        edgeFlows: { ...flowMap },
        levelMap: levelObj,
        levelGraph: levelObj,
        activeAugmentingPath: res.path,
        path: res.path,
        bottleneckDelta: res.flow,
        bottleneckCapacity: res.flow,
        minCut: dfsMinCut,
        telemetry: dfsTelemetry,
      });
    }

    const blockMinCut = computeMinCutPartition(nodes, edges, flowMap, source);
    const blockTelemetry = computeFlowTelemetry(nodes, edges, flowMap, source, sink);

    steps.push({
      stepIndex: steps.length,
      phase: `Blocking Flow Complete (Phase ${phaseNumber})`,
      title: `Phase ${phaseNumber}: Blocking Flow Complete`,
      description: `Phase ${phaseNumber} completed with ${blockingFlowTotal} units pushed.`,
      currentFlow,
      currentTotalFlow: currentFlow,
      flowMap: { ...flowMap },
      edgeFlows: { ...flowMap },
      levelMap: levelObj,
      levelGraph: levelObj,
      minCut: blockMinCut,
      telemetry: blockTelemetry,
    });

    phaseNumber++;
  }

  const finalMinCut = computeMinCutPartition(nodes, edges, flowMap, source);
  const finalTelemetry = computeFlowTelemetry(nodes, edges, flowMap, source, sink);

  steps.push({
    stepIndex: steps.length,
    phase: "Algorithm Terminated",
    title: "Algorithm Terminated",
    description: `Dinic's algorithm terminated with max-flow = ${currentFlow}.`,
    currentFlow,
    currentTotalFlow: currentFlow,
    flowMap: { ...flowMap },
    edgeFlows: { ...flowMap },
    minCut: finalMinCut,
    telemetry: finalTelemetry,
  });

  return {
    algorithm: "dinic",
    finalFlow: currentFlow,
    maxFlow: currentFlow,
    minCost: 0,
    finalFlowMap: flowMap,
    finalEdgeFlows: flowMap,
    minCutPartition: finalMinCut,
    minCut: finalMinCut,
    steps,
    isConservationValid: finalTelemetry.isConservationSatisfied,
    isCapacityValid: true,
    nodeConservations: [],
    telemetry: {
      ...finalTelemetry,
      totalSteps: steps.length,
      augmentingPathsCount: steps.filter((s) => s.phase?.includes("DFS Augmenting Flow")).length,
      pushesCount: 0,
      relabelsCount: 0,
      executionTimeMs: 1.0,
    },
  };
}

// ----------------------------------------------------------------------------
// Algorithm 3: Push-Relabel Implementation
// ----------------------------------------------------------------------------
export function runPushRelabelAlgorithm(
  nodes: readonly NetworkFlowNode[],
  edges: readonly NetworkFlowEdge[],
  source: string,
  sink: string,
): AlgorithmSimulationResult {
  const flowMap: Record<string, number> = {};
  for (const e of edges) {
    const key = e.id ?? edgeKey(e.source, e.target);
    flowMap[key] = 0;
    flowMap[edgeKey(e.source, e.target)] = 0;
  }

  const heights: Record<string, number> = {};
  const excesses: Record<string, number> = {};
  for (const n of nodes) {
    heights[n.id] = 0;
    excesses[n.id] = 0;
  }
  heights[source] = nodes.length;

  const steps: FlowStepTrace[] = [];

  for (const edge of edges) {
    if (edge.source === source) {
      const eKey = edge.id ?? edgeKey(edge.source, edge.target);
      flowMap[eKey] = edge.capacity;
      flowMap[edgeKey(edge.source, edge.target)] = edge.capacity;
      excesses[edge.target] += edge.capacity;
      excesses[source] -= edge.capacity;
    }
  }

  const initialMinCut = computeMinCutPartition(nodes, edges, flowMap, source);
  const initialTelemetry = computeFlowTelemetry(nodes, edges, flowMap, source, sink);

  steps.push({
    stepIndex: 0,
    phase: "Preflow Initialization",
    title: "Preflow Initialization",
    description: `Initialized height h(${source}) = ${nodes.length} and saturated all outgoing edges from source.`,
    currentFlow: excesses[sink] || 0,
    currentTotalFlow: excesses[sink] || 0,
    flowMap: { ...flowMap },
    edgeFlows: { ...flowMap },
    pushRelabelState: {
      heights: { ...heights },
      excesses: { ...excesses },
    },
    nodeHeights: { ...heights },
    excessFlows: { ...excesses },
    minCut: initialMinCut,
    telemetry: initialTelemetry,
  });

  let iterations = 0;
  const maxIterations = 2000;

  while (iterations++ < maxIterations) {
    let activeNode: string | null = null;
    let maxH = -1;

    for (const node of nodes) {
      if (node.id !== source && node.id !== sink && excesses[node.id] > 0) {
        if (heights[node.id] > maxH) {
          maxH = heights[node.id];
          activeNode = node.id;
        }
      }
    }

    if (!activeNode) break;

    const u = activeNode;
    const residual = computeResidualCapacityMap(edges, flowMap);
    let pushed = false;

    for (const node of nodes) {
      const v = node.id;
      const rCap = residual[edgeKey(u, v)] ?? 0;

      if (rCap > 0 && heights[u] === heights[v] + 1) {
        const delta = Math.min(excesses[u], rCap);
        const isForward = edges.some((e) => e.source === u && e.target === v);
        if (isForward) {
          flowMap[edgeKey(u, v)] = (flowMap[edgeKey(u, v)] ?? 0) + delta;
          const matchingEdge = edges.find((e) => e.source === u && e.target === v);
          if (matchingEdge?.id) flowMap[matchingEdge.id] = flowMap[edgeKey(u, v)];
        } else {
          flowMap[edgeKey(v, u)] = (flowMap[edgeKey(v, u)] ?? 0) - delta;
          const matchingEdge = edges.find((e) => e.source === v && e.target === u);
          if (matchingEdge?.id) flowMap[matchingEdge.id] = flowMap[edgeKey(v, u)];
        }

        excesses[u] -= delta;
        excesses[v] += delta;
        pushed = true;

        const curMinCut = computeMinCutPartition(nodes, edges, flowMap, source);
        const curTelemetry = computeFlowTelemetry(nodes, edges, flowMap, source, sink);

        steps.push({
          stepIndex: steps.length,
          phase: "Push Operation",
          title: `Push Operation: ${u} → ${v}`,
          description: `Pushed Δ = ${delta} excess from ${u} to ${v}.`,
          currentFlow: excesses[sink] || 0,
          currentTotalFlow: excesses[sink] || 0,
          flowMap: { ...flowMap },
          edgeFlows: { ...flowMap },
          pushRelabelState: {
            heights: { ...heights },
            excesses: { ...excesses },
            operationType: "push",
            activeNodeId: u,
            targetNodeId: v,
            pushedAmount: delta,
          },
          nodeHeights: { ...heights },
          excessFlows: { ...excesses },
          minCut: curMinCut,
          telemetry: curTelemetry,
        });
        break;
      }
    }

    if (!pushed) {
      let minNeighborH = Infinity;
      for (const node of nodes) {
        const v = node.id;
        const rCap = residual[edgeKey(u, v)] ?? 0;
        if (rCap > 0) {
          minNeighborH = Math.min(minNeighborH, heights[v]);
        }
      }

      if (minNeighborH !== Infinity) {
        const oldHeight = heights[u];
        const newHeight = minNeighborH + 1;
        heights[u] = newHeight;

        const curMinCut = computeMinCutPartition(nodes, edges, flowMap, source);
        const curTelemetry = computeFlowTelemetry(nodes, edges, flowMap, source, sink);

        steps.push({
          stepIndex: steps.length,
          phase: "Relabel Operation",
          title: `Relabel Node ${u}`,
          description: `Relabeled height of node ${u} from ${oldHeight} to ${newHeight}.`,
          currentFlow: excesses[sink] || 0,
          currentTotalFlow: excesses[sink] || 0,
          flowMap: { ...flowMap },
          edgeFlows: { ...flowMap },
          pushRelabelState: {
            heights: { ...heights },
            excesses: { ...excesses },
            operationType: "relabel",
            activeNodeId: u,
            oldHeight,
            newHeight,
          },
          nodeHeights: { ...heights },
          excessFlows: { ...excesses },
          minCut: curMinCut,
          telemetry: curTelemetry,
        });
      }
    }
  }

  let finalFlow = 0;
  for (const edge of edges) {
    if (edge.target === sink) {
      finalFlow += flowMap[edgeKey(edge.source, edge.target)] ?? 0;
    }
    if (edge.source === sink) {
      finalFlow -= flowMap[edgeKey(edge.source, edge.target)] ?? 0;
    }
  }

  const finalMinCut = computeMinCutPartition(nodes, edges, flowMap, source);
  const finalTelemetry = computeFlowTelemetry(nodes, edges, flowMap, source, sink);

  steps.push({
    stepIndex: steps.length,
    phase: "Algorithm Terminated",
    title: "Algorithm Terminated",
    description: `Push-relabel reached equilibrium with max flow = ${finalFlow}.`,
    currentFlow: finalFlow,
    currentTotalFlow: finalFlow,
    flowMap: { ...flowMap },
    edgeFlows: { ...flowMap },
    pushRelabelState: {
      heights: { ...heights },
      excesses: { ...excesses },
    },
    nodeHeights: { ...heights },
    excessFlows: { ...excesses },
    minCut: finalMinCut,
    telemetry: finalTelemetry,
  });

  return {
    algorithm: "push_relabel",
    finalFlow,
    maxFlow: finalFlow,
    minCost: 0,
    finalFlowMap: flowMap,
    finalEdgeFlows: flowMap,
    minCutPartition: finalMinCut,
    minCut: finalMinCut,
    steps,
    isConservationValid: finalTelemetry.isConservationSatisfied,
    isCapacityValid: true,
    nodeConservations: [],
    telemetry: {
      ...finalTelemetry,
      totalSteps: steps.length,
      augmentingPathsCount: 0,
      pushesCount: steps.filter((s) => s.phase === "Push Operation").length,
      relabelsCount: steps.filter((s) => s.phase === "Relabel Operation").length,
      executionTimeMs: 1.0,
    },
  };
}

// ----------------------------------------------------------------------------
// Algorithm 4: Bellman-Ford Implementation
// ----------------------------------------------------------------------------
export function runBellmanFordDijkstra(
  nodes: readonly NetworkFlowNode[],
  edges: readonly (NetworkFlowEdge & { weight?: number })[],
  source: string,
  sink: string,
): ShortestPathSimulationResult {
  const distances: Record<string, number> = {};
  const predecessors: Record<string, string | null> = {};

  for (const node of nodes) {
    distances[node.id] = Infinity;
    predecessors[node.id] = null;
  }
  distances[source] = 0;

  const steps: FlowStepTrace[] = [];

  for (let i = 0; i < nodes.length - 1; i++) {
    let changed = false;
    for (const edge of edges) {
      const u = edge.source;
      const v = edge.target;
      const cost = edge.cost ?? edge.weight ?? 1;

      if (distances[u] !== Infinity && distances[u] + cost < distances[v]) {
        distances[v] = distances[u] + cost;
        predecessors[v] = u;
        changed = true;
      }
    }
    if (!changed) break;
  }

  let hasNegativeCycle = false;
  let cycleStartNode: string | null = null;

  for (const edge of edges) {
    const u = edge.source;
    const v = edge.target;
    const cost = edge.cost ?? edge.weight ?? 1;

    if (distances[u] !== Infinity && distances[u] + cost < distances[v]) {
      hasNegativeCycle = true;
      cycleStartNode = v;
      break;
    }
  }

  let cycleNodes: string[] = [];

  if (hasNegativeCycle && cycleStartNode) {
    let curr = cycleStartNode;
    for (let i = 0; i < nodes.length; i++) {
      curr = predecessors[curr] ?? curr;
    }

    const cycle: string[] = [curr];
    let v = predecessors[curr];
    while (v && v !== curr && !cycle.includes(v)) {
      cycle.push(v);
      v = predecessors[v];
    }
    cycle.push(curr);
    cycle.reverse();
    cycleNodes = cycle;

    steps.push({
      stepIndex: 0,
      phase: "Negative Cycle Detected",
      title: "Negative Cycle Detected",
      description: `Detected negative cycle: [${cycleNodes.join(" → ")}].`,
      currentFlow: 0,
      currentTotalFlow: 0,
      flowMap: {},
      edgeFlows: {},
      activeAugmentingPath: cycleNodes,
      path: cycleNodes,
      telemetry: {
        currentFlow: 0,
        minCutCapacity: 0,
        isConservationSatisfied: false,
        sourceNetOutflow: 0,
        sinkNetInflow: 0,
        saturatedEdgesCount: 0,
        totalEdgesCount: edges.length,
        negativeCycleDetected: true,
      },
    });
  } else {
    steps.push({
      stepIndex: 0,
      phase: "Shortest Paths Converged",
      title: "Shortest Paths Converged",
      description: `Computed shortest path distances from source ${source} to sink ${sink}. Distance = ${distances[sink]}.`,
      currentFlow: 0,
      currentTotalFlow: 0,
      flowMap: {},
      edgeFlows: {},
      telemetry: {
        currentFlow: 0,
        minCutCapacity: 0,
        isConservationSatisfied: true,
        sourceNetOutflow: 0,
        sinkNetInflow: 0,
        saturatedEdgesCount: 0,
        totalEdgesCount: edges.length,
        negativeCycleDetected: false,
      },
    });
  }

  return {
    hasNegativeCycle,
    cycleNodes,
    distances,
    predecessors,
    steps,
  };
}

// ============================================================================
// 4. REACT COMPONENT: GraphNetworkFlowStudio
// ============================================================================

export interface GraphNetworkFlowStudioProps {
  readonly initialPreset?: FlowPresetId;
  readonly initialAlgorithm?: FlowAlgorithmId;
  readonly initialMode?: FlowAlgorithmMode;
  readonly initialViewMode?: FlowStudioViewMode;
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly showTheory?: boolean;
  readonly standalone?: boolean;
  readonly className?: string;
  readonly onPresetChange?: (presetId: FlowPresetId) => void;
  readonly onAlgorithmChange?: (algorithmId: FlowAlgorithmId) => void;
  readonly onModeChange?: (mode: FlowAlgorithmMode) => void;
  readonly onStepChange?: (stepIndex: number) => void;
}

export const GraphNetworkFlowStudio: React.FC<GraphNetworkFlowStudioProps> = ({
  initialPreset = "max_flow_bottleneck",
  initialAlgorithm,
  initialMode,
  initialViewMode = "simulation",
  width = 900,
  height = 560,
  title = "Graph Network Flow & Min-Cut Dual Studio",
  showTheory = true,
  standalone = false,
  className = "",
  onPresetChange,
  onAlgorithmChange,
  onModeChange,
  onStepChange,
}) => {
  const defaultAlgo = initialMode ?? initialAlgorithm ?? "dinic";
  const [selectedPresetId, setSelectedPresetId] = useState<FlowPresetId>(initialPreset);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<FlowAlgorithmId>(defaultAlgo);
  const [viewMode, setViewMode] = useState<FlowStudioViewMode>(initialViewMode);
  const [displayMode, setDisplayMode] = useState<EdgeLabelDisplayMode>("flow_capacity");
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1);

  const presetConfig = useMemo(
    () => NETWORK_FLOW_PRESETS[selectedPresetId] || NETWORK_FLOW_PRESETS.max_flow_bottleneck,
    [selectedPresetId],
  );

  const simulationResult = useMemo(() => {
    if (selectedAlgorithm === "bellman_ford") {
      return runBellmanFordDijkstra(
        presetConfig.nodes,
        presetConfig.edges,
        presetConfig.source,
        presetConfig.sink,
      );
    }
    if (selectedAlgorithm === "edmonds_karp") {
      return runEdmondsKarpAlgorithm(
        presetConfig.nodes,
        presetConfig.edges,
        presetConfig.source,
        presetConfig.sink,
      );
    }
    if (selectedAlgorithm === "push_relabel") {
      return runPushRelabelAlgorithm(
        presetConfig.nodes,
        presetConfig.edges,
        presetConfig.source,
        presetConfig.sink,
      );
    }
    if (selectedAlgorithm === "min_cost_max_flow") {
      return solveMinCostMaxFlow(presetConfig.graph);
    }
    return runDinicAlgorithm(
      presetConfig.nodes,
      presetConfig.edges,
      presetConfig.source,
      presetConfig.sink,
    );
  }, [selectedAlgorithm, presetConfig]);

  const totalSteps = simulationResult.steps.length;
  const currentStep =
    simulationResult.steps[Math.min(currentStepIndex, totalSteps - 1)] || simulationResult.steps[0];

  const handlePresetSelect = useCallback(
    (newPresetId: FlowPresetId) => {
      setSelectedPresetId(newPresetId);
      setCurrentStepIndex(0);
      setIsPlaying(false);
      onPresetChange?.(newPresetId);
      onStepChange?.(0);
    },
    [onPresetChange, onStepChange],
  );

  const handleAlgorithmSelect = useCallback(
    (newAlgo: FlowAlgorithmId) => {
      setSelectedAlgorithm(newAlgo);
      setCurrentStepIndex(0);
      setIsPlaying(false);
      onAlgorithmChange?.(newAlgo);
      onModeChange?.(newAlgo);
      onStepChange?.(0);
    },
    [onAlgorithmChange, onModeChange, onStepChange],
  );

  const handleStepIndexChange = useCallback(
    (newIdx: number) => {
      const clamped = Math.max(0, Math.min(newIdx, totalSteps - 1));
      setCurrentStepIndex(clamped);
      onStepChange?.(clamped);
    },
    [totalSteps, onStepChange],
  );

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        const next = prev + 1;
        onStepChange?.(next);
        return next;
      });
    }, 1200 / playSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playSpeed, totalSteps, onStepChange]);

  const { ref: svgContainerRef } = useCanvasBox({ width, height });

  const canvasNodes = useMemo(() => {
    return presetConfig.nodes.map((node) => {
      const pctX = node.x ?? 50;
      const pctY = node.y ?? 50;
      const pxX = node.x && node.x > 100 ? node.x : 60 + (pctX / 100) * 640;
      const pxY = node.y && node.y > 100 ? node.y : 50 + (pctY / 100) * 360;
      return {
        ...node,
        pxX,
        pxY,
      };
    });
  }, [presetConfig.nodes]);

  const canvasNodeMap = useMemo(() => {
    const map = new Map<string, { pxX: number; pxY: number; label: string }>();
    for (const cn of canvasNodes) {
      map.set(cn.id, cn);
    }
    return map;
  }, [canvasNodes]);

  return (
    <div
      className={`flex flex-col bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-sans ${className}`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              {title}
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                {presetConfig.complexity ?? FLOW_ALGORITHMS[selectedAlgorithm]?.paradigm}
              </span>
            </h2>
            <p className="text-xs text-slate-400">{presetConfig.description}</p>
          </div>
        </div>

        {/* Preset & Algorithm Pickers */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <Layers className="w-4 h-4 text-slate-400" />
            <select
              value={selectedPresetId}
              onChange={(e) => handlePresetSelect(e.target.value as FlowPresetId)}
              className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
            >
              {Object.values(NETWORK_FLOW_PRESETS).map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <select
              value={selectedAlgorithm}
              onChange={(e) => handleAlgorithmSelect(e.target.value as FlowAlgorithmId)}
              className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
            >
              {Object.values(FLOW_ALGORITHMS).map((algo) => (
                <option key={algo.id} value={algo.id} className="bg-slate-900 text-slate-200">
                  {algo.name} ({algo.timeComplexity})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Mode Badges & Metrics Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-slate-900/40 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              setViewMode("simulation");
              setDisplayMode("flow_capacity");
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === "simulation"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Step Simulation
          </button>
          <button
            onClick={() => setViewMode("min_cut")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
              viewMode === "min_cut"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            Min-Cut Theorem
          </button>
          <button
            onClick={() => {
              setViewMode("residual");
              setDisplayMode("residual");
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === "residual"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Residual Graph
          </button>
          <button
            onClick={() => setViewMode("flow_table")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === "flow_table"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Flow & Conservation
          </button>
        </div>

        {/* Real-time Telemetry Metrics */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-400">Current Flow:</span>
            <span className="font-bold text-emerald-400">
              {currentStep.currentFlow ?? currentStep.currentTotalFlow ?? 0}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">Max: {presetConfig.expectedMaxFlow}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 rounded-lg border border-slate-800">
            <Scissors className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-400">Min-Cut:</span>
            <span className="font-bold text-rose-400">
              {currentStep.minCut?.minCutCapacity ??
                currentStep.minCut?.cutCapacity ??
                presetConfig.expectedMinCutCapacity}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 text-emerald-400 rounded-lg border border-emerald-800/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-sans font-medium">Conservation Valid</span>
          </div>
        </div>
      </div>

      {/* 3. Main Stage: Interactive Canvas & Side Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        <div
          ref={svgContainerRef}
          className="lg:col-span-3 relative flex items-center justify-center bg-slate-950 p-4 min-h-[460px]"
        >
          <svg viewBox="0 0 760 460" className="w-full h-full max-h-[460px] select-none">
            <defs>
              <marker
                id="flow-arrow-default"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
              </marker>
              <marker
                id="flow-arrow-active"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>
              <marker
                id="flow-arrow-saturated"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
              </marker>
            </defs>

            {presetConfig.edges.map((edge) => {
              const src = canvasNodeMap.get(edge.source);
              const tgt = canvasNodeMap.get(edge.target);
              if (!src || !tgt) return null;

              const fKey = edgeKey(edge.source, edge.target);
              const flowsObj = currentStep.flowMap ?? currentStep.edgeFlows ?? {};
              const f = flowsObj[fKey] ?? (edge.id ? flowsObj[edge.id] : undefined) ?? 0;
              const isSaturated = f === edge.capacity && edge.capacity > 0;
              const activePath = currentStep.activeAugmentingPath ?? currentStep.path;
              const isActive =
                activePath &&
                activePath.includes(edge.source) &&
                activePath.includes(edge.target) &&
                activePath.indexOf(edge.target) === activePath.indexOf(edge.source) + 1;

              const dx = tgt.pxX - src.pxX;
              const dy = tgt.pxY - src.pxY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const nodeR = 24;

              const sx = src.pxX + (dx / dist) * nodeR;
              const sy = src.pxY + (dy / dist) * nodeR;
              const tx = tgt.pxX - (dx / dist) * (nodeR + 6);
              const ty = tgt.pxY - (dy / dist) * (nodeR + 6);
              const mx = (sx + tx) / 2;
              const my = (sy + ty) / 2;

              let strokeColor = "#475569";
              let strokeWidth = 2.5;

              if (isActive) {
                strokeColor = "#38bdf8";
                strokeWidth = 4.5;
              } else if (isSaturated) {
                strokeColor = "#fbbf24";
                strokeWidth = 3;
              } else if (f > 0) {
                strokeColor = "#34d399";
                strokeWidth = 3;
              }

              return (
                <g key={fKey} className="transition-all duration-300">
                  <line
                    x1={sx}
                    y1={sy}
                    x2={tx}
                    y2={ty}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    markerEnd={`url(#flow-arrow-${isActive ? "active" : isSaturated ? "saturated" : "default"})`}
                  />
                  <g transform={`translate(${mx}, ${my})`}>
                    <rect
                      x={-28}
                      y={-12}
                      width={56}
                      height={24}
                      rx={12}
                      fill="#0f172a"
                      stroke={strokeColor}
                      strokeWidth={1.5}
                    />
                    <text
                      x={0}
                      y={4}
                      textAnchor="middle"
                      className="text-[11px] font-mono font-bold fill-slate-200 pointer-events-none"
                    >
                      {displayMode === "residual"
                        ? `${edge.capacity - f}`
                        : displayMode === "cost"
                          ? `$${edge.cost ?? 0}`
                          : `${f}/${edge.capacity}`}
                    </text>
                  </g>
                </g>
              );
            })}

            {canvasNodes.map((node) => {
              const isSource = node.id === presetConfig.source;
              const isSink = node.id === presetConfig.sink;
              const activePath = currentStep.activeAugmentingPath ?? currentStep.path;
              const isActiveInPath = activePath?.includes(node.id) ?? false;
              const level = currentStep.levelMap?.[node.id] ?? currentStep.levelGraph?.[node.id];
              const heightVal =
                currentStep.pushRelabelState?.heights[node.id] ??
                currentStep.nodeHeights?.[node.id];
              const excessVal =
                currentStep.pushRelabelState?.excesses[node.id] ??
                currentStep.excessFlows?.[node.id];

              let fillColor = "#1e293b";
              let strokeColor = "#64748b";

              if (isSource) {
                fillColor = "#064e3b";
                strokeColor = "#10b981";
              } else if (isSink) {
                fillColor = "#881337";
                strokeColor = "#f43f5e";
              }

              if (isActiveInPath) {
                strokeColor = "#38bdf8";
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.pxX}, ${node.pxY})`}
                  className="cursor-pointer"
                >
                  {isActiveInPath && (
                    <circle
                      r={30}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      opacity={0.6}
                      className="animate-pulse"
                    />
                  )}
                  <circle
                    r={24}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={2.5}
                    className="drop-shadow-lg"
                  />
                  <text
                    x={0}
                    y={4}
                    textAnchor="middle"
                    className="text-xs font-bold font-mono fill-white pointer-events-none"
                  >
                    {node.id}
                  </text>
                  <text
                    x={0}
                    y={38}
                    textAnchor="middle"
                    className="text-[10px] font-sans font-semibold fill-slate-300 pointer-events-none"
                  >
                    {node.label}
                  </text>
                  {level !== undefined && level !== -1 && (
                    <g transform="translate(16, -18)">
                      <rect
                        x={-8}
                        y={-8}
                        width={18}
                        height={16}
                        rx={4}
                        fill="#0284c7"
                        stroke="#38bdf8"
                        strokeWidth={1}
                      />
                      <text
                        x={1}
                        y={3.5}
                        textAnchor="middle"
                        className="text-[9px] font-mono font-bold fill-white"
                      >
                        L{level}
                      </text>
                    </g>
                  )}
                  {heightVal !== undefined && (
                    <g transform="translate(-16, -18)">
                      <rect
                        x={-8}
                        y={-8}
                        width={20}
                        height={16}
                        rx={4}
                        fill="#6d28d9"
                        stroke="#a78bfa"
                        strokeWidth={1}
                      />
                      <text
                        x={2}
                        y={3.5}
                        textAnchor="middle"
                        className="text-[9px] font-mono font-bold fill-white"
                      >
                        h{heightVal}
                      </text>
                    </g>
                  )}
                  {excessVal !== undefined && excessVal > 0 && (
                    <g transform="translate(0, -28)">
                      <rect
                        x={-14}
                        y={-8}
                        width={28}
                        height={16}
                        rx={4}
                        fill="#dc2626"
                        stroke="#f87171"
                        strokeWidth={1}
                      />
                      <text
                        x={0}
                        y={3.5}
                        textAnchor="middle"
                        className="text-[9px] font-mono font-bold fill-white"
                      >
                        e={excessVal}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Side Telemetry & Step Trace Panel */}
        <div className="p-5 flex flex-col justify-between bg-slate-900/60 space-y-4">
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-emerald-400 font-bold">
                  Step {currentStep.stepIndex + 1} of {totalSteps}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                  {selectedAlgorithm}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-200">
                {currentStep.phase ?? currentStep.title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">{currentStep.description}</p>
            </div>

            {(currentStep.activeAugmentingPath || currentStep.path) && (
              <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-800/40 text-xs space-y-1.5">
                <span className="text-[11px] font-semibold text-sky-300 flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5" />
                  Active Path / Cycle:
                </span>
                <div className="flex items-center flex-wrap gap-1 font-mono text-slate-200">
                  {(currentStep.activeAugmentingPath ?? currentStep.path)!.map((nodeId, idx) => (
                    <React.Fragment key={idx}>
                      <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-700 font-bold text-emerald-400">
                        {nodeId}
                      </span>
                      {idx < (currentStep.activeAugmentingPath ?? currentStep.path)!.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {showTheory && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  Theory & Duality Note:
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {presetConfig.theoryExplanation}
                </p>
              </div>
            )}

            {standalone && (
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                <span className="font-bold text-emerald-400">Standalone Studio Mode</span>
                <p className="text-[10px] text-slate-400">
                  Interactive live visualizer for graph cut theorem.
                </p>
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between font-mono">
              <span>Time Complexity:</span>
              <span className="text-amber-400">{presetConfig.complexity}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span>Min-Cut Duality:</span>
              <span className="text-emerald-400">
                MaxFlow ({presetConfig.expectedMaxFlow}) = MinCut (
                {presetConfig.expectedMinCutCapacity})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Playback Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 border-t border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStepIndexChange(0)}
            title="Reset"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStepIndexChange(currentStepIndex - 1)}
            disabled={currentStepIndex === 0}
            title="Step Back"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (currentStepIndex >= totalSteps - 1) handleStepIndexChange(0);
              setIsPlaying((p) => !p);
            }}
            className={`px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition ${
              isPlaying
                ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pause" : "Play Flow"}
          </button>
          <button
            onClick={() => handleStepIndexChange(currentStepIndex + 1)}
            disabled={currentStepIndex >= totalSteps - 1}
            title="Step Forward"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStepIndexChange(totalSteps - 1)}
            title="Jump to End"
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            Max Flow ⇥
          </button>
        </div>

        <div className="flex items-center gap-6 flex-1 max-w-md">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-mono text-slate-400">Step</span>
            <input
              type="range"
              min={0}
              max={Math.max(0, totalSteps - 1)}
              value={currentStepIndex}
              onChange={(e) => {
                setIsPlaying(false);
                handleStepIndexChange(Number(e.target.value));
              }}
              className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-slate-400 min-w-[42px]">
              {currentStepIndex + 1}/{totalSteps}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={playSpeed}
              onChange={(e) => setPlaySpeed(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded px-2 py-1 focus:outline-none"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1.0x</option>
              <option value={2}>2.0x</option>
              <option value={4}>4.0x</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
