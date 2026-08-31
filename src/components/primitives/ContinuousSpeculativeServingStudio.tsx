import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Cpu,
  Layers,
  Zap,
  Sparkles,
  Clock,
  Activity,
  CheckCircle2,
  XCircle,
  Split,
  Info,
  BarChart3,
  Network,
  PlusCircle,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type ServingPresetId =
  | "speculative_standard_k4"
  | "orca_continuous_batching"
  | "chunked_prefill_sarathi"
  | "adversarial_low_acceptance"
  | "tree_speculative_branching";

export type RequestStatus = "waiting" | "prefilling" | "decoding" | "completed";

export type SpeculativeMode = "linear" | "tree";

export interface TokenProbability {
  readonly token: string;
  readonly draftProb: number;
  readonly targetProb: number;
  readonly accepted?: boolean;
  readonly uniformVal?: number;
  readonly isBonus?: boolean;
  readonly isRecovery?: boolean;
}

export interface SpeculativeDraftNode {
  readonly id: string;
  readonly token: string;
  readonly depth: number;
  readonly parentId: string | null;
  readonly draftProb: number;
  readonly targetProb: number;
  readonly accepted: boolean;
  readonly uniformSample: number;
  readonly children: SpeculativeDraftNode[];
}

export interface SpeculativeStepResult {
  readonly draftTokens: readonly string[];
  readonly draftProbs: readonly number[];
  readonly targetProbs: readonly number[];
  readonly uniformSamples: readonly number[];
  readonly acceptedIndices: readonly number[];
  readonly rejectedIndex: number | null;
  readonly numAccepted: number;
  readonly totalEmittedTokens: number;
  readonly emittedTokens: readonly string[];
  readonly bonusToken: string | null;
  readonly recoveryToken: string | null;
  readonly speedup: number;
}

export interface InferenceRequest {
  readonly id: string;
  readonly prompt: string;
  readonly promptTokens: number;
  readonly prefilledTokens: number;
  readonly generatedTokens: readonly string[];
  readonly maxNewTokens: number;
  readonly arrivalIteration: number;
  readonly status: RequestStatus;
  readonly ttft: number | null; // Time To First Token (iteration delta)
  readonly totalLatency: number | null; // Total iterations from arrival to completion
  readonly kvBlocksAllocated: number;
  readonly color: string;
  readonly speculativeHistory: readonly {
    iteration: number;
    proposed: number;
    accepted: number;
  }[];
}

export interface BatchSchedulerState {
  readonly iteration: number;
  readonly activeRequests: readonly InferenceRequest[];
  readonly waitingQueue: readonly InferenceRequest[];
  readonly completedRequests: readonly InferenceRequest[];
  readonly totalTokensGenerated: number;
  readonly totalDraftTokensProposed: number;
  readonly totalDraftTokensAccepted: number;
  readonly currentStepSpeculation?: SpeculativeStepResult;
  readonly memoryBlockGrid: readonly (string | null)[]; // Request ID or null per block
  readonly iterationTimeline: readonly {
    iteration: number;
    activeCount: number;
    prefillTokenBudget: number;
    decodeTokenCount: number;
    acceptedSpecTokens: number;
    kvUtilizationPercent: number;
  }[];
}

export interface SchedulerConfig {
  readonly maxBatchSize: number;
  readonly prefillChunkBudget: number; // Tokens per iteration for prefilling
  readonly enableChunkedPrefill: boolean;
  readonly lookaheadK: number; // K in [2..8]
  readonly draftCostRatio: number; // gamma = c_draft / c_target (e.g. 0.05)
  readonly defaultAcceptanceRate: number; // alpha (e.g. 0.8)
  readonly kvCacheCapacityBlocks: number;
  readonly tokensPerBlock: number;
  readonly speculativeMode: SpeculativeMode;
  readonly branchFactor?: number;
}

export interface ServingPreset {
  readonly id: ServingPresetId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly targetModel: string;
  readonly draftModel: string;
  readonly config: SchedulerConfig;
  readonly initialRequests: readonly InferenceRequest[];
  readonly highlightConcepts: readonly string[];
}

export interface ContinuousServingStudioProps {
  readonly initialPreset?: ServingPresetId;
  readonly initialConfig?: Partial<SchedulerConfig>;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onStepChange?: (state: BatchSchedulerState) => void;
  readonly onPresetChange?: (presetId: ServingPresetId) => void;
}

// ============================================================================
// 2. PURE MATHEMATICAL & SERVING ALGORITHMIC FUNCTIONS
// ============================================================================

/**
 * Stochastic Rejection Sampling for Speculative Decoding:
 * Evaluates candidate draft tokens against target model probabilities.
 * Accept token i with probability min(1, p(x_i) / q(x_i)).
 * If rejected at index j, all subsequent tokens are discarded and a recovery
 * token is sampled from the residual distribution p'(x) = max(0, p(x) - q(x)) / norm.
 * Lossless guarantee: Output distribution is mathematically identical to target model alone.
 */
export function computeRejectionSamplingAcceptance(
  draftProbs: readonly number[],
  targetProbs: readonly number[],
  randomUniformVals: readonly number[],
): {
  readonly acceptedIndices: number[];
  readonly rejectedIndex: number | null;
  readonly numAccepted: number;
  readonly totalEmitted: number;
} {
  const K = Math.min(draftProbs.length, targetProbs.length, randomUniformVals.length);
  const acceptedIndices: number[] = [];
  let rejectedIndex: number | null = null;

  for (let i = 0; i < K; i++) {
    const q = Math.max(1e-7, draftProbs[i] ?? 0.5);
    const p = Math.max(0, targetProbs[i] ?? 0.5);
    const alpha = Math.min(1, p / q);
    const u = randomUniformVals[i] ?? 0.5;

    if (u <= alpha) {
      acceptedIndices.push(i);
    } else {
      rejectedIndex = i;
      break; // First mismatch terminates the speculation chain
    }
  }

  const numAccepted = acceptedIndices.length;
  // If all K accepted, we get K accepted + 1 bonus token from target model = K + 1.
  // If rejected at index j, we get j accepted + 1 recovery token = j + 1.
  const totalEmitted = numAccepted + 1;

  return {
    acceptedIndices,
    rejectedIndex,
    numAccepted,
    totalEmitted,
  };
}

/**
 * Calculates the exact residual distribution when a draft token is rejected:
 * p'(x) = max(0, p(x) - q(x)) / sum_y max(0, p(y) - q(y))
 * If draft matches target identically (sum == 0), defaults to p(x).
 */
export function computeResidualDistribution(
  draftProbs: Record<string, number> | readonly number[],
  targetProbs: Record<string, number> | readonly number[],
): Record<string, number> | number[] {
  if (Array.isArray(draftProbs) && Array.isArray(targetProbs)) {
    const len = Math.max(draftProbs.length, targetProbs.length);
    const diffs: number[] = [];
    let sumPositiveDiff = 0;

    for (let i = 0; i < len; i++) {
      const q = draftProbs[i] ?? 0;
      const p = targetProbs[i] ?? 0;
      const diff = Math.max(0, p - q);
      diffs.push(diff);
      sumPositiveDiff += diff;
    }

    if (sumPositiveDiff < 1e-9) {
      return [...targetProbs];
    }
    return diffs.map((d) => d / sumPositiveDiff);
  }

  const draftMap = draftProbs as Record<string, number>;
  const targetMap = targetProbs as Record<string, number>;
  const allKeys = Array.from(new Set([...Object.keys(draftMap), ...Object.keys(targetMap)]));

  const rawResidual: Record<string, number> = {};
  let totalPositiveDiff = 0;

  for (const token of allKeys) {
    const q = draftMap[token] ?? 0;
    const p = targetMap[token] ?? 0;
    const diff = Math.max(0, p - q);
    rawResidual[token] = diff;
    totalPositiveDiff += diff;
  }

  const normalizedResidual: Record<string, number> = {};
  if (totalPositiveDiff < 1e-9) {
    for (const token of allKeys) {
      normalizedResidual[token] = targetMap[token] ?? 0;
    }
  } else {
    for (const token of allKeys) {
      normalizedResidual[token] = (rawResidual[token] ?? 0) / totalPositiveDiff;
    }
  }

  return normalizedResidual;
}

/**
 * Samples a token from the residual distribution deterministically given a seed or uniform random value.
 */
export function sampleResidualToken(
  draftProbs: Record<string, number>,
  targetProbs: Record<string, number>,
  randomSeed = 0.42,
): {
  readonly token: string;
  readonly probability: number;
  readonly residualDist: Record<string, number>;
} {
  const residualDist = computeResidualDistribution(draftProbs, targetProbs) as Record<
    string,
    number
  >;
  const entries = Object.entries(residualDist).sort((a, b) => b[1] - a[1]);

  let cumulative = 0;
  const targetThreshold = Math.max(0, Math.min(0.9999, randomSeed));

  for (const [token, prob] of entries) {
    cumulative += prob;
    if (cumulative >= targetThreshold) {
      return { token, probability: prob, residualDist };
    }
  }

  const fallback = entries[0] ?? ["<unk>", 1.0];
  return { token: fallback[0], probability: fallback[1], residualDist };
}

/**
 * Theoretical Expected Accepted Tokens per Speculative Verification Step:
 * E[N] = 1 + sum_{i=1}^K prod_{j=1}^i alpha_j
 * For uniform acceptance alpha: E[N] = 1 + sum_{i=1}^K alpha^i = 1 + (alpha * (1 - alpha^K)) / (1 - alpha)
 */
export function computeExpectedAcceptedTokens(
  acceptanceRates: readonly number[] | number,
  lookaheadK: number,
): number {
  if (lookaheadK <= 0) return 1;

  if (typeof acceptanceRates === "number") {
    const alpha = Math.max(0, Math.min(1, acceptanceRates));
    if (Math.abs(alpha - 1.0) < 1e-6) {
      return 1 + lookaheadK;
    }
    if (alpha <= 1e-6) {
      return 1;
    }
    let expected = 1;
    let prod = 1;
    for (let i = 1; i <= lookaheadK; i++) {
      prod *= alpha;
      expected += prod;
    }
    return expected;
  }

  let expected = 1;
  let runningProd = 1;
  for (let i = 0; i < lookaheadK; i++) {
    const alpha = Math.max(0, Math.min(1, acceptanceRates[i] ?? 0.5));
    runningProd *= alpha;
    expected += runningProd;
  }
  return expected;
}

/**
 * Theoretical Speculative Decoding Speedup Ratio:
 * S = E[N] / (1 + K * gamma)
 * where gamma = c_draft / c_target (relative cost of 1 draft model step vs 1 target model step).
 */
export function computeSpeculativeSpeedup(
  expectedTokens: number,
  draftCostRatio: number,
  lookaheadK: number,
): number {
  const gamma = Math.max(0.001, draftCostRatio);
  const k = Math.max(1, lookaheadK);
  const denominator = 1 + k * gamma;
  return Math.max(0.1, expectedTokens / denominator);
}

/**
 * Generates a tree of speculative token hypotheses for Tree Speculative Decoding (SpecInfer / Medusa).
 */
export function generateSpeculativeDraftTree(
  prompt: string,
  k: number,
  branchFactor = 2,
): SpeculativeDraftNode {
  const vocabularySample = [
    "attention",
    "transformer",
    "latency",
    "throughput",
    "memory",
    "parallel",
    "speculative",
    "continuous",
    "batching",
    "kernel",
    "activation",
    "tensor",
    "gradient",
    "quantization",
    "bandwidth",
  ];

  let nodeCounter = 0;

  function buildNode(
    depth: number,
    parentId: string | null,
    _parentToken: string,
  ): SpeculativeDraftNode {
    const id = `node_${nodeCounter++}`;
    const tokenIndex = (prompt.length + depth * 3 + nodeCounter * 7) % vocabularySample.length;
    const token = vocabularySample[tokenIndex] ?? `tok_${depth}`;

    // Controlled pseudorandom acceptance values
    const draftProb = Math.max(0.2, 0.9 - depth * 0.12 - (nodeCounter % 3) * 0.1);
    const targetProb = Math.max(0.15, draftProb + ((nodeCounter % 5) - 2) * 0.08);
    const uniformSample = 0.1 + ((nodeCounter * 37) % 80) / 100;
    const accepted = uniformSample <= Math.min(1, targetProb / draftProb);

    const children: SpeculativeDraftNode[] = [];
    if (depth < k && accepted) {
      const branches = depth === 0 ? branchFactor : Math.max(1, branchFactor - 1);
      for (let b = 0; b < branches; b++) {
        children.push(buildNode(depth + 1, id, token));
      }
    }

    return {
      id,
      token,
      depth,
      parentId,
      draftProb: Math.round(draftProb * 100) / 100,
      targetProb: Math.round(targetProb * 100) / 100,
      accepted,
      uniformSample: Math.round(uniformSample * 100) / 100,
      children,
    };
  }

  return buildNode(0, null, "root");
}

/**
 * Constructs the 2D Tree Attention Mask matrix for parallel verification.
 * Mask[i][j] = 1 if token j is an ancestor of token i or j == i; 0 otherwise.
 */
export function createTreeAttentionMask(
  treeStructure: SpeculativeDraftNode | { numNodes: number; parentMap: number[] },
): number[][] {
  if ("numNodes" in treeStructure && "parentMap" in treeStructure) {
    const { numNodes, parentMap } = treeStructure;
    const mask: number[][] = Array.from({ length: numNodes }, () =>
      Array.from({ length: numNodes }, () => 0),
    );

    for (let i = 0; i < numNodes; i++) {
      let curr = i;
      while (curr >= 0 && curr < numNodes) {
        mask[i]![curr] = 1;
        curr = parentMap[curr] ?? -1;
      }
    }
    return mask;
  }

  // Flatten nodes from SpeculativeDraftNode
  const flatNodes: { id: string; parentId: string | null }[] = [];
  function traverse(n: SpeculativeDraftNode) {
    flatNodes.push({ id: n.id, parentId: n.parentId });
    n.children.forEach(traverse);
  }
  traverse(treeStructure as SpeculativeDraftNode);

  const N = flatNodes.length;
  const idToIndex = new Map<string, number>();
  flatNodes.forEach((node, idx) => idToIndex.set(node.id, idx));

  const mask: number[][] = Array.from({ length: N }, () => Array.from({ length: N }, () => 0));

  for (let i = 0; i < N; i++) {
    const current = flatNodes[i];
    if (!current) continue;
    mask[i]![i] = 1;
    let pId = current.parentId;
    while (pId !== null) {
      const pIdx = idToIndex.get(pId);
      if (pIdx !== undefined && pIdx < N) {
        mask[i]![pIdx] = 1;
        pId = flatNodes[pIdx]?.parentId ?? null;
      } else {
        break;
      }
    }
  }

  return mask;
}

/**
 * Splits a long prompt prefill into chunks of maximum chunkSize for chunked prefill co-scheduling (Sarathi).
 */
export function splitPrefillIntoChunks(promptLength: number, chunkSize: number): number[] {
  if (promptLength <= 0) return [];
  const safeChunk = Math.max(1, chunkSize);
  const chunks: number[] = [];
  let remaining = promptLength;

  while (remaining > 0) {
    const take = Math.min(remaining, safeChunk);
    chunks.push(take);
    remaining -= take;
  }

  return chunks;
}

/**
 * Computes comparative efficiency between static batching and continuous batching.
 */
export function calculateContinuousBatchingEfficiency(
  staticBatchStats: { totalIterations: number; totalTokens: number; peakConcurrency: number },
  continuousBatchStats: { totalIterations: number; totalTokens: number; peakConcurrency: number },
): {
  readonly staticThroughput: number;
  readonly continuousThroughput: number;
  readonly speedup: number;
  readonly bubbleReductionPercent: number;
} {
  const staticThroughput =
    staticBatchStats.totalIterations > 0
      ? staticBatchStats.totalTokens / staticBatchStats.totalIterations
      : 0;
  const continuousThroughput =
    continuousBatchStats.totalIterations > 0
      ? continuousBatchStats.totalTokens / continuousBatchStats.totalIterations
      : 0;

  const speedup =
    staticThroughput > 0 ? Math.round((continuousThroughput / staticThroughput) * 100) / 100 : 1.0;

  // Static bubble calculation: peak concurrency * iterations - total work
  const staticSlots = staticBatchStats.peakConcurrency * staticBatchStats.totalIterations;
  const staticBubbles = Math.max(0, staticSlots - staticBatchStats.totalTokens);
  const staticBubbleRatio = staticSlots > 0 ? staticBubbles / staticSlots : 0;

  const contSlots = continuousBatchStats.peakConcurrency * continuousBatchStats.totalIterations;
  const contBubbles = Math.max(0, contSlots - continuousBatchStats.totalTokens);
  const contBubbleRatio = contSlots > 0 ? contBubbles / contSlots : 0;

  const bubbleReductionPercent =
    staticBubbleRatio > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(((staticBubbleRatio - contBubbleRatio) / staticBubbleRatio) * 100),
          ),
        )
      : 0;

  return {
    staticThroughput: Math.round(staticThroughput * 10) / 10,
    continuousThroughput: Math.round(continuousThroughput * 10) / 10,
    speedup,
    bubbleReductionPercent,
  };
}

/**
 * Simulates one iteration step of Orca iteration-level continuous batching + speculative decoding.
 */
export function scheduleOrcaIterationStep(
  state: BatchSchedulerState,
  config: SchedulerConfig,
): BatchSchedulerState {
  const currentIter = state.iteration + 1;
  const blockSize = Math.max(1, config.tokensPerBlock);
  const capacityBlocks = Math.max(4, config.kvCacheCapacityBlocks);

  // 1. Process Finished Requests from current active pool
  const newlyCompleted: InferenceRequest[] = [];
  const continuingActive: InferenceRequest[] = [];

  for (const req of state.activeRequests) {
    if (req.generatedTokens.length >= req.maxNewTokens) {
      newlyCompleted.push({
        ...req,
        status: "completed",
        totalLatency: currentIter - req.arrivalIteration,
      });
    } else {
      continuingActive.push(req);
    }
  }

  // 2. Memory Deallocation for completed requests
  const memoryGrid = [...state.memoryBlockGrid];
  const freedIds = new Set(newlyCompleted.map((r) => r.id));
  for (let i = 0; i < memoryGrid.length; i++) {
    if (memoryGrid[i] && freedIds.has(memoryGrid[i]!)) {
      memoryGrid[i] = null;
    }
  }

  // Helper to count used blocks
  const countAllocatedBlocks = () => memoryGrid.filter((x) => x !== null).length;

  // 3. Admit waiting requests up to maxBatchSize and KV memory limit
  const waiting = [...state.waitingQueue];
  const admitted: InferenceRequest[] = [];

  while (waiting.length > 0 && continuingActive.length + admitted.length < config.maxBatchSize) {
    const candidate = waiting[0];
    if (!candidate) break;

    const initialBlockNeeds = Math.ceil(
      (config.enableChunkedPrefill
        ? Math.min(candidate.promptTokens, config.prefillChunkBudget)
        : candidate.promptTokens) / blockSize,
    );

    if (countAllocatedBlocks() + initialBlockNeeds <= capacityBlocks) {
      waiting.shift();
      admitted.push({
        ...candidate,
        status: "prefilling",
        prefilledTokens: 0,
      });

      // Allocate blocks
      let allocatedCount = 0;
      for (let i = 0; i < memoryGrid.length && allocatedCount < initialBlockNeeds; i++) {
        if (memoryGrid[i] === null) {
          memoryGrid[i] = candidate.id;
          allocatedCount++;
        }
      }
    } else {
      break; // Memory full
    }
  }

  const combinedActive = [...continuingActive, ...admitted];

  // 4. Execute Iteration Work for Active Requests
  let iterationPrefillTokens = 0;
  let iterationDecodeTokens = 0;
  let iterationAcceptedSpec = 0;
  let currentStepSpeculation: SpeculativeStepResult | undefined;

  const nextActiveList: InferenceRequest[] = [];
  const vocabulary = [
    "speculative",
    "execution",
    "optimizes",
    "throughput",
    "without",
    "distribution",
    "shift",
    "providing",
    "lossless",
    "inference",
    "acceleration",
    "for",
    "modern",
    "large",
    "language",
    "models",
  ];

  for (let rIdx = 0; rIdx < combinedActive.length; rIdx++) {
    const req = combinedActive[rIdx];
    if (!req) continue;

    if (req.status === "prefilling") {
      // Chunked prefill or full prefill
      const remainingPrompt = req.promptTokens - req.prefilledTokens;
      const processBudget = config.enableChunkedPrefill
        ? Math.min(remainingPrompt, config.prefillChunkBudget)
        : remainingPrompt;

      const newPrefilled = req.prefilledTokens + processBudget;
      iterationPrefillTokens += processBudget;

      if (newPrefilled >= req.promptTokens) {
        // Transition to decoding
        const ttft = currentIter - req.arrivalIteration;
        nextActiveList.push({
          ...req,
          status: "decoding",
          prefilledTokens: req.promptTokens,
          ttft: req.ttft ?? ttft,
          kvBlocksAllocated: Math.ceil((req.promptTokens + req.generatedTokens.length) / blockSize),
        });
      } else {
        nextActiveList.push({
          ...req,
          prefilledTokens: newPrefilled,
          kvBlocksAllocated: Math.ceil((newPrefilled + req.generatedTokens.length) / blockSize),
        });
      }
    } else if (req.status === "decoding") {
      // Execute Speculative Decoding verification step
      const K = config.lookaheadK;
      const draftProbs: number[] = [];
      const targetProbs: number[] = [];
      const uniformSamples: number[] = [];
      const draftTokens: string[] = [];

      for (let k = 0; k < K; k++) {
        const tokIndex = (currentIter * 7 + rIdx * 11 + k * 13) % vocabulary.length;
        draftTokens.push(vocabulary[tokIndex] ?? `tok_${k}`);

        // Controlled deterministic distribution
        const baseAlpha = config.defaultAcceptanceRate;
        const q = 0.7 - k * 0.05;
        const p = Math.max(0.1, q * baseAlpha + (k % 2 === 0 ? 0.08 : -0.05));
        const u = 0.1 + ((currentIter * 31 + k * 17 + rIdx * 5) % 90) / 100;

        draftProbs.push(Math.round(q * 100) / 100);
        targetProbs.push(Math.round(p * 100) / 100);
        uniformSamples.push(Math.round(u * 100) / 100);
      }

      const rejectionResult = computeRejectionSamplingAcceptance(
        draftProbs,
        targetProbs,
        uniformSamples,
      );

      const acceptedTokens: string[] = [];
      for (const idx of rejectionResult.acceptedIndices) {
        const t = draftTokens[idx];
        if (t) acceptedTokens.push(t);
      }

      const recoveryToken =
        rejectionResult.rejectedIndex !== null
          ? `recov_${vocabulary[(currentIter + rIdx) % vocabulary.length]}`
          : null;
      const bonusToken =
        rejectionResult.numAccepted === K
          ? `bonus_${vocabulary[(currentIter * 3 + rIdx) % vocabulary.length]}`
          : null;

      const emitted: string[] = [...acceptedTokens];
      if (recoveryToken) emitted.push(recoveryToken);
      if (bonusToken) emitted.push(bonusToken);

      iterationDecodeTokens += 1;
      iterationAcceptedSpec += rejectionResult.numAccepted;

      const speedup = computeSpeculativeSpeedup(
        rejectionResult.totalEmitted,
        config.draftCostRatio,
        K,
      );

      // Record step speculation for the primary visualizer request (first active decode)
      if (!currentStepSpeculation) {
        currentStepSpeculation = {
          draftTokens,
          draftProbs,
          targetProbs,
          uniformSamples,
          acceptedIndices: rejectionResult.acceptedIndices,
          rejectedIndex: rejectionResult.rejectedIndex,
          numAccepted: rejectionResult.numAccepted,
          totalEmittedTokens: emitted.length,
          emittedTokens: emitted,
          bonusToken,
          recoveryToken,
          speedup: Math.round(speedup * 100) / 100,
        };
      }

      const updatedGenerated = [...req.generatedTokens, ...emitted];
      const newBlockNeeds = Math.ceil((req.promptTokens + updatedGenerated.length) / blockSize);

      // Maintain KV blocks in memory grid
      let currentAllocated = 0;
      for (let i = 0; i < memoryGrid.length; i++) {
        if (memoryGrid[i] === req.id) currentAllocated++;
      }
      for (let i = 0; i < memoryGrid.length && currentAllocated < newBlockNeeds; i++) {
        if (memoryGrid[i] === null) {
          memoryGrid[i] = req.id;
          currentAllocated++;
        }
      }

      nextActiveList.push({
        ...req,
        generatedTokens: updatedGenerated,
        kvBlocksAllocated: newBlockNeeds,
        speculativeHistory: [
          ...req.speculativeHistory,
          {
            iteration: currentIter,
            proposed: K,
            accepted: rejectionResult.numAccepted,
          },
        ],
      });
    }
  }

  const finalCompleted = [...state.completedRequests, ...newlyCompleted];
  const newTokensGenerated =
    iterationAcceptedSpec + nextActiveList.filter((r) => r.status === "decoding").length;

  const totalUsedBlocks = memoryGrid.filter((x) => x !== null).length;
  const kvUtilizationPercent = Math.round((totalUsedBlocks / capacityBlocks) * 100);

  const timelineEntry = {
    iteration: currentIter,
    activeCount: nextActiveList.length,
    prefillTokenBudget: iterationPrefillTokens,
    decodeTokenCount: iterationDecodeTokens,
    acceptedSpecTokens: iterationAcceptedSpec,
    kvUtilizationPercent,
  };

  return {
    iteration: currentIter,
    activeRequests: nextActiveList,
    waitingQueue: waiting,
    completedRequests: finalCompleted,
    totalTokensGenerated: state.totalTokensGenerated + newTokensGenerated,
    totalDraftTokensProposed:
      state.totalDraftTokensProposed +
      nextActiveList.filter((r) => r.status === "decoding").length * config.lookaheadK,
    totalDraftTokensAccepted: state.totalDraftTokensAccepted + iterationAcceptedSpec,
    currentStepSpeculation,
    memoryBlockGrid: memoryGrid,
    iterationTimeline: [...state.iterationTimeline.slice(-19), timelineEntry],
  };
}

// ============================================================================
// 3. PRESET DEFINITIONS
// ============================================================================

export const CONTINUOUS_SERVING_PRESETS: Record<ServingPresetId, ServingPreset> = {
  speculative_standard_k4: {
    id: "speculative_standard_k4",
    name: "Standard Speculative Decoding (K=4)",
    subtitle: "LLaMA-3-70B Target + LLaMA-3-8B Draft (~82% Acceptance)",
    description:
      "Standard speculative decoding pipeline with lookahead window K=4. Draft model generates 4 candidate tokens quickly; 70B target model verifies all in one parallel forward pass using causal masking, yielding ~2.4x wall-clock speedup.",
    targetModel: "LLaMA-3-70B (FP16)",
    draftModel: "LLaMA-3-8B (FP16)",
    config: {
      maxBatchSize: 6,
      prefillChunkBudget: 256,
      enableChunkedPrefill: true,
      lookaheadK: 4,
      draftCostRatio: 0.05,
      defaultAcceptanceRate: 0.82,
      kvCacheCapacityBlocks: 32,
      tokensPerBlock: 16,
      speculativeMode: "linear",
    },
    initialRequests: [
      {
        id: "req_alpha",
        prompt: "Explain the mathematical formulation of speculative decoding rejection sampling.",
        promptTokens: 48,
        prefilledTokens: 48,
        generatedTokens: ["Speculative", "decoding", "accelerates", "autoregressive"],
        maxNewTokens: 32,
        arrivalIteration: 0,
        status: "decoding",
        ttft: 1,
        totalLatency: null,
        kvBlocksAllocated: 5,
        color: "#38bdf8",
        speculativeHistory: [],
      },
      {
        id: "req_beta",
        prompt: "Write a high-performance CUDA kernel for flash attention tiling.",
        promptTokens: 64,
        prefilledTokens: 64,
        generatedTokens: ["__global__", "void", "flash_attn_kernel"],
        maxNewTokens: 40,
        arrivalIteration: 0,
        status: "decoding",
        ttft: 1,
        totalLatency: null,
        kvBlocksAllocated: 6,
        color: "#a855f7",
        speculativeHistory: [],
      },
      {
        id: "req_gamma",
        prompt: "Derive the Gauss-Markov theorem for ordinary least squares estimators.",
        promptTokens: 36,
        prefilledTokens: 0,
        generatedTokens: [],
        maxNewTokens: 28,
        arrivalIteration: 1,
        status: "waiting",
        ttft: null,
        totalLatency: null,
        kvBlocksAllocated: 0,
        color: "#34d399",
        speculativeHistory: [],
      },
    ],
    highlightConcepts: [
      "Lossless Output Invariance",
      "Parallel Target Verification",
      "Exact Residual Resampling",
      "Arithmetic Intensity Boost",
    ],
  },

  orca_continuous_batching: {
    id: "orca_continuous_batching",
    name: "Orca Iteration-Level Continuous Batching",
    subtitle: "Dynamic Request Arrivals & Instant Slot Recycling",
    description:
      "Unlike static batching which locks GPU execution until the slowest sequence finishes, Orca schedules at the iteration level. Completed requests exit immediately and waiting requests join on the next step, eliminating 60%+ idle compute bubbles.",
    targetModel: "Mixtral-8x7B-Instruct",
    draftModel: "Mistral-7B-Draft",
    config: {
      maxBatchSize: 8,
      prefillChunkBudget: 128,
      enableChunkedPrefill: true,
      lookaheadK: 3,
      draftCostRatio: 0.06,
      defaultAcceptanceRate: 0.78,
      kvCacheCapacityBlocks: 40,
      tokensPerBlock: 16,
      speculativeMode: "linear",
    },
    initialRequests: [
      {
        id: "req_short_1",
        prompt: "Summarize BPE tokenization in one sentence.",
        promptTokens: 24,
        prefilledTokens: 24,
        generatedTokens: ["BPE", "iteratively", "merges", "frequent", "byte", "pairs."],
        maxNewTokens: 8,
        arrivalIteration: 0,
        status: "decoding",
        ttft: 1,
        totalLatency: null,
        kvBlocksAllocated: 2,
        color: "#f59e0b",
        speculativeHistory: [],
      },
      {
        id: "req_medium_2",
        prompt: "Compare ZeRO-1, ZeRO-2, and ZeRO-3 memory sharding tradeoffs.",
        promptTokens: 52,
        prefilledTokens: 52,
        generatedTokens: ["ZeRO-1", "shards", "optimizer", "states"],
        maxNewTokens: 48,
        arrivalIteration: 0,
        status: "decoding",
        ttft: 1,
        totalLatency: null,
        kvBlocksAllocated: 5,
        color: "#ec4899",
        speculativeHistory: [],
      },
      {
        id: "req_long_3",
        prompt: "Provide complete step-by-step proof of Eckart-Young Low-Rank Theorem.",
        promptTokens: 80,
        prefilledTokens: 0,
        generatedTokens: [],
        maxNewTokens: 64,
        arrivalIteration: 1,
        status: "waiting",
        ttft: null,
        totalLatency: null,
        kvBlocksAllocated: 0,
        color: "#06b6d4",
        speculativeHistory: [],
      },
      {
        id: "req_short_4",
        prompt: "What is the capital of France?",
        promptTokens: 12,
        prefilledTokens: 0,
        generatedTokens: [],
        maxNewTokens: 6,
        arrivalIteration: 2,
        status: "waiting",
        ttft: null,
        totalLatency: null,
        kvBlocksAllocated: 0,
        color: "#10b981",
        speculativeHistory: [],
      },
    ],
    highlightConcepts: [
      "Iteration-Level Scheduling",
      "Dynamic Slot Deallocation",
      "Zero Batch-Level Stalling",
      "Paged Block Allocation",
    ],
  },

  chunked_prefill_sarathi: {
    id: "chunked_prefill_sarathi",
    name: "Chunked Prefill & Mixed Scheduling (Sarathi)",
    subtitle: "Long Prompt Chunking Co-Scheduled with Active Decode",
    description:
      "Long context prefill creates massive compute spikes that stall decode requests and blow up Inter-Token Latency (ITL). Sarathi chunks long prompts into uniform slices (e.g. 128 tokens) co-scheduled with decode requests.",
    targetModel: "DeepSeek-V2-Lite",
    draftModel: "DeepSeek-1.3B-Draft",
    config: {
      maxBatchSize: 6,
      prefillChunkBudget: 128,
      enableChunkedPrefill: true,
      lookaheadK: 3,
      draftCostRatio: 0.05,
      defaultAcceptanceRate: 0.75,
      kvCacheCapacityBlocks: 36,
      tokensPerBlock: 16,
      speculativeMode: "linear",
    },
    initialRequests: [
      {
        id: "req_long_doc",
        prompt: "Analyze this 512-token research paper excerpt on hardware-aware tensor tiling...",
        promptTokens: 384,
        prefilledTokens: 128,
        generatedTokens: [],
        maxNewTokens: 48,
        arrivalIteration: 0,
        status: "prefilling",
        ttft: null,
        totalLatency: null,
        kvBlocksAllocated: 16,
        color: "#f43f5e",
        speculativeHistory: [],
      },
      {
        id: "req_decode_stream_1",
        prompt: "Quick Python regex to match email addresses.",
        promptTokens: 20,
        prefilledTokens: 20,
        generatedTokens: ["import", "re", "\n", "pattern", "=", "r'^[a-zA-Z0-9_.+-]+@'"],
        maxNewTokens: 24,
        arrivalIteration: 0,
        status: "decoding",
        ttft: 1,
        totalLatency: null,
        kvBlocksAllocated: 3,
        color: "#6366f1",
        speculativeHistory: [],
      },
      {
        id: "req_decode_stream_2",
        prompt: "Explain cosine similarity vs dot product.",
        promptTokens: 30,
        prefilledTokens: 30,
        generatedTokens: ["Cosine", "similarity", "normalizes", "by", "vector", "magnitudes"],
        maxNewTokens: 30,
        arrivalIteration: 0,
        status: "decoding",
        ttft: 1,
        totalLatency: null,
        kvBlocksAllocated: 4,
        color: "#8b5cf6",
        speculativeHistory: [],
      },
    ],
    highlightConcepts: [
      "Chunked Prefill Slicing",
      "ITL Jitter Minimization",
      "Compute Bubble Smoothing",
      "Mixed Arithmetic Intensity",
    ],
  },

  adversarial_low_acceptance: {
    id: "adversarial_low_acceptance",
    name: "Adversarial Low-Acceptance Regime",
    subtitle: "High Entropy Reasoning / Domain Mismatch (~28% Acceptance)",
    description:
      "When draft model distribution deviates significantly from target (e.g. dense mathematical proofs, code synthesis, high temperature), acceptance rates drop. Demonstrates fallback behavior and verification overhead bounds.",
    targetModel: "Claude-3.5-Sonnet-Grade Target",
    draftModel: "Small Distilled Draft (High Mismatch)",
    config: {
      maxBatchSize: 4,
      prefillChunkBudget: 256,
      enableChunkedPrefill: true,
      lookaheadK: 5,
      draftCostRatio: 0.12,
      defaultAcceptanceRate: 0.28,
      kvCacheCapacityBlocks: 24,
      tokensPerBlock: 16,
      speculativeMode: "linear",
    },
    initialRequests: [
      {
        id: "req_math_proof",
        prompt:
          "Prove that every planar graph with no triangles is 3-colorable or give counterexample.",
        promptTokens: 42,
        prefilledTokens: 42,
        generatedTokens: ["Consider", "the", "Grötzsch", "graph"],
        maxNewTokens: 36,
        arrivalIteration: 0,
        status: "decoding",
        ttft: 1,
        totalLatency: null,
        kvBlocksAllocated: 4,
        color: "#e11d48",
        speculativeHistory: [],
      },
      {
        id: "req_assembly",
        prompt: "Write x86-64 AVX-512 assembly for vectorized SGEMM inner loop.",
        promptTokens: 50,
        prefilledTokens: 50,
        generatedTokens: ["vmovups", "zmm0,", "[rsi]"],
        maxNewTokens: 32,
        arrivalIteration: 0,
        status: "decoding",
        ttft: 1,
        totalLatency: null,
        kvBlocksAllocated: 5,
        color: "#d97706",
        speculativeHistory: [],
      },
    ],
    highlightConcepts: [
      "High Verification Penalty",
      "Overhead Threshold: S < 1.0",
      "Frequent Residual Resampling",
      "Adaptive Lookahead Scaling",
    ],
  },

  tree_speculative_branching: {
    id: "tree_speculative_branching",
    name: "Tree Speculative Decoding (SpecInfer / Medusa)",
    subtitle: "Hypothesis Branching Tree + Tree Attention Mask Verification",
    description:
      "Instead of a single linear chain of tokens, the draft model proposes a tree of top-p token branches. The target model verifies all candidate paths in one parallel forward pass using a custom 2D tree attention mask.",
    targetModel: "LLaMA-3-70B-Instruct",
    draftModel: "Multi-Head Medusa Heads (4 Top Candidates)",
    config: {
      maxBatchSize: 4,
      prefillChunkBudget: 256,
      enableChunkedPrefill: true,
      lookaheadK: 4,
      draftCostRatio: 0.08,
      defaultAcceptanceRate: 0.75,
      kvCacheCapacityBlocks: 28,
      tokensPerBlock: 16,
      speculativeMode: "tree",
      branchFactor: 2,
    },
    initialRequests: [
      {
        id: "req_tree_1",
        prompt: "Design a fault-tolerant Raft consensus state machine in Rust.",
        promptTokens: 40,
        prefilledTokens: 40,
        generatedTokens: ["pub", "struct", "RaftNode", "{", "current_term:"],
        maxNewTokens: 32,
        arrivalIteration: 0,
        status: "decoding",
        ttft: 1,
        totalLatency: null,
        kvBlocksAllocated: 4,
        color: "#8b5cf6",
        speculativeHistory: [],
      },
    ],
    highlightConcepts: [
      "Tree Causal Masking",
      "Multi-Branch Parallel Scoring",
      "Higher Expected Token Yield",
      "Medusa / SpecInfer Topology",
    ],
  },
};

// ============================================================================
// 4. MAIN INTERACTIVE VISUALIZER COMPONENT
// ============================================================================

export const ContinuousSpeculativeServingStudio: React.FC<ContinuousServingStudioProps> = ({
  initialPreset = "speculative_standard_k4",
  initialConfig,
  width = "100%",
  height = "auto",
  standalone: _standalone = true,
  title = "Continuous Speculative LLM Serving Studio",
  onStepChange,
  onPresetChange,
}) => {
  // --------------------------------------------------------------------------
  // State: Preset, Config, and Scheduler Engine
  // --------------------------------------------------------------------------
  const [selectedPresetId, setSelectedPresetId] = useState<ServingPresetId>(initialPreset);
  const currentPreset =
    CONTINUOUS_SERVING_PRESETS[selectedPresetId] ??
    CONTINUOUS_SERVING_PRESETS.speculative_standard_k4;

  const [config, setConfig] = useState<SchedulerConfig>(() => ({
    ...currentPreset.config,
    ...initialConfig,
  }));

  // Active View Tab
  const [activeTab, setActiveTab] = useState<
    | "speculative_pipeline"
    | "orca_matrix"
    | "efficiency_gantt"
    | "hardware_intensity"
    | "theory_formulas"
  >("speculative_pipeline");

  // Simulation playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeedMs, setPlaySpeedMs] = useState<number>(600);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scheduler state
  const [schedulerState, setSchedulerState] = useState<BatchSchedulerState>(() => {
    const memGrid = Array.from(
      { length: currentPreset.config.kvCacheCapacityBlocks },
      () => null as string | null,
    );
    let usedBlocks = 0;
    for (const req of currentPreset.initialRequests) {
      if (req.status !== "waiting") {
        for (let b = 0; b < req.kvBlocksAllocated && usedBlocks < memGrid.length; b++) {
          memGrid[usedBlocks++] = req.id;
        }
      }
    }

    return {
      iteration: 0,
      activeRequests: currentPreset.initialRequests.filter((r) => r.status !== "waiting"),
      waitingQueue: currentPreset.initialRequests.filter((r) => r.status === "waiting"),
      completedRequests: [],
      totalTokensGenerated: 0,
      totalDraftTokensProposed: 0,
      totalDraftTokensAccepted: 0,
      memoryBlockGrid: memGrid,
      iterationTimeline: [
        {
          iteration: 0,
          activeCount: currentPreset.initialRequests.filter((r) => r.status !== "waiting").length,
          prefillTokenBudget: 0,
          decodeTokenCount: currentPreset.initialRequests.filter((r) => r.status === "decoding")
            .length,
          acceptedSpecTokens: 0,
          kvUtilizationPercent: Math.round(
            (usedBlocks / currentPreset.config.kvCacheCapacityBlocks) * 100,
          ),
        },
      ],
    };
  });

  // Keep callback synchronized
  useEffect(() => {
    if (onStepChange) {
      onStepChange(schedulerState);
    }
  }, [schedulerState, onStepChange]);

  // Handle Preset Switching
  const handleSelectPreset = useCallback(
    (presetId: ServingPresetId) => {
      const preset = CONTINUOUS_SERVING_PRESETS[presetId];
      if (!preset) return;
      setSelectedPresetId(presetId);
      setConfig(preset.config);
      setIsPlaying(false);

      const memGrid = Array.from(
        { length: preset.config.kvCacheCapacityBlocks },
        () => null as string | null,
      );
      let usedBlocks = 0;
      for (const req of preset.initialRequests) {
        if (req.status !== "waiting") {
          for (let b = 0; b < req.kvBlocksAllocated && usedBlocks < memGrid.length; b++) {
            memGrid[usedBlocks++] = req.id;
          }
        }
      }

      const initialState: BatchSchedulerState = {
        iteration: 0,
        activeRequests: preset.initialRequests.filter((r) => r.status !== "waiting"),
        waitingQueue: preset.initialRequests.filter((r) => r.status === "waiting"),
        completedRequests: [],
        totalTokensGenerated: 0,
        totalDraftTokensProposed: 0,
        totalDraftTokensAccepted: 0,
        memoryBlockGrid: memGrid,
        iterationTimeline: [
          {
            iteration: 0,
            activeCount: preset.initialRequests.filter((r) => r.status !== "waiting").length,
            prefillTokenBudget: 0,
            decodeTokenCount: preset.initialRequests.filter((r) => r.status === "decoding").length,
            acceptedSpecTokens: 0,
            kvUtilizationPercent: Math.round(
              (usedBlocks / preset.config.kvCacheCapacityBlocks) * 100,
            ),
          },
        ],
      };

      setSchedulerState(initialState);
      if (onPresetChange) onPresetChange(presetId);
    },
    [onPresetChange],
  );

  // Single Step Forward
  const stepForward = useCallback(() => {
    setSchedulerState((prev) => scheduleOrcaIterationStep(prev, config));
  }, [config]);

  // Reset Simulation
  const resetSimulation = useCallback(() => {
    handleSelectPreset(selectedPresetId);
  }, [handleSelectPreset, selectedPresetId]);

  // Auto-play loop
  useEffect(() => {
    if (isPlaying) {
      animationTimerRef.current = setInterval(() => {
        stepForward();
      }, playSpeedMs);
    } else {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    }
    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    };
  }, [isPlaying, playSpeedMs, stepForward]);

  // Inject Dynamic Request
  const handleInjectDynamicRequest = () => {
    const newId = `req_dyn_${Math.floor(Math.random() * 900 + 100)}`;
    const colors = ["#ec4899", "#f59e0b", "#38bdf8", "#34d399", "#a855f7", "#06b6d4"];
    const promptLen = 20 + Math.floor(Math.random() * 40);
    const maxGen = 16 + Math.floor(Math.random() * 24);

    const newReq: InferenceRequest = {
      id: newId,
      prompt: `Dynamic user query #${newId.slice(-3)} requesting real-time streaming response.`,
      promptTokens: promptLen,
      prefilledTokens: 0,
      generatedTokens: [],
      maxNewTokens: maxGen,
      arrivalIteration: schedulerState.iteration,
      status: "waiting",
      ttft: null,
      totalLatency: null,
      kvBlocksAllocated: 0,
      color: colors[Math.floor(Math.random() * colors.length)] ?? "#38bdf8",
      speculativeHistory: [],
    };

    setSchedulerState((prev) => ({
      ...prev,
      waitingQueue: [...prev.waitingQueue, newReq],
    }));
  };

  // --------------------------------------------------------------------------
  // Computed Analytics
  // --------------------------------------------------------------------------
  const effectiveAlpha = useMemo(() => {
    if (schedulerState.totalDraftTokensProposed === 0) return config.defaultAcceptanceRate;
    return (
      Math.round(
        (schedulerState.totalDraftTokensAccepted / schedulerState.totalDraftTokensProposed) * 1000,
      ) / 1000
    );
  }, [
    schedulerState.totalDraftTokensProposed,
    schedulerState.totalDraftTokensAccepted,
    config.defaultAcceptanceRate,
  ]);

  const expectedAcceptedTokens = useMemo(() => {
    return computeExpectedAcceptedTokens(effectiveAlpha, config.lookaheadK);
  }, [effectiveAlpha, config.lookaheadK]);

  const theoreticalSpeedup = useMemo(() => {
    return computeSpeculativeSpeedup(
      expectedAcceptedTokens,
      config.draftCostRatio,
      config.lookaheadK,
    );
  }, [expectedAcceptedTokens, config.draftCostRatio, config.lookaheadK]);

  // Synthetic Speculative Step for Visualizer if none yet
  const displaySpeculation: SpeculativeStepResult = useMemo(() => {
    if (schedulerState.currentStepSpeculation) {
      return schedulerState.currentStepSpeculation;
    }
    const K = config.lookaheadK;
    const tokens = [
      "lossless",
      "verification",
      "reduces",
      "inference",
      "latency",
      "significantly",
    ].slice(0, K);
    const dProbs = [0.85, 0.78, 0.72, 0.65, 0.58, 0.52].slice(0, K);
    const tProbs = [0.82, 0.75, 0.35, 0.6, 0.5, 0.45].slice(0, K);
    const unifs = [0.42, 0.55, 0.88, 0.3, 0.25, 0.6].slice(0, K);
    const rej = computeRejectionSamplingAcceptance(dProbs, tProbs, unifs);
    const emitted = rej.acceptedIndices.map((i) => tokens[i]!);
    if (rej.rejectedIndex !== null) emitted.push("recovery_token");
    else emitted.push("bonus_token");

    return {
      draftTokens: tokens,
      draftProbs: dProbs,
      targetProbs: tProbs,
      uniformSamples: unifs,
      acceptedIndices: rej.acceptedIndices,
      rejectedIndex: rej.rejectedIndex,
      numAccepted: rej.numAccepted,
      totalEmittedTokens: emitted.length,
      emittedTokens: emitted,
      bonusToken: rej.numAccepted === K ? "bonus_token" : null,
      recoveryToken: rej.rejectedIndex !== null ? "recovery_token" : null,
      speedup: computeSpeculativeSpeedup(emitted.length, config.draftCostRatio, K),
    };
  }, [schedulerState.currentStepSpeculation, config.lookaheadK, config.draftCostRatio]);

  // Tree Speculation Data Structure (for Medusa / Tree mode)
  const draftTree = useMemo(() => {
    return generateSpeculativeDraftTree(
      "Speculative Serving Engine",
      config.lookaheadK,
      config.branchFactor ?? 2,
    );
  }, [config.lookaheadK, config.branchFactor]);

  const treeMask = useMemo(() => {
    return createTreeAttentionMask(draftTree);
  }, [draftTree]);

  // Static vs Continuous Batching Comparison Metrics
  const efficiencyMetrics = useMemo(() => {
    const totalToks = Math.max(1, schedulerState.totalTokensGenerated);
    const iters = Math.max(1, schedulerState.iteration);
    const activePeak = Math.max(1, config.maxBatchSize);

    return calculateContinuousBatchingEfficiency(
      {
        totalIterations: Math.ceil(iters * 1.8),
        totalTokens: totalToks,
        peakConcurrency: activePeak,
      },
      { totalIterations: iters, totalTokens: totalToks, peakConcurrency: activePeak },
    );
  }, [schedulerState.totalTokensGenerated, schedulerState.iteration, config.maxBatchSize]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div
      data-testid="continuous-speculative-serving-studio"
      className="flex flex-col w-full bg-slate-950 text-slate-100 rounded-xl border border-indigo-900/40 shadow-2xl overflow-hidden font-sans"
      style={{ width, minHeight: height }}
    >
      {/* -------------------------------------------------------------------- */}
      {/* Top Header & Presets Bar */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-slate-900/90 border-b border-indigo-900/30 px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {title}
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50 font-mono">
                  vLLM / Orca / Sarathi
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Lossless Speculative Decoding • Iteration-Level Continuous Batching • Chunked
                Prefill Tiling
              </p>
            </div>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Preset:
          </span>
          <select
            data-testid="preset-selector"
            value={selectedPresetId}
            onChange={(e) => handleSelectPreset(e.target.value as ServingPresetId)}
            className="bg-slate-800 text-slate-200 border border-indigo-700/50 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {Object.values(CONTINUOUS_SERVING_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Live Telemetry KPI Ribbon */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-3 bg-slate-900/50 border-b border-slate-800 text-xs">
        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex flex-col">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Speculative Speedup
          </span>
          <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
            {theoreticalSpeedup.toFixed(2)}x
          </span>
          <span className="text-[10px] text-slate-500">vs Autoregressive Target</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex flex-col">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Expected Yield E[N]
          </span>
          <span className="text-lg font-bold text-indigo-300 font-mono mt-0.5">
            {expectedAcceptedTokens.toFixed(2)} tok/step
          </span>
          <span className="text-[10px] text-slate-500">Lookahead K = {config.lookaheadK}</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex flex-col">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Acceptance Rate α
          </span>
          <span className="text-lg font-bold text-sky-400 font-mono mt-0.5">
            {(effectiveAlpha * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500">
            {schedulerState.totalDraftTokensAccepted}/{schedulerState.totalDraftTokensProposed}{" "}
            accepted
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex flex-col">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Activity className="w-3.5 h-3.5 text-purple-400" /> Active Concurrency
          </span>
          <span className="text-lg font-bold text-purple-300 font-mono mt-0.5">
            {schedulerState.activeRequests.length} / {config.maxBatchSize} reqs
          </span>
          <span className="text-[10px] text-slate-500">
            {schedulerState.waitingQueue.length} waiting
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex flex-col">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Layers className="w-3.5 h-3.5 text-amber-400" /> KV Cache Util
          </span>
          <span className="text-lg font-bold text-amber-300 font-mono mt-0.5">
            {schedulerState.iterationTimeline[schedulerState.iterationTimeline.length - 1]
              ?.kvUtilizationPercent ?? 0}
            %
          </span>
          <span className="text-[10px] text-slate-500">
            {config.kvCacheCapacityBlocks} total blocks
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex flex-col">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-pink-400" /> Step Iteration
          </span>
          <span className="text-lg font-bold text-pink-300 font-mono mt-0.5">
            #{schedulerState.iteration}
          </span>
          <span className="text-[10px] text-slate-500">
            {schedulerState.totalTokensGenerated} total tokens
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Interactive Control Deck */}
      {/* -------------------------------------------------------------------- */}
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            data-testid="play-pause-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow transition-colors ${
              isPlaying
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? "Pause" : "Play Serving"}
          </button>

          <button
            data-testid="step-btn"
            disabled={isPlaying}
            onClick={stepForward}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 text-xs font-medium"
          >
            <SkipForward className="w-3.5 h-3.5" /> Step Iteration
          </button>

          <button
            data-testid="reset-btn"
            onClick={resetSimulation}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            data-testid="inject-req-btn"
            onClick={handleInjectDynamicRequest}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-700/50 text-xs font-medium"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Inject Traffic
          </button>
        </div>

        {/* Sliders and Knobs */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Lookahead K:</span>
            <input
              data-testid="k-slider"
              type="range"
              min={2}
              max={8}
              step={1}
              value={config.lookaheadK}
              onChange={(e) => setConfig({ ...config, lookaheadK: parseInt(e.target.value, 10) })}
              className="w-20 accent-indigo-500 cursor-pointer"
            />
            <span className="font-mono text-indigo-400 font-bold">{config.lookaheadK}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Draft Latency γ:</span>
            <input
              data-testid="cost-ratio-slider"
              type="range"
              min={0.01}
              max={0.25}
              step={0.01}
              value={config.draftCostRatio}
              onChange={(e) => setConfig({ ...config, draftCostRatio: parseFloat(e.target.value) })}
              className="w-20 accent-sky-500 cursor-pointer"
            />
            <span className="font-mono text-sky-400">{config.draftCostRatio.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Prefill Chunk:</span>
            <input
              data-testid="chunk-slider"
              type="range"
              min={64}
              max={512}
              step={64}
              value={config.prefillChunkBudget}
              onChange={(e) =>
                setConfig({ ...config, prefillChunkBudget: parseInt(e.target.value, 10) })
              }
              className="w-20 accent-purple-500 cursor-pointer"
            />
            <span className="font-mono text-purple-300">{config.prefillChunkBudget}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Speed:</span>
            <input
              data-testid="speed-slider"
              type="range"
              min={100}
              max={1500}
              step={50}
              value={playSpeedMs}
              onChange={(e) => setPlaySpeedMs(parseInt(e.target.value, 10))}
              className="w-16 accent-slate-400 cursor-pointer"
            />
            <span className="font-mono text-slate-400">{playSpeedMs}ms</span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* View Tabs */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 text-xs font-medium gap-2">
        <button
          data-testid="tab-speculative"
          onClick={() => setActiveTab("speculative_pipeline")}
          className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === "speculative_pipeline"
              ? "border-indigo-500 text-indigo-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Speculative Verification Engine
        </button>

        <button
          data-testid="tab-orca"
          onClick={() => setActiveTab("orca_matrix")}
          className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === "orca_matrix"
              ? "border-purple-500 text-purple-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Network className="w-3.5 h-3.5" /> Continuous Batching (Orca Grid)
        </button>

        <button
          data-testid="tab-efficiency"
          onClick={() => setActiveTab("efficiency_gantt")}
          className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === "efficiency_gantt"
              ? "border-emerald-500 text-emerald-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Static vs Continuous Bubbles
        </button>

        <button
          data-testid="tab-intensity"
          onClick={() => setActiveTab("hardware_intensity")}
          className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === "hardware_intensity"
              ? "border-amber-500 text-amber-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" /> Hardware Arithmetic Intensity
        </button>

        <button
          data-testid="tab-theory"
          onClick={() => setActiveTab("theory_formulas")}
          className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === "theory_formulas"
              ? "border-sky-500 text-sky-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Info className="w-3.5 h-3.5" /> Proofs & Formulas
        </button>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Active Tab Main Stage Content */}
      {/* -------------------------------------------------------------------- */}
      <div className="p-5 flex-1 overflow-y-auto">
        {/* TAB 1: SPECULATIVE VERIFICATION ENGINE */}
        {activeTab === "speculative_pipeline" && (
          <div data-testid="speculative-view" className="space-y-6">
            {/* Top Model Info Card */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-mono text-[11px] border border-indigo-700/50">
                    Target: {currentPreset.targetModel}
                  </span>
                  <span className="text-slate-500">◀ verified with ▶</span>
                  <span className="px-2 py-0.5 rounded bg-sky-900/60 text-sky-300 font-mono text-[11px] border border-sky-700/50">
                    Draft: {currentPreset.draftModel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">{currentPreset.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setConfig({
                      ...config,
                      speculativeMode: config.speculativeMode === "linear" ? "tree" : "linear",
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-700 flex items-center gap-1.5"
                >
                  <Split className="w-3.5 h-3.5 text-indigo-400" />
                  Mode:{" "}
                  {config.speculativeMode === "linear" ? "Linear Lookahead" : "Branching Tree"}
                </button>
              </div>
            </div>

            {/* Speculative Verification Pipeline Display */}
            {config.speculativeMode === "linear" ? (
              <div className="bg-slate-900/90 border border-indigo-900/40 rounded-xl p-5 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Iteration #{schedulerState.iteration} Speculative Token Verification Pipeline
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    Emitted {displaySpeculation.totalEmittedTokens} Tokens in 1 Target Forward Pass
                  </span>
                </div>

                {/* Candidate Tokens Visual Chain */}
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {displaySpeculation.draftTokens.map((tok, idx) => {
                    const isAccepted = displaySpeculation.acceptedIndices.includes(idx);
                    const isRejected = displaySpeculation.rejectedIndex === idx;
                    const isDiscarded =
                      displaySpeculation.rejectedIndex !== null &&
                      idx > displaySpeculation.rejectedIndex;

                    const q = displaySpeculation.draftProbs[idx] ?? 0.5;
                    const p = displaySpeculation.targetProbs[idx] ?? 0.5;
                    const u = displaySpeculation.uniformSamples[idx] ?? 0.5;
                    const alpha = Math.min(1, p / q);

                    return (
                      <div
                        key={`tok_${idx}`}
                        className={`rounded-xl p-3 border flex flex-col justify-between transition-all ${
                          isAccepted
                            ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-100 shadow-emerald-950/50 shadow-md"
                            : isRejected
                              ? "bg-rose-950/40 border-rose-500/60 text-rose-100 shadow-rose-950/50 shadow-md"
                              : "bg-slate-900/40 border-slate-800 text-slate-500 opacity-60"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-mono text-slate-400">
                            Draft #{idx + 1}
                          </span>
                          {isAccepted && (
                            <span className="flex items-center text-[10px] font-bold text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" /> Accepted
                            </span>
                          )}
                          {isRejected && (
                            <span className="flex items-center text-[10px] font-bold text-rose-400">
                              <XCircle className="w-3.5 h-3.5 mr-0.5" /> Rejected
                            </span>
                          )}
                          {isDiscarded && (
                            <span className="text-[10px] text-slate-600">Skipped</span>
                          )}
                        </div>

                        <div className="my-2">
                          <span
                            className={`text-base font-bold font-mono px-2 py-1 rounded ${
                              isAccepted
                                ? "bg-emerald-900/60 text-emerald-300"
                                : isRejected
                                  ? "bg-rose-900/60 text-rose-300 line-through"
                                  : "bg-slate-800 text-slate-500"
                            }`}
                          >
                            &quot;{tok}&quot;
                          </span>
                        </div>

                        {/* Math Check */}
                        <div className="text-[10px] space-y-1 mt-2 pt-2 border-t border-slate-800/80 font-mono">
                          <div className="flex justify-between">
                            <span className="text-slate-400">q(x):</span>
                            <span>{q.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">p(x):</span>
                            <span>{p.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">α = min(1, p/q):</span>
                            <span className="font-bold text-indigo-300">{alpha.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">u ~ U(0,1):</span>
                            <span className={u <= alpha ? "text-emerald-400" : "text-rose-400"}>
                              {u.toFixed(2)} {u <= alpha ? "≤ α" : "> α"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Bonus Token or Recovery Token Card */}
                  {displaySpeculation.recoveryToken && (
                    <div className="rounded-xl p-3 border bg-sky-950/50 border-sky-500/60 text-sky-100 shadow-md flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-mono text-sky-400 font-bold">
                          Residual Recovery
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-900 text-sky-200">
                          Target Re-Sample
                        </span>
                      </div>
                      <div className="my-2">
                        <span className="text-sm font-bold font-mono px-2 py-1 rounded bg-sky-900/80 text-sky-200">
                          &quot;{displaySpeculation.recoveryToken}&quot;
                        </span>
                      </div>
                      <div className="text-[10px] text-sky-300/80 pt-2 border-t border-sky-900 font-mono">
                        Resampled from residual p&apos;(x) = max(0, p-q) / norm. Lossless invariant
                        maintained.
                      </div>
                    </div>
                  )}

                  {displaySpeculation.bonusToken && (
                    <div className="rounded-xl p-3 border bg-purple-950/50 border-purple-500/60 text-purple-100 shadow-md flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-mono text-purple-400 font-bold">
                          Target Bonus Token
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900 text-purple-200">
                          Free Token
                        </span>
                      </div>
                      <div className="my-2">
                        <span className="text-sm font-bold font-mono px-2 py-1 rounded bg-purple-900/80 text-purple-200">
                          &quot;{displaySpeculation.bonusToken}&quot;
                        </span>
                      </div>
                      <div className="text-[10px] text-purple-300/80 pt-2 border-t border-purple-900 font-mono">
                        All {config.lookaheadK} candidates accepted! Sampled from next step target
                        distribution.
                      </div>
                    </div>
                  )}
                </div>

                {/* Mathematical Proof Callout */}
                <div className="mt-4 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <strong>Exact Lossless Distribution Proof:</strong> P(emit x) = q(x)·min(1, p/q)
                    + (1 - Σ min(p,q))·p&apos;(x) ≡ p(x).
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    Zero Quality Degradation
                  </span>
                </div>
              </div>
            ) : (
              /* Tree Speculative Decoding Topology View */
              <div className="bg-slate-900/90 border border-purple-900/40 rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Split className="w-4 h-4 text-purple-400" />
                    Speculative Hypothesis Tree & 2D Tree Causal Attention Mask
                  </h3>
                  <span className="text-xs text-purple-300 font-mono">
                    Branch Factor: {config.branchFactor ?? 2} • Depth: {config.lookaheadK}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Visual Tree Structure */}
                  <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 flex flex-col justify-center">
                    <h4 className="text-xs font-semibold text-slate-400 mb-3">
                      Hypothesis Token Tree:
                    </h4>
                    <div className="flex flex-col gap-2 font-mono text-xs">
                      <div className="p-2 rounded bg-indigo-900/50 border border-indigo-500/50 text-indigo-200 w-fit">
                        [Root] &quot;{draftTree.token}&quot; (p={draftTree.targetProb})
                      </div>
                      <div className="pl-6 border-l-2 border-indigo-700/50 space-y-2">
                        {draftTree.children.map((child, cIdx) => (
                          <div key={child.id} className="space-y-1">
                            <div
                              className={`p-1.5 rounded border w-fit text-xs ${
                                child.accepted
                                  ? "bg-emerald-900/40 border-emerald-500 text-emerald-300"
                                  : "bg-rose-900/40 border-rose-500 text-rose-300 line-through"
                              }`}
                            >
                              Branch {cIdx + 1}: &quot;{child.token}&quot; (q={child.draftProb}, p=
                              {child.targetProb})
                            </div>
                            {child.children.length > 0 && (
                              <div className="pl-6 border-l-2 border-slate-700 space-y-1">
                                {child.children.map((grandChild) => (
                                  <div
                                    key={grandChild.id}
                                    className={`p-1 rounded border w-fit text-[11px] ${
                                      grandChild.accepted
                                        ? "bg-emerald-950 border-emerald-600 text-emerald-400"
                                        : "bg-rose-950 border-rose-700 text-rose-400 line-through"
                                    }`}
                                  >
                                    ↳ &quot;{grandChild.token}&quot; (p={grandChild.targetProb})
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: 2D Tree Attention Mask Matrix */}
                  <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-400 mb-2">
                      2D Tree Attention Mask Matrix M ∈ ℝ^(N×N):
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Token j attends to token i iff i is an ancestor of j in the hypothesis tree.
                    </p>
                    <div className="inline-block border border-slate-700 rounded-lg p-2 bg-slate-900">
                      <div
                        className="grid gap-1"
                        style={{
                          gridTemplateColumns: `repeat(${treeMask.length}, minmax(0, 1fr))`,
                        }}
                      >
                        {treeMask.map((row, r) =>
                          row.map((val, c) => (
                            <div
                              key={`mask_${r}_${c}`}
                              className={`w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] font-bold ${
                                val === 1
                                  ? "bg-purple-600/80 text-white"
                                  : "bg-slate-800 text-slate-600"
                              }`}
                              title={`Token ${r} -> Token ${c}: ${val === 1 ? "Attend (1)" : "Masked (0)"}`}
                            >
                              {val}
                            </div>
                          )),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONTINUOUS BATCHING ORCA GRID */}
        {activeTab === "orca_matrix" && (
          <div data-testid="orca-view" className="space-y-6">
            {/* Iteration-Level Active Request Grid */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Orca Iteration-Level Request Pool (Active Concurrency:{" "}
                    {schedulerState.activeRequests.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Finished requests instantly deallocate memory; new requests admitted mid-flight.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-indigo-300 font-mono">
                  Iteration #{schedulerState.iteration}
                </span>
              </div>

              <div className="space-y-3">
                {schedulerState.activeRequests.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                    No active requests. Click &quot;Inject Traffic&quot; to admit queries!
                  </div>
                ) : (
                  schedulerState.activeRequests.map((req) => {
                    const totalReqTokens = req.promptTokens + req.maxNewTokens;
                    const currentDone =
                      req.status === "prefilling"
                        ? req.prefilledTokens
                        : req.promptTokens + req.generatedTokens.length;
                    const percent = Math.min(100, Math.round((currentDone / totalReqTokens) * 100));

                    return (
                      <div
                        key={req.id}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: req.color }}
                            />
                            <span className="font-mono text-xs font-bold text-slate-200">
                              {req.id}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                                req.status === "prefilling"
                                  ? "bg-amber-950 text-amber-300 border border-amber-800"
                                  : "bg-indigo-950 text-indigo-300 border border-indigo-800"
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-mono">
                            <span className="text-slate-400">
                              Prefill: {req.prefilledTokens}/{req.promptTokens} tok
                            </span>
                            <span className="text-slate-400">
                              Decode: {req.generatedTokens.length}/{req.maxNewTokens} tok
                            </span>
                            <span className="text-cyan-400 font-semibold">{percent}%</span>
                            <span className="text-amber-400">Blocks: {req.kvBlocksAllocated}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                          <div
                            className="bg-amber-500 h-full transition-all duration-300"
                            style={{
                              width: `${(Math.min(req.prefilledTokens, req.promptTokens) / totalReqTokens) * 100}%`,
                            }}
                            title="Prefill Progress"
                          />
                          <div
                            className="bg-indigo-500 h-full transition-all duration-300"
                            style={{
                              width: `${(req.generatedTokens.length / totalReqTokens) * 100}%`,
                            }}
                            title="Decode Generation Progress"
                          />
                        </div>

                        {/* Generated Token Text Preview */}
                        <div className="text-xs font-mono text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800/60 flex items-center justify-between">
                          <span className="truncate max-w-xl">
                            <strong className="text-slate-400">Tokens:</strong>{" "}
                            {req.generatedTokens.length > 0
                              ? req.generatedTokens.slice(-6).join(" ")
                              : "<awaiting first decode token>"}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            TTFT: {req.ttft !== null ? `${req.ttft} iters` : "pending"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Waiting Queue & Memory Blocks Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Waiting Queue */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center justify-between">
                  <span>Waiting Arrival Queue ({schedulerState.waitingQueue.length})</span>
                  <span className="text-[10px] text-slate-500">FIFO Admission</span>
                </h4>
                {schedulerState.waitingQueue.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Queue empty.</p>
                ) : (
                  <div className="space-y-2">
                    {schedulerState.waitingQueue.map((req, idx) => (
                      <div
                        key={req.id}
                        className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono">#{idx + 1}</span>
                          <span className="font-mono text-slate-300 font-semibold">{req.id}</span>
                          <span className="text-slate-400 text-[11px] truncate max-w-[180px]">
                            {req.prompt}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                          {req.promptTokens} prompt tok
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Physical KV Cache Block Table Grid */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                  <span>
                    Physical KV Cache Block Memory Map ({config.kvCacheCapacityBlocks} Blocks)
                  </span>
                  <span className="text-[10px] text-amber-400">
                    {config.tokensPerBlock} tokens/block
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  Dynamic memory blocks allocated on demand; freed immediately when requests exit.
                </p>
                <div className="grid grid-cols-8 sm:grid-cols-8 gap-1.5">
                  {schedulerState.memoryBlockGrid.map((slot, bIdx) => {
                    const isAllocated = slot !== null;
                    return (
                      <div
                        key={`block_${bIdx}`}
                        className={`h-8 rounded flex flex-col items-center justify-center border font-mono text-[9px] transition-all ${
                          isAllocated
                            ? "bg-indigo-600/30 border-indigo-500/80 text-indigo-200"
                            : "bg-slate-950 border-slate-800 text-slate-600"
                        }`}
                        title={
                          isAllocated
                            ? `Block #${bIdx}: Allocated to ${slot}`
                            : `Block #${bIdx}: Free`
                        }
                      >
                        <span>B{bIdx}</span>
                        {isAllocated && (
                          <span className="text-[8px] truncate max-w-[32px]">
                            {slot?.slice(0, 4)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STATIC VS CONTINUOUS BATCHING GANTT EFFICIENCY */}
        {activeTab === "efficiency_gantt" && (
          <div data-testid="efficiency-view" className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    Static vs Continuous Batching Idle Bubble Comparison
                  </h3>
                  <p className="text-xs text-slate-400">
                    Orca continuous batching eliminates idle GPU bubble cycles caused by sequence
                    length variance.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Bubble Reduction</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {efficiencyMetrics.bubbleReductionPercent}% less idle waste
                    </span>
                  </div>
                </div>
              </div>

              {/* Comparative Gantt Graphic */}
              <div className="space-y-4 pt-2">
                {/* Static Batching Gantt */}
                <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/30 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-rose-400">
                      Static Batching (Batch Level Barrier)
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Throughput: {efficiencyMetrics.staticThroughput} tok/iter
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="w-16 text-slate-400">Seq 1 (Short):</span>
                      <div className="flex-1 bg-slate-800 h-5 rounded overflow-hidden flex">
                        <div className="bg-indigo-600 h-full w-[25%] flex items-center justify-center text-[10px] text-white">
                          Work
                        </div>
                        <div className="bg-rose-950/60 h-full w-[75%] flex items-center justify-center text-[10px] text-rose-400 border-l border-rose-800/40">
                          Idle Bubble Stalling (75%)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="w-16 text-slate-400">Seq 2 (Med):</span>
                      <div className="flex-1 bg-slate-800 h-5 rounded overflow-hidden flex">
                        <div className="bg-indigo-600 h-full w-[55%] flex items-center justify-center text-[10px] text-white">
                          Work
                        </div>
                        <div className="bg-rose-950/60 h-full w-[45%] flex items-center justify-center text-[10px] text-rose-400 border-l border-rose-800/40">
                          Idle Bubble Stalling (45%)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="w-16 text-slate-400">Seq 3 (Long):</span>
                      <div className="flex-1 bg-slate-800 h-5 rounded overflow-hidden flex">
                        <div className="bg-indigo-600 h-full w-[100%] flex items-center justify-center text-[10px] text-white">
                          Continuous Active Execution (100%)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Continuous Batching Gantt */}
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/30 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-emerald-400">
                      Continuous Batching (Iteration-Level Orca)
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Throughput: {efficiencyMetrics.continuousThroughput} tok/iter (
                      {efficiencyMetrics.speedup}x speedup)
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="w-16 text-slate-400">Slot 1:</span>
                      <div className="flex-1 bg-slate-800 h-5 rounded overflow-hidden flex">
                        <div className="bg-indigo-600 h-full w-[25%] flex items-center justify-center text-[9px] text-white">
                          Seq 1
                        </div>
                        <div className="bg-sky-600 h-full w-[35%] flex items-center justify-center text-[9px] text-white border-l border-slate-900">
                          Seq 4 (New)
                        </div>
                        <div className="bg-purple-600 h-full w-[40%] flex items-center justify-center text-[9px] text-white border-l border-slate-900">
                          Seq 6 (New)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="w-16 text-slate-400">Slot 2:</span>
                      <div className="flex-1 bg-slate-800 h-5 rounded overflow-hidden flex">
                        <div className="bg-indigo-600 h-full w-[55%] flex items-center justify-center text-[9px] text-white">
                          Seq 2
                        </div>
                        <div className="bg-emerald-600 h-full w-[45%] flex items-center justify-center text-[9px] text-white border-l border-slate-900">
                          Seq 5 (New)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="w-16 text-slate-400">Slot 3:</span>
                      <div className="flex-1 bg-slate-800 h-5 rounded overflow-hidden flex">
                        <div className="bg-indigo-600 h-full w-[100%] flex items-center justify-center text-[9px] text-white">
                          Seq 3 (Long)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HARDWARE ARITHMETIC INTENSITY */}
        {activeTab === "hardware_intensity" && (
          <div data-testid="hardware-view" className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                Memory Bandwidth vs Compute Bound Roofline Transition
              </h3>
              <p className="text-xs text-slate-400">
                Autoregressive decoding has Arithmetic Intensity I ≈ 1 FLOP/byte (severely Memory
                Bandwidth Bound). Speculative verification batch-verifies K tokens simultaneously,
                raising Arithmetic Intensity to K FLOP/byte.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-slate-300 block mb-1">
                    AR Baseline (K=1)
                  </span>
                  <div className="text-2xl font-bold font-mono text-rose-400">1.0 FLOP/byte</div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    GPU Tensor Cores sit 90%+ idle waiting for weights to stream from HBM memory.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-slate-300 block mb-1">
                    Speculative Verification (K={config.lookaheadK})
                  </span>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {(config.lookaheadK * 0.95).toFixed(1)} FLOP/byte
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Reuses loaded weight matrix across $K$ draft tokens in parallel matrix
                    multiplication (GEMM).
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-slate-300 block mb-1">
                    Memory Traffic Reduction
                  </span>
                  <div className="text-2xl font-bold font-mono text-indigo-400">
                    {(100 - 100 / expectedAcceptedTokens).toFixed(0)}% Saved
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Equivalent token generation with significantly fewer weight read cycles from
                    VRAM.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: THEORY & FORMULAS */}
        {activeTab === "theory_formulas" && (
          <div data-testid="theory-view" className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-6">
              <div>
                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2">
                  1. Stochastic Rejection Sampling & Exact Lossless Invariance
                </h3>
                <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 space-y-2 border border-slate-800">
                  <div>Acceptance Condition: α(x) = min(1, p(x) / q(x))</div>
                  <div>
                    Residual Distribution: p&apos;(x) = max(0, p(x) - q(x)) / (1 - Σ min(p(y),
                    q(y)))
                  </div>
                  <div className="text-emerald-400">
                    Proof: P(emit x) = q(x)·min(1, p(x)/q(x)) + (1 - Σ min(p(y),q(y)))·p&apos;(x) ≡
                    p(x)
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-2">
                  2. Expected Token Count E[N] and Speedup Equation S
                </h3>
                <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 space-y-2 border border-slate-800">
                  <div>Expected Emitted Tokens: E[N] = 1 + Σ_i=1^K (Π_j=1^i α_j)</div>
                  <div>
                    Wall-Clock Speedup: S = E[N] / (1 + K · γ), where γ = c_draft / c_target
                  </div>
                  <div className="text-indigo-300">
                    Breakeven Threshold: Speculation yields speedup S &gt; 1.0 iff E[N] &gt; 1 + K·γ
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">
                  3. Orca Continuous Batching & Sarathi Chunked Prefill
                </h3>
                <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 space-y-2 border border-slate-800">
                  <div>
                    Iteration Step: Sched(t) = {`{req_i ∈ Active | state_i(t) ∈ {Prefill, Decode}}`}
                  </div>
                  <div>Chunked Prefill Budget: B_prefill = min(remaining_prompt, chunk_size)</div>
                  <div className="text-sky-300">
                    ITL Guarantee: Prevents long-context prefill compute spikes from starving active
                    decode streams.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
