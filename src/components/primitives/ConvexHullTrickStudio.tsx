import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  TrendingUp,
  Zap,
  Table,
  Cpu,
  Plus,
  Trash2,
  GitBranch,
  CheckCircle2,
} from "lucide-react";

// ============================================================================
// 1. TYPES & CONTRACTS
// ============================================================================

export type CHTStudioModality =
  | "classic_monotonic_cht"
  | "dynamic_cht"
  | "li_chao_tree"
  | "knuth_quadrangle_dp";

export type OptimizationType = "min" | "max";

export interface CHTLine {
  readonly id: string;
  readonly m: number; // Slope
  readonly c: number; // Intercept: y = m * x + c
  readonly label?: string;
  readonly color?: string;
  readonly xStart?: number; // Active domain start
  readonly xEnd?: number; // Active domain end
  readonly isSegment?: boolean;
  readonly originalIndex?: number;
}

export interface LineIntersection {
  readonly x: number;
  readonly y: number;
  readonly parallel: boolean;
  readonly coincident: boolean;
}

export interface CHTQueryResult {
  readonly value: number;
  readonly optimalLine: CHTLine | null;
  readonly x: number;
  readonly stepCount: number;
  readonly index?: number;
  readonly path?: readonly string[];
}

// --- Classic Monotonic CHT Steps ---
export interface MonotonicCHTStep {
  readonly stepIndex: number;
  readonly phase: string;
  readonly title: string;
  readonly description: string;
  readonly candidateLine: CHTLine;
  readonly currentHull: readonly CHTLine[];
  readonly poppedLines: readonly CHTLine[];
  readonly action: "init" | "insert" | "pop" | "skip" | "finish";
  readonly intersectionX?: number;
  readonly prevIntersectionX?: number;
}

export interface MonotonicCHTResult {
  readonly hull: readonly CHTLine[];
  readonly breakpoints: readonly number[];
  readonly steps: readonly MonotonicCHTStep[];
  readonly type: OptimizationType;
}

// --- Dynamic CHT Steps ---
export interface DynamicCHTStep {
  readonly stepIndex: number;
  readonly phase: string;
  readonly title: string;
  readonly description: string;
  readonly candidateLine: CHTLine;
  readonly currentHull: readonly CHTLine[];
  readonly prunedLeftLines: readonly CHTLine[];
  readonly prunedRightLines: readonly CHTLine[];
  readonly action: "insert" | "reject_duplicate" | "reject_redundant" | "finish";
  readonly prevNeighbor?: CHTLine;
  readonly nextNeighbor?: CHTLine;
}

export interface DynamicCHTResult {
  readonly hull: readonly CHTLine[];
  readonly steps: readonly DynamicCHTStep[];
  readonly type: OptimizationType;
}

// --- Li Chao Segment Tree ---
export interface LiChaoNode {
  readonly id: string;
  readonly l: number;
  readonly r: number;
  readonly mid: number;
  readonly line: CHTLine | null;
  readonly leftChildId?: string | null;
  readonly rightChildId?: string | null;
  readonly left?: LiChaoNode | null;
  readonly right?: LiChaoNode | null;
}

export interface LiChaoTreeStep {
  readonly stepIndex: number;
  readonly phase: string;
  readonly title: string;
  readonly description: string;
  readonly line: CHTLine;
  readonly targetNodeId: string;
  readonly nodeInterval: readonly [number, number];
  readonly action:
    | "place_empty"
    | "swap_dominant"
    | "pushdown_left"
    | "pushdown_right"
    | "discard"
    | "segment_split"
    | "leaf_placed";
  readonly dominantLine: CHTLine;
  readonly pushedLine?: CHTLine;
}

export interface LiChaoTreeResult {
  readonly root: LiChaoNode | null;
  readonly nodes: readonly LiChaoNode[];
  readonly nodeCount: number;
  readonly maxDepth: number;
  readonly steps: readonly LiChaoTreeStep[];
  readonly domain: readonly [number, number];
  readonly type: OptimizationType;
}

// --- Knuth Quadrangle DP ---
export interface KnuthDPStep {
  readonly stepIndex: number;
  readonly phase: string;
  readonly title: string;
  readonly description: string;
  readonly i: number;
  readonly j: number;
  readonly len: number;
  readonly optLower: number;
  readonly optUpper: number;
  readonly testedK: readonly {
    readonly k: number;
    readonly cost: number;
    readonly dpLeft: number;
    readonly dpRight: number;
    readonly cVal: number;
  }[];
  readonly bestK: number;
  readonly bestVal: number;
  readonly naiveTestedCount: number;
  readonly knuthTestedCount: number;
  readonly cumulativeNaiveOps: number;
  readonly cumulativeKnuthOps: number;
  readonly currentDP: readonly (readonly number[])[];
  readonly currentOpt: readonly (readonly number[])[];
}

export interface MongeViolation {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly lhs: number;
  readonly rhs: number;
  readonly diff: number;
}

export interface MongeVerificationResult {
  readonly satisfiesMonge: boolean;
  readonly checkedQuadruples: number;
  readonly violations: readonly MongeViolation[];
  readonly minSlack: number;
  readonly maxSlack: number;
}

export interface KnuthDPResult {
  readonly dp: readonly (readonly number[])[];
  readonly opt: readonly (readonly number[])[];
  readonly n: number;
  readonly costMatrix: readonly (readonly number[])[];
  readonly knuthOperations: number;
  readonly naiveOperations: number;
  readonly speedupFactor: number;
  readonly steps: readonly KnuthDPStep[];
  readonly mongeVerification: MongeVerificationResult;
}

// ============================================================================
// 2. MODALITY METADATA & PRESETS
// ============================================================================

export interface ModalityMeta {
  readonly id: CHTStudioModality;
  readonly name: string;
  readonly shortName: string;
  readonly badge: string;
  readonly formulaTeX: string;
  readonly description: string;
  readonly complexity: string;
}

export const CHT_MODALITIES: readonly ModalityMeta[] = [
  {
    id: "classic_monotonic_cht",
    name: "Classic Monotonic Convex Hull Trick",
    shortName: "Monotonic CHT",
    badge: "O(N) / O(log N)",
    formulaTeX: "DP[i] = \\min_{j < i} \\{ m_j \\cdot x_i + c_j \\}",
    description:
      "Lower / Upper convex envelope maintained with slope-ordered line insertions. Lines popped via cross-product intersection monotonicity. Queryable in O(log N) via binary search or O(1) amortized two-pointers.",
    complexity: "Build: O(N log N) / O(N) sorted • Query: O(1) monotonic or O(log N) arbitrary",
  },
  {
    id: "dynamic_cht",
    name: "Fully Dynamic Convex Hull Trick",
    shortName: "Dynamic CHT",
    badge: "O(log N) Insert & Query",
    formulaTeX: "E = \\text{Hull}( \\{ y = m_i x + c_i \\}_{i=1}^M )",
    description:
      "Arbitrary slope line insertions without monotonicity assumptions. Maintains a slope-ordered envelope with dynamic neighbor redundancy testing and bilateral cascade pruning.",
    complexity: "Insert: O(log N) amortized • Query: O(log N) breakpoint search",
  },
  {
    id: "li_chao_tree",
    name: "Li Chao Segment Tree",
    shortName: "Li Chao Tree",
    badge: "O(log C) / O(log^2 C)",
    formulaTeX:
      "\\text{Node}[l, r] \\gets \\text{dominant line at } mid = \\lfloor (l+r)/2 \\rfloor",
    description:
      "Segment tree maintaining the upper/lower envelope over coordinate range [X_min, X_max]. Midpoint dominant line swapping with pushdown recursion for whole lines and restricted line segments.",
    complexity: "Line Insert: O(log C) • Segment Insert: O(log^2 C) • Point Query: O(log C)",
  },
  {
    id: "knuth_quadrangle_dp",
    name: "Knuth's Quadrangle Inequality DP Speedup",
    shortName: "Knuth DP (Monge)",
    badge: "O(N^2) vs O(N^3)",
    formulaTeX: "opt[i][j-1] \\le opt[i][j] \\le opt[i+1][j]",
    description:
      "2D interval DP acceleration when cost matrix C satisfies the Quadrangle Inequality (Monge property). Restricts the split search interval from [i, j-1] to [opt[i][j-1], opt[i+1][j]], cutting complexity from O(N^3) to O(N^2).",
    complexity: "Standard DP: O(N^3) • Knuth Accelerated: O(N^2) • Monge Test: O(N^4) or O(N^2)",
  },
];

const VIBRANT_LINE_COLORS = [
  "#38bdf8", // Sky 400
  "#f43f5e", // Rose 500
  "#10b981", // Emerald 500
  "#a855f7", // Purple 500
  "#f59e0b", // Amber 500
  "#06b6d4", // Cyan 500
  "#ec4899", // Pink 500
  "#84cc16", // Lime 500
  "#6366f1", // Indigo 500
  "#14b8a6", // Teal 500
];

export interface ModalityPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly lines?: readonly CHTLine[];
  readonly costMatrix?: readonly (readonly number[])[];
  readonly type?: OptimizationType;
  readonly domain?: readonly [number, number];
  readonly defaultQueryX?: number;
}

export const CHT_PRESETS: Record<string, ModalityPreset> = {
  classic_convex_lower: {
    id: "classic_convex_lower",
    name: "Classic Lower Envelope (Decreasing Slopes)",
    description:
      "Standard minimization envelope with sorted descending slopes: m = [5, 3, 2, 1, -1, -3].",
    type: "min",
    defaultQueryX: 12,
    lines: [
      { id: "l1", m: 5, c: 30, label: "y = 5x + 30", color: VIBRANT_LINE_COLORS[0] },
      { id: "l2", m: 3, c: 12, label: "y = 3x + 12", color: VIBRANT_LINE_COLORS[1] },
      { id: "l3", m: 2, c: 18, label: "y = 2x + 18", color: VIBRANT_LINE_COLORS[2] },
      { id: "l4", m: 1, c: 25, label: "y = x + 25", color: VIBRANT_LINE_COLORS[3] },
      { id: "l5", m: -1, c: 50, label: "y = -x + 50", color: VIBRANT_LINE_COLORS[4] },
      { id: "l6", m: -3, c: 80, label: "y = -3x + 80", color: VIBRANT_LINE_COLORS[5] },
    ],
  },
  upper_envelope_profit: {
    id: "upper_envelope_profit",
    name: "Upper Envelope Profit Maximization",
    description: "Maximization envelope with ascending slopes: m = [-2, 0, 2, 4, 7].",
    type: "max",
    defaultQueryX: 5,
    lines: [
      { id: "u1", m: -2, c: -10, label: "y = -2x - 10", color: VIBRANT_LINE_COLORS[0] },
      { id: "u2", m: 0, c: 5, label: "y = 5", color: VIBRANT_LINE_COLORS[1] },
      { id: "u3", m: 2, c: 15, label: "y = 2x + 15", color: VIBRANT_LINE_COLORS[2] },
      { id: "u4", m: 4, c: 8, label: "y = 4x + 8", color: VIBRANT_LINE_COLORS[3] },
      { id: "u5", m: 7, c: -10, label: "y = 7x - 10", color: VIBRANT_LINE_COLORS[4] },
    ],
  },
  batch_scheduling_dp: {
    id: "batch_scheduling_dp",
    name: "Batch Job Scheduling DP",
    description:
      "Minimizing batch job latency costs: DP[i] = min_{j < i} { DP[j] - F_j * T_i + S * F_n }.",
    type: "min",
    defaultQueryX: 8,
    lines: [
      { id: "b1", m: -12, c: 60, label: "Batch 1: y = -12x + 60", color: VIBRANT_LINE_COLORS[0] },
      { id: "b2", m: -8, c: 42, label: "Batch 2: y = -8x + 42", color: VIBRANT_LINE_COLORS[1] },
      { id: "b3", m: -5, c: 28, label: "Batch 3: y = -5x + 28", color: VIBRANT_LINE_COLORS[2] },
      { id: "b4", m: -3, c: 15, label: "Batch 4: y = -3x + 15", color: VIBRANT_LINE_COLORS[3] },
      { id: "b5", m: -1, c: 6, label: "Batch 5: y = -x + 6", color: VIBRANT_LINE_COLORS[4] },
    ],
  },
  machine_maintenance_dp: {
    id: "machine_maintenance_dp",
    name: "Machine Replacement DP",
    description: "Asset degradation cost lines: m = [8, 5, 3, 0, -2, -6].",
    type: "min",
    defaultQueryX: 10,
    lines: [
      { id: "m1", m: 8, c: 10, label: "Machine 1: y = 8x + 10", color: VIBRANT_LINE_COLORS[0] },
      { id: "m2", m: 5, c: 25, label: "Machine 2: y = 5x + 25", color: VIBRANT_LINE_COLORS[1] },
      { id: "m3", m: 3, c: 45, label: "Machine 3: y = 3x + 45", color: VIBRANT_LINE_COLORS[2] },
      { id: "m4", m: 0, c: 70, label: "Machine 4: y = 70", color: VIBRANT_LINE_COLORS[3] },
      { id: "m5", m: -2, c: 95, label: "Machine 5: y = -2x + 95", color: VIBRANT_LINE_COLORS[4] },
      { id: "m6", m: -6, c: 140, label: "Machine 6: y = -6x + 140", color: VIBRANT_LINE_COLORS[5] },
    ],
  },
};

export const DYNAMIC_CHT_PRESETS: Record<string, ModalityPreset> = {
  arbitrary_slope_stream: {
    id: "arbitrary_slope_stream",
    name: "Arbitrary Slope Stream",
    description:
      "Line insertions in arbitrary slope order: slopes oscillate between positive and negative.",
    type: "min",
    defaultQueryX: 6,
    lines: [
      { id: "d1", m: 4, c: 10, label: "y = 4x + 10", color: VIBRANT_LINE_COLORS[0] },
      { id: "d2", m: -2, c: 40, label: "y = -2x + 40", color: VIBRANT_LINE_COLORS[1] },
      { id: "d3", m: 1, c: 15, label: "y = x + 15", color: VIBRANT_LINE_COLORS[2] },
      { id: "d4", m: -5, c: 90, label: "y = -5x + 90", color: VIBRANT_LINE_COLORS[3] },
      { id: "d5", m: 3, c: -5, label: "y = 3x - 5", color: VIBRANT_LINE_COLORS[4] },
      { id: "d6", m: 0, c: 20, label: "y = 20", color: VIBRANT_LINE_COLORS[5] },
      { id: "d7", m: -1, c: 30, label: "y = -x + 30", color: VIBRANT_LINE_COLORS[6] },
    ],
  },
  stock_envelope_envelope: {
    id: "stock_envelope_envelope",
    name: "Portfolio Arbitrage Envelope",
    description: "Upper convex envelope for multi-asset yield maximization.",
    type: "max",
    defaultQueryX: 4,
    lines: [
      { id: "s1", m: 6, c: -20, label: "Asset A: y = 6x - 20", color: VIBRANT_LINE_COLORS[0] },
      { id: "s2", m: -4, c: 80, label: "Asset B: y = -4x + 80", color: VIBRANT_LINE_COLORS[1] },
      { id: "s3", m: 2, c: 10, label: "Asset C: y = 2x + 10", color: VIBRANT_LINE_COLORS[2] },
      { id: "s4", m: -1, c: 35, label: "Asset D: y = -x + 35", color: VIBRANT_LINE_COLORS[3] },
      { id: "s5", m: 5, c: -5, label: "Asset E: y = 5x - 5", color: VIBRANT_LINE_COLORS[4] },
      { id: "s6", m: 3, c: 18, label: "Asset F: y = 3x + 18", color: VIBRANT_LINE_COLORS[5] },
    ],
  },
  hull_update_burst: {
    id: "hull_update_burst",
    name: "Cascade Pruning Burst",
    description:
      "Sequence where new line insertions trigger cascading left and right neighbor pruning.",
    type: "min",
    defaultQueryX: 0,
    lines: [
      { id: "p1", m: 10, c: 100, label: "y = 10x + 100", color: VIBRANT_LINE_COLORS[0] },
      { id: "p2", m: -10, c: 100, label: "y = -10x + 100", color: VIBRANT_LINE_COLORS[1] },
      { id: "p3", m: 0, c: 20, label: "y = 20", color: VIBRANT_LINE_COLORS[2] },
      { id: "p4", m: 2, c: 15, label: "y = 2x + 15", color: VIBRANT_LINE_COLORS[3] },
      { id: "p5", m: -2, c: 15, label: "y = -2x + 15", color: VIBRANT_LINE_COLORS[4] },
      { id: "p6", m: 0, c: 5, label: "y = 5 (Prunes y=20)", color: VIBRANT_LINE_COLORS[5] },
    ],
  },
};

export const LICHAO_PRESETS: Record<string, ModalityPreset> = {
  dense_segments: {
    id: "dense_segments",
    name: "Dense Domain Lines [-20, 20]",
    description:
      "Whole-domain line insertions covering [-20, 20] demonstrating midpoint dominance pushdown.",
    type: "min",
    domain: [-20, 20],
    defaultQueryX: 3,
    lines: [
      { id: "lc1", m: 3, c: -10, label: "y = 3x - 10", color: VIBRANT_LINE_COLORS[0] },
      { id: "lc2", m: -2, c: 15, label: "y = -2x + 15", color: VIBRANT_LINE_COLORS[1] },
      { id: "lc3", m: 1, c: 5, label: "y = x + 5", color: VIBRANT_LINE_COLORS[2] },
      { id: "lc4", m: -4, c: 30, label: "y = -4x + 30", color: VIBRANT_LINE_COLORS[3] },
      { id: "lc5", m: 0, c: 8, label: "y = 8", color: VIBRANT_LINE_COLORS[4] },
    ],
  },
  discrete_domain_power: {
    id: "discrete_domain_power",
    name: "Power Consumption Envelope [0, 50]",
    description: "Discrete non-negative domain with varying power slope curves.",
    type: "min",
    domain: [0, 50],
    defaultQueryX: 25,
    lines: [
      { id: "pw1", m: -3, c: 120, label: "Mode A: y = -3x + 120", color: VIBRANT_LINE_COLORS[0] },
      { id: "pw2", m: -1.5, c: 70, label: "Mode B: y = -1.5x + 70", color: VIBRANT_LINE_COLORS[1] },
      { id: "pw3", m: -0.5, c: 35, label: "Mode C: y = -0.5x + 35", color: VIBRANT_LINE_COLORS[2] },
      { id: "pw4", m: 0.2, c: 10, label: "Mode D: y = 0.2x + 10", color: VIBRANT_LINE_COLORS[3] },
      { id: "pw5", m: 1.2, c: -20, label: "Mode E: y = 1.2x - 20", color: VIBRANT_LINE_COLORS[4] },
    ],
  },
  line_segment_chao: {
    id: "line_segment_chao",
    name: "Restricted Line Segments [x1, x2]",
    description:
      "Line segment insertions restricted to sub-intervals, requiring segment-tree splitting.",
    type: "min",
    domain: [-20, 20],
    defaultQueryX: 2,
    lines: [
      {
        id: "seg1",
        m: 2,
        c: -5,
        xStart: -15,
        xEnd: 5,
        isSegment: true,
        label: "y = 2x - 5 on [-15, 5]",
        color: VIBRANT_LINE_COLORS[0],
      },
      {
        id: "seg2",
        m: -3,
        c: 20,
        xStart: -5,
        xEnd: 15,
        isSegment: true,
        label: "y = -3x + 20 on [-5, 15]",
        color: VIBRANT_LINE_COLORS[1],
      },
      {
        id: "seg3",
        m: 0.5,
        c: 10,
        xStart: -10,
        xEnd: 10,
        isSegment: true,
        label: "y = 0.5x + 10 on [-10, 10]",
        color: VIBRANT_LINE_COLORS[2],
      },
      {
        id: "seg4",
        m: -1,
        c: -2,
        xStart: 0,
        xEnd: 20,
        isSegment: true,
        label: "y = -x - 2 on [0, 20]",
        color: VIBRANT_LINE_COLORS[3],
      },
    ],
  },
};

// Generates a Monge cost matrix: C[i][j] = prefix_sum(weights, i, j)
function generateOptimalBSTCostMatrix(weights: readonly number[]): number[][] {
  const n = weights.length;
  const pref = [0];
  for (let i = 0; i < n; i++) pref.push(pref[i] + weights[i]);
  const cost: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      cost[i][j] = pref[j + 1] - pref[i];
    }
  }
  return cost;
}

export const KNUTH_PRESETS: Record<string, ModalityPreset> = {
  optimal_bst_cost: {
    id: "optimal_bst_cost",
    name: "Optimal Binary Search Tree (N=6)",
    description:
      "Search frequency prefix sums: W = [4, 2, 6, 3, 5, 1]. Satisfies Monge QI perfectly.",
    costMatrix: generateOptimalBSTCostMatrix([4, 2, 6, 3, 5, 1]),
  },
  matrix_chain_monge: {
    id: "matrix_chain_monge",
    name: "Submodular Interval Cost (N=7)",
    description: "Quadratic submodular cost matrix C[i][j] = (j - i + 1)^1.5 + (j - i) * 3.",
    costMatrix: (() => {
      const n = 7;
      const cost: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
          const len = j - i + 1;
          cost[i][j] = Math.round(Math.pow(len, 1.4) * 8 + len * 2);
        }
      }
      return cost;
    })(),
  },
  polygon_triangulation_dp: {
    id: "polygon_triangulation_dp",
    name: "Convex Polygon Triangulation (N=8)",
    description:
      "Convex polygon perimeter chord weights C[i][j] = (i - j)^2 with submodular chord penalty.",
    costMatrix: (() => {
      const n = 8;
      const cost: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
          const diff = j - i;
          cost[i][j] = diff <= 1 ? 0 : Math.round(diff * 12 + Math.sqrt(diff) * 6);
        }
      }
      return cost;
    })(),
  },
};

// ============================================================================
// 3. PURE ALGORITHMIC FUNCTIONS (EXPORTED FOR TESTING)
// ============================================================================

/**
 * Computes the exact 2D intersection point between two linear functions:
 * l1: y = m1 * x + c1
 * l2: y = m2 * x + c2
 */
export function computeLineIntersection(l1: CHTLine, l2: CHTLine): LineIntersection {
  const EPS = 1e-11;
  const dm = l1.m - l2.m;
  const dc = l2.c - l1.c;

  if (Math.abs(dm) < EPS) {
    if (Math.abs(l1.c - l2.c) < EPS) {
      return { x: 0, y: l1.c, parallel: true, coincident: true };
    }
    return { x: NaN, y: NaN, parallel: true, coincident: false };
  }

  const x = dc / dm;
  const y = l1.m * x + l1.c;
  return { x, y, parallel: false, coincident: false };
}

/**
 * Builds the Classic Monotonic Convex Hull Envelope.
 * Slopes are expected (or automatically sorted) in monotonic order:
 * - For "min": sorted by descending slope (m_0 > m_1 > ... > m_k).
 * - For "max": sorted by ascending slope (m_0 < m_1 < ... < m_k).
 */
export function buildMonotonicCHT(
  lines: readonly CHTLine[],
  type: OptimizationType = "min",
): MonotonicCHTResult {
  if (!lines || lines.length === 0) {
    return { hull: [], breakpoints: [], steps: [], type };
  }

  const EPS = 1e-11;
  // Sort lines:
  // For min: descending slope; if same slope, keep smaller intercept c
  // For max: ascending slope; if same slope, keep larger intercept c
  const sorted = [...lines].sort((a, b) => {
    if (Math.abs(a.m - b.m) > EPS) {
      return type === "min" ? b.m - a.m : a.m - b.m;
    }
    return type === "min" ? a.c - b.c : b.c - a.c;
  });

  const hull: CHTLine[] = [];
  const steps: MonotonicCHTStep[] = [];
  let stepCount = 0;

  for (let i = 0; i < sorted.length; i++) {
    const line = sorted[i];

    // Handle parallel lines with the same slope
    if (hull.length > 0 && Math.abs(hull[hull.length - 1].m - line.m) < EPS) {
      const top = hull[hull.length - 1];
      const isBetter = type === "min" ? line.c < top.c : line.c > top.c;
      if (isBetter) {
        const popped = hull.pop()!;
        steps.push({
          stepIndex: stepCount++,
          phase: "Parallel Line Replacement",
          title: `Replace parallel line ${popped.id} with better intercept`,
          description: `Line ${line.id} (c=${line.c}) strictly dominates ${popped.id} (c=${popped.c}) with identical slope m=${line.m}.`,
          candidateLine: line,
          currentHull: [...hull],
          poppedLines: [popped],
          action: "pop",
        });
      } else {
        steps.push({
          stepIndex: stepCount++,
          phase: "Parallel Line Skip",
          title: `Skip inferior parallel line ${line.id}`,
          description: `Line ${line.id} (c=${line.c}) is inferior/equal to existing ${top.id} (c=${top.c}) with identical slope m=${line.m}.`,
          candidateLine: line,
          currentHull: [...hull],
          poppedLines: [],
          action: "skip",
        });
        continue;
      }
    }

    const poppedThisStep: CHTLine[] = [];

    while (hull.length >= 2) {
      const l1 = hull[hull.length - 2];
      const l2 = hull[hull.length - 1];
      const l3 = line;

      const int12 = computeLineIntersection(l1, l2);
      const int23 = computeLineIntersection(l2, l3);

      // Redundancy condition:
      // For min (decreasing slopes): l2 is redundant if int23.x <= int12.x
      // For max (increasing slopes): l2 is redundant if int23.x <= int12.x
      const isRedundant = int23.x <= int12.x + EPS;

      if (isRedundant) {
        const popped = hull.pop()!;
        poppedThisStep.push(popped);
        steps.push({
          stepIndex: stepCount++,
          phase: "Intersection Monotonicity Check",
          title: `Pop redundant line ${popped.id}`,
          description: `Intersection x(${l2.id}, ${l3.id}) = ${int23.x.toFixed(2)} <= x(${l1.id}, ${l2.id}) = ${int12.x.toFixed(2)}. Line ${popped.id} is never optimal.`,
          candidateLine: line,
          currentHull: [...hull],
          poppedLines: [popped],
          action: "pop",
          intersectionX: int23.x,
          prevIntersectionX: int12.x,
        });
      } else {
        break;
      }
    }

    hull.push(line);
    steps.push({
      stepIndex: stepCount++,
      phase: "Hull Insertion",
      title: `Insert line ${line.id} into convex hull`,
      description: `Line ${line.id} (y = ${line.m}x + ${line.c}) successfully added. Current hull size: ${hull.length}.`,
      candidateLine: line,
      currentHull: [...hull],
      poppedLines: poppedThisStep,
      action: "insert",
    });
  }

  // Calculate final breakpoints
  const breakpoints: number[] = [];
  for (let i = 0; i < hull.length - 1; i++) {
    const inter = computeLineIntersection(hull[i], hull[i + 1]);
    breakpoints.push(inter.x);
  }

  return { hull, breakpoints, steps, type };
}

/**
 * Queries the Monotonic CHT envelope at coordinate x via binary search on breakpoints in O(log N).
 */
export function queryMonotonicCHT(
  hull: readonly CHTLine[],
  x: number,
  type: OptimizationType = "min",
): CHTQueryResult {
  if (!hull || hull.length === 0) {
    return {
      value: type === "max" ? -Infinity : Infinity,
      optimalLine: null,
      x,
      stepCount: 0,
    };
  }

  if (hull.length === 1) {
    const l = hull[0];
    return {
      value: l.m * x + l.c,
      optimalLine: l,
      x,
      stepCount: 1,
      index: 0,
    };
  }

  // Compute breakpoints between adjacent lines
  const breakpoints: number[] = [];
  for (let i = 0; i < hull.length - 1; i++) {
    breakpoints.push(computeLineIntersection(hull[i], hull[i + 1]).x);
  }

  // Binary search on breakpoints
  let low = 0;
  let high = breakpoints.length - 1;
  let optimalIdx = hull.length - 1;
  let stepCount = 0;

  while (low <= high) {
    stepCount++;
    const mid = Math.floor((low + high) / 2);
    if (x <= breakpoints[mid]) {
      optimalIdx = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  const bestLine = hull[optimalIdx];
  const value = bestLine.m * x + bestLine.c;

  return {
    value,
    optimalLine: bestLine,
    x,
    stepCount,
    index: optimalIdx,
  };
}

/**
 * Checks if line L2 is redundant between L1 and L3 in a dynamic hull:
 * For min: slopes in descending order (m1 > m2 > m3)
 * For max: slopes in ascending order (m1 < m2 < m3)
 */
function isDynamicRedundant(l1: CHTLine, l2: CHTLine, l3: CHTLine): boolean {
  const EPS = 1e-11;
  const int12 = computeLineIntersection(l1, l2);
  const int23 = computeLineIntersection(l2, l3);

  if (int12.parallel || int23.parallel) return true;

  // L2 is redundant if intersection with L3 happens at or before intersection with L1
  return int23.x <= int12.x + EPS;
}

/**
 * Builds Fully Dynamic CHT without slope monotonicity assumptions.
 * Maintains a sorted list of lines by slope m, pruning redundant left/right neighbors upon each insertion.
 */
export function buildDynamicCHT(
  lines: readonly CHTLine[],
  type: OptimizationType = "min",
): DynamicCHTResult {
  if (!lines || lines.length === 0) {
    return { hull: [], steps: [], type };
  }

  const EPS = 1e-11;
  const hull: CHTLine[] = [];
  const steps: DynamicCHTStep[] = [];
  let stepCount = 0;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // Check for exact matching slope
    const sameSlopeIdx = hull.findIndex((l) => Math.abs(l.m - line.m) < EPS);
    if (sameSlopeIdx !== -1) {
      const existing = hull[sameSlopeIdx];
      const isBetter = type === "min" ? line.c < existing.c : line.c > existing.c;
      if (isBetter) {
        hull.splice(sameSlopeIdx, 1);
        steps.push({
          stepIndex: stepCount++,
          phase: "Duplicate Slope Update",
          title: `Replace line with identical slope m=${line.m}`,
          description: `Line ${line.id} (c=${line.c}) replaced ${existing.id} (c=${existing.c}).`,
          candidateLine: line,
          currentHull: [...hull],
          prunedLeftLines: [existing],
          prunedRightLines: [],
          action: "insert",
        });
      } else {
        steps.push({
          stepIndex: stepCount++,
          phase: "Duplicate Slope Rejection",
          title: `Reject line with inferior intercept`,
          description: `Line ${line.id} has slope m=${line.m} and c=${line.c} which is worse than existing ${existing.id} (c=${existing.c}).`,
          candidateLine: line,
          currentHull: [...hull],
          prunedLeftLines: [],
          prunedRightLines: [],
          action: "reject_duplicate",
        });
        continue;
      }
    }

    // Find insertion index:
    // For min: strictly descending slopes (m_0 > m_1 > ...)
    // For max: strictly ascending slopes (m_0 < m_1 < ...)
    let insertPos = 0;
    while (
      insertPos < hull.length &&
      (type === "min" ? hull[insertPos].m > line.m : hull[insertPos].m < line.m)
    ) {
      insertPos++;
    }

    // Check if new line is redundant with its immediate predecessor and successor
    if (insertPos > 0 && insertPos < hull.length) {
      const prevL = hull[insertPos - 1];
      const nextL = hull[insertPos];
      if (isDynamicRedundant(prevL, line, nextL)) {
        steps.push({
          stepIndex: stepCount++,
          phase: "Neighbor Redundancy Test",
          title: `Reject redundant line ${line.id}`,
          description: `Line ${line.id} is completely hidden between ${prevL.id} (m=${prevL.m}) and ${nextL.id} (m=${nextL.m}).`,
          candidateLine: line,
          currentHull: [...hull],
          prunedLeftLines: [],
          prunedRightLines: [],
          action: "reject_redundant",
          prevNeighbor: prevL,
          nextNeighbor: nextL,
        });
        continue;
      }
    }

    // Insert line at position
    hull.splice(insertPos, 0, line);
    let curPos = insertPos;

    // Prune to the left
    const prunedLeft: CHTLine[] = [];
    while (curPos >= 2) {
      const p1 = hull[curPos - 2];
      const p2 = hull[curPos - 1];
      const p3 = hull[curPos];
      if (isDynamicRedundant(p1, p2, p3)) {
        prunedLeft.push(hull.splice(curPos - 1, 1)[0]);
        curPos--;
      } else {
        break;
      }
    }

    // Prune to the right
    const prunedRight: CHTLine[] = [];
    while (curPos + 2 < hull.length) {
      const n1 = hull[curPos];
      const n2 = hull[curPos + 1];
      const n3 = hull[curPos + 2];
      if (isDynamicRedundant(n1, n2, n3)) {
        prunedRight.push(hull.splice(curPos + 1, 1)[0]);
      } else {
        break;
      }
    }

    steps.push({
      stepIndex: stepCount++,
      phase: "Dynamic Insertion & Cascade Prune",
      title: `Inserted line ${line.id} into Dynamic CHT`,
      description: `Inserted ${line.id} at slope rank ${curPos + 1}/${hull.length}. Pruned ${prunedLeft.length} left and ${prunedRight.length} right redundant lines.`,
      candidateLine: line,
      currentHull: [...hull],
      prunedLeftLines: prunedLeft,
      prunedRightLines: prunedRight,
      action: "insert",
    });
  }

  // Calculate active intervals [xStart, xEnd] for each line in the envelope
  const finalHull: CHTLine[] = [];
  for (let i = 0; i < hull.length; i++) {
    const l = hull[i];
    const xStart = i === 0 ? -Infinity : computeLineIntersection(hull[i - 1], l).x;
    const xEnd = i === hull.length - 1 ? Infinity : computeLineIntersection(l, hull[i + 1]).x;

    finalHull.push({
      ...l,
      xStart,
      xEnd,
    });
  }

  return { hull: finalHull, steps, type };
}

/**
 * Queries the Dynamic CHT envelope at coordinate x via binary search on intervals.
 */
export function queryDynamicCHT(
  hull: readonly CHTLine[],
  x: number,
  type: OptimizationType = "min",
): CHTQueryResult {
  if (!hull || hull.length === 0) {
    return {
      value: type === "max" ? -Infinity : Infinity,
      optimalLine: null,
      x,
      stepCount: 0,
    };
  }

  let low = 0;
  let high = hull.length - 1;
  let bestIdx = 0;
  let stepCount = 0;

  while (low <= high) {
    stepCount++;
    const mid = Math.floor((low + high) / 2);
    const line = hull[mid];
    const xS = line.xStart ?? -Infinity;
    const xE = line.xEnd ?? Infinity;

    if (x < xS) {
      high = mid - 1;
    } else if (x > xE) {
      low = mid + 1;
    } else {
      bestIdx = mid;
      break;
    }
  }

  const bestLine = hull[bestIdx];
  const bestVal = bestLine.m * x + bestLine.c;

  return {
    value: bestVal,
    optimalLine: bestLine,
    x,
    stepCount,
    index: bestIdx,
  };
}

// ============================================================================
// 4. LI CHAO SEGMENT TREE IMPLEMENTATION
// ============================================================================

class LiChaoNodeImpl implements LiChaoNode {
  id: string;
  l: number;
  r: number;
  mid: number;
  line: CHTLine | null = null;
  leftChildId: string | null = null;
  rightChildId: string | null = null;
  left: LiChaoNodeImpl | null = null;
  right: LiChaoNodeImpl | null = null;

  constructor(id: string, l: number, r: number) {
    this.id = id;
    this.l = l;
    this.r = r;
    this.mid = Math.floor((l + r) / 2);
  }
}

function evalLine(l: CHTLine, x: number): number {
  return l.m * x + l.c;
}

function isLineBetter(y1: number, y2: number, type: OptimizationType): boolean {
  return type === "min" ? y1 < y2 : y1 > y2;
}

function insertLineToLiChao(
  node: LiChaoNodeImpl,
  newLine: CHTLine,
  type: OptimizationType,
  steps: LiChaoTreeStep[],
  stepCounter: { count: number },
  nodeCounter: { count: number },
): void {
  const l = node.l;
  const r = node.r;
  const mid = node.mid;

  if (node.line === null) {
    node.line = newLine;
    steps.push({
      stepIndex: stepCounter.count++,
      phase: "Empty Node Assignment",
      title: `Stored line ${newLine.id} at node [${l}, ${r}]`,
      description: `Node [${l}, ${r}] was empty. Stored line ${newLine.label ?? newLine.id} (y = ${newLine.m}x + ${newLine.c}).`,
      line: newLine,
      targetNodeId: node.id,
      nodeInterval: [l, r],
      action: "place_empty",
      dominantLine: newLine,
    });
    return;
  }

  let currLine = node.line;
  const currMid = evalLine(currLine, mid);
  const newMid = evalLine(newLine, mid);

  const newBetterAtMid = isLineBetter(newMid, currMid, type);
  let dominant = currLine;
  let pushed = newLine;

  if (newBetterAtMid) {
    dominant = newLine;
    pushed = currLine;
    node.line = newLine;
    steps.push({
      stepIndex: stepCounter.count++,
      phase: "Midpoint Dominance Swap",
      title: `Swapped dominant line at node [${l}, ${r}]`,
      description: `Line ${newLine.id} is superior at midpoint x=${mid} (val=${newMid.toFixed(2)} vs ${currMid.toFixed(2)}). Stored ${newLine.id}, pushing down ${currLine.id}.`,
      line: newLine,
      targetNodeId: node.id,
      nodeInterval: [l, r],
      action: "swap_dominant",
      dominantLine: dominant,
      pushedLine: pushed,
    });
  }

  if (l === r) {
    steps.push({
      stepIndex: stepCounter.count++,
      phase: "Leaf Termination",
      title: `Leaf reached at x=${l}`,
      description: `Reached leaf node interval [${l}, ${r}]. Line ${dominant.id} remains dominant.`,
      line: newLine,
      targetNodeId: node.id,
      nodeInterval: [l, r],
      action: "leaf_placed",
      dominantLine: dominant,
    });
    return;
  }

  // Push down the inferior line
  const pushedLeft = evalLine(pushed, l);
  const domLeft = evalLine(dominant, l);
  const pushedRight = evalLine(pushed, r);
  const domRight = evalLine(dominant, r);

  if (isLineBetter(pushedLeft, domLeft, type)) {
    // Pushed line is better at the left endpoint, so it intersects in [l, mid]
    if (!node.left) {
      node.left = new LiChaoNodeImpl(`lc_${nodeCounter.count++}`, l, mid);
      node.leftChildId = node.left.id;
    }
    steps.push({
      stepIndex: stepCounter.count++,
      phase: "Pushdown Left Child",
      title: `Push down line ${pushed.id} to left child [${l}, ${mid}]`,
      description: `Line ${pushed.id} is superior at left bound x=${l} (${pushedLeft.toFixed(2)} vs ${domLeft.toFixed(2)}). Recursing left.`,
      line: pushed,
      targetNodeId: node.id,
      nodeInterval: [l, mid],
      action: "pushdown_left",
      dominantLine: dominant,
      pushedLine: pushed,
    });
    insertLineToLiChao(node.left, pushed, type, steps, stepCounter, nodeCounter);
  } else if (isLineBetter(pushedRight, domRight, type)) {
    // Pushed line is better at the right endpoint, so it intersects in [mid+1, r]
    if (!node.right) {
      node.right = new LiChaoNodeImpl(`lc_${nodeCounter.count++}`, mid + 1, r);
      node.rightChildId = node.right.id;
    }
    steps.push({
      stepIndex: stepCounter.count++,
      phase: "Pushdown Right Child",
      title: `Push down line ${pushed.id} to right child [${mid + 1}, ${r}]`,
      description: `Line ${pushed.id} is superior at right bound x=${r} (${pushedRight.toFixed(2)} vs ${domRight.toFixed(2)}). Recursing right.`,
      line: pushed,
      targetNodeId: node.id,
      nodeInterval: [mid + 1, r],
      action: "pushdown_right",
      dominantLine: dominant,
      pushedLine: pushed,
    });
    insertLineToLiChao(node.right, pushed, type, steps, stepCounter, nodeCounter);
  } else {
    // Pushed line is inferior across the entire interval [l, r], discard
    steps.push({
      stepIndex: stepCounter.count++,
      phase: "Discard Inferior Line",
      title: `Discard line ${pushed.id} across [${l}, ${r}]`,
      description: `Line ${pushed.id} is strictly inferior/equal across the whole interval [${l}, ${r}] to ${dominant.id}. Discarding.`,
      line: pushed,
      targetNodeId: node.id,
      nodeInterval: [l, r],
      action: "discard",
      dominantLine: dominant,
      pushedLine: pushed,
    });
  }
}

function insertSegmentToLiChao(
  node: LiChaoNodeImpl,
  segLine: CHTLine,
  ql: number,
  qr: number,
  type: OptimizationType,
  steps: LiChaoTreeStep[],
  stepCounter: { count: number },
  nodeCounter: { count: number },
): void {
  const l = node.l;
  const r = node.r;

  if (r < ql || l > qr) return;

  if (ql <= l && r <= qr) {
    // Fully enclosed inside segment domain, perform standard line insertion
    insertLineToLiChao(node, segLine, type, steps, stepCounter, nodeCounter);
    return;
  }

  const mid = node.mid;
  steps.push({
    stepIndex: stepCounter.count++,
    phase: "Segment Canonical Split",
    title: `Split segment [${ql}, ${qr}] at node [${l}, ${r}]`,
    description: `Segment does not fully cover [${l}, ${r}]. Splitting into overlapping child intervals.`,
    line: segLine,
    targetNodeId: node.id,
    nodeInterval: [l, r],
    action: "segment_split",
    dominantLine: node.line ?? segLine,
  });

  if (ql <= mid) {
    if (!node.left) {
      node.left = new LiChaoNodeImpl(`lc_${nodeCounter.count++}`, l, mid);
      node.leftChildId = node.left.id;
    }
    insertSegmentToLiChao(node.left, segLine, ql, qr, type, steps, stepCounter, nodeCounter);
  }

  if (qr > mid) {
    if (!node.right) {
      node.right = new LiChaoNodeImpl(`lc_${nodeCounter.count++}`, mid + 1, r);
      node.rightChildId = node.right.id;
    }
    insertSegmentToLiChao(node.right, segLine, ql, qr, type, steps, stepCounter, nodeCounter);
  }
}

/**
 * Builds a Li Chao Segment Tree over coordinate domain [xMin, xMax].
 */
export function buildLiChaoTree(
  lines: readonly CHTLine[],
  xMin: number,
  xMax: number,
  type: OptimizationType = "min",
): LiChaoTreeResult {
  const root = new LiChaoNodeImpl("root", xMin, xMax);
  const steps: LiChaoTreeStep[] = [];
  const stepCounter = { count: 0 };
  const nodeCounter = { count: 1 };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.isSegment && line.xStart !== undefined && line.xEnd !== undefined) {
      insertSegmentToLiChao(
        root,
        line,
        Math.max(xMin, line.xStart),
        Math.min(xMax, line.xEnd),
        type,
        steps,
        stepCounter,
        nodeCounter,
      );
    } else {
      insertLineToLiChao(root, line, type, steps, stepCounter, nodeCounter);
    }
  }

  // Collect all nodes and calculate max depth
  const allNodes: LiChaoNode[] = [];
  let maxDepth = 0;

  function collect(node: LiChaoNodeImpl, depth: number) {
    allNodes.push(node);
    if (depth > maxDepth) maxDepth = depth;
    if (node.left) collect(node.left, depth + 1);
    if (node.right) collect(node.right, depth + 1);
  }
  collect(root, 1);

  return {
    root,
    nodes: allNodes,
    nodeCount: allNodes.length,
    maxDepth,
    steps,
    domain: [xMin, xMax],
    type,
  };
}

/**
 * Queries the Li Chao Segment Tree at coordinate x in O(log C) operations.
 */
export function queryLiChaoTree(
  root: LiChaoNode | null,
  x: number,
  type: OptimizationType = "min",
): CHTQueryResult {
  if (!root) {
    return {
      value: type === "max" ? -Infinity : Infinity,
      optimalLine: null,
      x,
      stepCount: 0,
    };
  }

  let curr: LiChaoNode | null = root;
  let bestVal = type === "max" ? -Infinity : Infinity;
  let bestLine: CHTLine | null = null;
  const path: string[] = [];
  let stepCount = 0;

  while (curr) {
    stepCount++;
    path.push(curr.id);

    if (curr.line) {
      const val = evalLine(curr.line, x);
      if (isLineBetter(val, bestVal, type)) {
        bestVal = val;
        bestLine = curr.line;
      }
    }

    if (curr.l === curr.r) break;

    const mid = curr.mid;
    if (x <= mid) {
      curr = curr.left ?? null;
    } else {
      curr = curr.right ?? null;
    }
  }

  return {
    value: bestVal,
    optimalLine: bestLine,
    x,
    stepCount,
    path,
  };
}

// ============================================================================
// 5. KNUTH'S OPTIMIZATION / MONGE DP SPEEDUP
// ============================================================================

/**
 * Verifies if a given 2D cost matrix C satisfies the Quadrangle Inequality (QI) / Monge condition:
 * C[a][c] + C[b][d] <= C[a][d] + C[b][c] for all 0 <= a <= b <= c <= d < n.
 */
export function verifyMongeProperty(
  costMatrix: readonly (readonly number[])[],
  n: number,
): MongeVerificationResult {
  const violations: MongeViolation[] = [];
  let checked = 0;
  let minSlack = Infinity;
  let maxSlack = -Infinity;

  for (let a = 0; a < n; a++) {
    for (let b = a; b < n; b++) {
      for (let c = b; c < n; c++) {
        for (let d = c; d < n; d++) {
          checked++;
          const lhs = costMatrix[a][c] + costMatrix[b][d];
          const rhs = costMatrix[a][d] + costMatrix[b][c];
          const diff = lhs - rhs;
          const slack = rhs - lhs;

          if (slack < minSlack) minSlack = slack;
          if (slack > maxSlack) maxSlack = slack;

          if (diff > 1e-9) {
            violations.push({ a, b, c, d, lhs, rhs, diff });
          }
        }
      }
    }
  }

  return {
    satisfiesMonge: violations.length === 0,
    checkedQuadruples: checked,
    violations,
    minSlack: Number.isFinite(minSlack) ? minSlack : 0,
    maxSlack: Number.isFinite(maxSlack) ? maxSlack : 0,
  };
}

/**
 * Solves 2D Interval DP with Knuth's Quadrangle Inequality optimization:
 * DP[i][j] = min_{i <= k < j} { DP[i][k] + DP[k+1][j] } + C[i][j]
 * Search space for split k is restricted to [opt[i][j-1], opt[i+1][j]], cutting complexity from O(n^3) to O(n^2).
 */
export function solveKnuthDP(costMatrix: readonly (readonly number[])[], n: number): KnuthDPResult {
  const dp: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const opt: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  // Base cases: intervals of length 1 (i == j) have DP = 0, opt = i
  for (let i = 0; i < n; i++) {
    dp[i][i] = 0;
    opt[i][i] = i;
  }

  const steps: KnuthDPStep[] = [];
  let stepIndex = 0;
  let cumulativeNaiveOps = 0;
  let cumulativeKnuthOps = 0;

  // Process intervals by length len = 2 ... n
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1;

      // Base case for len = 2: only k = i is possible
      if (len === 2) {
        dp[i][j] = costMatrix[i][j];
        opt[i][j] = i;
        cumulativeNaiveOps += 1;
        cumulativeKnuthOps += 1;

        steps.push({
          stepIndex: stepIndex++,
          phase: "Base Case Interval (len=2)",
          title: `Computed base interval [${i}, ${j}]`,
          description: `Single split point k=${i} with direct cost C[${i}][${j}] = ${costMatrix[i][j]}.`,
          i,
          j,
          len,
          optLower: i,
          optUpper: i,
          testedK: [{ k: i, cost: dp[i][j], dpLeft: 0, dpRight: 0, cVal: costMatrix[i][j] }],
          bestK: i,
          bestVal: dp[i][j],
          naiveTestedCount: 1,
          knuthTestedCount: 1,
          cumulativeNaiveOps,
          cumulativeKnuthOps,
          currentDP: dp.map((row) => [...row]),
          currentOpt: opt.map((row) => [...row]),
        });
        continue;
      }

      // Knuth's split search bounds: opt[i][j-1] <= opt[i][j] <= opt[i+1][j]
      const optLower = opt[i][j - 1];
      const optUpper = Math.min(opt[i + 1][j], j - 1);

      let bestVal = Infinity;
      let bestK = optLower;
      const testedK: { k: number; cost: number; dpLeft: number; dpRight: number; cVal: number }[] =
        [];

      for (let k = optLower; k <= optUpper; k++) {
        const dpLeft = dp[i][k];
        const dpRight = dp[k + 1][j];
        const cVal = costMatrix[i][j];
        const total = dpLeft + dpRight + cVal;

        testedK.push({ k, cost: total, dpLeft, dpRight, cVal });

        if (total < bestVal) {
          bestVal = total;
          bestK = k;
        }
      }

      dp[i][j] = bestVal;
      opt[i][j] = bestK;

      const naiveCount = j - i;
      const knuthCount = optUpper - optLower + 1;
      cumulativeNaiveOps += naiveCount;
      cumulativeKnuthOps += knuthCount;

      steps.push({
        stepIndex: stepIndex++,
        phase: `Interval DP (len=${len})`,
        title: `Computed cell DP[${i}][${j}] = ${bestVal}`,
        description: `Knuth search range k ∈ [${optLower}, ${optUpper}] (evaluated ${knuthCount} instead of ${naiveCount} points). Optimal split: k* = ${bestK}.`,
        i,
        j,
        len,
        optLower,
        optUpper,
        testedK,
        bestK,
        bestVal,
        naiveTestedCount: naiveCount,
        knuthTestedCount: knuthCount,
        cumulativeNaiveOps,
        cumulativeKnuthOps,
        currentDP: dp.map((row) => [...row]),
        currentOpt: opt.map((row) => [...row]),
      });
    }
  }

  const mongeVerification = verifyMongeProperty(costMatrix, n);
  const speedupFactor =
    cumulativeKnuthOps > 0 ? Math.round((cumulativeNaiveOps / cumulativeKnuthOps) * 100) / 100 : 1;

  return {
    dp,
    opt,
    n,
    costMatrix,
    knuthOperations: cumulativeKnuthOps,
    naiveOperations: cumulativeNaiveOps,
    speedupFactor,
    steps,
    mongeVerification,
  };
}

// ============================================================================
// 6. REACT INTERACTIVE STUDIO COMPONENT
// ============================================================================

export interface ConvexHullTrickStudioProps {
  readonly initialModality?: CHTStudioModality;
  readonly initialPreset?: string;
  readonly initialType?: OptimizationType;
  readonly width?: number;
  readonly height?: number;
  readonly standalone?: boolean;
  readonly title?: string;
}

export const ConvexHullTrickStudio: React.FC<ConvexHullTrickStudioProps> = ({
  initialModality = "classic_monotonic_cht",
  initialPreset,
  initialType = "min",
  standalone = false,
  title = "Convex Hull Trick & Li Chao Studio",
}) => {
  // --- Modality & Settings State ---
  const [modality, setModality] = useState<CHTStudioModality>(initialModality);
  const [optType, setOptType] = useState<OptimizationType>(initialType);
  const [selectedPreset, setSelectedPreset] = useState<string>(
    initialPreset ??
      (initialModality === "classic_monotonic_cht"
        ? "classic_convex_lower"
        : initialModality === "dynamic_cht"
          ? "arbitrary_slope_stream"
          : initialModality === "li_chao_tree"
            ? "dense_segments"
            : "optimal_bst_cost"),
  );

  // --- Lines & Inputs State ---
  const [customLines, setCustomLines] = useState<CHTLine[]>(() => {
    return (CHT_PRESETS.classic_convex_lower.lines as CHTLine[]) ?? [];
  });

  const [newLineM, setNewLineM] = useState<string>("-2");
  const [newLineC, setNewLineC] = useState<string>("35");
  const [newSegL, setNewSegL] = useState<string>("-10");
  const [newSegR, setNewSegR] = useState<string>("10");
  const [isSegmentMode, setIsSegmentMode] = useState<boolean>(false);

  // --- Animation & Stepper State ---
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(600);
  const [activeQueryX, setActiveQueryX] = useState<number>(10);

  // --- View Controls ---
  const [showAllLines, setShowAllLines] = useState<boolean>(true);
  const [showBreakpoints, setShowBreakpoints] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"visualizer" | "dp_matrix" | "theory" | "systems">(
    "visualizer",
  );

  // --- Knuth Matrix Selection ---
  const [mongeA, setMongeA] = useState<number>(0);
  const [mongeB, setMongeB] = useState<number>(1);
  const [mongeC, setMongeC] = useState<number>(3);
  const [mongeD, setMongeD] = useState<number>(4);

  // SVG Canvas Reference
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Synchronize when modality changes
  useEffect(() => {
    if (modality === "classic_monotonic_cht") {
      const p = CHT_PRESETS[selectedPreset] ?? CHT_PRESETS.classic_convex_lower;
      setCustomLines((p.lines as CHTLine[]) ?? []);
      setOptType(p.type ?? "min");
      setActiveQueryX(p.defaultQueryX ?? 10);
    } else if (modality === "dynamic_cht") {
      const p = DYNAMIC_CHT_PRESETS[selectedPreset] ?? DYNAMIC_CHT_PRESETS.arbitrary_slope_stream;
      setCustomLines((p.lines as CHTLine[]) ?? []);
      setOptType(p.type ?? "min");
      setActiveQueryX(p.defaultQueryX ?? 6);
    } else if (modality === "li_chao_tree") {
      const p = LICHAO_PRESETS[selectedPreset] ?? LICHAO_PRESETS.dense_segments;
      setCustomLines((p.lines as CHTLine[]) ?? []);
      setOptType(p.type ?? "min");
      setActiveQueryX(p.defaultQueryX ?? 3);
    }
    setCurrentStepIdx(0);
    setIsPlaying(false);
  }, [modality, selectedPreset]);

  // --- Algorithmic Computations ---

  const monotonicResult = useMemo(() => {
    if (modality !== "classic_monotonic_cht") return null;
    return buildMonotonicCHT(customLines, optType);
  }, [modality, customLines, optType]);

  const dynamicResult = useMemo(() => {
    if (modality !== "dynamic_cht") return null;
    return buildDynamicCHT(customLines, optType);
  }, [modality, customLines, optType]);

  const liChaoResult = useMemo(() => {
    if (modality !== "li_chao_tree") return null;
    const domain = LICHAO_PRESETS[selectedPreset]?.domain ?? [-20, 20];
    return buildLiChaoTree(customLines, domain[0], domain[1], optType);
  }, [modality, customLines, selectedPreset, optType]);

  const knuthResult = useMemo(() => {
    if (modality !== "knuth_quadrangle_dp") return null;
    const p = KNUTH_PRESETS[selectedPreset] ?? KNUTH_PRESETS.optimal_bst_cost;
    const mat = (p.costMatrix as number[][]) ?? generateOptimalBSTCostMatrix([4, 2, 6, 3, 5, 1]);
    return solveKnuthDP(mat, mat.length);
  }, [modality, selectedPreset]);

  const totalSteps = useMemo(() => {
    if (modality === "classic_monotonic_cht") return monotonicResult?.steps.length ?? 0;
    if (modality === "dynamic_cht") return dynamicResult?.steps.length ?? 0;
    if (modality === "li_chao_tree") return liChaoResult?.steps.length ?? 0;
    if (modality === "knuth_quadrangle_dp") return knuthResult?.steps.length ?? 0;
    return 0;
  }, [modality, monotonicResult, dynamicResult, liChaoResult, knuthResult]);

  // Ensure current step index is within bounds
  useEffect(() => {
    if (totalSteps > 0 && currentStepIdx >= totalSteps) {
      setCurrentStepIdx(totalSteps - 1);
    }
  }, [totalSteps, currentStepIdx]);

  // Query calculation at activeQueryX
  const activeQuery = useMemo<CHTQueryResult>(() => {
    if (modality === "classic_monotonic_cht" && monotonicResult) {
      return queryMonotonicCHT(monotonicResult.hull, activeQueryX, optType);
    }
    if (modality === "dynamic_cht" && dynamicResult) {
      return queryDynamicCHT(dynamicResult.hull, activeQueryX, optType);
    }
    if (modality === "li_chao_tree" && liChaoResult) {
      return queryLiChaoTree(liChaoResult.root, activeQueryX, optType);
    }
    return {
      value: 0,
      optimalLine: null,
      x: activeQueryX,
      stepCount: 0,
    };
  }, [modality, monotonicResult, dynamicResult, liChaoResult, activeQueryX, optType]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev + 1 >= totalSteps) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, playSpeed, totalSteps]);

  // --- Line Manipulation Handlers ---
  const handleAddLine = useCallback(() => {
    const m = parseFloat(newLineM);
    const c = parseFloat(newLineC);
    if (Number.isNaN(m) || Number.isNaN(c)) return;

    const id = `custom_${Date.now() % 10000}`;
    const color = VIBRANT_LINE_COLORS[customLines.length % VIBRANT_LINE_COLORS.length];

    let newLine: CHTLine = {
      id,
      m,
      c,
      label: `y = ${m}x + ${c}`,
      color,
    };

    if (modality === "li_chao_tree" && isSegmentMode) {
      const sl = parseFloat(newSegL);
      const sr = parseFloat(newSegR);
      if (!Number.isNaN(sl) && !Number.isNaN(sr) && sl < sr) {
        newLine = {
          ...newLine,
          xStart: sl,
          xEnd: sr,
          isSegment: true,
          label: `y = ${m}x + ${c} on [${sl}, ${sr}]`,
        };
      }
    }

    setCustomLines((prev) => [...prev, newLine]);
    setCurrentStepIdx(0);
  }, [newLineM, newLineC, newSegL, newSegR, isSegmentMode, modality, customLines.length]);

  const handleRemoveLine = useCallback((id: string) => {
    setCustomLines((prev) => prev.filter((l) => l.id !== id));
    setCurrentStepIdx(0);
  }, []);

  const handleClearLines = useCallback(() => {
    setCustomLines([]);
    setCurrentStepIdx(0);
  }, []);

  // --- SVG Coordinate Transform Helper ---
  const svgBounds = useMemo(() => {
    let minX = -10;
    let maxX = 25;
    let minY = -20;
    let maxY = 120;

    if (modality === "li_chao_tree") {
      const dom = LICHAO_PRESETS[selectedPreset]?.domain ?? [-20, 20];
      minX = dom[0] - 2;
      maxX = dom[1] + 2;
    }

    if (customLines.length > 0) {
      const xs = [minX, maxX, activeQueryX];
      const ys: number[] = [];

      for (const line of customLines) {
        for (const x of xs) {
          const y = line.m * x + line.c;
          if (Number.isFinite(y)) ys.push(y);
        }
      }

      if (ys.length > 0) {
        minY = Math.min(-10, Math.min(...ys) - 10);
        maxY = Math.max(10, Math.max(...ys) + 15);
      }
    }

    return { minX, maxX, minY, maxY };
  }, [customLines, activeQueryX, modality, selectedPreset]);

  // Coordinate mapper functions
  const canvasWidth = 740;
  const canvasHeight = 360;
  const padX = 55;
  const padY = 35;

  const toSvgX = useCallback(
    (x: number) => {
      const { minX, maxX } = svgBounds;
      const span = maxX - minX || 1;
      return padX + ((x - minX) / span) * (canvasWidth - 2 * padX);
    },
    [svgBounds],
  );

  const toSvgY = useCallback(
    (y: number) => {
      const { minY, maxY } = svgBounds;
      const span = maxY - minY || 1;
      return canvasHeight - padY - ((y - minY) / span) * (canvasHeight - 2 * padY);
    },
    [svgBounds],
  );

  const fromSvgX = useCallback(
    (svgX: number) => {
      const { minX, maxX } = svgBounds;
      const span = maxX - minX;
      return minX + ((svgX - padX) / (canvasWidth - 2 * padX)) * span;
    },
    [svgBounds],
  );

  // Interactive mouse click / drag on SVG canvas to set active query X
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const rawVal = fromSvgX(clickX);
    const clamped = Math.round(rawVal * 2) / 2;
    setActiveQueryX(clamped);
  };

  // Current active hull based on step
  const activeHullAtStep = useMemo<readonly CHTLine[]>(() => {
    if (modality === "classic_monotonic_cht" && monotonicResult?.steps[currentStepIdx]) {
      return monotonicResult.steps[currentStepIdx].currentHull;
    }
    if (modality === "dynamic_cht" && dynamicResult?.steps[currentStepIdx]) {
      return dynamicResult.steps[currentStepIdx].currentHull;
    }
    if (modality === "classic_monotonic_cht" && monotonicResult) {
      return monotonicResult.hull;
    }
    if (modality === "dynamic_cht" && dynamicResult) {
      return dynamicResult.hull;
    }
    return [];
  }, [modality, monotonicResult, dynamicResult, currentStepIdx]);

  // Current step details
  const activeStepDetails = useMemo(() => {
    if (modality === "classic_monotonic_cht") return monotonicResult?.steps[currentStepIdx];
    if (modality === "dynamic_cht") return dynamicResult?.steps[currentStepIdx];
    if (modality === "li_chao_tree") return liChaoResult?.steps[currentStepIdx];
    if (modality === "knuth_quadrangle_dp") return knuthResult?.steps[currentStepIdx];
    return null;
  }, [modality, monotonicResult, dynamicResult, liChaoResult, knuthResult, currentStepIdx]);

  // ==========================================================================
  // RENDER SECTIONS
  // ==========================================================================

  return (
    <div
      className={`w-full font-sans antialiased text-slate-100 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden ${
        standalone ? "min-h-screen p-6" : "p-4 md:p-6"
      }`}
    >
      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {title}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono">
                Advanced DP Lab
              </span>
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 max-w-3xl">
            Interactive Convex Hull Trick, Dynamic Envelope Pruning, Li Chao Segment Tree &
            Knuth&apos;s Monge Quadrangle Speedup.
          </p>
        </div>

        {/* Global Action Badges & Mode Switch */}
        <div className="flex flex-wrap items-center gap-2">
          {modality !== "knuth_quadrangle_dp" && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                type="button"
                onClick={() => setOptType("min")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  optType === "min"
                    ? "bg-amber-500 text-slate-950 shadow-md font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Min Envelope (Lower)
              </button>
              <button
                type="button"
                onClick={() => setOptType("max")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  optType === "max"
                    ? "bg-amber-500 text-slate-950 shadow-md font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Max Envelope (Upper)
              </button>
            </div>
          )}

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("visualizer")}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === "visualizer"
                  ? "bg-slate-800 text-amber-300 font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Visualizer
            </button>
            {modality === "knuth_quadrangle_dp" && (
              <button
                type="button"
                onClick={() => setActiveTab("dp_matrix")}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === "dp_matrix"
                    ? "bg-slate-800 text-amber-300 font-medium"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                DP & Monge Heatmap
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab("theory")}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === "theory"
                  ? "bg-slate-800 text-amber-300 font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Theorems & Invariants
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("systems")}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === "systems"
                  ? "bg-slate-800 text-amber-300 font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Systems & Cache
            </button>
          </div>
        </div>
      </div>

      {/* --- MODALITY SELECTOR TABS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-5">
        {CHT_MODALITIES.map((m) => {
          const isSelected = modality === m.id;
          return (
            <button
              type="button"
              key={m.id}
              onClick={() => {
                setModality(m.id);
                if (m.id === "classic_monotonic_cht") {
                  setSelectedPreset("classic_convex_lower");
                } else if (m.id === "dynamic_cht") {
                  setSelectedPreset("arbitrary_slope_stream");
                } else if (m.id === "li_chao_tree") {
                  setSelectedPreset("dense_segments");
                } else {
                  setSelectedPreset("optimal_bst_cost");
                }
              }}
              className={`text-left p-3.5 rounded-xl border transition-all relative overflow-hidden group ${
                isSelected
                  ? "bg-slate-900/90 border-amber-500/50 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20"
                  : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-white tracking-wide flex items-center gap-1.5">
                  {m.id === "classic_monotonic_cht" && (
                    <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                  )}
                  {m.id === "dynamic_cht" && <Zap className="w-3.5 h-3.5 text-rose-400" />}
                  {m.id === "li_chao_tree" && (
                    <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  {m.id === "knuth_quadrangle_dp" && (
                    <Table className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  {m.shortName}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {m.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">{m.description}</p>
            </button>
          );
        })}
      </div>

      {/* --- PRESETS & CONFIGURATION BAR --- */}
      <div className="mt-4 p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-medium">Presets:</span>
          {modality === "classic_monotonic_cht" &&
            Object.values(CHT_PRESETS).map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setSelectedPreset(p.id)}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  selectedPreset === p.id
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300 font-medium"
                    : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {p.name}
              </button>
            ))}

          {modality === "dynamic_cht" &&
            Object.values(DYNAMIC_CHT_PRESETS).map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setSelectedPreset(p.id)}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  selectedPreset === p.id
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300 font-medium"
                    : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {p.name}
              </button>
            ))}

          {modality === "li_chao_tree" &&
            Object.values(LICHAO_PRESETS).map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setSelectedPreset(p.id)}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  selectedPreset === p.id
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300 font-medium"
                    : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {p.name}
              </button>
            ))}

          {modality === "knuth_quadrangle_dp" &&
            Object.values(KNUTH_PRESETS).map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setSelectedPreset(p.id)}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  selectedPreset === p.id
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300 font-medium"
                    : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {p.name}
              </button>
            ))}
        </div>

        {/* Query Slider */}
        {modality !== "knuth_quadrangle_dp" && (
          <div className="flex items-center gap-2.5 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-mono text-[11px]">Query x =</span>
            <span className="text-amber-400 font-bold font-mono">{activeQueryX}</span>
            <input
              type="range"
              min={svgBounds.minX}
              max={svgBounds.maxX}
              step="0.5"
              value={activeQueryX}
              onChange={(e) => setActiveQueryX(parseFloat(e.target.value))}
              className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-emerald-400 font-mono font-medium text-[11px]">
              y={activeQuery.value.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* --- TAB 1: VISUALIZER --- */}
      {activeTab === "visualizer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
          {/* Main Visualizer Stage (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* SVG Canvas Container */}
            <div className="relative bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3 md:p-4 overflow-hidden shadow-inner">
              {/* Canvas Header / Overlay Metrics */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-[11px] text-slate-300">
                    {modality === "classic_monotonic_cht" &&
                      `Hull Stack: ${activeHullAtStep.length} lines`}
                    {modality === "dynamic_cht" &&
                      `Dynamic Envelope: ${activeHullAtStep.length} lines`}
                    {modality === "li_chao_tree" &&
                      `Li Chao Nodes: ${liChaoResult?.nodeCount ?? 0} (Depth ${liChaoResult?.maxDepth ?? 0})`}
                    {modality === "knuth_quadrangle_dp" &&
                      `Evaluated Cell (${activeStepDetails ? (activeStepDetails as KnuthDPStep).i : 0}, ${activeStepDetails ? (activeStepDetails as KnuthDPStep).j : 0})`}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px]">
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-amber-500 accent-amber-500"
                    />
                    <span>Grid</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px]">
                    <input
                      type="checkbox"
                      checked={showAllLines}
                      onChange={(e) => setShowAllLines(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-amber-500 accent-amber-500"
                    />
                    <span>All Lines</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px]">
                    <input
                      type="checkbox"
                      checked={showBreakpoints}
                      onChange={(e) => setShowBreakpoints(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-amber-500 accent-amber-500"
                    />
                    <span>Breakpoints</span>
                  </label>
                </div>
              </div>

              {/* Interactive SVG Coordinate Canvas */}
              {modality !== "knuth_quadrangle_dp" ? (
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
                  onClick={handleCanvasClick}
                  className="w-full h-auto bg-slate-950/90 rounded-xl border border-slate-800/80 cursor-crosshair select-none"
                  style={{ maxHeight: "420px" }}
                >
                  <defs>
                    <linearGradient id="envelopeGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                      <stop offset="50%" stopColor="#fbbf24" stopOpacity="1" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Cartesian Grid */}
                  {showGrid && (
                    <g opacity="0.15">
                      {/* Vertical grid lines */}
                      {Array.from({ length: 15 }).map((_, i) => {
                        const span = svgBounds.maxX - svgBounds.minX;
                        const xVal = svgBounds.minX + (i / 14) * span;
                        const sx = toSvgX(xVal);
                        return (
                          <line
                            key={`grid-v-${i}`}
                            x1={sx}
                            y1={padY}
                            x2={sx}
                            y2={canvasHeight - padY}
                            stroke="#94a3b8"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                          />
                        );
                      })}
                      {/* Horizontal grid lines */}
                      {Array.from({ length: 8 }).map((_, i) => {
                        const span = svgBounds.maxY - svgBounds.minY;
                        const yVal = svgBounds.minY + (i / 7) * span;
                        const sy = toSvgY(yVal);
                        return (
                          <line
                            key={`grid-h-${i}`}
                            x1={padX}
                            y1={sy}
                            x2={canvasWidth - padX}
                            y2={sy}
                            stroke="#94a3b8"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                          />
                        );
                      })}
                    </g>
                  )}

                  {/* Axes */}
                  <line
                    x1={padX}
                    y1={toSvgY(0)}
                    x2={canvasWidth - padX}
                    y2={toSvgY(0)}
                    stroke="#475569"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={toSvgX(0)}
                    y1={padY}
                    x2={toSvgX(0)}
                    y2={canvasHeight - padY}
                    stroke="#475569"
                    strokeWidth="1.5"
                  />

                  {/* Axis Tick Labels */}
                  <text
                    x={canvasWidth - padX + 5}
                    y={toSvgY(0) + 4}
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    X
                  </text>
                  <text
                    x={toSvgX(0) - 14}
                    y={padY - 8}
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    Y
                  </text>

                  {/* Candidate / Input Lines */}
                  {showAllLines &&
                    customLines.map((l) => {
                      const x1 = l.xStart !== undefined ? l.xStart : svgBounds.minX;
                      const x2 = l.xEnd !== undefined ? l.xEnd : svgBounds.maxX;
                      const y1 = l.m * x1 + l.c;
                      const y2 = l.m * x2 + l.c;
                      const isActive = activeQuery.optimalLine?.id === l.id;

                      return (
                        <g key={`cand-${l.id}`}>
                          <line
                            x1={toSvgX(x1)}
                            y1={toSvgY(y1)}
                            x2={toSvgX(x2)}
                            y2={toSvgY(y2)}
                            stroke={l.color ?? "#64748b"}
                            strokeWidth={isActive ? "2.5" : "1.2"}
                            strokeOpacity={isActive ? "1" : "0.35"}
                            strokeDasharray={l.isSegment ? "none" : "4 2"}
                          />
                          <text
                            x={toSvgX((x1 + x2) / 2)}
                            y={toSvgY(l.m * ((x1 + x2) / 2) + l.c) - 4}
                            fill={l.color ?? "#94a3b8"}
                            fontSize="9"
                            fontFamily="monospace"
                            opacity={isActive ? 1 : 0.6}
                          >
                            {l.id}
                          </text>
                        </g>
                      );
                    })}

                  {/* Highlighted Convex Envelope Polyline */}
                  {activeHullAtStep.length > 0 && (
                    <g>
                      {activeHullAtStep.map((l, idx) => {
                        const startX =
                          idx === 0
                            ? svgBounds.minX
                            : computeLineIntersection(activeHullAtStep[idx - 1], l).x;
                        const endX =
                          idx === activeHullAtStep.length - 1
                            ? svgBounds.maxX
                            : computeLineIntersection(l, activeHullAtStep[idx + 1]).x;

                        const yStart = l.m * startX + l.c;
                        const yEnd = l.m * endX + l.c;

                        return (
                          <line
                            key={`hull-seg-${l.id}-${idx}`}
                            x1={toSvgX(startX)}
                            y1={toSvgY(yStart)}
                            x2={toSvgX(endX)}
                            y2={toSvgY(yEnd)}
                            stroke="url(#envelopeGlow)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            filter="url(#glow)"
                          />
                        );
                      })}
                    </g>
                  )}

                  {/* Intersection Breakpoint Markers */}
                  {showBreakpoints &&
                    activeHullAtStep.slice(0, -1).map((l1, idx) => {
                      const l2 = activeHullAtStep[idx + 1];
                      const inter = computeLineIntersection(l1, l2);
                      if (inter.parallel) return null;
                      const cx = toSvgX(inter.x);
                      const cy = toSvgY(inter.y);

                      return (
                        <g key={`bp-${idx}`}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r="5"
                            fill="#f59e0b"
                            stroke="#0f172a"
                            strokeWidth="2"
                          />
                          <text
                            x={cx + 6}
                            y={cy - 6}
                            fill="#fcd34d"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            ({inter.x.toFixed(1)}, {inter.y.toFixed(1)})
                          </text>
                        </g>
                      );
                    })}

                  {/* Active Query Cursor line x = activeQueryX */}
                  <g>
                    <line
                      x1={toSvgX(activeQueryX)}
                      y1={padY}
                      x2={toSvgX(activeQueryX)}
                      y2={canvasHeight - padY}
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />

                    {/* Optimal Evaluation Marker */}
                    {activeQuery.optimalLine && (
                      <g>
                        <circle
                          cx={toSvgX(activeQueryX)}
                          cy={toSvgY(activeQuery.value)}
                          r="7"
                          fill="#38bdf8"
                          stroke="#0284c7"
                          strokeWidth="2"
                          className="animate-pulse"
                        />
                        <rect
                          x={toSvgX(activeQueryX) + 10}
                          y={toSvgY(activeQuery.value) - 22}
                          width="120"
                          height="20"
                          rx="4"
                          fill="#0f172a"
                          fillOpacity="0.9"
                          stroke="#38bdf8"
                          strokeWidth="1"
                        />
                        <text
                          x={toSvgX(activeQueryX) + 14}
                          y={toSvgY(activeQuery.value) - 8}
                          fill="#38bdf8"
                          fontSize="9.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          opt: y={activeQuery.value.toFixed(2)}
                        </text>
                      </g>
                    )}
                  </g>
                </svg>
              ) : (
                /* Knuth DP Visualizer Step Preview */
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-purple-300">
                      Step {currentStepIdx + 1}/{totalSteps}: Length{" "}
                      {activeStepDetails ? (activeStepDetails as KnuthDPStep).len : 2} interval
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Ops: Knuth {knuthResult?.knuthOperations} vs Naive{" "}
                      {knuthResult?.naiveOperations} (
                      <span className="text-emerald-400 font-bold">
                        {knuthResult?.speedupFactor}x speedup
                      </span>
                      )
                    </span>
                  </div>

                  {activeStepDetails && (
                    <div className="p-3 bg-slate-900/90 rounded-lg border border-purple-500/30 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-purple-200">
                          Computing Cell [{(activeStepDetails as KnuthDPStep).i}][
                          {(activeStepDetails as KnuthDPStep).j}]
                        </span>
                        <span className="font-mono text-amber-300">
                          Best split k* = {(activeStepDetails as KnuthDPStep).bestK} (Cost ={" "}
                          {(activeStepDetails as KnuthDPStep).bestVal})
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Knuth split bound: k ∈ [opt[{(activeStepDetails as KnuthDPStep).i}][
                        {(activeStepDetails as KnuthDPStep).j - 1}], opt[
                        {(activeStepDetails as KnuthDPStep).i + 1}][
                        {(activeStepDetails as KnuthDPStep).j}]] = [
                        {(activeStepDetails as KnuthDPStep).optLower},{" "}
                        {(activeStepDetails as KnuthDPStep).optUpper}].
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(activeStepDetails as KnuthDPStep).testedK.map((tk) => (
                          <span
                            key={tk.k}
                            className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                              tk.k === (activeStepDetails as KnuthDPStep).bestK
                                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            k={tk.k}: DP[{(activeStepDetails as KnuthDPStep).i}][{tk.k}] (
                            {tk.dpLeft}) + DP[{tk.k + 1}][
                            {(activeStepDetails as KnuthDPStep).j}] ({tk.dpRight}) + C ({tk.cVal}) ={" "}
                            {tk.cost}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stepper Toolbar */}
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all font-semibold flex items-center gap-1.5 shadow-md"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? "Pause" : "Play"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStepIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentStepIdx === 0}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-all"
                  title="Step Backward"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStepIdx((prev) => Math.min(totalSteps - 1, prev + 1))}
                  disabled={currentStepIdx >= totalSteps - 1}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-all"
                  title="Step Forward"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStepIdx(0);
                    setIsPlaying(false);
                  }}
                  className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all"
                  title="Reset Steps"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Step Slider & Speed */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono text-[11px]">Step:</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {totalSteps > 0 ? currentStepIdx + 1 : 0}/{totalSteps}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, totalSteps - 1)}
                    value={currentStepIdx}
                    onChange={(e) => setCurrentStepIdx(parseInt(e.target.value, 10))}
                    className="w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[10px]">Speed:</span>
                  <select
                    value={playSpeed}
                    onChange={(e) => setPlaySpeed(parseInt(e.target.value, 10))}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[10px] text-slate-300 focus:outline-none"
                  >
                    <option value={1000}>1.0s</option>
                    <option value={600}>0.6s</option>
                    <option value={300}>0.3s</option>
                    <option value={100}>0.1s</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel: Line Inspector & Execution Trace (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Active Query Optimal Result Card */}
            <div className="p-4 bg-slate-900/90 border border-amber-500/30 rounded-2xl space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Query Evaluation
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {modality === "classic_monotonic_cht"
                    ? "Binary Search O(log N)"
                    : modality === "dynamic_cht"
                      ? "Interval Search O(log N)"
                      : "Tree Query O(log C)"}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">Query Point x:</span>
                  <span className="font-mono text-white font-semibold">{activeQueryX}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">
                    Optimal {optType.toUpperCase()} y:
                  </span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    {activeQuery.value.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400 font-mono">Winning Line:</span>
                  <span className="font-mono text-amber-300 font-medium">
                    {activeQuery.optimalLine
                      ? `${activeQuery.optimalLine.id} (${activeQuery.optimalLine.label ?? `y = ${activeQuery.optimalLine.m}x + ${activeQuery.optimalLine.c}`})`
                      : "None"}
                  </span>
                </div>
              </div>
            </div>

            {/* Step Trace Description Card */}
            {activeStepDetails && (
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {"phase" in activeStepDetails
                      ? (activeStepDetails as { phase: string }).phase
                      : ""}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Step {currentStepIdx + 1}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-white">
                  {"title" in activeStepDetails
                    ? (activeStepDetails as { title: string }).title
                    : ""}
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {"description" in activeStepDetails
                    ? (activeStepDetails as { description: string }).description
                    : ""}
                </p>
              </div>
            )}

            {/* Custom Line / Segment Adder */}
            {modality !== "knuth_quadrangle_dp" && (
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    Add Linear Function
                  </h3>
                  {modality === "li_chao_tree" && (
                    <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSegmentMode}
                        onChange={(e) => setIsSegmentMode(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-amber-500 accent-amber-500"
                      />
                      <span>Segment</span>
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono">Slope m:</label>
                    <input
                      type="number"
                      value={newLineM}
                      onChange={(e) => setNewLineM(e.target.value)}
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono">Intercept c:</label>
                    <input
                      type="number"
                      value={newLineC}
                      onChange={(e) => setNewLineC(e.target.value)}
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {modality === "li_chao_tree" && isSegmentMode && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono">xStart:</label>
                      <input
                        type="number"
                        value={newSegL}
                        onChange={(e) => setNewSegL(e.target.value)}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono">xEnd:</label>
                      <input
                        type="number"
                        value={newSegR}
                        onChange={(e) => setNewSegR(e.target.value)}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="flex-1 py-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold text-xs transition-all shadow"
                  >
                    Insert Line
                  </button>
                  <button
                    type="button"
                    onClick={handleClearLines}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-all"
                    title="Clear All Lines"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Lines List */}
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {customLines.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: l.color ?? "#94a3b8" }}
                        />
                        <span className="font-mono text-slate-200">
                          {l.label ?? `y = ${l.m}x + ${l.c}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(l.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: KNUTH DP MATRIX & MONGE HEATMAP --- */}
      {activeTab === "dp_matrix" && knuthResult && (
        <div className="mt-5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* DP Matrix Table (6 cols) */}
            <div className="lg:col-span-6 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                  <Table className="w-4 h-4" />
                  Interval DP Matrix DP[i][j]
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Size: {knuthResult.n} × {knuthResult.n}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse font-mono text-xs">
                  <thead>
                    <tr>
                      <th className="p-1.5 text-slate-500 text-[11px]">i \ j</th>
                      {Array.from({ length: knuthResult.n }).map((_, j) => (
                        <th key={j} className="p-1.5 text-amber-400 text-[11px]">
                          {j}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {knuthResult.dp.map((row, i) => (
                      <tr key={i} className="border-t border-slate-800/60">
                        <td className="p-1.5 text-amber-400 font-bold text-[11px]">{i}</td>
                        {row.map((val, j) => {
                          const isDiagonal = i === j;
                          const isInvalid = i > j;
                          const optSplit = knuthResult.opt[i][j];

                          return (
                            <td
                              key={j}
                              className={`p-2 transition-all ${
                                isInvalid
                                  ? "text-slate-700 bg-slate-950/30"
                                  : isDiagonal
                                    ? "text-slate-500 bg-slate-900"
                                    : "text-purple-200 bg-purple-950/20 hover:bg-purple-900/40 border border-purple-900/20"
                              }`}
                            >
                              {!isInvalid && (
                                <div>
                                  <div className="font-bold">{val}</div>
                                  {!isDiagonal && (
                                    <div className="text-[9px] text-amber-400/80">
                                      k*={optSplit}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Optimal Split Matrix opt[i][j] (6 cols) */}
            <div className="lg:col-span-6 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Optimal Split Decision Matrix opt[i][j]
                </h3>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  Monotonic: opt[i][j-1] ≤ opt[i][j] ≤ opt[i+1][j]
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse font-mono text-xs">
                  <thead>
                    <tr>
                      <th className="p-1.5 text-slate-500 text-[11px]">i \ j</th>
                      {Array.from({ length: knuthResult.n }).map((_, j) => (
                        <th key={j} className="p-1.5 text-amber-400 text-[11px]">
                          {j}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {knuthResult.opt.map((row, i) => (
                      <tr key={i} className="border-t border-slate-800/60">
                        <td className="p-1.5 text-amber-400 font-bold text-[11px]">{i}</td>
                        {row.map((val, j) => {
                          const isInvalid = i >= j;
                          return (
                            <td
                              key={j}
                              className={`p-2 transition-all ${
                                isInvalid
                                  ? "text-slate-700 bg-slate-950/30"
                                  : "text-amber-300 bg-amber-950/20 hover:bg-amber-900/40 border border-amber-900/20 font-bold"
                              }`}
                            >
                              {!isInvalid && val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Monge Quadrangle Inequality Verifier Interactive Tool */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Quadrangle Inequality (QI) / Monge Condition Verification
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  C[a][c] + C[b][d] ≤ C[a][d] + C[b][c] for all 0 ≤ a ≤ b ≤ c ≤ d &lt; n
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-mono font-semibold ${
                    knuthResult.mongeVerification.satisfiesMonge
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  {knuthResult.mongeVerification.satisfiesMonge
                    ? `Verified (${knuthResult.mongeVerification.checkedQuadruples} quadruples valid)`
                    : `${knuthResult.mongeVerification.violations.length} Monge Violations`}
                </span>
              </div>
            </div>

            {/* Interactive Quadruple Inspector (a, b, c, d) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              <div>
                <label className="text-[11px] font-mono text-slate-400">Index a:</label>
                <input
                  type="number"
                  min="0"
                  max={knuthResult.n - 1}
                  value={mongeA}
                  onChange={(e) => setMongeA(parseInt(e.target.value, 10))}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-400">Index b:</label>
                <input
                  type="number"
                  min={mongeA}
                  max={knuthResult.n - 1}
                  value={mongeB}
                  onChange={(e) => setMongeB(parseInt(e.target.value, 10))}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-400">Index c:</label>
                <input
                  type="number"
                  min={mongeB}
                  max={knuthResult.n - 1}
                  value={mongeC}
                  onChange={(e) => setMongeC(parseInt(e.target.value, 10))}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-400">Index d:</label>
                <input
                  type="number"
                  min={mongeC}
                  max={knuthResult.n - 1}
                  value={mongeD}
                  onChange={(e) => setMongeD(parseInt(e.target.value, 10))}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Verification Result Display */}
            {(() => {
              const a = Math.min(Math.max(0, mongeA), knuthResult.n - 1);
              const b = Math.min(Math.max(a, mongeB), knuthResult.n - 1);
              const c = Math.min(Math.max(b, mongeC), knuthResult.n - 1);
              const d = Math.min(Math.max(c, mongeD), knuthResult.n - 1);

              const cac = knuthResult.costMatrix[a][c];
              const cbd = knuthResult.costMatrix[b][d];
              const cad = knuthResult.costMatrix[a][d];
              const cbc = knuthResult.costMatrix[b][c];

              const lhs = cac + cbd;
              const rhs = cad + cbc;
              const diff = rhs - lhs;
              const isValid = diff >= -1e-9;

              return (
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 font-mono">
                    <div className="text-slate-300">
                      LHS: C[{a}][{c}] ({cac}) + C[{b}][{d}] ({cbd}) ={" "}
                      <span className="text-amber-400 font-bold">{lhs}</span>
                    </div>
                    <div className="text-slate-300">
                      RHS: C[{a}][{d}] ({cad}) + C[{b}][{c}] ({cbc}) ={" "}
                      <span className="text-purple-400 font-bold">{rhs}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400 font-mono">
                        Slack Δ = RHS - LHS:
                      </div>
                      <div className="font-mono font-bold text-sm text-emerald-400">+{diff}</div>
                    </div>
                    <div
                      className={`p-2 rounded-lg font-bold text-xs ${
                        isValid
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {isValid ? "LHS ≤ RHS (Satisfied)" : "VIOLATION"}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* --- TAB 3: THEORETICAL PROOFS & INVARIANTS --- */}
      {activeTab === "theory" && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-300">
          {/* Proof 1: Convex Envelope Monotonicity */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <TrendingUp className="w-4 h-4" />
              1. Convex Envelope Invariant & Intersection Monotonicity
            </div>
            <p className="leading-relaxed text-slate-300">
              For a lower envelope with strictly decreasing slopes m1 &gt; m2 &gt; ... &gt; mk, the
              pairwise intersection x-coordinates strictly increase:
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-300">
              {"x(L1, L2) < x(L2, L3) < ... < x(L_{k-1}, L_k)"}
            </div>
            <p className="leading-relaxed text-slate-400">
              When inserting candidate line L3 to a stack ending in (L1, L2), if x(L2, L3) &le;
              x(L1, L2), line L2 is redundant because L3 overtakes L1 at or before the coordinate
              where L2 would have become optimal. Thus, popping L2 maintains the strict convexity of
              the lower envelope.
            </p>
          </div>

          {/* Proof 2: Li Chao Pushdown Invariant */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <GitBranch className="w-4 h-4" />
              2. Li Chao Tree Midpoint Dominance & Pushdown Correctness
            </div>
            <p className="leading-relaxed text-slate-300">
              Let node u cover range [l, r] with midpoint mid = floor((l+r)/2). We maintain the
              invariant that u stores the line that is dominant at mid.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300">
              {"{L_{\\text{stored}}(mid) \\le L_{\\text{new}}(mid) \\quad (\\text{for Min DP})}"}
            </div>
            <p className="leading-relaxed text-slate-400">
              Since two distinct lines intersect at at most one point, the pushed-down inferior line
              can only outperform the dominant line on at most one of the two halves [l, mid] or
              [mid+1, r]. Therefore, we recurse into exactly one child, guaranteeing O(log C) time
              per line insertion.
            </p>
          </div>

          {/* Proof 3: Knuth Monge Optimization */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <Table className="w-4 h-4" />
              3. Knuth&apos;s Split Monotonicity from Quadrangle Inequality
            </div>
            <p className="leading-relaxed text-slate-300">
              If cost matrix C satisfies QI (C[a][c] + C[b][d] &le; C[a][d] + C[b][c]) and
              monotonicity (C[b][c] &le; C[a][d]), then the 2D DP array DP[i][j] also satisfies QI.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-purple-300">
              {"opt[i][j-1] <= opt[i][j] <= opt[i+1][j]"}
            </div>
            <p className="leading-relaxed text-slate-400">
              For a fixed interval length L, the sum of search ranges telescopes: sum_i
              (opt[i+1][i+L-1] - opt[i][i+L-2] + 1) = opt[n-L+2][n] - opt[1][L-1] + n &le; 2n.
              Summing over all lengths L = 2 ... n yields O(n^2) total operations instead of naive
              O(n^3).
            </p>
          </div>

          {/* Proof 4: Dynamic Neighbor Pruning */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Zap className="w-4 h-4" />
              4. Dynamic CHT Bilateral Cascade Pruning
            </div>
            <p className="leading-relaxed text-slate-300">
              In Fully Dynamic CHT with arbitrary slope insertions, maintaining a sorted array or
              balanced BST by slope m allows O(log N) neighbor lookup.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-rose-300">
              {"isRedundant(P, L, N) <=> x(P, L) >= x(L, N)"}
            </div>
            <p className="leading-relaxed text-slate-400">
              Because each line is inserted once and deleted at most once across the entire sequence
              of operations, the amortized cost per insertion remains O(log N) despite the potential
              cascading pruning loops.
            </p>
          </div>
        </div>
      )}

      {/* --- TAB 4: SYSTEMS & HARDWARE ARCHITECTURE --- */}
      {activeTab === "systems" && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-300">
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Cpu className="w-4 h-4" />
              Cache Locality: Flat Vectors vs Pointer-Chased Trees
            </div>
            <p className="leading-relaxed text-slate-300">
              Classic Monotonic CHT uses contiguous vectors of structs (e.g.{" "}
              <code className="text-amber-300 font-mono">{"struct Line { double m, c; };"}</code>).
              All lines and intersection breakpoints reside contiguously in memory, yielding near
              100% L1 cache hits during binary search.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400">
              Memory Footprint: 16 bytes per line • L1 Cache Misses: ~0% • Hardware Prefetch
              Friendly
            </div>
            <p className="leading-relaxed text-slate-400">
              In contrast, dynamically allocated Li Chao Segment Trees or Dynamic Hull trees suffer
              pointer dereference overhead and cache misses (~15-30ns per jump).
            </p>
          </div>

          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
              <Zap className="w-4 h-4" />
              Branch Prediction & Branchless Eytzinger Layout
            </div>
            <p className="leading-relaxed text-slate-300">
              Standard binary search on breakpoints induces unpredictable conditional branches
              ($\approx 50\%$ misprediction rate). Using the 1-indexed Eytzinger array layout with
              conditional moves (<code className="text-sky-300 font-mono">cmov</code>) eliminates
              branch misprediction penalties.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400">
              Standard BS: ~12-18 cycles/step • Branchless Eytzinger: ~3-5 cycles/step (3.5x
              throughput)
            </div>
            <p className="leading-relaxed text-slate-400">
              For batch queries, lines can be evaluated via SIMD vectorization (AVX-512 / ARM NEON)
              computing 8 or 16 line evaluations simultaneously.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConvexHullTrickStudio;
