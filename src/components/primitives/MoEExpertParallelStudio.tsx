import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Cpu,
  Network,
  Layers,
  Zap,
  BarChart3,
  Activity,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Sliders,
  ShieldCheck,
  Sparkles,
  Server,
  Scale,
  Boxes,
  AlertTriangle,
  Info,
  TrendingDown,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

// ============================================================================
// 1. TYPES & CONTRACTS
// ============================================================================

export type MoEPresetId =
  | "mixtral_8x7b"
  | "deepseek_v3"
  | "switch_transformer"
  | "load_imbalance_straggler"
  | "capacity_drop_stress"
  | "gshard_top2"
  | "custom";

export type PipelineStepId =
  | "router_gating"
  | "topk_selection"
  | "aux_loss"
  | "capacity_truncation"
  | "all_to_all_dispatch"
  | "expert_ffn"
  | "all_to_all_combine"
  | "aggregation_output";

export type RoutingBiasType = "balanced" | "clustered" | "heavy_straggler" | "adversarial";

export type RoutingStrategy = "aux_loss" | "deepseek_bias";

export interface MoEConfig {
  readonly numExperts: number; // E (e.g. 8, 16, 64)
  readonly topK: number; // k (e.g. 1, 2, 4, 6, 8)
  readonly numGpus: number; // P (e.g. 2, 4, 8)
  readonly numTokens: number; // T (e.g. 16, 32, 64)
  readonly capacityFactor: number; // C (e.g. 1.0, 1.25, 1.5, 2.0)
  readonly auxLossAlpha: number; // alpha (e.g. 0.01, 0.02)
  readonly noiseStd: number; // sigma for noisy top-k jitter
  readonly hiddenDim: number; // d_model (e.g. 1024, 2048, 4096)
  readonly bytesPerElement: number; // 1 (FP8), 2 (FP16/BF16), 4 (FP32)
  readonly routingBias: RoutingBiasType;
  readonly routingStrategy?: RoutingStrategy;
  readonly biasStepSize?: number; // gamma for DeepSeek-V3 dynamic bias updates
}

export interface TokenAssignment {
  readonly expertId: number;
  readonly weight: number;
  readonly targetGpu: number;
  readonly isLocal: boolean;
  readonly isDropped: boolean;
}

export interface TokenData {
  readonly id: number;
  readonly text: string;
  readonly sourceGpu: number;
  readonly logits: readonly number[];
  readonly biasedScores?: readonly number[];
  readonly routingProbs: readonly number[];
  readonly selectedExperts: readonly number[];
  readonly weights: readonly number[];
  readonly assignments: readonly TokenAssignment[];
  readonly droppedExperts: readonly number[];
  readonly targetGpus: readonly number[];
  readonly crossGpuCount: number;
  readonly localCount: number;
}

export interface AllToAllResult {
  readonly expertCapacity: number;
  readonly expertAssignedTokens: readonly (readonly number[])[];
  readonly expertProcessedTokens: readonly (readonly number[])[];
  readonly expertDroppedTokens: readonly (readonly number[])[];
  readonly expertLoads: readonly number[];
  readonly expertUtilization: readonly number[];
  readonly totalDroppedAssignments: number;
  readonly totalProcessedAssignments: number;
  readonly dropRate: number;
  readonly tokenResults: readonly TokenData[];
  readonly gpuDispatchMatrix: readonly (readonly number[])[];
  readonly gpuCombineMatrix: readonly (readonly number[])[];
  readonly gpuComputeLoads: readonly number[];
  readonly stragglerGpu: number;
  readonly stragglerPenaltyRatio: number;
  readonly crossGpuTransfers: number;
  readonly localTransfers: number;
}

export interface DeepSeekBiasRoutingResult {
  readonly selectedExperts: number[][];
  readonly weights: number[][];
  readonly routingProbs: number[][];
  readonly biasedScores: number[][];
  readonly dynamicBiases: number[];
  readonly biasDeltas: number[];
}

export interface BiasConvergenceIteration {
  readonly iteration: number;
  readonly biases: number[];
  readonly expertLoads: number[];
  readonly imbalanceRatio: number;
  readonly auxLoss: number;
}

export interface MoEPreset {
  readonly id: MoEPresetId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly architectureFamily: string;
  readonly config: MoEConfig;
  readonly sampleTokens: readonly string[];
  readonly highlightConcepts: readonly string[];
}

export interface MoEExpertParallelStudioProps {
  readonly initialPreset?: MoEPresetId;
  readonly initialConfig?: Partial<MoEConfig>;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onStepChange?: (stepIndex: number, stepName: string) => void;
  readonly onPresetChange?: (presetId: MoEPresetId) => void;
}

export interface PipelineStepMeta {
  readonly id: PipelineStepId;
  readonly name: string;
  readonly shortName: string;
  readonly iconName: string;
  readonly description: string;
  readonly equation: string;
}

// ============================================================================
// 2. PIPELINE STEP DEFINITIONS
// ============================================================================

export const PIPELINE_STEPS: readonly PipelineStepMeta[] = [
  {
    id: "router_gating",
    name: "1. Router Gating Logits & Biases",
    shortName: "Router Gating",
    iconName: "Zap",
    description:
      "Input tokens are projected through gating matrix W_g to compute routing logits H(x) = x · W_g + b_i + ε.",
    equation:
      "H(x)_i = (x \\cdot W_g)_i + b_i + \\epsilon_i, \\quad \\epsilon \\sim \\mathcal{N}(0, \\sigma^2)",
  },
  {
    id: "topk_selection",
    name: "2. Top-k Sparse Selection",
    shortName: "Top-k Selection",
    iconName: "Sliders",
    description:
      "Top-k highest scoring experts are selected. Gating weights G(x) are normalized with Softmax over un-biased affinities.",
    equation:
      "G(x)_i = \\frac{\\exp(\\text{aff}(x, i))}{\\sum_{j \\in \\text{TopK}} \\exp(\\text{aff}(x, j))} \\quad \\forall i \\in \\text{TopK}(H(x), k)",
  },
  {
    id: "aux_loss",
    name: "3. Aux Loss vs Dynamic Bias Balancing",
    shortName: "Load Balancing",
    iconName: "Scale",
    description:
      "Standard MoE evaluates auxiliary balancing loss. DeepSeek-V3 operates aux-loss-free using dynamic expert bias updates.",
    equation:
      "\\Delta b_i = -\\gamma \\cdot \\frac{\\text{load}_i - \\bar{C}}{\\bar{C}} \\quad (\\mathcal{L}_{\\text{aux}} = 0)",
  },
  {
    id: "capacity_truncation",
    name: "4. Capacity Limit & Drop Check",
    shortName: "Capacity Drop",
    iconName: "ShieldCheck",
    description:
      "Calculates maximum token capacity per expert. Excess tokens overflowing the threshold are dropped to residual skip.",
    equation:
      "\\text{Capacity} = \\left\\lceil \\frac{k \\cdot T}{E} \\times C \\right\\rceil, \\quad \\text{Drop if } \\text{count}_i > \\text{Capacity}",
  },
  {
    id: "all_to_all_dispatch",
    name: "5. Dispatch All-to-All Collective",
    shortName: "Dispatch All2All",
    iconName: "Network",
    description:
      "GPU ranks exchange token activation tensors across NVLink/InfiniBand to target expert host GPUs.",
    equation:
      "\\text{Dispatch}(P \\times P): \\quad \\text{GPU}_r \\xrightarrow{\\text{All2All}} \\text{GPU}_{\\lfloor e / (E/P) \\rfloor}",
  },
  {
    id: "expert_ffn",
    name: "6. GPU Expert FFN Compute",
    shortName: "Expert Compute",
    iconName: "Cpu",
    description:
      "Each GPU executes the 2-layer MLP/FFN for its locally hosted subset of experts in parallel.",
    equation:
      "y_{t, i} = \\text{FFN}_i(x_t) = \\sigma(x_t W_{1,i}) W_{2,i} \\quad \\forall i \\in \\text{GPU Local Experts}",
  },
  {
    id: "all_to_all_combine",
    name: "7. Combine All-to-All Collective",
    shortName: "Combine All2All",
    iconName: "Network",
    description:
      "Processed expert activation outputs are returned back to the originating GPU rank via reverse All-to-All.",
    equation:
      "\\text{Combine}(P \\times P): \\quad \\text{GPU}_{\\text{target}} \\xrightarrow{\\text{All2All}} \\text{GPU}_{\\text{source}}",
  },
  {
    id: "aggregation_output",
    name: "8. Weighted Sum & Residual",
    shortName: "Aggregation",
    iconName: "Boxes",
    description:
      "Originating GPUs combine top-k expert outputs weighted by G(x) and add the residual skip connection.",
    equation: "y_t = x_t + \\sum_{i \\in \\text{TopK}} G(x_t)_i \\cdot \\text{FFN}_i(x_t)",
  },
];

// ============================================================================
// 3. PURE MATHEMATICAL & SIMULATION FUNCTIONS
// ============================================================================

/**
 * Numerically stable Softmax function over a 1D vector of logits.
 */
export function softmax(logits: readonly number[]): number[] {
  if (!logits || logits.length === 0) return [];
  const maxVal = Math.max(...logits);
  if (!Number.isFinite(maxVal)) {
    return Array.from({ length: logits.length }, () => 1 / logits.length);
  }

  const expValues = logits.map((val) => Math.exp(val - maxVal));
  const sumExp = expValues.reduce((acc, curr) => acc + curr, 0);

  if (sumExp <= 0 || !Number.isFinite(sumExp)) {
    return Array.from({ length: logits.length }, () => 1 / logits.length);
  }

  return expValues.map((val) => val / sumExp);
}

/**
 * Deterministic standard normal PRNG using Box-Muller transform with pseudo-random seed.
 */
function pseudoNormal(seed: number): number {
  const u1 = Math.max(1e-7, (Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1);
  const u2 = Math.max(1e-7, (Math.cos(seed * 26.3314 + 19.412) * 23421.6312) % 1);
  const mag = Math.sqrt(-2.0 * Math.log(Math.abs(u1)));
  return mag * Math.cos(2.0 * Math.PI * Math.abs(u2));
}

/**
 * Computes Top-k routing selections, normalized weights, and full routing probabilities (Standard MoE).
 */
export function computeTopKRouting(
  logits: readonly (readonly number[])[],
  k: number,
  noiseStd = 0,
  randomSeed = 42,
): {
  readonly selectedExperts: number[][];
  readonly weights: number[][];
  readonly routingProbs: number[][];
} {
  const T = logits.length;
  if (T === 0) {
    return { selectedExperts: [], weights: [], routingProbs: [] };
  }

  const selectedExperts: number[][] = [];
  const weights: number[][] = [];
  const routingProbs: number[][] = [];

  for (let t = 0; t < T; t++) {
    const rawL = logits[t] ?? [];
    const E = rawL.length;
    const effectiveK = Math.max(1, Math.min(k, E));

    // Inject jitter if requested (Noisy Top-k)
    const perturbedLogits: number[] = [];
    for (let e = 0; e < E; e++) {
      const base = rawL[e] ?? 0;
      const noise = noiseStd > 0 ? pseudoNormal(randomSeed + t * 100 + e * 7) * noiseStd : 0;
      perturbedLogits.push(base + noise);
    }

    const fullProbs = softmax(perturbedLogits);
    routingProbs.push(fullProbs);

    // Find top-k expert indices
    const indexed = perturbedLogits.map((val, idx) => ({ idx, val }));
    indexed.sort((a, b) => b.val - a.val);

    const topIndices: number[] = [];
    const topLogits: number[] = [];
    for (let i = 0; i < effectiveK; i++) {
      const item = indexed[i];
      if (item !== undefined) {
        topIndices.push(item.idx);
        topLogits.push(item.val);
      }
    }

    // Softmax normalized over only the top-k chosen logits
    const topWeights = softmax(topLogits);

    selectedExperts.push(topIndices);
    weights.push(topWeights);
  }

  return {
    selectedExperts,
    weights,
    routingProbs,
  };
}

/**
 * DeepSeek-V3 Auxiliary-Loss-Free Dynamic Bias Routing Mechanism:
 * 1. Biased routing scores: s_{t, i} = affinity(x_t, e_i) + b_i
 * 2. Top-k selection based on biased scores: TopK(s_{t, :}, k)
 * 3. Gating weights computed on raw unbiased logits: Softmax(affinity(x_t, e_{selected}))
 *    (Ensures representation learning is never distorted by dynamic balancing bias terms).
 */
export function computeDeepSeekBiasRouting(
  logits: readonly (readonly number[])[],
  biases: readonly number[],
  k: number,
  noiseStd = 0,
  randomSeed = 42,
): DeepSeekBiasRoutingResult {
  const T = logits.length;
  if (T === 0) {
    return {
      selectedExperts: [],
      weights: [],
      routingProbs: [],
      biasedScores: [],
      dynamicBiases: [...biases],
      biasDeltas: [],
    };
  }

  const selectedExperts: number[][] = [];
  const weights: number[][] = [];
  const routingProbs: number[][] = [];
  const biasedScores: number[][] = [];

  for (let t = 0; t < T; t++) {
    const rawL = logits[t] ?? [];
    const E = rawL.length;
    const effectiveK = Math.max(1, Math.min(k, E));

    const rawPerturbed: number[] = [];
    const rowBiased: number[] = [];

    for (let e = 0; e < E; e++) {
      const base = rawL[e] ?? 0;
      const noise = noiseStd > 0 ? pseudoNormal(randomSeed + t * 100 + e * 7) * noiseStd : 0;
      const unBiasedScore = base + noise;
      const b_i = biases[e] ?? 0;
      rawPerturbed.push(unBiasedScore);
      rowBiased.push(unBiasedScore + b_i);
    }

    biasedScores.push(rowBiased);
    routingProbs.push(softmax(rawPerturbed));

    // Sort by biased score for top-k routing selection
    const indexed = rowBiased.map((score, idx) => ({ idx, score, rawVal: rawPerturbed[idx] ?? 0 }));
    indexed.sort((a, b) => b.score - a.score);

    const topIndices: number[] = [];
    const topRawLogits: number[] = [];

    for (let i = 0; i < effectiveK; i++) {
      const item = indexed[i];
      if (item !== undefined) {
        topIndices.push(item.idx);
        topRawLogits.push(item.rawVal); // DeepSeek-V3: weights computed from unbiased raw logits
      }
    }

    const topWeights = softmax(topRawLogits);

    selectedExperts.push(topIndices);
    weights.push(topWeights);
  }

  return {
    selectedExperts,
    weights,
    routingProbs,
    biasedScores,
    dynamicBiases: [...biases],
    biasDeltas: Array.from({ length: biases.length }, () => 0),
  };
}

/**
 * Updates DeepSeek-V3 dynamic expert biases:
 * Overloaded experts (load > target) receive negative bias adjustment (b_i decreases).
 * Underloaded experts (load < target) receive positive bias adjustment (b_i increases).
 */
export function updateDeepSeekBiases(
  currentBiases: readonly number[],
  expertLoads: readonly number[],
  targetLoadPerExpert: number,
  gamma = 0.1,
): {
  readonly updatedBiases: number[];
  readonly deltas: number[];
} {
  const E = Math.max(currentBiases.length, expertLoads.length);
  const updatedBiases: number[] = [];
  const deltas: number[] = [];

  for (let e = 0; e < E; e++) {
    const curB = currentBiases[e] ?? 0;
    const load = expertLoads[e] ?? 0;
    const diff = load - targetLoadPerExpert;

    // Proportional normalized gradient adjustment
    const delta =
      targetLoadPerExpert > 0 ? -gamma * (diff / targetLoadPerExpert) : -gamma * Math.sign(diff);

    const roundedDelta = Math.abs(delta) < 1e-9 ? 0 : Math.round(delta * 1000) / 1000;
    const rawNewB = curB + roundedDelta;
    const newB = Math.abs(rawNewB) < 1e-9 ? 0 : Math.round(rawNewB * 1000) / 1000;

    updatedBiases.push(newB);
    deltas.push(roundedDelta);
  }

  return {
    updatedBiases,
    deltas,
  };
}

/**
 * Simulates multi-step dynamic bias adaptation demonstrating how bias routing drives load imbalance
 * down from an initial skewed spike to near 1.0x without any auxiliary loss penalty.
 */
export function simulateDeepSeekBiasConvergence(
  initialLogits: readonly (readonly number[])[],
  k: number,
  numIterations = 6,
  gamma = 0.5,
  _capacityFactor = 1.25,
): BiasConvergenceIteration[] {
  const T = initialLogits.length;
  if (T === 0) return [];
  const E = initialLogits[0]?.length ?? 1;
  const targetLoad = (T * k) / E;

  let currentBiases = Array.from({ length: E }, () => 0);
  const iterations: BiasConvergenceIteration[] = [];

  for (let iter = 0; iter < numIterations; iter++) {
    const routing = computeDeepSeekBiasRouting(initialLogits, currentBiases, k, 0, 42);

    const loads = Array.from({ length: E }, () => 0);
    for (let t = 0; t < T; t++) {
      const selected = routing.selectedExperts[t] ?? [];
      for (const eId of selected) {
        if (eId >= 0 && eId < E) {
          loads[eId]! += 1;
        }
      }
    }

    const maxL = Math.max(...loads, 1);
    const meanL = loads.reduce((a, b) => a + b, 0) / E;
    const imbalanceRatio = meanL > 0 ? Math.round((maxL / meanL) * 100) / 100 : 1.0;

    iterations.push({
      iteration: iter,
      biases: [...currentBiases],
      expertLoads: [...loads],
      imbalanceRatio,
      auxLoss: 0.0, // Auxiliary loss free!
    });

    const update = updateDeepSeekBiases(currentBiases, loads, targetLoad, gamma);
    currentBiases = update.updatedBiases;
  }

  return iterations;
}

/**
 * Calculates the Auxiliary Load Balancing Loss:
 * L_aux = alpha * E * sum_{i=1}^E (f_i * P_i)
 * where f_i is fraction of tokens dispatched to expert i, and P_i is average routing probability for expert i.
 */
export function computeAuxiliaryLoss(
  routingProbs: readonly (readonly number[])[],
  expertCounts: readonly number[],
  numTokens: number,
  numExperts: number,
  alpha: number,
): {
  readonly loss: number;
  readonly f_fractions: number[];
  readonly p_probs: number[];
} {
  if (numTokens <= 0 || numExperts <= 0) {
    return { loss: 0, f_fractions: [], p_probs: [] };
  }

  const totalAssignedSlots = expertCounts.reduce((acc, curr) => acc + curr, 0);
  const f_fractions: number[] = [];
  const p_probs: number[] = [];

  for (let e = 0; e < numExperts; e++) {
    const f_i =
      totalAssignedSlots > 0 ? (expertCounts[e] ?? 0) / totalAssignedSlots : 1 / numExperts;
    f_fractions.push(f_i);

    let sumProb = 0;
    for (let t = 0; t < numTokens; t++) {
      sumProb += routingProbs[t]?.[e] ?? 0;
    }
    const P_i = sumProb / numTokens;
    p_probs.push(P_i);
  }

  let sumFP = 0;
  for (let e = 0; e < numExperts; e++) {
    sumFP += (f_fractions[e] ?? 0) * (p_probs[e] ?? 0);
  }

  const rawLoss = alpha * numExperts * sumFP;
  const loss = Math.round(rawLoss * 10000) / 10000;

  return {
    loss,
    f_fractions,
    p_probs,
  };
}

/**
 * Calculates the maximum token capacity per expert:
 * Capacity = ceil((k * T / E) * C)
 */
export function calculateExpertCapacity(
  numTokens: number,
  topK: number,
  numExperts: number,
  capacityFactor: number,
): number {
  if (numExperts <= 0 || numTokens <= 0 || topK <= 0) return 1;
  const baseAvgTokensPerExpert = (topK * numTokens) / numExperts;
  const rawCap = Math.ceil(baseAvgTokensPerExpert * Math.max(0.1, capacityFactor));
  return Math.max(1, rawCap);
}

/**
 * Generates synthetic deterministic routing logits for visual studio scenarios.
 */
export function generateDeterministicLogits(
  numTokens: number,
  numExperts: number,
  biasType: RoutingBiasType = "balanced",
  seed = 42,
): number[][] {
  const logits: number[][] = [];

  for (let t = 0; t < numTokens; t++) {
    const row: number[] = [];
    for (let e = 0; e < numExperts; e++) {
      let baseVal = Math.sin(t * 1.7 + e * 2.3 + seed * 0.1) * 1.5;

      if (biasType === "clustered") {
        // Experts 0 and 1 receive high logits, others receive low
        if (e < 2) {
          baseVal += 3.5;
        } else {
          baseVal -= 1.5;
        }
      } else if (biasType === "heavy_straggler") {
        // Expert 0 is a massive bottleneck
        if (e === 0) {
          baseVal += 6.0;
        } else if (e === 1) {
          baseVal += 2.5;
        } else {
          baseVal -= 2.0;
        }
      } else if (biasType === "adversarial") {
        // Alternating extreme spikes per token
        if (e === t % numExperts || e === (t + 1) % numExperts) {
          baseVal += 4.5;
        } else {
          baseVal -= 2.5;
        }
      } else {
        // Balanced with slight natural variance
        baseVal += ((t + e * 3) % 5) * 0.3;
      }

      row.push(Math.round(baseVal * 100) / 100);
    }
    logits.push(row);
  }

  return logits;
}

/**
 * Simulates the full All-to-All Dispatch and Combine communication collective,
 * token capacity truncation, and GPU compute execution.
 */
export function simulateAllToAllDispatchCombine(
  numTokens: number,
  topK: number,
  numExperts: number,
  numGpus: number,
  capacityFactor: number,
  routingAssignments: readonly (readonly { expertId: number; weight: number }[])[],
  tokenSources?: readonly number[],
  tokenTexts?: readonly string[],
  routingProbs?: readonly (readonly number[])[],
  rawLogits?: readonly (readonly number[])[],
  biasedScores?: readonly (readonly number[])[],
): AllToAllResult {
  const P = Math.max(1, numGpus);
  const E = Math.max(1, numExperts);
  const T = Math.max(1, numTokens);
  const expertsPerGpu = Math.max(1, Math.floor(E / P));
  const tokensPerGpu = Math.max(1, Math.floor(T / P));

  const capacity = calculateExpertCapacity(T, topK, E, capacityFactor);

  const expertAssignedTokens: number[][] = Array.from({ length: E }, () => []);
  const expertProcessedTokens: number[][] = Array.from({ length: E }, () => []);
  const expertDroppedTokens: number[][] = Array.from({ length: E }, () => []);

  // Track assignments per expert
  for (let t = 0; t < T; t++) {
    const assigns = routingAssignments[t] ?? [];
    for (const item of assigns) {
      const eId = item.expertId;
      if (eId >= 0 && eId < E) {
        expertAssignedTokens[eId]!.push(t);
      }
    }
  }

  // Apply capacity factor thresholding per expert
  for (let e = 0; e < E; e++) {
    const list = expertAssignedTokens[e] ?? [];
    for (let idx = 0; idx < list.length; idx++) {
      const tokenIdx = list[idx]!;
      if (idx < capacity) {
        expertProcessedTokens[e]!.push(tokenIdx);
      } else {
        expertDroppedTokens[e]!.push(tokenIdx);
      }
    }
  }

  const expertLoads = expertAssignedTokens.map((arr) => arr.length);
  const expertUtilization = expertProcessedTokens.map(
    (arr) => Math.round((arr.length / capacity) * 100) / 100,
  );

  let totalDroppedAssignments = 0;
  let totalProcessedAssignments = 0;
  for (let e = 0; e < E; e++) {
    totalDroppedAssignments += expertDroppedTokens[e]?.length ?? 0;
    totalProcessedAssignments += expertProcessedTokens[e]?.length ?? 0;
  }
  const totalAssignments = totalProcessedAssignments + totalDroppedAssignments;
  const dropRate =
    totalAssignments > 0 ? Math.round((totalDroppedAssignments / totalAssignments) * 1000) / 10 : 0;

  // Build GPU Dispatch Matrix (P x P) & Combine Matrix (P x P)
  const gpuDispatchMatrix: number[][] = Array.from({ length: P }, () =>
    Array.from({ length: P }, () => 0),
  );
  const gpuCombineMatrix: number[][] = Array.from({ length: P }, () =>
    Array.from({ length: P }, () => 0),
  );
  const gpuComputeLoads: number[] = Array.from({ length: P }, () => 0);

  let crossGpuTransfers = 0;
  let localTransfers = 0;

  const sampleVocab = [
    "Transformer",
    "Attention",
    "Mixture",
    "Expert",
    "Gradient",
    "Softmax",
    "AllToAll",
    "Collective",
    "Throughput",
    "Bandwidth",
    "Latency",
    "Dispatch",
    "Combine",
    "Capacity",
    "Straggler",
    "Routing",
    "NVLink",
    "Parallelism",
  ];

  const tokenResults: TokenData[] = [];

  for (let t = 0; t < T; t++) {
    const srcGpu =
      tokenSources && tokenSources[t] !== undefined
        ? tokenSources[t]!
        : Math.min(P - 1, Math.floor(t / tokensPerGpu));

    const tokenWord =
      tokenTexts && tokenTexts[t] !== undefined
        ? tokenTexts[t]!
        : (sampleVocab[t % sampleVocab.length] ?? `tok_${t}`);

    const rawAssigns = routingAssignments[t] ?? [];
    const fullProbs = routingProbs?.[t] ?? Array.from({ length: E }, () => 1 / E);
    const rowLogits = rawLogits?.[t] ?? Array.from({ length: E }, () => 0);
    const rowBiased = biasedScores?.[t];

    const tokenAssignmentsList: TokenAssignment[] = [];
    const selectedExpertsList: number[] = [];
    const weightsList: number[] = [];
    const droppedExpertsList: number[] = [];
    const targetGpusList: number[] = [];

    let tokenCross = 0;
    let tokenLocal = 0;

    for (const item of rawAssigns) {
      const eId = item.expertId;
      const weight = item.weight;
      const targetGpu = Math.min(P - 1, Math.floor(eId / expertsPerGpu));
      const isLocal = srcGpu === targetGpu;

      // Check if dropped
      const isDropped = expertDroppedTokens[eId]?.includes(t) ?? false;
      if (isDropped) {
        droppedExpertsList.push(eId);
      }

      selectedExpertsList.push(eId);
      weightsList.push(weight);
      targetGpusList.push(targetGpu);

      tokenAssignmentsList.push({
        expertId: eId,
        weight,
        targetGpu,
        isLocal,
        isDropped,
      });

      // Dispatch collective transfers
      if (gpuDispatchMatrix[srcGpu]?.[targetGpu] !== undefined) {
        gpuDispatchMatrix[srcGpu]![targetGpu] += 1;
      }

      if (isLocal) {
        tokenLocal++;
        localTransfers++;
      } else {
        tokenCross++;
        crossGpuTransfers++;
      }

      // Combine collective transfers (only for accepted computed tokens)
      if (!isDropped) {
        if (gpuCombineMatrix[targetGpu]?.[srcGpu] !== undefined) {
          gpuCombineMatrix[targetGpu]![srcGpu] += 1;
        }
        if (gpuComputeLoads[targetGpu] !== undefined) {
          gpuComputeLoads[targetGpu] += 1;
        }
      }
    }

    tokenResults.push({
      id: t,
      text: tokenWord,
      sourceGpu: srcGpu,
      logits: rowLogits,
      biasedScores: rowBiased,
      routingProbs: fullProbs,
      selectedExperts: selectedExpertsList,
      weights: weightsList,
      assignments: tokenAssignmentsList,
      droppedExperts: droppedExpertsList,
      targetGpus: targetGpusList,
      crossGpuCount: tokenCross,
      localCount: tokenLocal,
    });
  }

  // Identify straggler GPU
  let maxComputeGpu = 0;
  let maxComputeVal = gpuComputeLoads[0] ?? 0;
  let sumCompute = 0;

  for (let p = 0; p < P; p++) {
    const val = gpuComputeLoads[p] ?? 0;
    sumCompute += val;
    if (val > maxComputeVal) {
      maxComputeVal = val;
      maxComputeGpu = p;
    }
  }

  const meanCompute = sumCompute / P;
  const stragglerPenaltyRatio =
    meanCompute > 0 ? Math.round((maxComputeVal / meanCompute) * 100) / 100 : 1.0;

  return {
    expertCapacity: capacity,
    expertAssignedTokens,
    expertProcessedTokens,
    expertDroppedTokens,
    expertLoads,
    expertUtilization,
    totalDroppedAssignments,
    totalProcessedAssignments,
    dropRate,
    tokenResults,
    gpuDispatchMatrix,
    gpuCombineMatrix,
    gpuComputeLoads,
    stragglerGpu: maxComputeGpu,
    stragglerPenaltyRatio,
    crossGpuTransfers,
    localTransfers,
  };
}

/**
 * Calculates network communication volume metrics for All-to-All Dispatches and Combines.
 */
export function calculateMoeCommunicationVolume(
  numTokens: number,
  topK: number,
  hiddenDim: number,
  bytesPerElement: number,
  numGpus: number,
  crossGpuTransfers?: number,
): {
  readonly dispatchBytes: number;
  readonly combineBytes: number;
  readonly totalBytes: number;
  readonly theoreticalTotalBytes: number;
  readonly perGpuVolumeBytes: number;
} {
  const P = Math.max(1, numGpus);
  const tokenSizeBytes = hiddenDim * bytesPerElement;

  // If exact simulated cross-GPU count is given, use it; otherwise use theoretical ((P-1)/P) fraction
  const theoreticalCrossCount = numTokens * topK * ((P - 1) / P);
  const actualCrossCount =
    crossGpuTransfers !== undefined ? crossGpuTransfers : theoreticalCrossCount;

  const dispatchBytes = actualCrossCount * tokenSizeBytes;
  const combineBytes = actualCrossCount * tokenSizeBytes;
  const totalBytes = dispatchBytes + combineBytes;

  const theoreticalTotalBytes = 2 * theoreticalCrossCount * tokenSizeBytes;
  const perGpuVolumeBytes = P > 0 ? totalBytes / P : 0;

  return {
    dispatchBytes,
    combineBytes,
    totalBytes,
    theoreticalTotalBytes,
    perGpuVolumeBytes,
  };
}

/**
 * Calculates statistical load imbalance factor across all experts.
 */
export function calculateExpertLoadImbalance(expertCounts: readonly number[]): {
  readonly maxLoad: number;
  readonly meanLoad: number;
  readonly minLoad: number;
  readonly imbalanceRatio: number;
  readonly standardDeviation: number;
  readonly coefficientOfVariation: number;
} {
  if (!expertCounts || expertCounts.length === 0) {
    return {
      maxLoad: 0,
      meanLoad: 0,
      minLoad: 0,
      imbalanceRatio: 1.0,
      standardDeviation: 0,
      coefficientOfVariation: 0,
    };
  }

  const E = expertCounts.length;
  let maxLoad = expertCounts[0] ?? 0;
  let minLoad = expertCounts[0] ?? 0;
  let sum = 0;

  for (let i = 0; i < E; i++) {
    const c = expertCounts[i] ?? 0;
    if (c > maxLoad) maxLoad = c;
    if (c < minLoad) minLoad = c;
    sum += c;
  }

  const meanLoad = sum / E;
  const imbalanceRatio = meanLoad > 0 ? Math.round((maxLoad / meanLoad) * 100) / 100 : 1.0;

  let varianceSum = 0;
  for (let i = 0; i < E; i++) {
    const diff = (expertCounts[i] ?? 0) - meanLoad;
    varianceSum += diff * diff;
  }
  const variance = varianceSum / E;
  const standardDeviation = Math.round(Math.sqrt(variance) * 100) / 100;
  const coefficientOfVariation =
    meanLoad > 0 ? Math.round((standardDeviation / meanLoad) * 100) / 100 : 0;

  return {
    maxLoad,
    meanLoad: Math.round(meanLoad * 100) / 100,
    minLoad,
    imbalanceRatio,
    standardDeviation,
    coefficientOfVariation,
  };
}

// ============================================================================
// 4. PRESET CONFIGURATIONS
// ============================================================================

export const MOE_PRESETS: Record<MoEPresetId, MoEPreset> = {
  mixtral_8x7b: {
    id: "mixtral_8x7b",
    name: "Mixtral 8x7B (Top-2 / 8 Experts)",
    subtitle: "Mistral AI Sparse Architecture (k=2, E=8, 4 GPUs)",
    description:
      "Industry standard sparse MoE activating 2 out of 8 experts per token (~12.9B active parameters out of 46.7B total). Reaches LLaMA-2-70B quality at 6x faster inference speed.",
    architectureFamily: "Mixtral Sparse MoE",
    config: {
      numExperts: 8,
      topK: 2,
      numGpus: 4,
      numTokens: 32,
      capacityFactor: 1.25,
      auxLossAlpha: 0.02,
      noiseStd: 0.05,
      hiddenDim: 4096,
      bytesPerElement: 2, // FP16
      routingBias: "balanced",
      routingStrategy: "aux_loss",
      biasStepSize: 0.1,
    },
    sampleTokens: [
      "Mixture",
      "of",
      "Experts",
      "routing",
      "unlocks",
      "massive",
      "parameter",
      "capacity",
      "with",
      "constant",
      "computational",
      "FLOP",
      "footprint",
      "across",
      "parallel",
      "clusters.",
    ],
    highlightConcepts: [
      "Top-2 Sparse Routing",
      "1.25x Expert Capacity Buffer",
      "Auxiliary Balancing Penalty",
      "All-to-All GPU Collective",
    ],
  },

  deepseek_v3: {
    id: "deepseek_v3",
    name: "DeepSeek V3 Fine-Grained MoE",
    subtitle: "Aux-Loss-Free Dynamic Bias Routing (k=8, E=64, 8 GPUs)",
    description:
      "Fine-grained MoE architecture sharding FFN capacity into 64 micro-experts activating top-8 per token. Uses DeepSeek-V3 auxiliary-loss-free dynamic bias routing (b_i adjustments) for balanced dispatch without gradient interference, in FP8 precision.",
    architectureFamily: "DeepSeek Multi-Head Latent & Fine-Grained MoE",
    config: {
      numExperts: 64,
      topK: 8,
      numGpus: 8,
      numTokens: 64,
      capacityFactor: 1.25,
      auxLossAlpha: 0.0,
      noiseStd: 0.02,
      hiddenDim: 2048,
      bytesPerElement: 1, // FP8
      routingBias: "heavy_straggler",
      routingStrategy: "deepseek_bias",
      biasStepSize: 0.15,
    },
    sampleTokens: [
      "DeepSeek",
      "fine-grained",
      "routing",
      "partitions",
      "dense",
      "layers",
      "into",
      "64",
      "micro-experts",
      "with",
      "dynamic",
      "bias",
      "compensation",
      "eliminating",
      "auxiliary",
      "loss.",
    ],
    highlightConcepts: [
      "64 Micro-Experts Sharding",
      "Top-8 Granular Activation",
      "Aux-Loss-Free Dynamic Bias Routing (b_i)",
      "FP8 All-to-All Bandwidth Halving",
    ],
  },

  switch_transformer: {
    id: "switch_transformer",
    name: "Switch Transformer (Top-1 Routing)",
    subtitle: "Fedus et al. Google Brain (k=1, E=8, 4 GPUs)",
    description:
      "Extreme single-expert routing (k=1) maximizing parameter scale while keeping computational cost identical to a standard dense Transformer. Minimizes All-to-All communication volume.",
    architectureFamily: "Google Switch Transformer",
    config: {
      numExperts: 8,
      topK: 1,
      numGpus: 4,
      numTokens: 32,
      capacityFactor: 1.0,
      auxLossAlpha: 0.01,
      noiseStd: 0.1,
      hiddenDim: 1024,
      bytesPerElement: 2,
      routingBias: "balanced",
      routingStrategy: "aux_loss",
      biasStepSize: 0.1,
    },
    sampleTokens: [
      "Switch",
      "routing",
      "dispatches",
      "each",
      "token",
      "to",
      "exactly",
      "one",
      "expert,",
      "slashing",
      "cross-GPU",
      "communication",
      "overhead",
      "in",
      "half.",
    ],
    highlightConcepts: [
      "Single-Expert Dispatch (k=1)",
      "Strict C=1.0 Capacity",
      "Minimal All-to-All Overhead",
      "Trillion-Parameter Scaling",
    ],
  },

  load_imbalance_straggler: {
    id: "load_imbalance_straggler",
    name: "Load Imbalance & Straggler Bottleneck",
    subtitle: "Routing Collapse onto Congested Expert 0 (k=2, E=8, 4 GPUs)",
    description:
      "Simulates router collapse where gating logits bias heavily toward Expert 0 and GPU 0. Demonstrates how a single overloaded GPU throttles the entire synchronized training step.",
    architectureFamily: "Adversarial Straggler Stress",
    config: {
      numExperts: 8,
      topK: 2,
      numGpus: 4,
      numTokens: 32,
      capacityFactor: 1.0,
      auxLossAlpha: 0.005,
      noiseStd: 0.0,
      hiddenDim: 2048,
      bytesPerElement: 2,
      routingBias: "heavy_straggler",
      routingStrategy: "aux_loss",
      biasStepSize: 0.1,
    },
    sampleTokens: [
      "Unbalanced",
      "gating",
      "causes",
      "severe",
      "GPU",
      "stragglers,",
      "wasting",
      "idle",
      "compute",
      "across",
      "healthy",
      "GPUs",
      "at",
      "synchronization",
      "barriers.",
    ],
    highlightConcepts: [
      "GPU Compute Stragglers",
      "Router Imbalance Collapse",
      "Barrier Synchronization Stalls",
      "High Imbalance Ratio > 2.5x",
    ],
  },

  capacity_drop_stress: {
    id: "capacity_drop_stress",
    name: "Capacity Factor Token Drop Stress",
    subtitle: "Severe Overflow & Token Dropping (C=0.75, k=2, E=8)",
    description:
      "Forces tight capacity limit (C=0.75) where clustered tokens overflow expert capacity buffers. Dropped tokens bypass expert FFN computation via the residual skip connection.",
    architectureFamily: "Overflow & Residual Bypass Stress",
    config: {
      numExperts: 8,
      topK: 2,
      numGpus: 4,
      numTokens: 32,
      capacityFactor: 0.75,
      auxLossAlpha: 0.01,
      noiseStd: 0.02,
      hiddenDim: 2048,
      bytesPerElement: 2,
      routingBias: "clustered",
      routingStrategy: "aux_loss",
      biasStepSize: 0.1,
    },
    sampleTokens: [
      "When",
      "token",
      "volume",
      "exceeds",
      "expert",
      "capacity,",
      "overflowing",
      "tokens",
      "are",
      "dropped",
      "and",
      "rely",
      "solely",
      "on",
      "residual",
      "connections.",
    ],
    highlightConcepts: [
      "Capacity Factor Buffer C < 1.0",
      "Token Dropping / Truncation",
      "Residual Passthrough",
      "Loss of Expert Representation",
    ],
  },

  gshard_top2: {
    id: "gshard_top2",
    name: "GShard Top-2 Sparse Gating",
    subtitle: "Lepikhin et al. Google (k=2, E=16, 4 GPUs, C=1.5)",
    description:
      "Google GShard MoE with Top-2 routing and generous 1.5x capacity factor. If the second expert exceeds capacity, the second slot is dropped while the primary expert processes reliably.",
    architectureFamily: "Google GShard MoE",
    config: {
      numExperts: 16,
      topK: 2,
      numGpus: 4,
      numTokens: 32,
      capacityFactor: 1.5,
      auxLossAlpha: 0.05,
      noiseStd: 0.05,
      hiddenDim: 2048,
      bytesPerElement: 2,
      routingBias: "balanced",
      routingStrategy: "aux_loss",
      biasStepSize: 0.1,
    },
    sampleTokens: [
      "GShard",
      "implements",
      "hierarchical",
      "top-2",
      "gating",
      "with",
      "generous",
      "capacity",
      "buffers",
      "to",
      "guarantee",
      "near-zero",
      "primary",
      "token",
      "drop",
      "rates.",
    ],
    highlightConcepts: [
      "GShard Top-2 Gating",
      "1.5x Capacity Slack Buffer",
      "Hierarchical Load Balancing",
      "Sparse Distributed Tensor Core",
    ],
  },

  custom: {
    id: "custom",
    name: "Custom MoE Architecture Sandbox",
    subtitle: "User-Tuned Experts, GPUs, Top-k, and Capacity",
    description:
      "Fully configurable playground to test arbitrary mixtures of experts, capacity factors, All-to-All communication topology, DeepSeek-V3 dynamic bias routing, and auxiliary loss coefficients.",
    architectureFamily: "User Custom MoE",
    config: {
      numExperts: 8,
      topK: 2,
      numGpus: 4,
      numTokens: 32,
      capacityFactor: 1.25,
      auxLossAlpha: 0.02,
      noiseStd: 0.05,
      hiddenDim: 2048,
      bytesPerElement: 2,
      routingBias: "balanced",
      routingStrategy: "aux_loss",
      biasStepSize: 0.1,
    },
    sampleTokens: [
      "Experiment",
      "with",
      "custom",
      "router",
      "noise,",
      "capacity",
      "factors,",
      "and",
      "GPU",
      "topologies",
      "to",
      "optimize",
      "distributed",
      "system",
      "throughput.",
    ],
    highlightConcepts: [
      "Custom Expert Sharding",
      "Arbitrary Top-k Selection",
      "Interactive All-to-All Matrix",
      "Live Straggler Diagnostics",
    ],
  },
};

// ============================================================================
// 5. COLOR PALETTES & VISUAL HELPERS
// ============================================================================

export const GPU_COLORS = [
  "#38bdf8", // Sky Blue (GPU 0)
  "#34d399", // Emerald (GPU 1)
  "#f59e0b", // Amber (GPU 2)
  "#a855f7", // Purple (GPU 3)
  "#f43f5e", // Rose (GPU 4)
  "#06b6d4", // Cyan (GPU 5)
  "#84cc16", // Lime (GPU 6)
  "#ec4899", // Pink (GPU 7)
];

export function getGpuColor(gpuIndex: number): string {
  return GPU_COLORS[gpuIndex % GPU_COLORS.length] ?? "#38bdf8";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ============================================================================
// 6. MAIN REACT COMPONENT: MoEExpertParallelStudio
// ============================================================================

export const MoEExpertParallelStudio: React.FC<MoEExpertParallelStudioProps> = ({
  initialPreset = "mixtral_8x7b",
  initialConfig,
  width = "100%",
  height = "auto",
  title = "Mixture-of-Experts & Expert Parallelism (EP) Studio",
  onStepChange,
  onPresetChange,
}) => {
  // Preset & Configuration State
  const [currentPresetId, setCurrentPresetId] = useState<MoEPresetId>(initialPreset);
  const activePreset = MOE_PRESETS[currentPresetId] ?? MOE_PRESETS.mixtral_8x7b;

  const [config, setConfig] = useState<MoEConfig>(() => ({
    ...activePreset.config,
    ...initialConfig,
  }));

  // Studio Active Tab State
  const [activeTab, setActiveTab] = useState<
    "pipeline" | "histogram" | "all2all" | "biases" | "inspector" | "theory"
  >("pipeline");

  // Step-by-Step Simulation State
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(0);
  const [showControlsDrawer, setShowControlsDrawer] = useState<boolean>(false);

  // Dynamic Expert Biases State for DeepSeek-V3 Routing
  const [dynamicBiases, setDynamicBiases] = useState<number[]>(() =>
    Array.from({ length: config.numExperts }, () => 0),
  );
  const [convergenceStep, setConvergenceStep] = useState<number>(0);

  // Sync preset changes
  const handleSelectPreset = useCallback(
    (presetId: MoEPresetId) => {
      setCurrentPresetId(presetId);
      const targetPreset = MOE_PRESETS[presetId];
      if (targetPreset) {
        setConfig(targetPreset.config);
        setDynamicBiases(Array.from({ length: targetPreset.config.numExperts }, () => 0));
        setConvergenceStep(0);
      }
      setCurrentStepIndex(0);
      onPresetChange?.(presetId);
    },
    [onPresetChange],
  );

  // Step Progression Callback
  const handleStepChange = useCallback(
    (newStep: number) => {
      const stepIdx = (newStep + PIPELINE_STEPS.length) % PIPELINE_STEPS.length;
      setCurrentStepIndex(stepIdx);
      const stepMeta = PIPELINE_STEPS[stepIdx];
      if (stepMeta) {
        onStepChange?.(stepIdx, stepMeta.id);
      }
    },
    [onStepChange],
  );

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(400, Math.floor(1400 / playbackSpeed));
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        const next = (prev + 1) % PIPELINE_STEPS.length;
        const stepMeta = PIPELINE_STEPS[next];
        if (stepMeta) {
          onStepChange?.(next, stepMeta.id);
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, onStepChange]);

  // Keep dynamicBiases array length synchronized with numExperts
  useEffect(() => {
    setDynamicBiases((prev) => {
      if (prev.length === config.numExperts) return prev;
      return Array.from({ length: config.numExperts }, (_, i) => prev[i] ?? 0);
    });
  }, [config.numExperts]);

  // Generate synthetic deterministic logits
  const rawLogits = useMemo(() => {
    return generateDeterministicLogits(config.numTokens, config.numExperts, config.routingBias, 42);
  }, [config.numTokens, config.numExperts, config.routingBias]);

  // Compute Routing according to chosen strategy (Standard Aux Loss vs DeepSeek-V3 Dynamic Bias)
  const isDeepSeekBiasMode = config.routingStrategy === "deepseek_bias";

  const routingResult = useMemo(() => {
    if (isDeepSeekBiasMode) {
      return computeDeepSeekBiasRouting(rawLogits, dynamicBiases, config.topK, config.noiseStd, 42);
    }
    const standard = computeTopKRouting(rawLogits, config.topK, config.noiseStd, 42);
    return {
      selectedExperts: standard.selectedExperts,
      weights: standard.weights,
      routingProbs: standard.routingProbs,
      biasedScores: rawLogits,
      dynamicBiases,
      biasDeltas: Array.from({ length: config.numExperts }, () => 0),
    };
  }, [
    isDeepSeekBiasMode,
    rawLogits,
    dynamicBiases,
    config.topK,
    config.noiseStd,
    config.numExperts,
  ]);

  // Form structured assignments
  const tokenAssignments = useMemo(() => {
    const list: { expertId: number; weight: number }[][] = [];
    for (let t = 0; t < config.numTokens; t++) {
      const selected = routingResult.selectedExperts[t] ?? [];
      const weights = routingResult.weights[t] ?? [];
      const row = selected.map((eId, idx) => ({
        expertId: eId,
        weight: weights[idx] ?? 0,
      }));
      list.push(row);
    }
    return list;
  }, [config.numTokens, routingResult]);

  // Source GPU mapping
  const tokenSources = useMemo(() => {
    const P = config.numGpus;
    const tokensPerGpu = Math.max(1, Math.floor(config.numTokens / P));
    return Array.from({ length: config.numTokens }, (_, i) =>
      Math.min(P - 1, Math.floor(i / tokensPerGpu)),
    );
  }, [config.numTokens, config.numGpus]);

  // Sample token words
  const tokenTexts = useMemo(() => {
    const words = activePreset.sampleTokens;
    return Array.from(
      { length: config.numTokens },
      (_, i) => words[i % words.length] ?? `tok_${i}`,
    );
  }, [config.numTokens, activePreset.sampleTokens]);

  // Simulate Full All-to-All & Compute Pipeline
  const simulation = useMemo(() => {
    return simulateAllToAllDispatchCombine(
      config.numTokens,
      config.topK,
      config.numExperts,
      config.numGpus,
      config.capacityFactor,
      tokenAssignments,
      tokenSources,
      tokenTexts,
      routingResult.routingProbs,
      rawLogits,
      routingResult.biasedScores,
    );
  }, [
    config.numTokens,
    config.topK,
    config.numExperts,
    config.numGpus,
    config.capacityFactor,
    tokenAssignments,
    tokenSources,
    tokenTexts,
    routingResult.routingProbs,
    rawLogits,
    routingResult.biasedScores,
  ]);

  // Compute Auxiliary Loss (0 if DeepSeek-V3 dynamic bias routing is active)
  const auxLossData = useMemo(() => {
    if (isDeepSeekBiasMode) {
      return {
        loss: 0.0,
        f_fractions: simulation.expertLoads.map(
          (l) => l / Math.max(1, config.numTokens * config.topK),
        ),
        p_probs: Array.from({ length: config.numExperts }, () => 1 / config.numExperts),
      };
    }
    return computeAuxiliaryLoss(
      routingResult.routingProbs,
      simulation.expertLoads,
      config.numTokens,
      config.numExperts,
      config.auxLossAlpha,
    );
  }, [
    isDeepSeekBiasMode,
    routingResult.routingProbs,
    simulation.expertLoads,
    config.numTokens,
    config.numExperts,
    config.topK,
    config.auxLossAlpha,
  ]);

  // Multi-step bias convergence simulation for DeepSeek-V3 Tab
  const biasConvergenceHistory = useMemo(() => {
    return simulateDeepSeekBiasConvergence(
      rawLogits,
      config.topK,
      6,
      config.biasStepSize ?? 0.15,
      config.capacityFactor,
    );
  }, [rawLogits, config.topK, config.biasStepSize, config.capacityFactor]);

  // Trigger one dynamic bias update step
  const handlePerformBiasUpdateStep = useCallback(() => {
    const targetLoad = (config.numTokens * config.topK) / config.numExperts;
    const { updatedBiases } = updateDeepSeekBiases(
      dynamicBiases,
      simulation.expertLoads,
      targetLoad,
      config.biasStepSize ?? 0.15,
    );
    setDynamicBiases(updatedBiases);
    setConvergenceStep((prev) => prev + 1);
  }, [
    config.numTokens,
    config.topK,
    config.numExperts,
    config.biasStepSize,
    dynamicBiases,
    simulation.expertLoads,
  ]);

  const handleResetBiases = useCallback(() => {
    setDynamicBiases(Array.from({ length: config.numExperts }, () => 0));
    setConvergenceStep(0);
  }, [config.numExperts]);

  // Load Imbalance Analytics
  const imbalanceStats = useMemo(() => {
    return calculateExpertLoadImbalance(simulation.expertLoads);
  }, [simulation.expertLoads]);

  // Communication Volume Analytics
  const commVolume = useMemo(() => {
    return calculateMoeCommunicationVolume(
      config.numTokens,
      config.topK,
      config.hiddenDim,
      config.bytesPerElement,
      config.numGpus,
      simulation.crossGpuTransfers,
    );
  }, [
    config.numTokens,
    config.topK,
    config.hiddenDim,
    config.bytesPerElement,
    config.numGpus,
    simulation.crossGpuTransfers,
  ]);

  const currentStep = PIPELINE_STEPS[currentStepIndex] ?? PIPELINE_STEPS[0]!;
  const selectedToken = simulation.tokenResults[selectedTokenIndex] ?? simulation.tokenResults[0];
  const expertsPerGpu = Math.max(1, Math.floor(config.numExperts / config.numGpus));

  return (
    <div
      data-testid="moe-expert-parallel-studio"
      className="flex flex-col w-full bg-[#080d1a] text-slate-100 rounded-xl border border-sky-500/20 shadow-2xl overflow-hidden font-sans select-none"
      style={{ width, height: height === "auto" ? undefined : height }}
    >
      {/* ==================================================================== */}
      {/* 1. STUDIO HEADER & CONTROLS BAR */}
      {/* ==================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border-b border-sky-500/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-400/30 text-sky-400 shadow-inner">
            <Boxes className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">{title}</h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full">
                EP Studio v2.5
              </span>
              {isDeepSeekBiasMode && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Aux-Loss-Free Bias Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {activePreset.name} • {activePreset.subtitle}
            </p>
          </div>
        </div>

        {/* Preset Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "mixtral_8x7b", label: "Mixtral 8x7B" },
              { id: "deepseek_v3", label: "DeepSeek V3" },
              { id: "switch_transformer", label: "Switch (k=1)" },
              { id: "load_imbalance_straggler", label: "Straggler Stress" },
              { id: "capacity_drop_stress", label: "Capacity Drop" },
              { id: "gshard_top2", label: "GShard Top-2" },
              { id: "custom", label: "Custom" },
            ] as const
          ).map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 border ${
                currentPresetId === preset.id
                  ? "bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-lg shadow-sky-500/20"
                  : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700/80 hover:text-white"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Playback & Drawer Controls */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-lg border border-slate-700/60">
          <button
            onClick={() => handleStepChange(currentStepIndex - 1)}
            title="Previous Stage"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <SkipForward className="w-4 h-4 rotate-180" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause Pipeline" : "Play Pipeline"}
            className={`p-1.5 rounded transition font-medium flex items-center gap-1 text-xs px-2.5 ${
              isPlaying
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-sky-500 text-slate-950 font-bold hover:bg-sky-400"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Play
              </>
            )}
          </button>
          <button
            onClick={() => handleStepChange(currentStepIndex + 1)}
            title="Next Stage"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStepChange(0)}
            title="Reset to Step 1"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed selector */}
          <div className="h-4 w-px bg-slate-700 mx-1" />
          <button
            onClick={() =>
              setPlaybackSpeed(playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 0.5 : 1)
            }
            className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
          >
            {playbackSpeed}x
          </button>

          {/* Parameters Toggle */}
          <button
            onClick={() => setShowControlsDrawer(!showControlsDrawer)}
            className={`p-1.5 rounded transition flex items-center gap-1 text-xs px-2 ${
              showControlsDrawer
                ? "bg-indigo-500 text-white font-semibold"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Tuner
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. COLLAPSIBLE PARAMETER TUNER DRAWER */}
      {/* ==================================================================== */}
      {showControlsDrawer && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 px-5 py-3 bg-slate-900/95 border-b border-sky-500/20 text-xs">
          {/* Num Experts */}
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-medium flex justify-between">
              <span>Experts (E)</span>
              <span className="text-sky-400 font-mono font-bold">{config.numExperts}</span>
            </label>
            <select
              value={config.numExperts}
              onChange={(e) => {
                const newE = Number(e.target.value);
                setConfig((prev) => ({
                  ...prev,
                  numExperts: newE,
                  topK: Math.min(prev.topK, newE),
                }));
              }}
              className="bg-slate-800 border border-slate-700 text-white rounded p-1"
            >
              {[4, 8, 16, 32, 64].map((v) => (
                <option key={v} value={v}>
                  {v} Experts
                </option>
              ))}
            </select>
          </div>

          {/* Top-K Active */}
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-medium flex justify-between">
              <span>Top-k (k)</span>
              <span className="text-sky-400 font-mono font-bold">{config.topK}</span>
            </label>
            <select
              value={config.topK}
              onChange={(e) => setConfig((prev) => ({ ...prev, topK: Number(e.target.value) }))}
              className="bg-slate-800 border border-slate-700 text-white rounded p-1"
            >
              {[1, 2, 4, 6, 8]
                .filter((v) => v <= config.numExperts)
                .map((v) => (
                  <option key={v} value={v}>
                    k = {v}
                  </option>
                ))}
            </select>
          </div>

          {/* Num GPUs */}
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-medium flex justify-between">
              <span>GPUs (P)</span>
              <span className="text-sky-400 font-mono font-bold">{config.numGpus}</span>
            </label>
            <select
              value={config.numGpus}
              onChange={(e) => setConfig((prev) => ({ ...prev, numGpus: Number(e.target.value) }))}
              className="bg-slate-800 border border-slate-700 text-white rounded p-1"
            >
              {[2, 4, 8].map((v) => (
                <option key={v} value={v}>
                  {v} GPUs
                </option>
              ))}
            </select>
          </div>

          {/* Num Tokens */}
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-medium flex justify-between">
              <span>Tokens (T)</span>
              <span className="text-sky-400 font-mono font-bold">{config.numTokens}</span>
            </label>
            <select
              value={config.numTokens}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, numTokens: Number(e.target.value) }))
              }
              className="bg-slate-800 border border-slate-700 text-white rounded p-1"
            >
              {[16, 32, 64, 128].map((v) => (
                <option key={v} value={v}>
                  {v} Tokens
                </option>
              ))}
            </select>
          </div>

          {/* Capacity Factor */}
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-medium flex justify-between">
              <span>Capacity (C)</span>
              <span className="text-emerald-400 font-mono font-bold">
                {config.capacityFactor.toFixed(2)}x
              </span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={config.capacityFactor}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, capacityFactor: Number(e.target.value) }))
              }
              className="accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Routing Strategy */}
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-medium flex justify-between">
              <span>Strategy</span>
            </label>
            <select
              value={config.routingStrategy ?? "aux_loss"}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  routingStrategy: e.target.value as RoutingStrategy,
                }))
              }
              className="bg-slate-800 border border-slate-700 text-white rounded p-1"
            >
              <option value="aux_loss">Standard Aux Loss</option>
              <option value="deepseek_bias">DeepSeek-V3 Bias</option>
            </select>
          </div>

          {/* Jitter Noise */}
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-medium flex justify-between">
              <span>Noise (σ)</span>
              <span className="text-amber-400 font-mono font-bold">
                {config.noiseStd.toFixed(2)}
              </span>
            </label>
            <input
              type="range"
              min="0.0"
              max="0.5"
              step="0.02"
              value={config.noiseStd}
              onChange={(e) => setConfig((prev) => ({ ...prev, noiseStd: Number(e.target.value) }))}
              className="accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Routing Bias Mode */}
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-medium flex justify-between">
              <span>Routing Bias</span>
            </label>
            <select
              value={config.routingBias}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, routingBias: e.target.value as RoutingBiasType }))
              }
              className="bg-slate-800 border border-slate-700 text-white rounded p-1"
            >
              <option value="balanced">Balanced</option>
              <option value="clustered">Clustered</option>
              <option value="heavy_straggler">Heavy Straggler</option>
              <option value="adversarial">Adversarial</option>
            </select>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. STEP PIPELINE PROGRESSION TRACKER */}
      {/* ==================================================================== */}
      <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
          {PIPELINE_STEPS.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            const isPast = idx < currentStepIndex;

            return (
              <button
                key={step.id}
                onClick={() => handleStepChange(idx)}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-left transition-all border ${
                  isActive
                    ? "bg-sky-500/20 text-sky-300 border-sky-400 shadow-md shadow-sky-500/10 font-bold"
                    : isPast
                      ? "bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600"
                      : "bg-slate-900/40 text-slate-500 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                    isActive
                      ? "bg-sky-400 text-slate-950"
                      : isPast
                        ? "bg-emerald-500/30 text-emerald-400"
                        : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="truncate text-[11px]">{step.shortName}</div>
              </button>
            );
          })}
        </div>

        {/* Current Active Step Banner */}
        <div className="mt-2 px-3 py-2 rounded-lg bg-sky-950/30 border border-sky-500/20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span className="text-xs font-bold text-sky-300">{currentStep.name}:</span>
            <span className="text-xs text-slate-300">{currentStep.description}</span>
          </div>
          <div className="font-mono text-[11px] text-sky-200 bg-sky-900/40 px-2 py-0.5 rounded border border-sky-700/50">
            {currentStep.equation}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. KPI SUMMARY CARDS */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 px-5 py-3 bg-slate-900/40 border-b border-slate-800/80 text-xs">
        {/* Metric 1: Routing Configuration */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span>Cluster Sharding</span>
            <Server className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-white">
              {config.numExperts}E / {config.topK}k
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              across {config.numGpus} GPUs
            </span>
          </div>
          <div className="text-[10px] text-sky-400/80 font-mono">
            {expertsPerGpu} experts/GPU • {config.numTokens} tokens
          </div>
        </div>

        {/* Metric 2: Auxiliary Loss / DeepSeek-V3 Mode */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span>{isDeepSeekBiasMode ? "DeepSeek-V3 Mode" : "Aux Balancing Loss"}</span>
            <Scale className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-purple-300 font-mono">
              {isDeepSeekBiasMode ? "0.0000" : auxLossData.loss.toFixed(4)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {isDeepSeekBiasMode ? "Aux-Loss-Free" : `α = ${config.auxLossAlpha}`}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            {isDeepSeekBiasMode ? (
              <span className="text-emerald-400 font-bold">Dynamic b_i Active</span>
            ) : (
              <span>Ideal: {config.auxLossAlpha.toFixed(4)}</span>
            )}
          </div>
        </div>

        {/* Metric 3: Capacity & Drops */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span>Expert Capacity (C)</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-emerald-300 font-mono">
              {simulation.expertCapacity} tokens
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({config.capacityFactor}x factor)
            </span>
          </div>
          <div className="text-[10px] flex items-center gap-1 font-mono">
            <span
              className={simulation.dropRate > 0 ? "text-rose-400 font-bold" : "text-emerald-400"}
            >
              {simulation.totalDroppedAssignments} drops ({simulation.dropRate}%)
            </span>
          </div>
        </div>

        {/* Metric 4: Load Imbalance Factor */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span>Load Imbalance (I)</span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-base font-bold font-mono ${
                imbalanceStats.imbalanceRatio > 1.8
                  ? "text-rose-400"
                  : imbalanceStats.imbalanceRatio > 1.3
                    ? "text-amber-300"
                    : "text-emerald-300"
              }`}
            >
              {imbalanceStats.imbalanceRatio.toFixed(2)}x
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              σ = {imbalanceStats.standardDeviation}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Max: {imbalanceStats.maxLoad} / Mean: {imbalanceStats.meanLoad}
          </div>
        </div>

        {/* Metric 5: All-to-All Comm Volume */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span>All-to-All Volume</span>
            <Network className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-sky-300 font-mono">
              {formatBytes(commVolume.totalBytes)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Total All2All</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Cross-GPU: {simulation.crossGpuTransfers} • Local: {simulation.localTransfers}
          </div>
        </div>

        {/* Metric 6: Straggler Penalty */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span>GPU Straggler Penalty</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-base font-bold font-mono ${
                simulation.stragglerPenaltyRatio > 1.5
                  ? "text-rose-400"
                  : simulation.stragglerPenaltyRatio > 1.2
                    ? "text-amber-300"
                    : "text-emerald-300"
              }`}
            >
              {simulation.stragglerPenaltyRatio.toFixed(2)}x
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Slowest: GPU {simulation.stragglerGpu}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Max GPU Load: {simulation.gpuComputeLoads[simulation.stragglerGpu]} tokens
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. TAB NAVIGATION */}
      {/* ==================================================================== */}
      <div className="flex items-center justify-between px-5 pt-3 pb-0 bg-slate-900/70 border-b border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(
            [
              { id: "pipeline", label: "Pipeline Flow & Cluster", icon: Layers },
              { id: "histogram", label: "Expert Load & Capacity", icon: BarChart3 },
              { id: "all2all", label: "All-to-All Traffic Matrix", icon: Network },
              { id: "biases", label: "DeepSeek-V3 Bias Routing", icon: Sparkles },
              { id: "inspector", label: "Token Routing Inspector", icon: Sliders },
              { id: "theory", label: "Math & Architecture", icon: Info },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
                  isSelected
                    ? "bg-slate-800 text-sky-300 border-sky-400 shadow-inner"
                    : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-400 hidden md:block">
          Click any step or tab to inspect internals
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. TAB CONTENT PANELS */}
      {/* ==================================================================== */}
      <div className="p-5 flex-1 min-h-[480px] flex flex-col bg-slate-950/40">
        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: PIPELINE FLOW & CLUSTER ARCHITECTURE */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "pipeline" && (
          <div className="flex flex-col gap-4">
            {/* Cluster Architecture Diagram */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-400" />
                  Distributed Cluster Stage Flow (P = {config.numGpus} GPUs, E = {config.numExperts}{" "}
                  Experts)
                </span>
                <span className="font-mono text-sky-400/80 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40 text-[11px]">
                  Step {currentStepIndex + 1}/8: {currentStep.name}
                </span>
              </div>

              {/* Graphical Distributed Pipeline Diagram */}
              <div className="w-full overflow-x-auto">
                <div className="min-w-[760px] grid grid-cols-4 gap-3 py-2">
                  {/* Column 1: Source GPUs & Token Batches */}
                  <div className="flex flex-col gap-2 p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
                    <div className="text-xs font-bold text-sky-300 flex items-center justify-between pb-1 border-b border-slate-800">
                      <span>Source GPUs (Rank 0..P-1)</span>
                      <span className="text-[10px] font-mono text-slate-400">T/P Tokens</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {Array.from({ length: config.numGpus }).map((_, pIdx) => {
                        const localTokens = simulation.tokenResults.filter(
                          (t) => t.sourceGpu === pIdx,
                        );
                        const isGpuActive = currentStepIndex <= 4 || currentStepIndex >= 6;

                        return (
                          <div
                            key={pIdx}
                            className={`p-2 rounded border text-xs transition ${
                              isGpuActive
                                ? "bg-slate-900 border-slate-700"
                                : "bg-slate-900/40 border-slate-800/60 opacity-60"
                            }`}
                          >
                            <div className="flex items-center justify-between font-mono font-bold mb-1">
                              <span style={{ color: getGpuColor(pIdx) }}>GPU Rank {pIdx}</span>
                              <span className="text-[10px] text-slate-400">
                                {localTokens.length} tokens
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {localTokens.slice(0, 6).map((tok) => (
                                <button
                                  key={tok.id}
                                  onClick={() => {
                                    setSelectedTokenIndex(tok.id);
                                    setActiveTab("inspector");
                                  }}
                                  title={`Token #${tok.id}: "${tok.text}" (Click to inspect)`}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition ${
                                    selectedTokenIndex === tok.id
                                      ? "bg-sky-500 text-slate-950 font-bold"
                                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                  }`}
                                >
                                  {tok.text.slice(0, 8)}
                                </button>
                              ))}
                              {localTokens.length > 6 && (
                                <span className="text-[10px] text-slate-500 font-mono py-0.5">
                                  +{localTokens.length - 6} more
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 2: Router Gating & Top-k Selection */}
                  <div className="flex flex-col gap-2 p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
                    <div className="text-xs font-bold text-purple-300 flex items-center justify-between pb-1 border-b border-slate-800">
                      <span>Router Gating & Top-k</span>
                      <span className="text-[10px] font-mono text-purple-400">
                        k = {config.topK}
                      </span>
                    </div>

                    <div className="flex flex-col justify-center flex-1 gap-3 p-2 bg-slate-900/60 rounded border border-slate-800/60 text-xs">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-slate-400 font-semibold">
                          Router Matrix & Biases:
                        </span>
                        <div className="p-2 rounded bg-slate-950 font-mono text-[10px] text-purple-300 border border-purple-900/30">
                          W_g ∈ ℝ^({config.hiddenDim} × {config.numExperts})
                          {isDeepSeekBiasMode && " + b_i"}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-slate-400 font-semibold">
                          Gating Strategy:
                        </span>
                        <div className="text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                          {isDeepSeekBiasMode
                            ? `DeepSeek-V3 Dynamic Bias Routing (Top-${config.topK})`
                            : config.topK === 1
                              ? "Switch Top-1 ArgMax Gating"
                              : `Sparse Top-${config.topK} Softmax Gating`}
                        </div>
                      </div>

                      <div className="p-2 rounded bg-purple-950/30 border border-purple-800/40 text-[11px] text-purple-200">
                        {isDeepSeekBiasMode ? (
                          <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Aux Loss Free (𝒪 = 0)
                          </div>
                        ) : (
                          <div>
                            Aux Balancing Loss:{" "}
                            <span className="font-bold font-mono">
                              {auxLossData.loss.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column 3: All-to-All Dispatch Exchange */}
                  <div className="flex flex-col gap-2 p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
                    <div className="text-xs font-bold text-amber-300 flex items-center justify-between pb-1 border-b border-slate-800">
                      <span>All-to-All Interconnect</span>
                      <Network className="w-3.5 h-3.5 text-amber-400" />
                    </div>

                    <div className="flex flex-col justify-between flex-1 gap-2 p-2 bg-slate-900/60 rounded border border-slate-800/60 text-xs">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Cross-GPU Packets:</span>
                          <span className="font-mono font-bold text-amber-300">
                            {simulation.crossGpuTransfers} transfers
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Local Memory Fastpath:</span>
                          <span className="font-mono font-bold text-emerald-300">
                            {simulation.localTransfers} transfers
                          </span>
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] flex flex-col gap-1 text-slate-300">
                        <div>Dispatch Volume: {formatBytes(commVolume.dispatchBytes)}</div>
                        <div>Combine Volume: {formatBytes(commVolume.combineBytes)}</div>
                        <div className="text-amber-400 font-bold">
                          Total Comm: {formatBytes(commVolume.totalBytes)}
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400">
                        All-to-All Collective replaces point-to-point exchanges with batched
                        ring/crossbar shuffles.
                      </div>
                    </div>
                  </div>

                  {/* Column 4: Target GPU Expert Execution & Residual Combine */}
                  <div className="flex flex-col gap-2 p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
                    <div className="text-xs font-bold text-emerald-300 flex items-center justify-between pb-1 border-b border-slate-800">
                      <span>Target GPUs (FFN Compute)</span>
                      <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    </div>

                    <div className="flex flex-col gap-2">
                      {Array.from({ length: config.numGpus }).map((_, pIdx) => {
                        const startE = pIdx * expertsPerGpu;
                        const endE = Math.min(config.numExperts, (pIdx + 1) * expertsPerGpu);
                        const computeCount = simulation.gpuComputeLoads[pIdx] ?? 0;
                        const isStraggler = pIdx === simulation.stragglerGpu;

                        return (
                          <div
                            key={pIdx}
                            className={`p-2 rounded border text-xs transition ${
                              isStraggler
                                ? "bg-rose-950/30 border-rose-600/50 shadow-sm shadow-rose-950"
                                : "bg-slate-900 border-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between font-mono font-bold mb-1">
                              <span style={{ color: getGpuColor(pIdx) }}>
                                GPU {pIdx} (E{startE}..E{endE - 1})
                              </span>
                              <span
                                className={`text-[10px] font-mono ${
                                  isStraggler ? "text-rose-400 font-bold" : "text-emerald-400"
                                }`}
                              >
                                {computeCount} tokens {isStraggler && "⚠️ Straggler"}
                              </span>
                            </div>

                            {/* Mini capacity load bar */}
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full ${
                                  isStraggler ? "bg-rose-500" : "bg-emerald-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (computeCount /
                                      Math.max(1, simulation.expertCapacity * expertsPerGpu)) *
                                      100,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stage-Specific Deep Dive Card */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2 text-xs">
              <div className="font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Pipeline Execution Insights: Stage {currentStepIndex + 1} ({currentStep.name})
              </div>
              <p className="text-slate-300 leading-relaxed">
                {currentStepIndex === 0 && (
                  <>
                    Tokens arrive distributed across all {config.numGpus} GPUs. The linear gating
                    network projects each token's {config.hiddenDim}-dim activation against all{" "}
                    {config.numExperts} expert routing centroids.
                    {isDeepSeekBiasMode
                      ? " In DeepSeek-V3 mode, dynamic expert biases b_i are added to form biased routing scores s_i = aff(x, i) + b_i."
                      : " Unnormalized routing logits are formed with optional Gaussian jitter noise."}
                  </>
                )}
                {currentStepIndex === 1 && (
                  <>
                    Top-{config.topK} experts are selected per token.
                    {isDeepSeekBiasMode
                      ? " Crucially, routing weights G(x)_i are computed via Softmax over unbiased raw affinities, ensuring dynamic biases never corrupt representation magnitudes."
                      : ` Gating weights are normalized over the top-${config.topK} logits to sum to 1.0.`}
                  </>
                )}
                {currentStepIndex === 2 && (
                  <>
                    {isDeepSeekBiasMode ? (
                      <>
                        DeepSeek-V3 operates{" "}
                        <span className="text-emerald-400 font-bold">
                          auxiliary-loss-free (ℒ_aux = 0)
                        </span>
                        . Dynamic bias terms adjust: overloaded experts receive negative adjustment
                        Δb_i &lt; 0, while underloaded experts receive positive adjustment Δb_i &gt;
                        0.
                      </>
                    ) : (
                      <>
                        The auxiliary load loss enforces uniform token distribution across all{" "}
                        {config.numExperts} experts during training. Currently, the auxiliary loss
                        is{" "}
                        <span className="font-mono text-purple-400 font-bold">
                          {auxLossData.loss.toFixed(4)}
                        </span>{" "}
                        (ideal uniform: {config.auxLossAlpha.toFixed(4)}).
                      </>
                    )}
                  </>
                )}
                {currentStepIndex === 3 && (
                  <>
                    Expert Capacity is bounded to{" "}
                    <span className="font-mono text-emerald-400 font-bold">
                      {simulation.expertCapacity}
                    </span>{" "}
                    tokens ({config.capacityFactor}x buffer). If an expert is overwhelmed, excess
                    tokens are dropped ({simulation.totalDroppedAssignments} dropped,{" "}
                    {simulation.dropRate}% drop rate) and bypass FFN compute.
                  </>
                )}
                {currentStepIndex === 4 && (
                  <>
                    The Dispatch All-to-All collective sends {simulation.crossGpuTransfers}{" "}
                    cross-GPU token activations ({formatBytes(commVolume.dispatchBytes)}) across
                    NVLink/InfiniBand, while {simulation.localTransfers} tokens execute locally in
                    GPU memory without network transit.
                  </>
                )}
                {currentStepIndex === 5 && (
                  <>
                    Each GPU runs FFN forward compute for its local experts. GPU{" "}
                    {simulation.stragglerGpu} is the current bottleneck straggler (
                    {simulation.gpuComputeLoads[simulation.stragglerGpu]} tokens computed vs mean{" "}
                    {imbalanceStats.meanLoad * expertsPerGpu}).
                  </>
                )}
                {currentStepIndex === 6 && (
                  <>
                    The Combine All-to-All collective returns computed expert activation outputs
                    back to the originating GPU rank ({formatBytes(commVolume.combineBytes)}{" "}
                    transferred).
                  </>
                )}
                {currentStepIndex === 7 && (
                  <>
                    Originating GPUs compute the weighted linear combination: y = x + ∑ w_i ·
                    FFN_i(x). Dropped tokens pass through via the residual connection without expert
                    transformation.
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: EXPERT LOAD & CAPACITY HISTOGRAM */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "histogram" && (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-sky-400" />
                    Expert Routing Load vs Capacity Limit (C = {config.capacityFactor}x)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Threshold:{" "}
                    <span className="font-mono text-emerald-400">
                      {simulation.expertCapacity} tokens/expert
                    </span>{" "}
                    • Total Drops:{" "}
                    <span className="font-mono text-rose-400">
                      {simulation.totalDroppedAssignments} ({simulation.dropRate}%)
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-sky-500" />
                    <span className="text-slate-300">Processed (Within Cap)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-500" />
                    <span className="text-slate-300">Dropped (Overflow)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-b border-dashed border-emerald-400" />
                    <span className="text-emerald-400">Capacity Line</span>
                  </div>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="w-full overflow-x-auto">
                <div className="min-w-[680px] h-64 flex items-end gap-2 pb-6 pt-6 px-4 bg-slate-950/70 rounded-lg border border-slate-800 relative">
                  {/* Capacity Line Indicator */}
                  {(() => {
                    const maxBarVal = Math.max(
                      simulation.expertCapacity * 1.4,
                      ...simulation.expertLoads,
                      1,
                    );
                    const capPercent = (simulation.expertCapacity / maxBarVal) * 100;

                    return (
                      <div
                        className="absolute left-0 right-0 border-b border-dashed border-emerald-400/80 pointer-events-none z-10 flex items-center justify-end pr-2"
                        style={{ bottom: `calc(${capPercent}% + 24px)` }}
                      >
                        <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/50">
                          Cap: {simulation.expertCapacity} tok
                        </span>
                      </div>
                    );
                  })()}

                  {/* Expert Columns */}
                  {Array.from({ length: config.numExperts }).map((_, eIdx) => {
                    const processed = simulation.expertProcessedTokens[eIdx]?.length ?? 0;
                    const dropped = simulation.expertDroppedTokens[eIdx]?.length ?? 0;
                    const totalAssigned = processed + dropped;
                    const ownerGpu = Math.min(config.numGpus - 1, Math.floor(eIdx / expertsPerGpu));

                    const maxBarVal = Math.max(
                      simulation.expertCapacity * 1.4,
                      ...simulation.expertLoads,
                      1,
                    );
                    const processedHeight = (processed / maxBarVal) * 100;
                    const droppedHeight = (dropped / maxBarVal) * 100;

                    const isOverloaded = dropped > 0;

                    return (
                      <div
                        key={eIdx}
                        className="flex-1 flex flex-col items-center h-full justify-end group relative"
                      >
                        {/* Hover Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition absolute bottom-full mb-2 bg-slate-900 border border-slate-700 text-slate-100 text-[11px] p-2 rounded-lg shadow-xl pointer-events-none z-20 whitespace-nowrap">
                          <div className="font-bold text-sky-300">
                            Expert {eIdx} (GPU {ownerGpu})
                          </div>
                          <div>Assigned: {totalAssigned} tokens</div>
                          <div>
                            Processed: {processed} / Cap: {simulation.expertCapacity}
                          </div>
                          {dropped > 0 && (
                            <div className="text-rose-400 font-bold">Dropped: {dropped} tokens</div>
                          )}
                          {isDeepSeekBiasMode && (
                            <div className="text-purple-300">
                              Dynamic Bias b_{eIdx}: {(dynamicBiases[eIdx] ?? 0).toFixed(3)}
                            </div>
                          )}
                        </div>

                        {/* Bar Stack */}
                        <div className="w-full max-w-[40px] flex flex-col items-center justify-end h-full">
                          {droppedHeight > 0 && (
                            <div
                              className="w-full bg-rose-500 rounded-t border-t border-rose-300 transition-all duration-300"
                              style={{ height: `${droppedHeight}%` }}
                            />
                          )}
                          <div
                            className={`w-full transition-all duration-300 ${
                              droppedHeight > 0 ? "bg-sky-500" : "bg-sky-500 rounded-t"
                            }`}
                            style={{
                              height: `${processedHeight}%`,
                              backgroundColor: getGpuColor(ownerGpu),
                            }}
                          />
                        </div>

                        {/* X-Axis Label */}
                        <div className="absolute -bottom-5 flex flex-col items-center text-[10px] font-mono">
                          <span
                            className={`font-bold ${
                              isOverloaded ? "text-rose-400" : "text-slate-300"
                            }`}
                          >
                            E{eIdx}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Imbalance & Capacity Metrics Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2 text-xs">
                <h4 className="font-bold text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Routing Imbalance Statistical Breakdown
                </h4>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Imbalance Ratio (Max / Mean):</span>
                    <div className="text-base font-bold font-mono text-white">
                      {imbalanceStats.imbalanceRatio.toFixed(2)}x
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Standard Deviation (σ):</span>
                    <div className="text-base font-bold font-mono text-purple-300">
                      {imbalanceStats.standardDeviation} tokens
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Peak Congested Expert:</span>
                    <div className="text-base font-bold font-mono text-amber-300">
                      {imbalanceStats.maxLoad} tokens
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Min Utilized Expert:</span>
                    <div className="text-base font-bold font-mono text-slate-300">
                      {imbalanceStats.minLoad} tokens
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2 text-xs">
                <h4 className="font-bold text-slate-200 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  Load Balancing Mechanism
                </h4>
                {isDeepSeekBiasMode ? (
                  <div className="p-3 rounded bg-slate-950 border border-purple-800/40 font-mono text-purple-200 leading-relaxed">
                    <div className="text-emerald-400 font-bold">
                      DeepSeek-V3 Aux-Loss-Free Dynamic Biases
                    </div>
                    <div className="text-slate-300 mt-1">s_i = aff(x, e_i) + b_i</div>
                    <div className="text-slate-400 text-[11px] mt-1">
                      Δb_i = -γ · (load_i - C_target) / C_target
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded bg-slate-950 border border-slate-800 font-mono text-slate-300 leading-relaxed">
                    <div>ℒ_aux = α · E · ∑_(i=1)^E (f_i · P_i)</div>
                    <div className="text-sky-300 mt-1">
                      = {config.auxLossAlpha} · {config.numExperts} ·{" "}
                      {(auxLossData.loss / (config.auxLossAlpha * config.numExperts) || 0).toFixed(
                        4,
                      )}{" "}
                      = <span className="font-bold text-white">{auxLossData.loss.toFixed(4)}</span>
                    </div>
                  </div>
                )}
                <p className="text-slate-400 text-[11px]">
                  {isDeepSeekBiasMode
                    ? "Eliminates gradient penalties on token representations while naturally balancing expert load."
                    : "Penalizes expert load concentration through auxiliary loss backpropagation."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: ALL-TO-ALL COMMUNICATION MATRIX */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "all2all" && (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Network className="w-4 h-4 text-sky-400" />
                    All-to-All Dispatch Exchange Matrix (P = {config.numGpus} GPUs)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Row = Source GPU Rank • Column = Destination Expert Host GPU • Values =
                    Dispatched Token Count
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-1 rounded bg-sky-950 border border-sky-800 text-sky-300">
                    NVLink All-to-All: {formatBytes(commVolume.totalBytes)}
                  </span>
                </div>
              </div>

              {/* P x P Matrix Grid */}
              <div className="w-full overflow-x-auto">
                <div className="min-w-[500px] flex flex-col gap-1.5 p-3 bg-slate-950/70 rounded-lg border border-slate-800">
                  {/* Column Header */}
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 pb-1 border-b border-slate-800">
                    <div className="w-24 text-right pr-2">Src → Dst</div>
                    {Array.from({ length: config.numGpus }).map((_, col) => (
                      <div
                        key={col}
                        className="flex-1 text-center font-bold"
                        style={{ color: getGpuColor(col) }}
                      >
                        GPU {col}
                      </div>
                    ))}
                    <div className="w-20 text-center font-bold text-slate-200">Sent</div>
                  </div>

                  {/* Matrix Rows */}
                  {Array.from({ length: config.numGpus }).map((_, row) => {
                    const rowTokens = simulation.gpuDispatchMatrix[row] ?? [];
                    const rowTotal = rowTokens.reduce((a, b) => a + b, 0);

                    return (
                      <div key={row} className="flex items-center gap-1.5 text-xs font-mono">
                        <div
                          className="w-24 text-right pr-2 font-bold"
                          style={{ color: getGpuColor(row) }}
                        >
                          GPU {row}
                        </div>

                        {Array.from({ length: config.numGpus }).map((_, col) => {
                          const count = simulation.gpuDispatchMatrix[row]?.[col] ?? 0;
                          const isLocal = row === col;
                          const intensity = count > 0 ? Math.min(1, count / 10) : 0;

                          return (
                            <div
                              key={col}
                              className={`flex-1 h-11 flex flex-col items-center justify-center rounded border transition ${
                                isLocal
                                  ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-bold"
                                  : count > 0
                                    ? "bg-sky-950/40 border-sky-500/30 text-sky-200"
                                    : "bg-slate-900/40 border-slate-800 text-slate-600"
                              }`}
                              style={{
                                backgroundColor:
                                  !isLocal && count > 0
                                    ? `rgba(56, 189, 248, ${0.15 + intensity * 0.35})`
                                    : undefined,
                              }}
                            >
                              <span className="text-sm font-bold">{count}</span>
                              <span className="text-[9px] text-slate-400">
                                {isLocal ? "Local" : "All2All"}
                              </span>
                            </div>
                          );
                        })}

                        <div className="w-20 text-center font-bold text-white bg-slate-900 py-2.5 rounded border border-slate-800">
                          {rowTotal} tok
                        </div>
                      </div>
                    );
                  })}

                  {/* Column Totals */}
                  <div className="flex items-center gap-1.5 text-xs font-mono pt-1 border-t border-slate-800 text-slate-300">
                    <div className="w-24 text-right pr-2 font-bold text-slate-400">Received</div>
                    {Array.from({ length: config.numGpus }).map((_, col) => {
                      let colSum = 0;
                      for (let r = 0; r < config.numGpus; r++) {
                        colSum += simulation.gpuDispatchMatrix[r]?.[col] ?? 0;
                      }
                      return (
                        <div
                          key={col}
                          className="flex-1 text-center font-bold py-1 bg-slate-900 rounded border border-slate-800"
                          style={{ color: getGpuColor(col) }}
                        >
                          {colSum} tok
                        </div>
                      );
                    })}
                    <div className="w-20 text-center font-bold text-sky-400">
                      {config.numTokens * config.topK} tok
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bandwidth & Theoretical Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1 text-xs">
                <span className="text-slate-400 font-semibold">Dispatch Exchange Volume</span>
                <span className="text-lg font-bold font-mono text-sky-300">
                  {formatBytes(commVolume.dispatchBytes)}
                </span>
                <span className="text-[11px] text-slate-400">
                  Transfers {simulation.crossGpuTransfers} token activations (d_model=
                  {config.hiddenDim}, {config.bytesPerElement} bytes/elem).
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1 text-xs">
                <span className="text-slate-400 font-semibold">Combine Exchange Volume</span>
                <span className="text-lg font-bold font-mono text-sky-300">
                  {formatBytes(commVolume.combineBytes)}
                </span>
                <span className="text-[11px] text-slate-400">
                  Returns computed expert FFN activations back to source GPU ranks.
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1 text-xs">
                <span className="text-slate-400 font-semibold">Per-GPU Bus Traffic</span>
                <span className="text-lg font-bold font-mono text-amber-300">
                  {formatBytes(commVolume.perGpuVolumeBytes)}
                </span>
                <span className="text-[11px] text-slate-400">
                  Average bidirectional NIC/NVLink bandwidth demand per GPU rank.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 4: DEEPSEEK-V3 DYNAMIC BIAS ROUTING STUDIO */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "biases" && (
          <div className="flex flex-col gap-4">
            {/* Header & Controls for DeepSeek-V3 Dynamic Bias Adaptation */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  DeepSeek-V3 Auxiliary-Loss-Free Dynamic Bias Mechanism
                </h3>
                <p className="text-xs text-slate-400">
                  Dynamic expert bias adjustments s_i = aff(x, e_i) + b_i with zero auxiliary loss
                  penalty.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePerformBiasUpdateStep}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Step Dynamic Bias (+1 Step)
                </button>
                <button
                  onClick={handleResetBiases}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 border border-slate-700 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Biases (b_i = 0)
                </button>
              </div>
            </div>

            {/* Convergence Trace & Step Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Convergence Multi-Step Table */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2 text-xs">
                <div className="font-bold text-slate-200 flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                    Load Balancing Convergence
                  </span>
                  <span className="text-[10px] font-mono text-purple-400">
                    Step {convergenceStep}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  {biasConvergenceHistory.map((step) => (
                    <div
                      key={step.iteration}
                      className={`flex items-center justify-between p-2 rounded text-xs font-mono border ${
                        convergenceStep === step.iteration
                          ? "bg-purple-950/40 border-purple-500/50 text-white font-bold"
                          : "bg-slate-950 border-slate-800/80 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[10px] text-slate-300">
                          #{step.iteration}
                        </span>
                        <span>Iter {step.iteration}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={
                            step.imbalanceRatio < 1.3 ? "text-emerald-400" : "text-amber-300"
                          }
                        >
                          Imbalance: {step.imbalanceRatio.toFixed(2)}x
                        </span>
                        <span className="text-purple-300">ℒ_aux = 0</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-slate-400 mt-2">
                  Notice how dynamic biases reduce the imbalance ratio down to near 1.0x without
                  applying any auxiliary loss penalty to token gradients.
                </div>
              </div>

              {/* Live Expert Biases & Deltas Grid */}
              <div className="lg:col-span-2 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2 text-xs">
                <div className="font-bold text-slate-200 flex items-center justify-between pb-1 border-b border-slate-800">
                  <span>Dynamic Expert Biases ($b_i$) & Effective Score Offsets</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Target: {((config.numTokens * config.topK) / config.numExperts).toFixed(1)}{" "}
                    tok/exp
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 mt-1 max-h-72 overflow-y-auto pr-1">
                  {Array.from({ length: config.numExperts }).map((_, eIdx) => {
                    const b = dynamicBiases[eIdx] ?? 0;
                    const load = simulation.expertLoads[eIdx] ?? 0;
                    const target = (config.numTokens * config.topK) / config.numExperts;
                    const isOverloaded = load > target;

                    return (
                      <div
                        key={eIdx}
                        className={`p-2 rounded border flex flex-col justify-between font-mono ${
                          isOverloaded
                            ? "bg-rose-950/20 border-rose-800/40 text-rose-200"
                            : "bg-slate-950 border-slate-800 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span>E{eIdx}</span>
                          <span className="text-[10px] text-slate-400">{load}t</span>
                        </div>
                        <div className="mt-1 text-[11px] font-bold text-purple-300">
                          b = {b.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          {b > 0
                            ? `+${b.toFixed(2)} boost`
                            : b < 0
                              ? `${b.toFixed(2)} damp`
                              : "neutral"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Comparison vs Classical Auxiliary Loss */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                <h4 className="font-bold text-sky-300 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-sky-400" />
                  Classical MoE (Switch / GShard / Mixtral)
                </h4>
                <div className="p-3 rounded bg-slate-950 border border-slate-800 font-mono text-sky-300 text-[11px] leading-relaxed">
                  <div>ℒ_aux = α · E · ∑ f_i · P_i</div>
                  <div className="text-slate-400 text-[10px] mt-1">
                    Adds artificial penalty gradient to router weights W_g.
                  </div>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  High α causes optimization conflicts and degrades language modeling perplexity.
                  Low α fails to prevent expert collapse and stragglers.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/30 flex flex-col gap-2">
                <h4 className="font-bold text-purple-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  DeepSeek-V3 Aux-Loss-Free Dynamic Biases
                </h4>
                <div className="p-3 rounded bg-slate-950 border border-purple-900/40 font-mono text-purple-300 text-[11px] leading-relaxed">
                  <div>s_i = aff(x, e_i) + b_i, Δb_i = -γ · sign(load_i - C̄)</div>
                  <div className="text-emerald-400 text-[10px] mt-1">
                    Gating weights G(x) calculated on unbiased affinities (ℒ_aux = 0).
                  </div>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Maintains optimal parameter specialization while dynamically self-healing routing
                  imbalance across hundreds of micro-experts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 5: TOKEN INSPECTOR & GATING DEEP DIVE */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "inspector" && (
          <div className="flex flex-col gap-4">
            {/* Token Selector Strip */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-300">
                Select Token from Batch (T = {config.numTokens} tokens):
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {simulation.tokenResults.map((tok) => {
                  const isSelected = selectedTokenIndex === tok.id;
                  const hasDrops = tok.droppedExperts.length > 0;

                  return (
                    <button
                      key={tok.id}
                      onClick={() => setSelectedTokenIndex(tok.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium shrink-0 transition border flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-md shadow-sky-500/20"
                          : hasDrops
                            ? "bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/50"
                            : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getGpuColor(tok.sourceGpu) }}
                      />
                      <span>#{tok.id}</span>
                      <span className="font-sans font-semibold">"{tok.text}"</span>
                      {hasDrops && <span className="text-[10px] text-rose-400">⚠️</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Token Detail Card */}
            {selectedToken && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Card: Token Routing & Assignments */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">
                        Token #{selectedToken.id}: "{selectedToken.text}"
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={{
                          backgroundColor: `${getGpuColor(selectedToken.sourceGpu)}25`,
                          color: getGpuColor(selectedToken.sourceGpu),
                          border: `1px solid ${getGpuColor(selectedToken.sourceGpu)}50`,
                        }}
                      >
                        Origin: GPU {selectedToken.sourceGpu}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="font-bold text-slate-300">
                      Top-{config.topK} Chosen Experts & Routing Weights:
                    </span>

                    <div className="flex flex-col gap-1.5">
                      {selectedToken.assignments.map((assign, aIdx) => (
                        <div
                          key={aIdx}
                          className={`p-2.5 rounded-lg border flex items-center justify-between ${
                            assign.isDropped
                              ? "bg-rose-950/30 border-rose-700/50 text-rose-200"
                              : "bg-slate-950 border-slate-800 text-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getGpuColor(assign.targetGpu) }}
                            />
                            <div>
                              <div className="font-bold text-sky-300 font-mono">
                                Expert {assign.expertId} (Hosted on GPU {assign.targetGpu})
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {assign.isLocal
                                  ? "Local Memory (0 Bus Hop)"
                                  : "All-to-All NVLink Hop"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 font-mono">
                            <div className="text-right">
                              <div className="font-bold text-white">
                                Weight: {(assign.weight * 100).toFixed(1)}%
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Raw G(x)_{assign.expertId} = {assign.weight.toFixed(4)}
                              </div>
                            </div>

                            {assign.isDropped ? (
                              <span className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-700 text-[10px] font-bold">
                                DROPPED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700 text-[10px] font-bold">
                                PROCESSED
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Residual Combination Equation for this Token */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] leading-relaxed text-slate-300">
                    <div className="text-slate-400 font-sans font-bold text-xs mb-1">
                      Final Output Formulation for Token #{selectedToken.id}:
                    </div>
                    <div className="text-sky-300">
                      y_{selectedToken.id} = x_{selectedToken.id}
                      {selectedToken.assignments.map((a) =>
                        a.isDropped
                          ? ` + 0 · [Drop E${a.expertId}]`
                          : ` + ${a.weight.toFixed(2)} · FFN_${a.expertId}(x_{${selectedToken.id}})`,
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Card: Full Probability Distribution Across All E Experts */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2 text-xs">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    Full Routing Score & Probability Distribution (All {config.numExperts} Experts)
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    {isDeepSeekBiasMode
                      ? "Biased scores determine selection; unbiased Softmax normalizes weights:"
                      : "Router Softmax probabilities before Top-k gating mask:"}
                  </p>

                  <div className="flex flex-col gap-1 mt-1 max-h-72 overflow-y-auto pr-1">
                    {Array.from({ length: config.numExperts }).map((_, eIdx) => {
                      const prob = selectedToken.routingProbs[eIdx] ?? 0;
                      const biasedScore =
                        selectedToken.biasedScores?.[eIdx] ?? selectedToken.logits[eIdx] ?? 0;
                      const isChosen = selectedToken.selectedExperts.includes(eIdx);
                      const ownerGpu = Math.min(
                        config.numGpus - 1,
                        Math.floor(eIdx / expertsPerGpu),
                      );

                      return (
                        <div
                          key={eIdx}
                          className={`flex items-center gap-2 p-1.5 rounded text-[11px] font-mono ${
                            isChosen
                              ? "bg-purple-950/40 border border-purple-600/50 text-white font-bold"
                              : "bg-slate-950/60 text-slate-400"
                          }`}
                        >
                          <span className="w-12 text-slate-300">
                            E{eIdx} (GPU {ownerGpu})
                          </span>
                          <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${isChosen ? "bg-purple-400" : "bg-slate-600"}`}
                              style={{ width: `${Math.max(2, prob * 100)}%` }}
                            />
                          </div>
                          <span className="w-14 text-right">{(prob * 100).toFixed(1)}%</span>
                          {isDeepSeekBiasMode && (
                            <span className="text-[10px] text-purple-300 w-16 text-right">
                              s={biasedScore.toFixed(1)}
                            </span>
                          )}
                          {isChosen && (
                            <span className="text-[10px] text-purple-300 font-sans">
                              ✓ Top-{config.topK}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 6: MATHEMATICAL FORMULATIONS & ARCHITECTURE COMPARISON */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "theory" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Card 1: Sparse Gating & Top-k Softmax */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
              <h4 className="font-bold text-sky-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-sky-400" />
                1. Sparse Top-k Gating Routing
              </h4>
              <p className="text-slate-300 leading-relaxed">
                In a Mixture-of-Experts layer with E feed-forward networks, a linear gating router
                computes routing logits for input token activation x:
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-sky-300 text-[11px] leading-relaxed">
                <div>H(x) = x · W_g + StandardNormal() · Softplus(x · W_noise)</div>
                <div className="mt-1">G(x)_i = exp(H(x)_i) / (∑_(j ∈ TopK) exp(H(x)_j))</div>
              </div>
              <p className="text-slate-400 text-[11px]">
                Only k ≪ E experts are computed per token. Arithmetic intensity scales efficiently
                while total parameter capacity grows O(E).
              </p>
            </div>

            {/* Card 2: DeepSeek-V3 Dynamic Bias Routing */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/30 flex flex-col gap-2">
              <h4 className="font-bold text-purple-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                2. DeepSeek-V3 Aux-Loss-Free Dynamic Biases
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Replaces gradient-based auxiliary balancing losses with dynamic learnable bias
                offsets:
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-purple-900/40 font-mono text-purple-300 text-[11px] leading-relaxed">
                <div>s_i = affinity(x, e_i) + b_i, i ∈ TopK(s_i, k)</div>
                <div className="mt-1">Δb_i = -γ · (load_i - C̄) / C̄, ℒ_aux = 0</div>
              </div>
              <p className="text-slate-400 text-[11px]">
                Maintains representation purity by computing final gating weights from unbiased
                affinities.
              </p>
            </div>

            {/* Card 3: Expert Capacity Factor & Token Dropping */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
              <h4 className="font-bold text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                3. Expert Capacity Factor & Overflow Truncation
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Static batch tensor allocations in CUDA/TPU kernels require fixed buffer shapes:
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-emerald-300 text-[11px] leading-relaxed">
                <div>Capacity = ⌈ (k · T / E) · C ⌉</div>
              </div>
              <p className="text-slate-400 text-[11px]">
                C = 1.0 allocates exact average capacity. C = 1.25 to 1.5 provides a safety cushion.
                Overflowing tokens drop their expert compute and rely on the residual skip
                connection y = x.
              </p>
            </div>

            {/* Card 4: All-to-All Communication Matrix */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
              <h4 className="font-bold text-amber-300 flex items-center gap-2">
                <Network className="w-4 h-4 text-amber-400" />
                4. All-to-All Communication in Expert Parallelism (EP)
              </h4>
              <p className="text-slate-300 leading-relaxed">
                When E experts are partitioned across P GPUs (E/P experts per GPU):
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-amber-300 text-[11px] leading-relaxed">
                <div>Dispatch All-to-All: T · k · ((P - 1) / P) · d_model · bytes</div>
                <div>Combine All-to-All: Same reverse volume</div>
              </div>
              <p className="text-slate-400 text-[11px]">
                High interconnect bandwidth (NVLink / NVSwitch / InfiniBand) and FP8 quantization
                are vital to prevent communication from becoming the execution bottleneck.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 7. STUDIO FOOTER BAR */}
      {/* ==================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Architecture: {activePreset.architectureFamily}</span>
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="font-mono text-slate-300 hidden sm:inline">
            E={config.numExperts}, k={config.topK}, P={config.numGpus}, C={config.capacityFactor}x,
            {isDeepSeekBiasMode ? " Aux-Loss-Free" : ` α=${config.auxLossAlpha}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">
            Selected Token: <span className="font-bold text-sky-300">#{selectedTokenIndex}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MoEExpertParallelStudio;
