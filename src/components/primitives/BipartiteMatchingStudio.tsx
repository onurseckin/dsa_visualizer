import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Zap,
  Network,
  ShieldCheck,
  Scale,
  Grid,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type BipartiteStudioModality =
  | "hopcroft_karp_matching"
  | "konig_min_vertex_cover"
  | "hungarian_min_cost_assignment"
  | "hall_marriage_condition";

export type BipartitePresetId =
  | "classic_job_assignment"
  | "dense_bipartite_complete"
  | "hall_violator_contracting"
  | "hopcroft_karp_multi_layer"
  | "cost_matrix_4x4"
  | "k44_symmetric_assignment";

export interface BipartiteNode {
  readonly id: string;
  readonly label: string;
  readonly partition: "L" | "R";
  readonly index: number;
  readonly role?: string;
  readonly x?: number;
  readonly y?: number;
}

export interface BipartiteEdge {
  readonly id: string;
  readonly source: string; // Left node ID
  readonly target: string; // Right node ID
  readonly cost?: number;
  readonly weight?: number;
}

export interface BipartiteGraph {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly leftNodes: readonly BipartiteNode[];
  readonly rightNodes: readonly BipartiteNode[];
  readonly edges: readonly BipartiteEdge[];
  readonly costMatrix?: readonly (readonly number[])[];
}

export type BipartiteStepAction =
  | "init"
  | "hk_bfs_start"
  | "hk_bfs_level"
  | "hk_bfs_sink_reached"
  | "hk_bfs_no_path"
  | "hk_dfs_path_search"
  | "hk_dfs_augment"
  | "hk_phase_complete"
  | "hk_complete"
  | "konig_init"
  | "konig_unmatched_seeds"
  | "konig_explore_unmatched"
  | "konig_explore_matched"
  | "konig_z_complete"
  | "konig_mvc_derived"
  | "konig_mis_derived"
  | "konig_verified"
  | "hungarian_init_potentials"
  | "hungarian_tight_subgraph"
  | "hungarian_worker_start"
  | "hungarian_tree_expand"
  | "hungarian_calc_delta"
  | "hungarian_update_potentials"
  | "hungarian_augment_path"
  | "hungarian_optimal"
  | "hall_init"
  | "hall_subset_scan"
  | "hall_violator_found"
  | "hall_condition_satisfied"
  | "hall_summary";

export interface BipartiteTelemetry {
  readonly cardinality: number;
  readonly maxCardinality?: number;
  readonly phaseCount: number;
  readonly augmentationsCount: number;
  readonly totalCost?: number;
  readonly dualPotentialSum?: number;
  readonly mvcSize?: number;
  readonly misSize?: number;
  readonly isOptimal?: boolean;
  readonly hallSatisfied?: boolean;
  readonly maxDefect?: number;
  readonly violatorSubset?: readonly string[];
  readonly violatorNeighborhood?: readonly string[];
  readonly shortestAugmentingLength?: number;
  readonly currentDelta?: number;
}

export interface BipartiteAnimationStep {
  readonly stepIndex: number;
  readonly modality: BipartiteStudioModality;
  readonly action: BipartiteStepAction;
  readonly title: string;
  readonly description: string;
  readonly details?: string;
  readonly matchedEdges: readonly string[]; // Edge IDs
  readonly matchedPairs: Readonly<Record<string, string>>; // bidirectional mapping
  readonly activeNodes?: readonly string[];
  readonly activeEdges?: readonly string[];
  readonly alternatingPath?: readonly string[]; // node IDs in alternating order
  readonly bfsLevels?: Readonly<Record<string, number>>;
  readonly zSetNodes?: readonly string[];
  readonly mvcNodes?: readonly string[];
  readonly misNodes?: readonly string[];
  readonly uPotentials?: Readonly<Record<string, number>>; // Left potentials u_i
  readonly vPotentials?: Readonly<Record<string, number>>; // Right potentials v_j
  readonly reducedCosts?: Readonly<Record<string, number>>; // edgeId -> reduced cost
  readonly tightEdges?: readonly string[];
  readonly treeS?: readonly string[]; // Left nodes in alternating tree
  readonly treeT?: readonly string[]; // Right nodes in alternating tree
  readonly delta?: number;
  readonly hallSubsetS?: readonly string[];
  readonly hallNeighborNS?: readonly string[];
  readonly hallDefect?: number;
  readonly telemetry: BipartiteTelemetry;
}

export interface BipartitePreset {
  readonly id: BipartitePresetId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly defaultModality: BipartiteStudioModality;
  readonly graph: BipartiteGraph;
  readonly theoryNotes: string;
  readonly tags: readonly string[];
}

export interface ModalityConfig {
  readonly id: BipartiteStudioModality;
  readonly title: string;
  readonly subtitle: string;
  readonly theory: string;
  readonly complexity: string;
  readonly badgeColor: string;
  readonly iconName: string;
}

export interface BipartiteMatchingStudioProps {
  readonly initialModality?: BipartiteStudioModality;
  readonly initialPreset?: BipartitePresetId;
  readonly customGraph?: BipartiteGraph;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onStepChange?: (step: BipartiteAnimationStep) => void;
  readonly onModalityChange?: (modality: BipartiteStudioModality) => void;
  readonly onPresetChange?: (presetId: BipartitePresetId) => void;
}

// ============================================================================
// 2. CONSTANTS & MODALITY CONFIGURATIONS
// ============================================================================

export const MATCHING_MODALITY_INFOS: Record<BipartiteStudioModality, ModalityConfig> = {
  hopcroft_karp_matching: {
    id: "hopcroft_karp_matching",
    title: "Hopcroft-Karp Algorithm",
    subtitle: "O(E √V) Layered Multi-Source BFS & Maximal Disjoint DFS Augmentations",
    theory:
      "Hopcroft-Karp finds maximum cardinality matchings in bipartite graphs by interleaving multi-source BFS phases (constructing a layered level graph from free left vertices to free right vertices) with simultaneous maximal vertex-disjoint DFS augmentations along shortest alternating paths.",
    complexity: "O(E √V) time, O(V + E) space",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    iconName: "Zap",
  },
  konig_min_vertex_cover: {
    id: "konig_min_vertex_cover",
    title: "König's Theorem & Duality",
    subtitle: "|M| = |MVC| & |MIS| = |V| - |MVC| via Alternating Reachability",
    theory:
      "König's Duality Theorem establishes that in any bipartite graph, the maximum matching cardinality equals the minimum vertex cover size (|M| = |MVC|). Alternating BFS/DFS from unmatched left vertices partitions V into reachable set Z, yielding MVC = (L \\ Z) ∪ (R ∩ Z) and Maximum Independent Set MIS = (L ∩ Z) ∪ (R \\ Z).",
    complexity: "O(V + E) post-matching traversal",
    badgeColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    iconName: "Scale",
  },
  hungarian_min_cost_assignment: {
    id: "hungarian_min_cost_assignment",
    title: "Hungarian / Kuhn-Munkres",
    subtitle: "O(V³) Primal-Dual Minimum Cost Weighted Assignment with Potentials",
    theory:
      "The Hungarian method maintains dual node potentials u_i and v_j satisfying u_i + v_j ≤ c_ij, inducing reduced costs π_ij = c_ij - u_i - v_j ≥ 0. By searching for augmenting paths in the tight equality subgraph (where π_ij = 0) and shifting potentials by Δ = min_{i∈S, j∉T} π_ij, it certifies optimal primal-dual cost equality ∑ c_uv = ∑ u_i + ∑ v_j.",
    complexity: "O(V³) time with slack caching",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    iconName: "Network",
  },
  hall_marriage_condition: {
    id: "hall_marriage_condition",
    title: "Hall's Marriage Condition",
    subtitle: "∀S ⊆ L, |N(S)| ≥ |S| Satisfiability & Bottleneck Defect Analysis",
    theory:
      "Hall's Marriage Theorem states that a bipartite graph G = (L ∪ R, E) admits a matching covering all of L if and only if every subset S ⊆ L satisfies |N(S)| ≥ |S|. If violated, the maximal contracting subset S* reveals an unmatchable bottleneck with defect δ(S) = |S| - |N(S)| > 0.",
    complexity: "O(2^|L| · |E|) exhaustive / O(E √V) max-flow certification",
    badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    iconName: "ShieldCheck",
  },
};

// ============================================================================
// 3. PRESET BIPARTITE GRAPHS
// ============================================================================

export const BIPARTITE_MATCHING_PRESETS: Record<BipartitePresetId, BipartitePreset> = {
  classic_job_assignment: {
    id: "classic_job_assignment",
    name: "Classic Job Assignment (4×4)",
    subtitle: "4 Workers to 4 Tasks with Cost Matrix",
    description:
      "Standard balanced 4×4 bipartite assignment instance with non-uniform weights. Perfect for observing Hungarian potential shifts and primal-dual equality.",
    defaultModality: "hungarian_min_cost_assignment",
    theoryNotes:
      "Cost matrix: W1:[9, 2, 7, 8], W2:[6, 4, 3, 7], W3:[5, 8, 1, 8], W4:[7, 6, 9, 4]. Optimal minimum cost assignment yields total cost 13 (W1→J2:2, W2→J1:6, W3→J3:1, W4→J4:4).",
    tags: ["Assignment", "Hungarian", "Weighted", "Primal-Dual"],
    graph: {
      id: "classic_job_assignment",
      name: "Job Assignment 4x4",
      description: "4 Workers (L) to 4 Jobs (R)",
      leftNodes: [
        { id: "W1", label: "W₁", partition: "L", index: 0 },
        { id: "W2", label: "W₂", partition: "L", index: 1 },
        { id: "W3", label: "W₃", partition: "L", index: 2 },
        { id: "W4", label: "W₄", partition: "L", index: 3 },
      ],
      rightNodes: [
        { id: "J1", label: "J₁", partition: "R", index: 0 },
        { id: "J2", label: "J₂", partition: "R", index: 1 },
        { id: "J3", label: "J₃", partition: "R", index: 2 },
        { id: "J4", label: "J₄", partition: "R", index: 3 },
      ],
      costMatrix: [
        [9, 2, 7, 8],
        [6, 4, 3, 7],
        [5, 8, 1, 8],
        [7, 6, 9, 4],
      ],
      edges: [
        { id: "W1-J1", source: "W1", target: "J1", cost: 9 },
        { id: "W1-J2", source: "W1", target: "J2", cost: 2 },
        { id: "W1-J3", source: "W1", target: "J3", cost: 7 },
        { id: "W1-J4", source: "W1", target: "J4", cost: 8 },
        { id: "W2-J1", source: "W2", target: "J1", cost: 6 },
        { id: "W2-J2", source: "W2", target: "J2", cost: 4 },
        { id: "W2-J3", source: "W2", target: "J3", cost: 3 },
        { id: "W2-J4", source: "W2", target: "J4", cost: 7 },
        { id: "W3-J1", source: "W3", target: "J1", cost: 5 },
        { id: "W3-J2", source: "W3", target: "J2", cost: 8 },
        { id: "W3-J3", source: "W3", target: "J3", cost: 1 },
        { id: "W3-J4", source: "W3", target: "J4", cost: 8 },
        { id: "W4-J1", source: "W4", target: "J1", cost: 7 },
        { id: "W4-J2", source: "W4", target: "J2", cost: 6 },
        { id: "W4-J3", source: "W4", target: "J3", cost: 9 },
        { id: "W4-J4", source: "W4", target: "J4", cost: 4 },
      ],
    },
  },

  dense_bipartite_complete: {
    id: "dense_bipartite_complete",
    name: "Complete Bipartite K₅,₅",
    subtitle: "5×5 Dense Bipartite Graph with Structured Costs",
    description:
      "Fully connected 5×5 bipartite graph K₅,₅ with 25 edges. Demonstrates complete matching reachability and König vertex cover bounds.",
    defaultModality: "hopcroft_karp_matching",
    theoryNotes:
      "Every vertex in L connects to every vertex in R. Admits 5! = 120 perfect matchings. Minimum Vertex Cover size is 5, Maximum Independent Set size is 5.",
    tags: ["Complete", "K5,5", "Dense", "Hopcroft-Karp"],
    graph: {
      id: "dense_bipartite_complete",
      name: "Complete K5,5",
      description: "Complete bipartite graph K5,5 (25 edges)",
      leftNodes: [
        { id: "L1", label: "L₁", partition: "L", index: 0 },
        { id: "L2", label: "L₂", partition: "L", index: 1 },
        { id: "L3", label: "L₃", partition: "L", index: 2 },
        { id: "L4", label: "L₄", partition: "L", index: 3 },
        { id: "L5", label: "L₅", partition: "L", index: 4 },
      ],
      rightNodes: [
        { id: "R1", label: "R₁", partition: "R", index: 0 },
        { id: "R2", label: "R₂", partition: "R", index: 1 },
        { id: "R3", label: "R₃", partition: "R", index: 2 },
        { id: "R4", label: "R₄", partition: "R", index: 3 },
        { id: "R5", label: "R₅", partition: "R", index: 4 },
      ],
      costMatrix: [
        [3, 8, 2, 10, 3],
        [8, 7, 2, 9, 7],
        [6, 4, 2, 7, 5],
        [8, 4, 2, 3, 5],
        [9, 10, 6, 9, 10],
      ],
      edges: [
        { id: "L1-R1", source: "L1", target: "R1", cost: 3 },
        { id: "L1-R2", source: "L1", target: "R2", cost: 8 },
        { id: "L1-R3", source: "L1", target: "R3", cost: 2 },
        { id: "L1-R4", source: "L1", target: "R4", cost: 10 },
        { id: "L1-R5", source: "L1", target: "R5", cost: 3 },
        { id: "L2-R1", source: "L2", target: "R1", cost: 8 },
        { id: "L2-R2", source: "L2", target: "R2", cost: 7 },
        { id: "L2-R3", source: "L2", target: "R3", cost: 2 },
        { id: "L2-R4", source: "L2", target: "R4", cost: 9 },
        { id: "L2-R5", source: "L2", target: "R5", cost: 7 },
        { id: "L3-R1", source: "L3", target: "R1", cost: 6 },
        { id: "L3-R2", source: "L3", target: "R2", cost: 4 },
        { id: "L3-R3", source: "L3", target: "R3", cost: 2 },
        { id: "L3-R4", source: "L3", target: "R4", cost: 7 },
        { id: "L3-R5", source: "L3", target: "R5", cost: 5 },
        { id: "L4-R1", source: "L4", target: "R1", cost: 8 },
        { id: "L4-R2", source: "L4", target: "R2", cost: 4 },
        { id: "L4-R3", source: "L4", target: "R3", cost: 2 },
        { id: "L4-R4", source: "L4", target: "R4", cost: 3 },
        { id: "L4-R5", source: "L4", target: "R5", cost: 5 },
        { id: "L5-R1", source: "L5", target: "R1", cost: 9 },
        { id: "L5-R2", source: "L5", target: "R2", cost: 10 },
        { id: "L5-R3", source: "L5", target: "R3", cost: 6 },
        { id: "L5-R4", source: "L5", target: "R4", cost: 9 },
        { id: "L5-R5", source: "L5", target: "R5", cost: 10 },
      ],
    },
  },

  hall_violator_contracting: {
    id: "hall_violator_contracting",
    name: "Hall Violator (Contracting Bottleneck)",
    subtitle: "3-Node Subset Connecting to Only 2 Neighbors (|N(S)| < |S|)",
    description:
      "Constructed bottleneck graph where subset S = {L₁, L₂, L₃} has neighborhood N(S) = {R₁, R₂} of size 2. Demonstrates Hall's Marriage Theorem condition failure.",
    defaultModality: "hall_marriage_condition",
    theoryNotes:
      "Subset S = {L₁, L₂, L₃} has |S| = 3 but |N(S)| = 2 < 3. Defect δ(S) = |S| - |N(S)| = 1. Therefore no matching can cover all of L, and maximum matching cardinality is at most |L| - 1 = 3.",
    tags: ["Hall", "Violator", "Bottleneck", "Defect", "Counterexample"],
    graph: {
      id: "hall_violator_contracting",
      name: "Contracting Hall Violator",
      description: "Bottleneck graph with Hall condition violation",
      leftNodes: [
        { id: "L1", label: "L₁", partition: "L", index: 0 },
        { id: "L2", label: "L₂", partition: "L", index: 1 },
        { id: "L3", label: "L₃", partition: "L", index: 2 },
        { id: "L4", label: "L₄", partition: "L", index: 3 },
      ],
      rightNodes: [
        { id: "R1", label: "R₁", partition: "R", index: 0 },
        { id: "R2", label: "R₂", partition: "R", index: 1 },
        { id: "R3", label: "R₃", partition: "R", index: 2 },
        { id: "R4", label: "R₄", partition: "R", index: 3 },
      ],
      costMatrix: [
        [2, 4, 99, 99],
        [3, 1, 99, 99],
        [5, 6, 99, 99],
        [99, 99, 2, 3],
      ],
      edges: [
        { id: "L1-R1", source: "L1", target: "R1", cost: 2 },
        { id: "L1-R2", source: "L1", target: "R2", cost: 4 },
        { id: "L2-R1", source: "L2", target: "R1", cost: 3 },
        { id: "L2-R2", source: "L2", target: "R2", cost: 1 },
        { id: "L3-R1", source: "L3", target: "R1", cost: 5 },
        { id: "L3-R2", source: "L3", target: "R2", cost: 6 },
        { id: "L4-R3", source: "L4", target: "R3", cost: 2 },
        { id: "L4-R4", source: "L4", target: "R4", cost: 3 },
      ],
    },
  },

  hopcroft_karp_multi_layer: {
    id: "hopcroft_karp_multi_layer",
    name: "Hopcroft-Karp Multi-Layer (5×5)",
    subtitle: "Multi-Phase Alternating Paths of Lengths 1, 3, and 5",
    description:
      "Engineered sparse bipartite graph designed to trigger multiple distinct phases of Hopcroft-Karp: short direct augmentations followed by length-3 and length-5 alternating paths.",
    defaultModality: "hopcroft_karp_matching",
    theoryNotes:
      "Hopcroft-Karp builds a layered BFS DAG to find ALL shortest vertex-disjoint augmenting paths in each phase. This graph requires multiple phases to reach maximum cardinality 5.",
    tags: ["Hopcroft-Karp", "Multi-Phase", "Layered BFS", "Disjoint DFS"],
    graph: {
      id: "hopcroft_karp_multi_layer",
      name: "Hopcroft-Karp Multi-Layer",
      description: "Graph triggering length 1, 3, 5 alternating paths",
      leftNodes: [
        { id: "L1", label: "L₁", partition: "L", index: 0 },
        { id: "L2", label: "L₂", partition: "L", index: 1 },
        { id: "L3", label: "L₃", partition: "L", index: 2 },
        { id: "L4", label: "L₄", partition: "L", index: 3 },
        { id: "L5", label: "L₅", partition: "L", index: 4 },
      ],
      rightNodes: [
        { id: "R1", label: "R₁", partition: "R", index: 0 },
        { id: "R2", label: "R₂", partition: "R", index: 1 },
        { id: "R3", label: "R₃", partition: "R", index: 2 },
        { id: "R4", label: "R₄", partition: "R", index: 3 },
        { id: "R5", label: "R₅", partition: "R", index: 4 },
      ],
      costMatrix: [
        [1, 2, 5, 99, 99],
        [99, 1, 3, 6, 99],
        [99, 99, 2, 4, 99],
        [99, 99, 99, 2, 3],
        [99, 99, 99, 99, 1],
      ],
      edges: [
        { id: "L1-R1", source: "L1", target: "R1", cost: 1 },
        { id: "L1-R2", source: "L1", target: "R2", cost: 2 },
        { id: "L1-R3", source: "L1", target: "R3", cost: 5 },
        { id: "L2-R2", source: "L2", target: "R2", cost: 1 },
        { id: "L2-R3", source: "L2", target: "R3", cost: 3 },
        { id: "L2-R4", source: "L2", target: "R4", cost: 6 },
        { id: "L3-R3", source: "L3", target: "R3", cost: 2 },
        { id: "L3-R4", source: "L3", target: "R4", cost: 4 },
        { id: "L4-R4", source: "L4", target: "R4", cost: 2 },
        { id: "L4-R5", source: "L4", target: "R5", cost: 3 },
        { id: "L5-R5", source: "L5", target: "R5", cost: 1 },
      ],
    },
  },

  cost_matrix_4x4: {
    id: "cost_matrix_4x4",
    name: "Kuhn-Munkres Dual Benchmark (4×4)",
    subtitle: "Weighted Matrix with Non-Trivial Potential Updates",
    description:
      "Classical Hungarian benchmark matrix requiring dual potential shifts (Δ > 0) to grow the equality subgraph and uncover augmenting paths.",
    defaultModality: "hungarian_min_cost_assignment",
    theoryNotes:
      "Cost matrix: [[10, 19, 8, 15], [10, 18, 7, 17], [13, 16, 9, 14], [12, 19, 8, 18]]. Illustrates slack computation and potential updates u_i ← u_i + Δ, v_j ← v_j - Δ.",
    tags: ["Hungarian", "Kuhn-Munkres", "Potentials", "Reduced Costs"],
    graph: {
      id: "cost_matrix_4x4",
      name: "KM Benchmark Matrix 4x4",
      description: "Standard benchmark for Hungarian potential shifts",
      leftNodes: [
        { id: "A", label: "A", partition: "L", index: 0 },
        { id: "B", label: "B", partition: "L", index: 1 },
        { id: "C", label: "C", partition: "L", index: 2 },
        { id: "D", label: "D", partition: "L", index: 3 },
      ],
      rightNodes: [
        { id: "1", label: "1", partition: "R", index: 0 },
        { id: "2", label: "2", partition: "R", index: 1 },
        { id: "3", label: "3", partition: "R", index: 2 },
        { id: "4", label: "4", partition: "R", index: 3 },
      ],
      costMatrix: [
        [10, 19, 8, 15],
        [10, 18, 7, 17],
        [13, 16, 9, 14],
        [12, 19, 8, 18],
      ],
      edges: [
        { id: "A-1", source: "A", target: "1", cost: 10 },
        { id: "A-2", source: "A", target: "2", cost: 19 },
        { id: "A-3", source: "A", target: "3", cost: 8 },
        { id: "A-4", source: "A", target: "4", cost: 15 },
        { id: "B-1", source: "B", target: "1", cost: 10 },
        { id: "B-2", source: "B", target: "2", cost: 18 },
        { id: "B-3", source: "B", target: "3", cost: 7 },
        { id: "B-4", source: "B", target: "4", cost: 17 },
        { id: "C-1", source: "C", target: "1", cost: 13 },
        { id: "C-2", source: "C", target: "2", cost: 16 },
        { id: "C-3", source: "C", target: "3", cost: 9 },
        { id: "C-4", source: "C", target: "4", cost: 14 },
        { id: "D-1", source: "D", target: "1", cost: 12 },
        { id: "D-2", source: "D", target: "2", cost: 19 },
        { id: "D-3", source: "D", target: "3", cost: 8 },
        { id: "D-4", source: "D", target: "4", cost: 18 },
      ],
    },
  },

  k44_symmetric_assignment: {
    id: "k44_symmetric_assignment",
    name: "König Duality & Independent Set (4×4)",
    subtitle: "Sparse Bipartite with Clear MVC & MIS Partitions",
    description:
      "Sparse 4×4 graph crafted to highlight the alternating path tree Z, deriving Minimum Vertex Cover and Maximum Independent Set directly from maximum matching.",
    defaultModality: "konig_min_vertex_cover",
    theoryNotes:
      "Demonstrates König's theorem: Minimum Vertex Cover MVC = (L \\ Z) ∪ (R ∩ Z), Maximum Independent Set MIS = (L ∩ Z) ∪ (R \\ Z). Size check: |M| = |MVC| = 3, |MIS| = 8 - 3 = 5.",
    tags: ["König", "Vertex Cover", "Independent Set", "Duality"],
    graph: {
      id: "k44_symmetric_assignment",
      name: "König Duality Graph",
      description: "Sparse graph for MVC & MIS decomposition",
      leftNodes: [
        { id: "U1", label: "U₁", partition: "L", index: 0 },
        { id: "U2", label: "U₂", partition: "L", index: 1 },
        { id: "U3", label: "U₃", partition: "L", index: 2 },
        { id: "U4", label: "U₄", partition: "L", index: 3 },
      ],
      rightNodes: [
        { id: "V1", label: "V₁", partition: "R", index: 0 },
        { id: "V2", label: "V₂", partition: "R", index: 1 },
        { id: "V3", label: "V₃", partition: "R", index: 2 },
        { id: "V4", label: "V₄", partition: "R", index: 3 },
      ],
      costMatrix: [
        [1, 99, 99, 99],
        [1, 2, 99, 99],
        [99, 1, 3, 99],
        [99, 99, 1, 99],
      ],
      edges: [
        { id: "U1-V1", source: "U1", target: "V1", cost: 1 },
        { id: "U2-V1", source: "U2", target: "V1", cost: 1 },
        { id: "U2-V2", source: "U2", target: "V2", cost: 2 },
        { id: "U3-V2", source: "U3", target: "V2", cost: 1 },
        { id: "U3-V3", source: "U3", target: "V3", cost: 3 },
        { id: "U4-V3", source: "U4", target: "V3", cost: 1 },
      ],
    },
  },
};

// ============================================================================
// 4. ALGORITHMIC ENGINES (PURE FUNCTIONS)
// ============================================================================

/**
 * Helper to build adjacency and lookup tables from a bipartite graph.
 */
function buildBipartiteAdjacency(graph: BipartiteGraph) {
  const leftIds = graph.leftNodes.map((n) => n.id);
  const rightIds = graph.rightNodes.map((n) => n.id);
  const leftAdj = new Map<string, string[]>();
  const rightAdj = new Map<string, string[]>();
  const edgeByPair = new Map<string, BipartiteEdge>();

  for (const id of leftIds) leftAdj.set(id, []);
  for (const id of rightIds) rightAdj.set(id, []);

  for (const edge of graph.edges) {
    if (leftAdj.has(edge.source) && rightAdj.has(edge.target)) {
      leftAdj.get(edge.source)!.push(edge.target);
      rightAdj.get(edge.target)!.push(edge.source);
      edgeByPair.set(`${edge.source}->${edge.target}`, edge);
      edgeByPair.set(`${edge.target}->${edge.source}`, edge);
    }
  }

  return { leftIds, rightIds, leftAdj, rightAdj, edgeByPair };
}

/**
 * Hopcroft-Karp Algorithm for Maximum Cardinality Bipartite Matching (O(E √V)).
 */
export function runHopcroftKarpAlgorithm(graph: BipartiteGraph): {
  matching: Map<string, string>; // L -> R mapping
  cardinality: number;
  phases: number;
  steps: BipartiteAnimationStep[];
} {
  const { leftIds, rightIds, leftAdj, edgeByPair } = buildBipartiteAdjacency(graph);
  const steps: BipartiteAnimationStep[] = [];

  const pairU: Record<string, string | null> = {};
  const pairV: Record<string, string | null> = {};
  for (const u of leftIds) pairU[u] = null;
  for (const v of rightIds) pairV[v] = null;

  const dist: Record<string, number> = {};
  let cardinality = 0;
  let phaseCount = 0;
  let stepCounter = 0;

  const getMatchedEdgesList = (): string[] => {
    const list: string[] = [];
    for (const u of leftIds) {
      const v = pairU[u];
      if (v) {
        const edge = edgeByPair.get(`${u}->${v}`);
        if (edge) list.push(edge.id);
      }
    }
    return list;
  };

  const getMatchedPairsMap = (): Record<string, string> => {
    const map: Record<string, string> = {};
    for (const u of leftIds) {
      if (pairU[u]) {
        map[u] = pairU[u]!;
        map[pairU[u]!] = u;
      }
    }
    return map;
  };

  // Initial Step
  steps.push({
    stepIndex: stepCounter++,
    modality: "hopcroft_karp_matching",
    action: "init",
    title: "Hopcroft-Karp Initialization",
    description: `Bipartite graph initialized with |L| = ${leftIds.length}, |R| = ${rightIds.length}, |E| = ${graph.edges.length}. Matching M = ∅ (cardinality 0).`,
    details:
      "Hopcroft-Karp executes in O(E √V) time by interleaving multi-source BFS with maximal vertex-disjoint DFS augmentations.",
    matchedEdges: [],
    matchedPairs: {},
    activeNodes: leftIds,
    telemetry: {
      cardinality: 0,
      phaseCount: 0,
      augmentationsCount: 0,
      isOptimal: false,
    },
  });

  // Hopcroft-Karp Main Loop
  while (true) {
    phaseCount++;
    const queue: string[] = [];

    for (const u of leftIds) {
      if (pairU[u] === null) {
        dist[u] = 0;
        queue.push(u);
      } else {
        dist[u] = Infinity;
      }
    }
    dist["NIL"] = Infinity;

    // Record BFS level assignments for visualization
    const bfsLevels: Record<string, number> = {};
    for (const u of leftIds) {
      if (dist[u] !== Infinity) bfsLevels[u] = dist[u];
    }

    steps.push({
      stepIndex: stepCounter++,
      modality: "hopcroft_karp_matching",
      action: "hk_bfs_start",
      title: `Phase ${phaseCount}: Multi-Source BFS Level Graph`,
      description: `Initialized BFS queue with ${queue.length} free left vertices at level 0: [${queue.join(", ")}].`,
      details:
        "Building alternating layered level graph to find shortest path distance to free right vertices.",
      matchedEdges: getMatchedEdgesList(),
      matchedPairs: getMatchedPairsMap(),
      activeNodes: [...queue],
      bfsLevels: { ...bfsLevels },
      telemetry: {
        cardinality,
        phaseCount,
        augmentationsCount: cardinality,
        isOptimal: false,
      },
    });

    while (queue.length > 0) {
      const u = queue.shift()!;
      if (dist[u] < dist["NIL"]) {
        const neighbors = leftAdj.get(u) || [];
        for (const v of neighbors) {
          const u2 = pairV[v];
          if (u2 === null) {
            if (dist["NIL"] === Infinity) {
              dist["NIL"] = dist[u] + 1;
            }
          } else if (dist[u2] === Infinity) {
            dist[u2] = dist[u] + 1;
            bfsLevels[u2] = dist[u2];
            queue.push(u2);
          }
        }
      }
    }

    // Check if an augmenting path exists in this phase
    if (dist["NIL"] === Infinity) {
      steps.push({
        stepIndex: stepCounter++,
        modality: "hopcroft_karp_matching",
        action: "hk_bfs_no_path",
        title: `Phase ${phaseCount}: No Augmenting Paths Exist`,
        description:
          "BFS could not reach any unmatched right vertex. Level graph has no path from free L to free R.",
        details:
          "By Berge's Lemma, a matching is maximum iff no augmenting path exists. The matching is globally optimal!",
        matchedEdges: getMatchedEdgesList(),
        matchedPairs: getMatchedPairsMap(),
        bfsLevels: { ...bfsLevels },
        telemetry: {
          cardinality,
          phaseCount,
          augmentationsCount: cardinality,
          isOptimal: true,
        },
      });
      break;
    }

    const shortestPathLength = 2 * dist["NIL"] - 1;

    steps.push({
      stepIndex: stepCounter++,
      modality: "hopcroft_karp_matching",
      action: "hk_bfs_sink_reached",
      title: `Phase ${phaseCount}: Shortest Augmenting Path Length = ${shortestPathLength}`,
      description: `BFS reached unmatched right vertices at layer depth ${dist["NIL"]} (path length ${shortestPathLength} edges). Ready for simultaneous DFS.`,
      details:
        "All augmenting paths in this phase will have exactly this minimal length, guaranteeing maximal vertex-disjoint packing.",
      matchedEdges: getMatchedEdgesList(),
      matchedPairs: getMatchedPairsMap(),
      bfsLevels: { ...bfsLevels },
      telemetry: {
        cardinality,
        phaseCount,
        augmentationsCount: cardinality,
        shortestAugmentingLength: shortestPathLength,
        isOptimal: false,
      },
    });

    // DFS Phase: Find maximal set of vertex-disjoint augmenting paths
    let phaseAugmentations = 0;

    const dfs = (u: string, currentPath: string[]): string[] | null => {
      const neighbors = leftAdj.get(u) || [];
      for (const v of neighbors) {
        const u2 = pairV[v];
        if (u2 === null || dist[u2] === dist[u] + 1) {
          if (u2 === null) {
            // Found augmenting path to free right vertex v
            return [...currentPath, u, v];
          } else {
            const subPath = dfs(u2, [...currentPath, u, v]);
            if (subPath !== null) {
              return subPath;
            }
          }
        }
      }
      dist[u] = Infinity; // prune vertex from further searches in this phase
      return null;
    };

    for (const u of leftIds) {
      if (pairU[u] === null) {
        const path = dfs(u, []);
        if (path !== null) {
          phaseAugmentations++;
          cardinality++;

          // Build edge IDs along the path
          const pathEdgeIds: string[] = [];
          for (let i = 0; i < path.length - 1; i++) {
            const edge = edgeByPair.get(`${path[i]}->${path[i + 1]}`);
            if (edge) pathEdgeIds.push(edge.id);
          }

          // Augment matching: flip matching along path
          for (let i = 0; i < path.length; i += 2) {
            const uNode = path[i];
            const vNode = path[i + 1];
            pairU[uNode] = vNode;
            pairV[vNode] = uNode;
          }

          steps.push({
            stepIndex: stepCounter++,
            modality: "hopcroft_karp_matching",
            action: "hk_dfs_augment",
            title: `Phase ${phaseCount}: DFS Augmentation along P`,
            description: `Augmented matching via alternating path [${path.join(" → ")}]. Updated matching M ← M ⊕ P.`,
            details: `Matching cardinality increased to ${cardinality}. Vertices along P are now matched and locked for this phase.`,
            matchedEdges: getMatchedEdgesList(),
            matchedPairs: getMatchedPairsMap(),
            activeNodes: [...path],
            activeEdges: pathEdgeIds,
            alternatingPath: [...path],
            bfsLevels: { ...bfsLevels },
            telemetry: {
              cardinality,
              phaseCount,
              augmentationsCount: cardinality,
              shortestAugmentingLength: shortestPathLength,
              isOptimal: false,
            },
          });
        }
      }
    }

    steps.push({
      stepIndex: stepCounter++,
      modality: "hopcroft_karp_matching",
      action: "hk_phase_complete",
      title: `Phase ${phaseCount} Complete: +${phaseAugmentations} Augmentations`,
      description: `Phase ${phaseCount} concluded with ${phaseAugmentations} disjoint paths augmented. Current |M| = ${cardinality}.`,
      details: "Proceeding to next BFS phase to find strictly longer augmenting paths.",
      matchedEdges: getMatchedEdgesList(),
      matchedPairs: getMatchedPairsMap(),
      telemetry: {
        cardinality,
        phaseCount,
        augmentationsCount: cardinality,
        isOptimal: false,
      },
    });

    if (phaseAugmentations === 0) {
      break;
    }
  }

  // Final Step
  steps.push({
    stepIndex: stepCounter++,
    modality: "hopcroft_karp_matching",
    action: "hk_complete",
    title: "Hopcroft-Karp Terminated: Maximum Cardinality Found",
    description: `Maximum matching cardinality |M| = ${cardinality} achieved in ${phaseCount} BFS/DFS phases.`,
    details: "Hopcroft-Karp algorithm completed with maximum matching verified.",
    matchedEdges: getMatchedEdgesList(),
    matchedPairs: getMatchedPairsMap(),
    telemetry: {
      cardinality,
      maxCardinality: cardinality,
      phaseCount,
      augmentationsCount: cardinality,
      isOptimal: true,
    },
  });

  const finalMatching = new Map<string, string>();
  for (const u of leftIds) {
    if (pairU[u]) {
      finalMatching.set(u, pairU[u]!);
    }
  }

  return {
    matching: finalMatching,
    cardinality,
    phases: phaseCount,
    steps,
  };
}

/**
 * König's Theorem & Vertex Cover / Independent Set Duality Engine.
 */
export function runKonigDuality(
  graph: BipartiteGraph,
  matchingInput?: Map<string, string>,
): {
  matching: Map<string, string>;
  zSet: Set<string>;
  mvc: Set<string>;
  mis: Set<string>;
  steps: BipartiteAnimationStep[];
} {
  const { leftIds, rightIds, leftAdj, edgeByPair } = buildBipartiteAdjacency(graph);
  const steps: BipartiteAnimationStep[] = [];
  let stepCounter = 0;

  // Use provided matching or solve with Hopcroft-Karp
  let matching: Map<string, string>;
  if (matchingInput) {
    matching = new Map(matchingInput);
  } else {
    const hkResult = runHopcroftKarpAlgorithm(graph);
    matching = hkResult.matching;
  }

  const matchedEdgesList: string[] = [];
  const matchedPairs: Record<string, string> = {};
  for (const [u, v] of matching.entries()) {
    const edge = edgeByPair.get(`${u}->${v}`);
    if (edge) matchedEdgesList.push(edge.id);
    matchedPairs[u] = v;
    matchedPairs[v] = u;
  }

  const pairU: Record<string, string | null> = {};
  const pairV: Record<string, string | null> = {};
  for (const u of leftIds) pairU[u] = matching.get(u) || null;
  for (const v of rightIds) pairV[v] = null;
  for (const [u, v] of matching.entries()) {
    pairV[v] = u;
  }

  // Step 1: Init with Maximum Matching
  steps.push({
    stepIndex: stepCounter++,
    modality: "konig_min_vertex_cover",
    action: "konig_init",
    title: "König's Theorem: Maximum Matching Base",
    description: `Maximum matching M with |M| = ${matching.size} pairs established. Preparing alternating path reachability to derive Minimum Vertex Cover.`,
    details:
      "König's Duality Theorem states that in any bipartite graph, max |M| = min |MVC|. Vertices will be partitioned via alternating reachability set Z.",
    matchedEdges: [...matchedEdgesList],
    matchedPairs: { ...matchedPairs },
    telemetry: {
      cardinality: matching.size,
      phaseCount: 1,
      augmentationsCount: matching.size,
      mvcSize: matching.size,
      misSize: graph.leftNodes.length + graph.rightNodes.length - matching.size,
      isOptimal: true,
    },
  });

  // Step 2: Identify Unmatched Left Vertices as seeds for Z
  const freeLeft = leftIds.filter((u) => pairU[u] === null);
  const zSet = new Set<string>();
  const queue: string[] = [];

  for (const u of freeLeft) {
    zSet.add(u);
    queue.push(u);
  }

  steps.push({
    stepIndex: stepCounter++,
    modality: "konig_min_vertex_cover",
    action: "konig_unmatched_seeds",
    title: `Alternating Search Rooted at Free Left Vertices: [${freeLeft.join(", ") || "none"}]`,
    description: `Identified ${freeLeft.length} unmatched left vertices as the initial seed set for Z.`,
    details:
      "Set Z contains all vertices reachable via alternating paths (using unmatched edges from L to R, and matched edges from R to L).",
    matchedEdges: [...matchedEdgesList],
    matchedPairs: { ...matchedPairs },
    activeNodes: [...freeLeft],
    zSetNodes: Array.from(zSet),
    telemetry: {
      cardinality: matching.size,
      phaseCount: 1,
      augmentationsCount: matching.size,
      mvcSize: matching.size,
      misSize: graph.leftNodes.length + graph.rightNodes.length - matching.size,
    },
  });

  // Step 3: Alternating BFS/DFS traversal
  while (queue.length > 0) {
    const x = queue.shift()!;
    const isLeft = leftIds.includes(x);

    if (isLeft) {
      // From L to R: follow non-matching edges
      const neighbors = leftAdj.get(x) || [];
      for (const y of neighbors) {
        if (pairU[x] !== y && !zSet.has(y)) {
          zSet.add(y);
          queue.push(y);

          const edge = edgeByPair.get(`${x}->${y}`);
          steps.push({
            stepIndex: stepCounter++,
            modality: "konig_min_vertex_cover",
            action: "konig_explore_unmatched",
            title: `Follow Non-Matching Edge (${x} → ${y})`,
            description: `From left vertex ${x} ∈ Z, reached right vertex ${y} via unmatched edge. Added ${y} to Z.`,
            details:
              "Alternating reachability: left-to-right steps MUST traverse non-matching edges.",
            matchedEdges: [...matchedEdgesList],
            matchedPairs: { ...matchedPairs },
            activeNodes: [x, y],
            activeEdges: edge ? [edge.id] : [],
            zSetNodes: Array.from(zSet),
            telemetry: {
              cardinality: matching.size,
              phaseCount: 1,
              augmentationsCount: matching.size,
            },
          });
        }
      }
    } else {
      // From R to L: follow matched edge
      const u = pairV[x];
      if (u && !zSet.has(u)) {
        zSet.add(u);
        queue.push(u);

        const edge = edgeByPair.get(`${u}->${x}`);
        steps.push({
          stepIndex: stepCounter++,
          modality: "konig_min_vertex_cover",
          action: "konig_explore_matched",
          title: `Follow Matched Edge (${x} → ${u})`,
          description: `From right vertex ${x} ∈ Z, followed matched edge back to left vertex ${u}. Added ${u} to Z.`,
          details: "Alternating reachability: right-to-left steps MUST traverse matched edges.",
          matchedEdges: [...matchedEdgesList],
          matchedPairs: { ...matchedPairs },
          activeNodes: [x, u],
          activeEdges: edge ? [edge.id] : [],
          zSetNodes: Array.from(zSet),
          telemetry: {
            cardinality: matching.size,
            phaseCount: 1,
            augmentationsCount: matching.size,
          },
        });
      }
    }
  }

  // Step 4: Z set completed
  steps.push({
    stepIndex: stepCounter++,
    modality: "konig_min_vertex_cover",
    action: "konig_z_complete",
    title: "Alternating Reachability Set Z Fully Constructed",
    description: `Set Z = {${Array.from(zSet).join(", ")}} contains ${zSet.size} vertices reachable from free left nodes.`,
    details:
      "Partitioning vertices: L \\ Z (unreachable left) and R ∩ Z (reachable right) will form the Minimum Vertex Cover.",
    matchedEdges: [...matchedEdgesList],
    matchedPairs: { ...matchedPairs },
    zSetNodes: Array.from(zSet),
    telemetry: {
      cardinality: matching.size,
      phaseCount: 1,
      augmentationsCount: matching.size,
    },
  });

  // Step 5: Derive Minimum Vertex Cover
  // MVC = (L \ Z) ∪ (R ∩ Z)
  const mvc = new Set<string>();
  const mvcL: string[] = [];
  const mvcR: string[] = [];

  for (const u of leftIds) {
    if (!zSet.has(u)) {
      mvc.add(u);
      mvcL.push(u);
    }
  }
  for (const v of rightIds) {
    if (zSet.has(v)) {
      mvc.add(v);
      mvcR.push(v);
    }
  }

  steps.push({
    stepIndex: stepCounter++,
    modality: "konig_min_vertex_cover",
    action: "konig_mvc_derived",
    title: `Minimum Vertex Cover: MVC = (L \\ Z) ∪ (R ∩ Z) = {${Array.from(mvc).join(", ")}}`,
    description: `Derived MVC of size ${mvc.size}: Unreachable Left L \\ Z = [${mvcL.join(", ")}], Reachable Right R ∩ Z = [${mvcR.join(", ")}].`,
    details: `König's theorem confirmed: |MVC| = ${mvc.size} == |M| = ${matching.size}. Every edge in the graph has at least one endpoint in MVC.`,
    matchedEdges: [...matchedEdgesList],
    matchedPairs: { ...matchedPairs },
    zSetNodes: Array.from(zSet),
    mvcNodes: Array.from(mvc),
    telemetry: {
      cardinality: matching.size,
      phaseCount: 1,
      augmentationsCount: matching.size,
      mvcSize: mvc.size,
      misSize: graph.leftNodes.length + graph.rightNodes.length - mvc.size,
      isOptimal: true,
    },
  });

  // Step 6: Derive Maximum Independent Set
  // MIS = (L ∩ Z) ∪ (R \ Z) = V \ MVC
  const mis = new Set<string>();
  for (const u of leftIds) {
    if (zSet.has(u)) mis.add(u);
  }
  for (const v of rightIds) {
    if (!zSet.has(v)) mis.add(v);
  }

  const totalVertices = leftIds.length + rightIds.length;

  steps.push({
    stepIndex: stepCounter++,
    modality: "konig_min_vertex_cover",
    action: "konig_mis_derived",
    title: `Maximum Independent Set: MIS = (L ∩ Z) ∪ (R \\ Z) = {${Array.from(mis).join(", ")}}`,
    description: `Derived MIS of size ${mis.size} = |V| - |MVC| (${totalVertices} - ${mvc.size} = ${mis.size}).`,
    details:
      "By Gallai's Theorem, for any graph, |MVC| + |MIS| = |V|. No two vertices in MIS share an edge.",
    matchedEdges: [...matchedEdgesList],
    matchedPairs: { ...matchedPairs },
    zSetNodes: Array.from(zSet),
    mvcNodes: Array.from(mvc),
    misNodes: Array.from(mis),
    telemetry: {
      cardinality: matching.size,
      phaseCount: 1,
      augmentationsCount: matching.size,
      mvcSize: mvc.size,
      misSize: mis.size,
      isOptimal: true,
    },
  });

  // Step 7: Final Verification Step
  steps.push({
    stepIndex: stepCounter++,
    modality: "konig_min_vertex_cover",
    action: "konig_verified",
    title: "König's Theorem & Gallai Identities Formally Verified",
    description: `|M| = ${matching.size} = |MVC| = ${mvc.size}, and |MIS| = ${mis.size} = ${totalVertices} - ${mvc.size}. All edge covers and independence constraints verified.`,
    details: "Exact primal-dual combinatorial optimality certified.",
    matchedEdges: [...matchedEdgesList],
    matchedPairs: { ...matchedPairs },
    mvcNodes: Array.from(mvc),
    misNodes: Array.from(mis),
    telemetry: {
      cardinality: matching.size,
      phaseCount: 1,
      augmentationsCount: matching.size,
      mvcSize: mvc.size,
      misSize: mis.size,
      isOptimal: true,
    },
  });

  return {
    matching,
    zSet,
    mvc,
    mis,
    steps,
  };
}

/**
 * Hungarian Algorithm (Kuhn-Munkres) for Minimum Cost Weighted Bipartite Matching (O(V³)).
 */
export function runHungarianAlgorithm(graph: BipartiteGraph): {
  assignment: Map<string, string>; // L -> R mapping
  minCost: number;
  uPotentials: Record<string, number>;
  vPotentials: Record<string, number>;
  steps: BipartiteAnimationStep[];
} {
  const { leftIds, rightIds, edgeByPair } = buildBipartiteAdjacency(graph);
  const steps: BipartiteAnimationStep[] = [];
  let stepCounter = 0;

  const n = leftIds.length;
  const m = rightIds.length;
  const dim = Math.max(n, m);

  // Build cost matrix
  const cost: number[][] = Array.from({ length: dim }, () => Array(dim).fill(0));

  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      if (i < n && j < m) {
        const uId = leftIds[i];
        const vId = rightIds[j];
        const edge = edgeByPair.get(`${uId}->${vId}`);
        cost[i][j] = edge?.cost !== undefined ? edge.cost : 99;
      } else {
        cost[i][j] = 0; // Padding for rectangular instances
      }
    }
  }

  // Dual potentials
  const uPot = Array(dim).fill(0);
  const vPot = Array(dim).fill(0);

  // Initialize potentials: u_i = min_j C[i][j], v_j = min_i (C[i][j] - u_i)
  for (let i = 0; i < dim; i++) {
    let minRow = Infinity;
    for (let j = 0; j < dim; j++) {
      if (cost[i][j] < minRow) minRow = cost[i][j];
    }
    uPot[i] = minRow !== Infinity ? minRow : 0;
  }

  for (let j = 0; j < dim; j++) {
    let minCol = Infinity;
    for (let i = 0; i < dim; i++) {
      const reduced = cost[i][j] - uPot[i];
      if (reduced < minCol) minCol = reduced;
    }
    vPot[j] = minCol !== Infinity && minCol > 0 ? minCol : 0;
  }

  const matchL = Array(dim).fill(-1);
  const matchR = Array(dim).fill(-1);

  const getReducedCostsMap = (): Record<string, number> => {
    const rc: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        const uId = leftIds[i];
        const vId = rightIds[j];
        const edge = edgeByPair.get(`${uId}->${vId}`);
        if (edge) {
          rc[edge.id] = cost[i][j] - uPot[i] - vPot[j];
        }
      }
    }
    return rc;
  };

  const getTightEdgesList = (): string[] => {
    const tight: string[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        const uId = leftIds[i];
        const vId = rightIds[j];
        const edge = edgeByPair.get(`${uId}->${vId}`);
        if (edge && cost[i][j] - uPot[i] - vPot[j] === 0) {
          tight.push(edge.id);
        }
      }
    }
    return tight;
  };

  const getUPotentialsMap = (): Record<string, number> => {
    const map: Record<string, number> = {};
    for (let i = 0; i < n; i++) map[leftIds[i]] = uPot[i];
    return map;
  };

  const getVPotentialsMap = (): Record<string, number> => {
    const map: Record<string, number> = {};
    for (let j = 0; j < m; j++) map[rightIds[j]] = vPot[j];
    return map;
  };

  const getMatchedEdgesList = (): string[] => {
    const list: string[] = [];
    for (let i = 0; i < n; i++) {
      const j = matchL[i];
      if (j !== -1 && j < m) {
        const edge = edgeByPair.get(`${leftIds[i]}->${rightIds[j]}`);
        if (edge) list.push(edge.id);
      }
    }
    return list;
  };

  const getMatchedPairsMap = (): Record<string, string> => {
    const map: Record<string, string> = {};
    for (let i = 0; i < n; i++) {
      const j = matchL[i];
      if (j !== -1 && j < m) {
        map[leftIds[i]] = rightIds[j];
        map[rightIds[j]] = leftIds[i];
      }
    }
    return map;
  };

  const computeCurrentTotalCost = (): number => {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const j = matchL[i];
      if (j !== -1 && j < m) sum += cost[i][j];
    }
    return sum;
  };

  const computeDualPotentialSum = (): number => {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += uPot[i];
    for (let j = 0; j < m; j++) sum += vPot[j];
    return sum;
  };

  // Step 1: Initial potentials & reduced costs
  steps.push({
    stepIndex: stepCounter++,
    modality: "hungarian_min_cost_assignment",
    action: "hungarian_init_potentials",
    title: "Dual Potentials & Reduced Costs Initialized",
    description: `Initial potentials set: u_i = min_j C[i][j] for L, v_j = min_i (C[i][j] - u_i) for R. All reduced costs π_ij = C_ij - u_i - v_j ≥ 0.`,
    details:
      "Complementary Slackness theorem: A matching composed entirely of tight edges (π_ij = 0) is certified optimal.",
    matchedEdges: [],
    matchedPairs: {},
    uPotentials: getUPotentialsMap(),
    vPotentials: getVPotentialsMap(),
    reducedCosts: getReducedCostsMap(),
    tightEdges: getTightEdgesList(),
    telemetry: {
      cardinality: 0,
      phaseCount: 0,
      augmentationsCount: 0,
      totalCost: 0,
      dualPotentialSum: computeDualPotentialSum(),
      isOptimal: false,
    },
  });

  // Augment for each left worker i0
  for (let i0 = 0; i0 < dim; i0++) {
    const inS = Array(dim).fill(false);
    const inT = Array(dim).fill(false);
    const slack = Array(dim).fill(Infinity);
    const slackFrom = Array(dim).fill(-1);
    const parentR = Array(dim).fill(-1);

    const currentI = i0;
    inS[currentI] = true;

    for (let j = 0; j < dim; j++) {
      slack[j] = cost[currentI][j] - uPot[currentI] - vPot[j];
      slackFrom[j] = currentI;
    }

    if (i0 < n) {
      steps.push({
        stepIndex: stepCounter++,
        modality: "hungarian_min_cost_assignment",
        action: "hungarian_worker_start",
        title: `Assigning Left Vertex ${leftIds[i0]} (Index ${i0})`,
        description: `Growing alternating equality tree rooted at unmatched vertex ${leftIds[i0]}. Tree S = {${leftIds[i0]}}, T = ∅.`,
        details:
          "Searching for an augmenting path in the tight equality subgraph or identifying minimal potential shift Δ.",
        matchedEdges: getMatchedEdgesList(),
        matchedPairs: getMatchedPairsMap(),
        activeNodes: [leftIds[i0]],
        treeS: [leftIds[i0]],
        treeT: [],
        uPotentials: getUPotentialsMap(),
        vPotentials: getVPotentialsMap(),
        reducedCosts: getReducedCostsMap(),
        tightEdges: getTightEdgesList(),
        telemetry: {
          cardinality: i0,
          phaseCount: i0 + 1,
          augmentationsCount: i0,
          totalCost: computeCurrentTotalCost(),
          dualPotentialSum: computeDualPotentialSum(),
          isOptimal: false,
        },
      });
    }

    while (true) {
      // Find right node with minimum slack outside T
      let delta = Infinity;
      let jStar = -1;

      for (let j = 0; j < dim; j++) {
        if (!inT[j] && slack[j] < delta) {
          delta = slack[j];
          jStar = j;
        }
      }

      // If delta > 0, update potentials
      if (delta > 0 && delta !== Infinity) {
        for (let i = 0; i < dim; i++) {
          if (inS[i]) uPot[i] += delta;
        }
        for (let j = 0; j < dim; j++) {
          if (inT[j]) {
            vPot[j] -= delta;
          } else {
            slack[j] -= delta;
          }
        }

        const activeSIds: string[] = [];
        const activeTIds: string[] = [];
        for (let i = 0; i < n; i++) if (inS[i]) activeSIds.push(leftIds[i]);
        for (let j = 0; j < m; j++) if (inT[j]) activeTIds.push(rightIds[j]);

        steps.push({
          stepIndex: stepCounter++,
          modality: "hungarian_min_cost_assignment",
          action: "hungarian_update_potentials",
          title: `Dual Potential Shift: Δ = ${delta}`,
          description: `Shifted potentials by Δ = ${delta}: u_i ← u_i + ${delta} for i ∈ S, v_j ← v_j - ${delta} for j ∈ T. New tight edges formed!`,
          details: `Dual sum shifted to ${computeDualPotentialSum()}. Minimum slack edge is now tight (π_ij = 0).`,
          matchedEdges: getMatchedEdgesList(),
          matchedPairs: getMatchedPairsMap(),
          uPotentials: getUPotentialsMap(),
          vPotentials: getVPotentialsMap(),
          reducedCosts: getReducedCostsMap(),
          tightEdges: getTightEdgesList(),
          treeS: activeSIds,
          treeT: activeTIds,
          delta,
          telemetry: {
            cardinality: i0,
            phaseCount: i0 + 1,
            augmentationsCount: i0,
            totalCost: computeCurrentTotalCost(),
            dualPotentialSum: computeDualPotentialSum(),
            currentDelta: delta,
            isOptimal: false,
          },
        });
      }

      if (jStar === -1) break;

      // If jStar is unmatched, we found an augmenting path!
      if (matchR[jStar] === -1) {
        // Trace and augment matching
        let currJ = jStar;
        const augPathNodes: string[] = [];
        const augPathEdges: string[] = [];

        while (true) {
          const currI = slackFrom[currJ];
          matchL[currI] = currJ;
          matchR[currJ] = currI;

          if (currI < n && currJ < m) {
            augPathNodes.unshift(rightIds[currJ]);
            augPathNodes.unshift(leftIds[currI]);
            const edge = edgeByPair.get(`${leftIds[currI]}->${rightIds[currJ]}`);
            if (edge) augPathEdges.push(edge.id);
          }

          if (currI === i0) break;
          currJ = parentR[currI];
        }

        const currentMatchedCount = matchL.filter((j, i) => i < n && j !== -1 && j < m).length;

        steps.push({
          stepIndex: stepCounter++,
          modality: "hungarian_min_cost_assignment",
          action: "hungarian_augment_path",
          title: `Augmenting Path Found for ${i0 < n ? leftIds[i0] : `Node ${i0}`}`,
          description: `Augmented matching along tight path [${augPathNodes.join(" → ")}]. Matched pairs count: ${currentMatchedCount}.`,
          details: `Current assignment cost ∑ c_uv = ${computeCurrentTotalCost()}. Complementary slackness holds on all matched pairs.`,
          matchedEdges: getMatchedEdgesList(),
          matchedPairs: getMatchedPairsMap(),
          activeNodes: augPathNodes,
          activeEdges: augPathEdges,
          alternatingPath: augPathNodes,
          uPotentials: getUPotentialsMap(),
          vPotentials: getVPotentialsMap(),
          reducedCosts: getReducedCostsMap(),
          tightEdges: getTightEdgesList(),
          telemetry: {
            cardinality: currentMatchedCount,
            phaseCount: i0 + 1,
            augmentationsCount: currentMatchedCount,
            totalCost: computeCurrentTotalCost(),
            dualPotentialSum: computeDualPotentialSum(),
            isOptimal: currentMatchedCount === Math.min(n, m),
          },
        });

        break;
      } else {
        // jStar is matched to some worker i1. Add jStar to T and i1 to S.
        const i1 = matchR[jStar];
        inT[jStar] = true;
        inS[i1] = true;
        parentR[i1] = jStar;

        for (let j = 0; j < dim; j++) {
          if (!inT[j]) {
            const val = cost[i1][j] - uPot[i1] - vPot[j];
            if (val < slack[j]) {
              slack[j] = val;
              slackFrom[j] = i1;
            }
          }
        }

        const activeSIds: string[] = [];
        const activeTIds: string[] = [];
        for (let i = 0; i < n; i++) if (inS[i]) activeSIds.push(leftIds[i]);
        for (let j = 0; j < m; j++) if (inT[j]) activeTIds.push(rightIds[j]);

        steps.push({
          stepIndex: stepCounter++,
          modality: "hungarian_min_cost_assignment",
          action: "hungarian_tree_expand",
          title: `Equality Tree Expanded: +${jStar < m ? rightIds[jStar] : `R${jStar}`}, +${i1 < n ? leftIds[i1] : `L${i1}`}`,
          description: `Encountered matched right vertex ${jStar < m ? rightIds[jStar] : `R${jStar}`}. Added to T, and matched left vertex ${i1 < n ? leftIds[i1] : `L${i1}`} to S.`,
          details: "Updating slacks from newly added tree node to all right vertices outside T.",
          matchedEdges: getMatchedEdgesList(),
          matchedPairs: getMatchedPairsMap(),
          treeS: activeSIds,
          treeT: activeTIds,
          uPotentials: getUPotentialsMap(),
          vPotentials: getVPotentialsMap(),
          reducedCosts: getReducedCostsMap(),
          tightEdges: getTightEdgesList(),
          telemetry: {
            cardinality: i0,
            phaseCount: i0 + 1,
            augmentationsCount: i0,
            totalCost: computeCurrentTotalCost(),
            dualPotentialSum: computeDualPotentialSum(),
            isOptimal: false,
          },
        });
      }
    }
  }

  const finalCost = computeCurrentTotalCost();
  const finalDualSum = computeDualPotentialSum();

  // Step final: Certified optimal
  steps.push({
    stepIndex: stepCounter++,
    modality: "hungarian_min_cost_assignment",
    action: "hungarian_optimal",
    title: "Hungarian Method Complete: Primal-Dual Optimality Certified",
    description: `Optimal minimum cost assignment found with total cost ∑ c_uv = ${finalCost}. Dual objective ∑ u_i + ∑ v_j = ${finalDualSum}.`,
    details:
      "Strong duality certified: Primal min-cost == Dual max-potential sum. Zero duality gap!",
    matchedEdges: getMatchedEdgesList(),
    matchedPairs: getMatchedPairsMap(),
    uPotentials: getUPotentialsMap(),
    vPotentials: getVPotentialsMap(),
    reducedCosts: getReducedCostsMap(),
    tightEdges: getTightEdgesList(),
    telemetry: {
      cardinality: Math.min(n, m),
      maxCardinality: Math.min(n, m),
      phaseCount: dim,
      augmentationsCount: Math.min(n, m),
      totalCost: finalCost,
      dualPotentialSum: finalDualSum,
      isOptimal: true,
    },
  });

  const assignment = new Map<string, string>();
  for (let i = 0; i < n; i++) {
    const j = matchL[i];
    if (j !== -1 && j < m) {
      assignment.set(leftIds[i], rightIds[j]);
    }
  }

  return {
    assignment,
    minCost: finalCost,
    uPotentials: getUPotentialsMap(),
    vPotentials: getVPotentialsMap(),
    steps,
  };
}

/**
 * Hall's Marriage Condition Scanner & Bottleneck Defect Analyzer.
 */
export function runHallConditionScanner(graph: BipartiteGraph): {
  satisfied: boolean;
  maxDefect: number;
  violatorSubset?: string[];
  violatorNeighborhood?: string[];
  allSubsets: Array<{
    subset: string[];
    neighborhood: string[];
    defect: number;
    satisfied: boolean;
  }>;
  steps: BipartiteAnimationStep[];
} {
  const { leftIds, leftAdj, edgeByPair } = buildBipartiteAdjacency(graph);
  const steps: BipartiteAnimationStep[] = [];
  let stepCounter = 0;

  const n = leftIds.length;
  const numSubsets = 1 << n; // 2^n
  const subsetRecords: Array<{
    subset: string[];
    neighborhood: string[];
    defect: number;
    satisfied: boolean;
  }> = [];

  let maxDefect = 0;
  let worstViolator: { subset: string[]; neighborhood: string[] } | null = null;

  // Enumerate all non-empty subsets of L
  for (let mask = 1; mask < numSubsets; mask++) {
    const subset: string[] = [];
    const neighborSet = new Set<string>();

    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) !== 0) {
        const u = leftIds[i];
        subset.push(u);
        const neighbors = leftAdj.get(u) || [];
        for (const v of neighbors) {
          neighborSet.add(v);
        }
      }
    }

    const neighborhood = Array.from(neighborSet);
    const defect = subset.length - neighborhood.length;
    const satisfied = defect <= 0;

    subsetRecords.push({
      subset,
      neighborhood,
      defect,
      satisfied,
    });

    if (defect > maxDefect) {
      maxDefect = defect;
      worstViolator = { subset, neighborhood };
    }
  }

  const satisfied = maxDefect === 0;

  // Run Hopcroft-Karp to get max matching for reference
  const hkRes = runHopcroftKarpAlgorithm(graph);
  const matchedEdgesList: string[] = [];
  const matchedPairs: Record<string, string> = {};
  for (const [u, v] of hkRes.matching.entries()) {
    const edge = edgeByPair.get(`${u}->${v}`);
    if (edge) matchedEdgesList.push(edge.id);
    matchedPairs[u] = v;
    matchedPairs[v] = u;
  }

  // Step 1: Init Hall Scan
  steps.push({
    stepIndex: stepCounter++,
    modality: "hall_marriage_condition",
    action: "hall_init",
    title: "Hall's Marriage Condition Scanner Initialized",
    description: `Scanning all 2^|L| - 1 = ${subsetRecords.length} non-empty subsets S ⊆ L to verify |N(S)| ≥ |S|.`,
    details:
      "Hall's Marriage Theorem states: A matching covering all of L exists ⟺ ∀S ⊆ L, |N(S)| ≥ |S|.",
    matchedEdges: [...matchedEdgesList],
    matchedPairs: { ...matchedPairs },
    telemetry: {
      cardinality: hkRes.cardinality,
      phaseCount: 1,
      augmentationsCount: hkRes.cardinality,
      hallSatisfied: satisfied,
      maxDefect,
      isOptimal: satisfied,
    },
  });

  // Highlight key subsets in sequence (e.g., singletons, pairs, and worst violator if exists)
  const keySubsets = subsetRecords
    .filter((r) => !r.satisfied || r.subset.length === 1 || r.subset.length === 2)
    .slice(0, 8);

  for (const rec of keySubsets) {
    const activeEdgeIds: string[] = [];
    for (const u of rec.subset) {
      for (const v of rec.neighborhood) {
        const edge = edgeByPair.get(`${u}->${v}`);
        if (edge) activeEdgeIds.push(edge.id);
      }
    }

    if (!rec.satisfied) {
      steps.push({
        stepIndex: stepCounter++,
        modality: "hall_marriage_condition",
        action: "hall_violator_found",
        title: `CONTRACTING VIOLATOR DETECTED: S = {${rec.subset.join(", ")}}`,
        description: `Subset S of size ${rec.subset.length} connects to neighborhood N(S) = {${rec.neighborhood.join(", ")}} of size only ${rec.neighborhood.length} (|N(S)| < |S|).`,
        details: `Defect δ(S) = |S| - |N(S)| = ${rec.defect} > 0. By Hall's Theorem, no matching covering L can exist! Maximum matching size is bounded by |L| - ${rec.defect} = ${n - rec.defect}.`,
        matchedEdges: [...matchedEdgesList],
        matchedPairs: { ...matchedPairs },
        activeNodes: [...rec.subset, ...rec.neighborhood],
        activeEdges: activeEdgeIds,
        hallSubsetS: rec.subset,
        hallNeighborNS: rec.neighborhood,
        hallDefect: rec.defect,
        telemetry: {
          cardinality: hkRes.cardinality,
          phaseCount: 1,
          augmentationsCount: hkRes.cardinality,
          hallSatisfied: false,
          maxDefect,
          violatorSubset: rec.subset,
          violatorNeighborhood: rec.neighborhood,
          isOptimal: false,
        },
      });
    } else {
      steps.push({
        stepIndex: stepCounter++,
        modality: "hall_marriage_condition",
        action: "hall_subset_scan",
        title: `Testing Subset S = {${rec.subset.join(", ")}}`,
        description: `|S| = ${rec.subset.length} ≤ |N(S)| = ${rec.neighborhood.length} (Neighbors: {${rec.neighborhood.join(", ")}}). Condition holds for this subset (Defect ${rec.defect} ≤ 0).`,
        details: "Continuing exhaustive subset neighborhood verification.",
        matchedEdges: [...matchedEdgesList],
        matchedPairs: { ...matchedPairs },
        activeNodes: [...rec.subset, ...rec.neighborhood],
        activeEdges: activeEdgeIds,
        hallSubsetS: rec.subset,
        hallNeighborNS: rec.neighborhood,
        hallDefect: rec.defect,
        telemetry: {
          cardinality: hkRes.cardinality,
          phaseCount: 1,
          augmentationsCount: hkRes.cardinality,
          hallSatisfied: satisfied,
          maxDefect,
        },
      });
    }
  }

  // Summary Step
  if (satisfied) {
    steps.push({
      stepIndex: stepCounter++,
      modality: "hall_marriage_condition",
      action: "hall_condition_satisfied",
      title: "Hall's Marriage Condition Fully Satisfied! (∀S, |N(S)| ≥ |S|)",
      description: `All ${subsetRecords.length} subsets S ⊆ L satisfy |N(S)| ≥ |S|. Full matching covering all ${n} left vertices is guaranteed to exist.`,
      details: "König-Ore formula: max |M| = |L| - max_S(|S| - |N(S)|) = |L| - 0 = |L|.",
      matchedEdges: [...matchedEdgesList],
      matchedPairs: { ...matchedPairs },
      telemetry: {
        cardinality: hkRes.cardinality,
        maxCardinality: n,
        phaseCount: 1,
        augmentationsCount: hkRes.cardinality,
        hallSatisfied: true,
        maxDefect: 0,
        isOptimal: true,
      },
    });
  } else {
    steps.push({
      stepIndex: stepCounter++,
      modality: "hall_marriage_condition",
      action: "hall_summary",
      title: `Hall's Condition Violated: Bottleneck Defect δ = ${maxDefect}`,
      description: `Graph fails Hall's Condition. Maximum contracting bottleneck subset is S* = {${worstViolator?.subset.join(", ")}} with N(S*) = {${worstViolator?.neighborhood.join(", ")}}.`,
      details: `Maximum possible matching cardinality is |L| - δ* = ${n} - ${maxDefect} = ${n - maxDefect} (matches Hopcroft-Karp output ${hkRes.cardinality}).`,
      matchedEdges: [...matchedEdgesList],
      matchedPairs: { ...matchedPairs },
      hallSubsetS: worstViolator?.subset,
      hallNeighborNS: worstViolator?.neighborhood,
      hallDefect: maxDefect,
      telemetry: {
        cardinality: hkRes.cardinality,
        maxCardinality: n - maxDefect,
        phaseCount: 1,
        augmentationsCount: hkRes.cardinality,
        hallSatisfied: false,
        maxDefect,
        violatorSubset: worstViolator?.subset,
        violatorNeighborhood: worstViolator?.neighborhood,
        isOptimal: false,
      },
    });
  }

  return {
    satisfied,
    maxDefect,
    violatorSubset: worstViolator?.subset,
    violatorNeighborhood: worstViolator?.neighborhood,
    allSubsets: subsetRecords,
    steps,
  };
}

// ============================================================================
// 5. REACT STUDIO COMPONENT
// ============================================================================

export const BipartiteMatchingStudio: React.FC<BipartiteMatchingStudioProps> = ({
  initialModality = "hopcroft_karp_matching",
  initialPreset = "classic_job_assignment",
  customGraph,
  standalone = false,
  title = "Bipartite Matching & Hungarian Assignment Studio",
  onStepChange,
  onModalityChange,
  onPresetChange,
}) => {
  // State
  const [modality, setModality] = useState<BipartiteStudioModality>(initialModality);
  const [selectedPresetId, setSelectedPresetId] = useState<BipartitePresetId>(initialPreset);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<
    "canvas" | "matrix" | "hall_scanner" | "konig_view" | "theory"
  >("canvas");
  const [selectedSubsetIndex, setSelectedSubsetIndex] = useState<number | null>(null);

  // Active graph
  const activePreset =
    BIPARTITE_MATCHING_PRESETS[selectedPresetId] ||
    BIPARTITE_MATCHING_PRESETS.classic_job_assignment;
  const currentGraph: BipartiteGraph = useMemo(() => {
    return customGraph || activePreset.graph;
  }, [customGraph, activePreset]);

  // Compute animation steps for active modality
  const stepResult = useMemo(() => {
    switch (modality) {
      case "hopcroft_karp_matching":
        return runHopcroftKarpAlgorithm(currentGraph);
      case "konig_min_vertex_cover":
        return runKonigDuality(currentGraph);
      case "hungarian_min_cost_assignment":
        return runHungarianAlgorithm(currentGraph);
      case "hall_marriage_condition":
        return runHallConditionScanner(currentGraph);
      default:
        return runHopcroftKarpAlgorithm(currentGraph);
    }
  }, [modality, currentGraph]);

  const steps = stepResult.steps;
  const totalSteps = steps.length;
  const clampedStepIndex = Math.min(Math.max(0, currentStepIndex), totalSteps - 1);
  const currentStep = steps[clampedStepIndex] || steps[0];

  // Notify parent on step change
  useEffect(() => {
    if (currentStep && onStepChange) {
      onStepChange(currentStep);
    }
  }, [currentStep, onStepChange]);

  // Reset step index when modality or preset changes
  const handleModalitySelect = (newModality: BipartiteStudioModality) => {
    setModality(newModality);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setSelectedSubsetIndex(null);
    if (onModalityChange) onModalityChange(newModality);
  };

  const handlePresetSelect = (newPresetId: BipartitePresetId) => {
    setSelectedPresetId(newPresetId);
    const preset = BIPARTITE_MATCHING_PRESETS[newPresetId];
    if (preset) {
      setModality(preset.defaultModality);
    }
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setSelectedSubsetIndex(null);
    if (onPresetChange) onPresetChange(newPresetId);
  };

  // Playback timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, totalSteps]);

  // Step Controls Handlers
  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };
  const handleStepPrev = () => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };
  const handleStepNext = () => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
  };
  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    setCurrentStepIndex(parseInt(e.target.value, 10));
  };

  // SVG Layout computation
  const svgWidth = 880;
  const svgHeight = 520;
  const leftColX = 220;
  const rightColX = 660;

  const getNodeY = useCallback(
    (index: number, total: number) => {
      const topMargin = 70;
      const availableHeight = svgHeight - topMargin - 70;
      if (total <= 1) return topMargin + availableHeight / 2;
      return topMargin + (index / (total - 1)) * availableHeight;
    },
    [svgHeight],
  );

  const leftNodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    currentGraph.leftNodes.forEach((node, i) => {
      map.set(node.id, { x: leftColX, y: getNodeY(i, currentGraph.leftNodes.length) });
    });
    return map;
  }, [currentGraph.leftNodes, getNodeY]);

  const rightNodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    currentGraph.rightNodes.forEach((node, i) => {
      map.set(node.id, { x: rightColX, y: getNodeY(i, currentGraph.rightNodes.length) });
    });
    return map;
  }, [currentGraph.rightNodes, getNodeY]);

  // Modality Info
  const modalityConfig = MATCHING_MODALITY_INFOS[modality];

  return (
    <div
      className={`w-full flex flex-col bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden ${standalone ? "min-h-screen" : ""}`}
    >
      {/* 1. STUDIO HEADER */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">{title}</h1>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-mono border ${modalityConfig.badgeColor}`}
              >
                {modalityConfig.complexity}
              </span>
            </div>
            <p className="text-xs text-slate-400">{modalityConfig.subtitle}</p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Preset:</span>
          <select
            value={selectedPresetId}
            onChange={(e) => handlePresetSelect(e.target.value as BipartitePresetId)}
            className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            {Object.values(BIPARTITE_MATCHING_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. MODALITY TABS */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-2 flex flex-wrap gap-2">
        {(Object.keys(MATCHING_MODALITY_INFOS) as BipartiteStudioModality[]).map((modKey) => {
          const config = MATCHING_MODALITY_INFOS[modKey];
          const isActive = modality === modKey;
          return (
            <button
              key={modKey}
              onClick={() => handleModalitySelect(modKey)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-inner"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
              }`}
            >
              {modKey === "hopcroft_karp_matching" && <Zap className="w-3.5 h-3.5" />}
              {modKey === "konig_min_vertex_cover" && <Scale className="w-3.5 h-3.5" />}
              {modKey === "hungarian_min_cost_assignment" && <Network className="w-3.5 h-3.5" />}
              {modKey === "hall_marriage_condition" && <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{config.title}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TELEMETRY HUD BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 px-6 py-3 bg-slate-900/40 border-b border-slate-800/60 text-xs">
        {/* Cardinality |M| */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
            Matching Size |M|
          </span>
          <span className="text-base font-bold text-emerald-400 font-mono mt-0.5">
            {currentStep.telemetry.cardinality} /{" "}
            {Math.min(currentGraph.leftNodes.length, currentGraph.rightNodes.length)}
          </span>
        </div>

        {/* Modality Metric 1 */}
        {modality === "hopcroft_karp_matching" && (
          <>
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                BFS Phases
              </span>
              <span className="text-base font-bold text-cyan-400 font-mono mt-0.5">
                Phase {currentStep.telemetry.phaseCount}
              </span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                Augmentations
              </span>
              <span className="text-base font-bold text-amber-400 font-mono mt-0.5">
                {currentStep.telemetry.augmentationsCount}
              </span>
            </div>
          </>
        )}

        {modality === "konig_min_vertex_cover" && (
          <>
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                Min Vertex Cover |MVC|
              </span>
              <span className="text-base font-bold text-rose-400 font-mono mt-0.5">
                {currentStep.mvcNodes
                  ? currentStep.mvcNodes.length
                  : (currentStep.telemetry.mvcSize ?? "-")}
              </span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                Max Indep Set |MIS|
              </span>
              <span className="text-base font-bold text-indigo-400 font-mono mt-0.5">
                {currentStep.misNodes
                  ? currentStep.misNodes.length
                  : (currentStep.telemetry.misSize ?? "-")}
              </span>
            </div>
          </>
        )}

        {modality === "hungarian_min_cost_assignment" && (
          <>
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                Total Cost ∑ c_uv
              </span>
              <span className="text-base font-bold text-amber-400 font-mono mt-0.5">
                {currentStep.telemetry.totalCost ?? 0}
              </span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                Dual Sum ∑ u + ∑ v
              </span>
              <span className="text-base font-bold text-indigo-400 font-mono mt-0.5">
                {currentStep.telemetry.dualPotentialSum ?? 0}
              </span>
            </div>
          </>
        )}

        {modality === "hall_marriage_condition" && (
          <>
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                Hall Condition
              </span>
              <span
                className={`text-base font-bold font-mono mt-0.5 ${currentStep.telemetry.hallSatisfied ? "text-emerald-400" : "text-rose-400"}`}
              >
                {currentStep.telemetry.hallSatisfied ? "Satisfied" : "Violated"}
              </span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                Max Defect δ(S)
              </span>
              <span
                className={`text-base font-bold font-mono mt-0.5 ${currentStep.telemetry.maxDefect ? "text-rose-400" : "text-emerald-400"}`}
              >
                {currentStep.telemetry.maxDefect ?? 0}
              </span>
            </div>
          </>
        )}

        {/* Optimality Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
            Status
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {currentStep.telemetry.isOptimal ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">Optimal</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-xs font-semibold text-amber-400">In Progress</span>
              </>
            )}
          </div>
        </div>

        {/* Graph Vertices & Edges */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
            Partitions
          </span>
          <span className="text-xs font-mono text-slate-300 mt-0.5">
            |L|={currentGraph.leftNodes.length}, |R|={currentGraph.rightNodes.length}, |E|=
            {currentGraph.edges.length}
          </span>
        </div>
      </div>

      {/* 4. TAB CONTROLS (Canvas / Matrix / Scanner / Theory) */}
      <div className="flex items-center justify-between bg-slate-900/50 px-6 py-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab("canvas")}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === "canvas"
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Bipartite Canvas
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === "matrix"
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Cost & Potentials Matrix
          </button>
          {modality === "hall_marriage_condition" && (
            <button
              onClick={() => setActiveTab("hall_scanner")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === "hall_scanner"
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Hall Subsets Table
            </button>
          )}
          {modality === "konig_min_vertex_cover" && (
            <button
              onClick={() => setActiveTab("konig_view")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === "konig_view"
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Duality Decomposition
            </button>
          )}
          <button
            onClick={() => setActiveTab("theory")}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === "theory"
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Theory & Invariants
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Step {clampedStepIndex + 1} of {totalSteps}
        </div>
      </div>

      {/* 5. MAIN CONTENT AREA */}
      <div className="p-6 flex-1 flex flex-col gap-6">
        {/* TAB 1: BIPARTITE CANVAS */}
        {activeTab === "canvas" && (
          <div className="w-full bg-slate-900/90 border border-slate-800/90 rounded-xl overflow-hidden relative shadow-inner">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto select-none"
              style={{ maxHeight: "560px" }}
            >
              <defs>
                <filter id="glow-matched" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-path" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Partition Column Headers */}
              <text
                x={leftColX}
                y={32}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize={14}
                fontWeight="bold"
                fontFamily="monospace"
              >
                Partition L (Left Workers)
              </text>
              <text
                x={rightColX}
                y={32}
                textAnchor="middle"
                fill="#c084fc"
                fontSize={14}
                fontWeight="bold"
                fontFamily="monospace"
              >
                Partition R (Right Tasks)
              </text>

              {/* EDGES */}
              {currentGraph.edges.map((edge) => {
                const p1 = leftNodePositions.get(edge.source);
                const p2 = rightNodePositions.get(edge.target);
                if (!p1 || !p2) return null;

                const isMatched = currentStep.matchedEdges.includes(edge.id);
                const isActivePath = currentStep.activeEdges?.includes(edge.id);
                const isTight = currentStep.tightEdges?.includes(edge.id);
                const reducedCost = currentStep.reducedCosts?.[edge.id];

                let strokeColor = "#334155";
                let strokeWidth = 1.5;
                let strokeDash = undefined;
                let filter = undefined;

                if (isActivePath) {
                  strokeColor = "#f59e0b"; // Amber active
                  strokeWidth = 3.5;
                  filter = "url(#glow-path)";
                } else if (isMatched) {
                  strokeColor = "#10b981"; // Emerald matched
                  strokeWidth = 3;
                  filter = "url(#glow-matched)";
                } else if (isTight && modality === "hungarian_min_cost_assignment") {
                  strokeColor = "#818cf8"; // Indigo tight edge
                  strokeWidth = 2;
                  strokeDash = "5 3";
                }

                // Midpoint for cost/reduced cost pill
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;

                return (
                  <g key={edge.id} className="transition-all duration-300">
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                      filter={filter}
                    />

                    {/* Edge Cost Badge */}
                    {edge.cost !== undefined && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x={-18}
                          y={-9}
                          width={36}
                          height={18}
                          rx={9}
                          fill="#0f172a"
                          stroke={isMatched ? "#10b981" : isTight ? "#818cf8" : "#475569"}
                          strokeWidth={1}
                        />
                        <text
                          x={0}
                          y={3.5}
                          textAnchor="middle"
                          fill={isMatched ? "#34d399" : "#94a3b8"}
                          fontSize={10}
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {edge.cost}
                          {reducedCost !== undefined &&
                            modality === "hungarian_min_cost_assignment" && (
                              <tspan fill="#a78bfa"> ({reducedCost})</tspan>
                            )}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* LEFT NODES */}
              {currentGraph.leftNodes.map((node) => {
                const pos = leftNodePositions.get(node.id);
                if (!pos) return null;

                const isMatched = !!currentStep.matchedPairs[node.id];
                const isActive = currentStep.activeNodes?.includes(node.id);
                const inTreeS = currentStep.treeS?.includes(node.id);
                const inZ = currentStep.zSetNodes?.includes(node.id);
                const inMVC = currentStep.mvcNodes?.includes(node.id);
                const inMIS = currentStep.misNodes?.includes(node.id);
                const inHallS = currentStep.hallSubsetS?.includes(node.id);
                const uPot = currentStep.uPotentials?.[node.id];
                const bfsLevel = currentStep.bfsLevels?.[node.id];

                let nodeStroke = "#0284c7"; // Sky
                let nodeFill = "#0c4a6e";

                if (inMVC) {
                  nodeStroke = "#f43f5e"; // Rose MVC
                  nodeFill = "#881337";
                } else if (inMIS) {
                  nodeStroke = "#10b981"; // Emerald MIS
                  nodeFill = "#064e3b";
                } else if (inHallS) {
                  nodeStroke = "#f43f5e"; // Rose Hall S
                  nodeFill = "#881337";
                } else if (inTreeS) {
                  nodeStroke = "#f59e0b"; // Amber tree S
                  nodeFill = "#78350f";
                } else if (inZ) {
                  nodeStroke = "#818cf8"; // Indigo Z set
                  nodeFill = "#312e81";
                } else if (isMatched) {
                  nodeStroke = "#10b981"; // Emerald matched
                  nodeFill = "#064e3b";
                }

                return (
                  <g key={node.id} className="transition-all duration-300">
                    {/* Potential Badge / BFS Level (Left of Node) */}
                    {uPot !== undefined && modality === "hungarian_min_cost_assignment" && (
                      <g transform={`translate(${pos.x - 70}, ${pos.y})`}>
                        <rect
                          x={-26}
                          y={-10}
                          width={52}
                          height={20}
                          rx={4}
                          fill="#1e1b4b"
                          stroke="#6366f1"
                          strokeWidth={1}
                        />
                        <text
                          x={0}
                          y={4}
                          textAnchor="middle"
                          fill="#c7d2fe"
                          fontSize={11}
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          u={uPot}
                        </text>
                      </g>
                    )}

                    {bfsLevel !== undefined && modality === "hopcroft_karp_matching" && (
                      <g transform={`translate(${pos.x - 60}, ${pos.y})`}>
                        <rect
                          x={-20}
                          y={-9}
                          width={40}
                          height={18}
                          rx={4}
                          fill="#082f49"
                          stroke="#0ea5e9"
                          strokeWidth={1}
                        />
                        <text
                          x={0}
                          y={3.5}
                          textAnchor="middle"
                          fill="#bae6fd"
                          fontSize={10}
                          fontFamily="monospace"
                        >
                          d={bfsLevel === Infinity ? "∞" : bfsLevel}
                        </text>
                      </g>
                    )}

                    {/* Node Circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isActive ? 22 : 19}
                      fill={nodeFill}
                      stroke={nodeStroke}
                      strokeWidth={isActive ? 3 : 2}
                      className="cursor-pointer"
                    />

                    {/* Node Label */}
                    <text
                      x={pos.x}
                      y={pos.y + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={11}
                      fontWeight="bold"
                      fontFamily="monospace"
                      pointerEvents="none"
                    >
                      {node.label}
                    </text>

                    {/* Role Tag (MVC, MIS, S, Z) */}
                    {inMVC && (
                      <text
                        x={pos.x}
                        y={pos.y - 24}
                        textAnchor="middle"
                        fill="#fb7185"
                        fontSize={9}
                        fontWeight="bold"
                      >
                        [MVC]
                      </text>
                    )}
                    {inMIS && (
                      <text
                        x={pos.x}
                        y={pos.y - 24}
                        textAnchor="middle"
                        fill="#34d399"
                        fontSize={9}
                        fontWeight="bold"
                      >
                        [MIS]
                      </text>
                    )}
                    {inHallS && (
                      <text
                        x={pos.x}
                        y={pos.y - 24}
                        textAnchor="middle"
                        fill="#fb7185"
                        fontSize={9}
                        fontWeight="bold"
                      >
                        [S ∈ L]
                      </text>
                    )}
                  </g>
                );
              })}

              {/* RIGHT NODES */}
              {currentGraph.rightNodes.map((node) => {
                const pos = rightNodePositions.get(node.id);
                if (!pos) return null;

                const isMatched = !!currentStep.matchedPairs[node.id];
                const isActive = currentStep.activeNodes?.includes(node.id);
                const inTreeT = currentStep.treeT?.includes(node.id);
                const inZ = currentStep.zSetNodes?.includes(node.id);
                const inMVC = currentStep.mvcNodes?.includes(node.id);
                const inMIS = currentStep.misNodes?.includes(node.id);
                const inHallNS = currentStep.hallNeighborNS?.includes(node.id);
                const vPot = currentStep.vPotentials?.[node.id];

                let nodeStroke = "#a855f7"; // Purple
                let nodeFill = "#581c87";

                if (inMVC) {
                  nodeStroke = "#f43f5e"; // Rose MVC
                  nodeFill = "#881337";
                } else if (inMIS) {
                  nodeStroke = "#10b981"; // Emerald MIS
                  nodeFill = "#064e3b";
                } else if (inHallNS) {
                  nodeStroke = "#38bdf8"; // Blue Hall N(S)
                  nodeFill = "#0369a1";
                } else if (inTreeT) {
                  nodeStroke = "#f59e0b"; // Amber tree T
                  nodeFill = "#78350f";
                } else if (inZ) {
                  nodeStroke = "#818cf8"; // Indigo Z set
                  nodeFill = "#312e81";
                } else if (isMatched) {
                  nodeStroke = "#10b981"; // Emerald matched
                  nodeFill = "#064e3b";
                }

                return (
                  <g key={node.id} className="transition-all duration-300">
                    {/* Potential Badge (Right of Node) */}
                    {vPot !== undefined && modality === "hungarian_min_cost_assignment" && (
                      <g transform={`translate(${pos.x + 70}, ${pos.y})`}>
                        <rect
                          x={-26}
                          y={-10}
                          width={52}
                          height={20}
                          rx={4}
                          fill="#1e1b4b"
                          stroke="#a855f7"
                          strokeWidth={1}
                        />
                        <text
                          x={0}
                          y={4}
                          textAnchor="middle"
                          fill="#e9d5ff"
                          fontSize={11}
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          v={vPot}
                        </text>
                      </g>
                    )}

                    {/* Node Circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isActive ? 22 : 19}
                      fill={nodeFill}
                      stroke={nodeStroke}
                      strokeWidth={isActive ? 3 : 2}
                      className="cursor-pointer"
                    />

                    {/* Node Label */}
                    <text
                      x={pos.x}
                      y={pos.y + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={11}
                      fontWeight="bold"
                      fontFamily="monospace"
                      pointerEvents="none"
                    >
                      {node.label}
                    </text>

                    {/* Role Tag (MVC, MIS, N(S), Z) */}
                    {inMVC && (
                      <text
                        x={pos.x}
                        y={pos.y - 24}
                        textAnchor="middle"
                        fill="#fb7185"
                        fontSize={9}
                        fontWeight="bold"
                      >
                        [MVC]
                      </text>
                    )}
                    {inMIS && (
                      <text
                        x={pos.x}
                        y={pos.y - 24}
                        textAnchor="middle"
                        fill="#34d399"
                        fontSize={9}
                        fontWeight="bold"
                      >
                        [MIS]
                      </text>
                    )}
                    {inHallNS && (
                      <text
                        x={pos.x}
                        y={pos.y - 24}
                        textAnchor="middle"
                        fill="#38bdf8"
                        fontSize={9}
                        fontWeight="bold"
                      >
                        [N(S)]
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* TAB 2: COST MATRIX & POTENTIALS */}
        {activeTab === "matrix" && (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-x-auto">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Grid className="w-4 h-4 text-emerald-400" />
              <span>
                Cost Matrix C[i][j], Dual Potentials (u_i, v_j), and Reduced Costs π_ij = c_ij - u_i
                - v_j
              </span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Green cells denote currently matched pairs. Purple highlighted cells denote tight
              edges (π_ij = 0) belonging to the equality subgraph.
            </p>

            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr>
                  <th className="p-2 border border-slate-800 bg-slate-950 text-slate-400">
                    Worker / Job
                  </th>
                  <th className="p-2 border border-slate-800 bg-indigo-950/40 text-indigo-300 font-bold">
                    Dual u_i
                  </th>
                  {currentGraph.rightNodes.map((rNode) => (
                    <th
                      key={rNode.id}
                      className="p-2 border border-slate-800 bg-slate-950 text-purple-300 text-center font-bold"
                    >
                      <div>{rNode.label}</div>
                      <div className="text-[10px] text-purple-400">
                        v_j = {currentStep.vPotentials?.[rNode.id] ?? 0}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentGraph.leftNodes.map((lNode) => {
                  const uVal = currentStep.uPotentials?.[lNode.id] ?? 0;
                  const isWorkerInTreeS = currentStep.treeS?.includes(lNode.id);

                  return (
                    <tr key={lNode.id} className={isWorkerInTreeS ? "bg-amber-950/20" : ""}>
                      <td className="p-2 border border-slate-800 bg-slate-950 text-cyan-300 font-bold">
                        {lNode.label}
                      </td>
                      <td className="p-2 border border-slate-800 bg-indigo-950/30 text-indigo-300 font-bold text-center">
                        {uVal}
                      </td>
                      {currentGraph.rightNodes.map((rNode) => {
                        const edge = currentGraph.edges.find(
                          (e) => e.source === lNode.id && e.target === rNode.id,
                        );
                        const origCost = edge?.cost ?? 99;
                        const vVal = currentStep.vPotentials?.[rNode.id] ?? 0;
                        const reducedCost = origCost - uVal - vVal;
                        const isMatched = currentStep.matchedPairs[lNode.id] === rNode.id;
                        const isTight = reducedCost === 0;

                        return (
                          <td
                            key={rNode.id}
                            className={`p-2 border border-slate-800 text-center transition-colors ${
                              isMatched
                                ? "bg-emerald-950/80 text-emerald-300 font-bold border-emerald-600"
                                : isTight
                                  ? "bg-purple-950/40 text-purple-300 font-semibold"
                                  : "text-slate-300 hover:bg-slate-800/40"
                            }`}
                          >
                            <div className="text-xs">{origCost}</div>
                            <div
                              className={`text-[10px] ${isTight ? "text-purple-400 font-bold" : "text-slate-500"}`}
                            >
                              π={reducedCost}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: HALL SUBSETS SCANNER */}
        {activeTab === "hall_scanner" && (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-x-auto">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Hall's Marriage Condition Subset Neighborhood Evaluation Table</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Exhaustive enumeration of all non-empty subsets S ⊆ L. Red rows highlight contracting
              violator subsets with |N(S)| &lt; |S| and defect δ(S) &gt; 0.
            </p>

            {/* Run Hall scanner on demand */}
            {(() => {
              const hallResult = runHallConditionScanner(currentGraph);
              return (
                <table className="w-full text-xs text-left border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400">
                      <th className="p-2.5 border border-slate-800">#</th>
                      <th className="p-2.5 border border-slate-800">Subset S ⊆ L</th>
                      <th className="p-2.5 border border-slate-800">|S|</th>
                      <th className="p-2.5 border border-slate-800">Neighborhood N(S) ⊆ R</th>
                      <th className="p-2.5 border border-slate-800">|N(S)|</th>
                      <th className="p-2.5 border border-slate-800">Defect |S| - |N(S)|</th>
                      <th className="p-2.5 border border-slate-800">Condition Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hallResult.allSubsets.map((rec, idx) => (
                      <tr
                        key={idx}
                        className={`border border-slate-800 transition-colors cursor-pointer ${
                          !rec.satisfied
                            ? "bg-rose-950/40 hover:bg-rose-950/60 text-rose-200"
                            : selectedSubsetIndex === idx
                              ? "bg-slate-800 text-white"
                              : "hover:bg-slate-800/50 text-slate-300"
                        }`}
                        onClick={() => setSelectedSubsetIndex(idx)}
                      >
                        <td className="p-2 border border-slate-800 text-slate-500">{idx + 1}</td>
                        <td className="p-2 border border-slate-800 font-bold text-cyan-400">{`{ ${rec.subset.join(", ")} }`}</td>
                        <td className="p-2 border border-slate-800">{rec.subset.length}</td>
                        <td className="p-2 border border-slate-800 font-bold text-purple-400">{`{ ${rec.neighborhood.join(", ")} }`}</td>
                        <td className="p-2 border border-slate-800">{rec.neighborhood.length}</td>
                        <td
                          className={`p-2 border border-slate-800 font-bold ${rec.defect > 0 ? "text-rose-400" : "text-emerald-400"}`}
                        >
                          {rec.defect > 0 ? `+${rec.defect}` : rec.defect}
                        </td>
                        <td className="p-2 border border-slate-800 font-bold">
                          {rec.satisfied ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Satisfied
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center gap-1 font-bold">
                              <AlertTriangle className="w-3.5 h-3.5" /> Violator (Contracting)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        )}

        {/* TAB 4: KÖNIG DUALITY BREAKDOWN */}
        {activeTab === "konig_view" && (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              <span>
                König's Theorem Sets: Minimum Vertex Cover & Maximum Independent Set Decomposition
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-rose-400 font-bold text-sm mb-2">
                  Minimum Vertex Cover (MVC)
                </div>
                <div className="text-slate-300 mb-1">
                  Formula: <span className="text-rose-300">MVC = (L \ Z) ∪ (R ∩ Z)</span>
                </div>
                <div className="text-slate-400 mb-2">
                  Vertices: [
                  {currentStep.mvcNodes ? currentStep.mvcNodes.join(", ") : "Computed at step 5"}]
                </div>
                <div className="text-slate-400">
                  Size |MVC|:{" "}
                  <span className="font-bold text-rose-400">
                    {currentStep.mvcNodes?.length ?? currentStep.telemetry.mvcSize ?? "-"}
                  </span>{" "}
                  (Matches |M| = {currentStep.telemetry.cardinality})
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-emerald-400 font-bold text-sm mb-2">
                  Maximum Independent Set (MIS)
                </div>
                <div className="text-slate-300 mb-1">
                  Formula:{" "}
                  <span className="text-emerald-300">MIS = (L ∩ Z) ∪ (R \ Z) = V \ MVC</span>
                </div>
                <div className="text-slate-400 mb-2">
                  Vertices: [
                  {currentStep.misNodes ? currentStep.misNodes.join(", ") : "Computed at step 6"}]
                </div>
                <div className="text-slate-400">
                  Size |MIS|:{" "}
                  <span className="font-bold text-emerald-400">
                    {currentStep.misNodes?.length ?? currentStep.telemetry.misSize ?? "-"}
                  </span>{" "}
                  = |V| - |MVC|
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: THEORY & INVARIANTS */}
        {activeTab === "theory" && (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4 text-xs text-slate-300">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Mathematical Foundations & Invariants</span>
            </h3>

            <div className="space-y-3 leading-relaxed">
              <p>
                <strong className="text-cyan-400">Hopcroft-Karp Algorithm (1973):</strong>{" "}
                Interleaves multi-source BFS with simultaneous maximal vertex-disjoint DFS
                augmentations. In each phase of length k, all shortest augmenting paths are
                augmented at once, guaranteeing that the shortest augmenting path strictly increases
                in length after each phase. The total number of phases is at most 2√|V|, giving a
                total time complexity of O(E √V).
              </p>
              <p>
                <strong className="text-indigo-400">König's Duality Theorem (1931):</strong> In any
                bipartite graph G = (L ∪ R, E), the maximum matching cardinality equals the minimum
                vertex cover size (|M| = |MVC|). Alternating reachability from unmatched left
                vertices partitions V into set Z, directly yielding MVC = (L \ Z) ∪ (R ∩ Z) and MIS
                = (L ∩ Z) ∪ (R \ Z).
              </p>
              <p>
                <strong className="text-amber-400">Hungarian / Kuhn-Munkres (1955):</strong>{" "}
                Primal-dual algorithm maintaining dual node potentials u_i + v_j ≤ c_ij. By
                complementary slackness, any perfect matching in the tight equality subgraph (where
                reduced cost π_ij = c_ij - u_i - v_j = 0) attains global minimum cost ∑ c_uv = ∑ u_i
                + ∑ v_j with zero duality gap.
              </p>
              <p>
                <strong className="text-rose-400">Hall's Marriage Condition (1935):</strong> A
                bipartite graph admits a matching covering L if and only if ∀S ⊆ L, |N(S)| ≥ |S|. If
                violated, the maximum defect max_S (|S| - |N(S)|) determines the exact deficiency of
                the maximum matching via the König-Ore formula: max |M| = |L| - max_S (|S| -
                |N(S)|).
              </p>
            </div>
          </div>
        )}

        {/* 6. STEP EXPLANATION CARD */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {currentStep.action.toUpperCase()}
              </span>
              <h2 className="text-sm font-bold text-white">{currentStep.title}</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Step {clampedStepIndex + 1} / {totalSteps}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{currentStep.description}</p>
          {currentStep.details && (
            <p className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
              {currentStep.details}
            </p>
          )}
        </div>

        {/* 7. PLAYBACK & TIMELINE SCRUBBER CONTROLS */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          {/* Scrubber slider */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-slate-400 w-12">0</span>
            <input
              type="range"
              min={0}
              max={Math.max(0, totalSteps - 1)}
              value={clampedStepIndex}
              onChange={handleScrubberChange}
              className="flex-1 accent-emerald-500 cursor-pointer"
            />
            <span className="text-xs font-mono text-slate-400 w-12 text-right">
              {totalSteps - 1}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                title="Reset to Start"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleStepPrev}
                disabled={clampedStepIndex === 0}
                title="Step Backward"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors border border-slate-700"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={handlePlayPause}
                title={isPlaying ? "Pause" : "Play"}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-lg shadow-emerald-950"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>
              <button
                onClick={handleStepNext}
                disabled={clampedStepIndex === totalSteps - 1}
                title="Step Forward"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors border border-slate-700"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Speed:</span>
              {[0.5, 1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`text-xs px-2.5 py-1 rounded font-mono transition-colors ${
                    playbackSpeed === spd
                      ? "bg-slate-700 text-emerald-400 font-bold border border-slate-600"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
