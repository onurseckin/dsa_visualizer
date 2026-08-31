import { describe, expect, it } from "bun:test";
import React from "react";
import {
  ContinuousSpeculativeServingStudio,
  CONTINUOUS_SERVING_PRESETS,
  computeRejectionSamplingAcceptance,
  computeResidualDistribution,
  sampleResidualToken,
  computeExpectedAcceptedTokens,
  computeSpeculativeSpeedup,
  generateSpeculativeDraftTree,
  createTreeAttentionMask,
  splitPrefillIntoChunks,
  calculateContinuousBatchingEfficiency,
  scheduleOrcaIterationStep,
  type ServingPresetId,
  type InferenceRequest,
  type BatchSchedulerState,
  type SchedulerConfig,
  type SpeculativeDraftNode,
} from "../../components/primitives/ContinuousSpeculativeServingStudio";

describe("ContinuousSpeculativeServingStudio & LLM Serving Engine Tests", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS CONFIGURATION
  // ==========================================================================
  describe("1. Component Instantiation & Props", () => {
    it("should instantiate ContinuousSpeculativeServingStudio with default props", () => {
      const element = React.createElement(ContinuousSpeculativeServingStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(ContinuousSpeculativeServingStudio);
    });

    it("should instantiate with custom preset, config overrides, and callbacks", () => {
      const onStepChangeMock = () => {};
      const onPresetChangeMock = () => {};

      const element = React.createElement(ContinuousSpeculativeServingStudio, {
        initialPreset: "chunked_prefill_sarathi",
        initialConfig: {
          lookaheadK: 5,
          draftCostRatio: 0.08,
          prefillChunkBudget: 64,
        },
        width: 1200,
        height: 700,
        standalone: true,
        title: "Custom LLM Speculative Serving Lab",
        onStepChange: onStepChangeMock,
        onPresetChange: onPresetChangeMock,
      });

      expect(element.props.initialPreset).toBe("chunked_prefill_sarathi");
      expect(element.props.initialConfig?.lookaheadK).toBe(5);
      expect(element.props.initialConfig?.draftCostRatio).toBe(0.08);
      expect(element.props.initialConfig?.prefillChunkBudget).toBe(64);
      expect(element.props.width).toBe(1200);
      expect(element.props.height).toBe(700);
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Custom LLM Speculative Serving Lab");
    });
  });

  // ==========================================================================
  // 2. PRESET INTEGRITY & VALIDATION
  // ==========================================================================
  describe("2. Preset Configurations Integrity", () => {
    const presetIds: ServingPresetId[] = [
      "speculative_standard_k4",
      "orca_continuous_batching",
      "chunked_prefill_sarathi",
      "adversarial_low_acceptance",
      "tree_speculative_branching",
    ];

    it("should contain all 5 production presets", () => {
      for (const id of presetIds) {
        const preset = CONTINUOUS_SERVING_PRESETS[id];
        expect(preset).toBeDefined();
        expect(preset.id).toBe(id);
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.subtitle.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(0);
        expect(preset.targetModel.length).toBeGreaterThan(0);
        expect(preset.draftModel.length).toBeGreaterThan(0);
        expect(preset.highlightConcepts.length).toBeGreaterThanOrEqual(3);
      }
    });

    it("every preset should have valid scheduler config parameters", () => {
      for (const id of presetIds) {
        const { config, initialRequests } = CONTINUOUS_SERVING_PRESETS[id];
        expect(config.maxBatchSize).toBeGreaterThanOrEqual(2);
        expect(config.prefillChunkBudget).toBeGreaterThanOrEqual(64);
        expect(config.lookaheadK).toBeGreaterThanOrEqual(2);
        expect(config.lookaheadK).toBeLessThanOrEqual(8);
        expect(config.draftCostRatio).toBeGreaterThan(0);
        expect(config.draftCostRatio).toBeLessThan(0.5);
        expect(config.defaultAcceptanceRate).toBeGreaterThan(0);
        expect(config.defaultAcceptanceRate).toBeLessThanOrEqual(1.0);
        expect(config.kvCacheCapacityBlocks).toBeGreaterThanOrEqual(16);
        expect(config.tokensPerBlock).toBeGreaterThanOrEqual(8);
        expect(initialRequests.length).toBeGreaterThanOrEqual(1);

        for (const req of initialRequests) {
          expect(req.id).toBeDefined();
          expect(req.prompt.length).toBeGreaterThan(0);
          expect(req.promptTokens).toBeGreaterThan(0);
          expect(req.maxNewTokens).toBeGreaterThan(0);
          expect(["waiting", "prefilling", "decoding", "completed"]).toContain(req.status);
        }
      }
    });
  });

  // ==========================================================================
  // 3. EXACT REJECTION SAMPLING & LOSSLESS PROBABILITY MATH
  // ==========================================================================
  describe("3. Stochastic Rejection Sampling & Lossless Residual Math", () => {
    it("should compute exact acceptance for all matching tokens (100% acceptance)", () => {
      const draftProbs = [0.8, 0.7, 0.6, 0.5];
      const targetProbs = [0.9, 0.8, 0.7, 0.6]; // Target >= Draft => alpha = 1.0 for all
      const uniformSamples = [0.1, 0.2, 0.3, 0.4];

      const result = computeRejectionSamplingAcceptance(draftProbs, targetProbs, uniformSamples);

      expect(result.numAccepted).toBe(4);
      expect(result.acceptedIndices).toEqual([0, 1, 2, 3]);
      expect(result.rejectedIndex).toBeNull();
      expect(result.totalEmitted).toBe(5); // 4 accepted + 1 bonus token
    });

    it("should reject at first mismatch and truncate speculation chain", () => {
      const draftProbs = [0.8, 0.8, 0.8, 0.8];
      const targetProbs = [0.8, 0.4, 0.8, 0.8]; // At idx 1: p/q = 0.5
      const uniformSamples = [0.2, 0.9, 0.1, 0.1]; // At idx 1: u = 0.9 > 0.5 -> reject

      const result = computeRejectionSamplingAcceptance(draftProbs, targetProbs, uniformSamples);

      expect(result.numAccepted).toBe(1);
      expect(result.acceptedIndices).toEqual([0]);
      expect(result.rejectedIndex).toBe(1);
      expect(result.totalEmitted).toBe(2); // 1 accepted + 1 recovery token
    });

    it("should handle 0% acceptance on the very first token", () => {
      const draftProbs = [0.9, 0.8];
      const targetProbs = [0.1, 0.8];
      const uniformSamples = [0.95, 0.1]; // At idx 0: u=0.95 > p/q=0.111 -> reject immediately

      const result = computeRejectionSamplingAcceptance(draftProbs, targetProbs, uniformSamples);

      expect(result.numAccepted).toBe(0);
      expect(result.acceptedIndices).toEqual([]);
      expect(result.rejectedIndex).toBe(0);
      expect(result.totalEmitted).toBe(1); // 0 accepted + 1 recovery token
    });

    it("should compute exact normalized residual distribution for array inputs", () => {
      // draft q = [0.4, 0.3, 0.3]
      // target p = [0.1, 0.6, 0.3]
      // max(0, p - q) = [0.0, 0.3, 0.0]
      // normalized residual = [0.0, 1.0, 0.0]
      const q = [0.4, 0.3, 0.3];
      const p = [0.1, 0.6, 0.3];

      const residual = computeResidualDistribution(q, p) as number[];
      expect(residual.length).toBe(3);
      expect(residual[0]).toBeCloseTo(0.0, 5);
      expect(residual[1]).toBeCloseTo(1.0, 5);
      expect(residual[2]).toBeCloseTo(0.0, 5);

      const sum = residual.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it("should compute exact normalized residual distribution for dictionary distributions", () => {
      const draftMap = { hello: 0.5, world: 0.3, foo: 0.2 };
      const targetMap = { hello: 0.2, world: 0.6, bar: 0.2 };

      // diffs:
      // "hello": max(0, 0.2 - 0.5) = 0
      // "world": max(0, 0.6 - 0.3) = 0.3
      // "foo": max(0, 0.0 - 0.2) = 0
      // "bar": max(0, 0.2 - 0.0) = 0.2
      // sum = 0.5
      // normalized: "world" -> 0.3/0.5 = 0.6, "bar" -> 0.2/0.5 = 0.4, others -> 0.0
      const residual = computeResidualDistribution(draftMap, targetMap) as Record<string, number>;

      expect(residual["world"]).toBeCloseTo(0.6, 5);
      expect(residual["bar"]).toBeCloseTo(0.4, 5);
      expect(residual["hello"]).toBeCloseTo(0.0, 5);
      expect(residual["foo"]).toBeCloseTo(0.0, 5);

      const totalSum = Object.values(residual).reduce((a, b) => a + b, 0);
      expect(totalSum).toBeCloseTo(1.0, 5);
    });

    it("should verify mathematical lossless distribution preservation identity", () => {
      // Identity: P(emit x) = min(q(x), p(x)) + (1 - sum_y min(q(y), p(y))) * p'(x) === p(x)
      const q: Record<string, number> = { A: 0.5, B: 0.3, C: 0.2 };
      const p: Record<string, number> = { A: 0.2, B: 0.5, C: 0.3 };

      const minSum = Math.min(q.A, p.A) + Math.min(q.B, p.B) + Math.min(q.C, p.C); // 0.2 + 0.3 + 0.2 = 0.7
      const rejectProb = 1 - minSum; // 0.3

      const residual = computeResidualDistribution(q, p) as Record<string, number>;

      for (const token of ["A", "B", "C"]) {
        const acceptDirect = Math.min(q[token] ?? 0, p[token] ?? 0);
        const resampleContrib = rejectProb * (residual[token] ?? 0);
        const effectiveEmitProb = acceptDirect + resampleContrib;

        expect(effectiveEmitProb).toBeCloseTo(p[token] ?? 0, 5);
      }
    });

    it("should deterministically sample residual recovery token with seed", () => {
      const draftMap = { A: 0.6, B: 0.4 };
      const targetMap = { A: 0.1, B: 0.9 }; // B has positive residual

      const sample1 = sampleResidualToken(draftMap, targetMap, 0.2);
      const sample2 = sampleResidualToken(draftMap, targetMap, 0.2);

      expect(sample1.token).toBe("B");
      expect(sample2.token).toBe("B");
      expect(sample1.probability).toBeCloseTo(1.0, 4);
    });
  });

  // ==========================================================================
  // 4. EXPECTED TOKENS E[N] & SPECULATIVE SPEEDUP S
  // ==========================================================================
  describe("4. Expected Tokens & Speculative Speedup Analytics", () => {
    it("should compute expected accepted tokens for uniform acceptance alpha", () => {
      // E[N] = 1 + sum_{i=1}^K alpha^i
      // K=4, alpha=0.8:
      // E[N] = 1 + 0.8 + 0.64 + 0.512 + 0.4096 = 3.3616
      const expected = computeExpectedAcceptedTokens(0.8, 4);
      expect(expected).toBeCloseTo(3.3616, 4);
    });

    it("should evaluate theoretical speedup ratio S = E[N] / (1 + K * gamma)", () => {
      // K=4, E[N]=3.3616, gamma=0.05
      // Denominator = 1 + 4 * 0.05 = 1.2
      // S = 3.3616 / 1.2 = 2.8013x
      const expected = computeExpectedAcceptedTokens(0.8, 4);
      const speedup = computeSpeculativeSpeedup(expected, 0.05, 4);
      expect(speedup).toBeCloseTo(2.8013, 3);
    });

    it("should verify 100% acceptance regime (alpha=1.0) emits 1 + K tokens", () => {
      const expected = computeExpectedAcceptedTokens(1.0, 4);
      expect(expected).toBe(5.0);

      const speedup = computeSpeculativeSpeedup(expected, 0.05, 4);
      expect(speedup).toBeCloseTo(5.0 / 1.2, 4);
    });

    it("should verify 0% acceptance regime (alpha=0.0) emits exactly 1.0 token", () => {
      const expected = computeExpectedAcceptedTokens(0.0, 4);
      expect(expected).toBe(1.0);

      const speedup = computeSpeculativeSpeedup(expected, 0.05, 4);
      expect(speedup).toBeLessThan(1.0); // S = 1.0 / 1.2 = 0.833x (overhead penalty)
    });

    it("should support heterogeneous per-step acceptance rate arrays", () => {
      // alpha = [0.9, 0.8, 0.5]
      // E[N] = 1 + 0.9 + (0.9 * 0.8) + (0.9 * 0.8 * 0.5) = 1 + 0.9 + 0.72 + 0.36 = 2.98
      const expected = computeExpectedAcceptedTokens([0.9, 0.8, 0.5], 3);
      expect(expected).toBeCloseTo(2.98, 4);
    });
  });

  // ==========================================================================
  // 5. TREE ATTENTION MASK & TOPOLOGY GENERATION
  // ==========================================================================
  describe("5. Tree Attention Mask Generation & Speculative Topology", () => {
    it("should generate a valid speculative draft tree", () => {
      const tree = generateSpeculativeDraftTree("Attention Mechanism", 3, 2);
      expect(tree).toBeDefined();
      expect(tree.id).toBeDefined();
      expect(tree.token).toBeDefined();
      expect(tree.depth).toBe(0);
      expect(tree.parentId).toBeNull();
      expect(Array.isArray(tree.children)).toBe(true);
    });

    it("should generate exact 2D causal tree attention mask for parent map", () => {
      // Tree topology:
      // Node 0 (Root)
      // Node 1 (Child of 0)
      // Node 2 (Child of 0)
      // Node 3 (Child of 1)
      const parentMap = [-1, 0, 0, 1];
      const mask = createTreeAttentionMask({ numNodes: 4, parentMap });

      expect(mask.length).toBe(4);
      expect(mask[0]).toEqual([1, 0, 0, 0]); // Root only attends to itself
      expect(mask[1]).toEqual([1, 1, 0, 0]); // Node 1 attends to Root and itself
      expect(mask[2]).toEqual([1, 0, 1, 0]); // Node 2 attends to Root and itself (NOT Node 1)
      expect(mask[3]).toEqual([1, 1, 0, 1]); // Node 3 attends to Root, Node 1, and itself (NOT Node 2)
    });

    it("should generate tree attention mask from SpeculativeDraftNode hierarchy", () => {
      const mockTree: SpeculativeDraftNode = {
        id: "root",
        token: "start",
        depth: 0,
        parentId: null,
        draftProb: 0.9,
        targetProb: 0.9,
        accepted: true,
        uniformSample: 0.1,
        children: [
          {
            id: "child_1",
            token: "branch1",
            depth: 1,
            parentId: "root",
            draftProb: 0.8,
            targetProb: 0.8,
            accepted: true,
            uniformSample: 0.2,
            children: [],
          },
          {
            id: "child_2",
            token: "branch2",
            depth: 1,
            parentId: "root",
            draftProb: 0.7,
            targetProb: 0.7,
            accepted: true,
            uniformSample: 0.3,
            children: [],
          },
        ],
      };

      const mask = createTreeAttentionMask(mockTree);
      expect(mask.length).toBe(3);
      expect(mask[0]).toEqual([1, 0, 0]); // root
      expect(mask[1]).toEqual([1, 1, 0]); // child_1 attends to root and child_1
      expect(mask[2]).toEqual([1, 0, 1]); // child_2 attends to root and child_2 (NOT child_1)
    });
  });

  // ==========================================================================
  // 6. CHUNKED PREFILL ARITHMETIC (SARATHI)
  // ==========================================================================
  describe("6. Chunked Prefill Tiling Arithmetic", () => {
    it("should split long prompt into exact chunks of specified budget", () => {
      const promptLength = 350;
      const chunkSize = 128;

      const chunks = splitPrefillIntoChunks(promptLength, chunkSize);

      expect(chunks).toEqual([128, 128, 94]);
      const total = chunks.reduce((a, b) => a + b, 0);
      expect(total).toBe(promptLength);
    });

    it("should return single chunk when prompt length <= chunkSize", () => {
      const chunks = splitPrefillIntoChunks(80, 128);
      expect(chunks).toEqual([80]);
    });

    it("should return empty array for 0 prompt length", () => {
      const chunks = splitPrefillIntoChunks(0, 128);
      expect(chunks).toEqual([]);
    });

    it("should split evenly when prompt length is a multiple of chunkSize", () => {
      const chunks = splitPrefillIntoChunks(256, 128);
      expect(chunks).toEqual([128, 128]);
    });
  });

  // ==========================================================================
  // 7. ORCA ITERATION-LEVEL CONTINUOUS BATCHING SCHEDULER
  // ==========================================================================
  describe("7. Orca Continuous Batching State Transitions", () => {
    const baseConfig: SchedulerConfig = {
      maxBatchSize: 4,
      prefillChunkBudget: 128,
      enableChunkedPrefill: true,
      lookaheadK: 3,
      draftCostRatio: 0.05,
      defaultAcceptanceRate: 0.8,
      kvCacheCapacityBlocks: 20,
      tokensPerBlock: 16,
      speculativeMode: "linear",
    };

    const initialRequests: InferenceRequest[] = [
      {
        id: "req_1",
        prompt: "Prompt 1",
        promptTokens: 32,
        prefilledTokens: 32,
        generatedTokens: ["Tok1", "Tok2"],
        maxNewTokens: 4,
        arrivalIteration: 0,
        status: "decoding",
        ttft: 1,
        totalLatency: null,
        kvBlocksAllocated: 3,
        color: "#38bdf8",
        speculativeHistory: [],
      },
      {
        id: "req_2",
        prompt: "Prompt 2 with long context",
        promptTokens: 200,
        prefilledTokens: 0,
        generatedTokens: [],
        maxNewTokens: 10,
        arrivalIteration: 0,
        status: "waiting",
        ttft: null,
        totalLatency: null,
        kvBlocksAllocated: 0,
        color: "#a855f7",
        speculativeHistory: [],
      },
    ];

    it("should step from iteration 0 to 1 and admit waiting request", () => {
      const memGrid = Array.from({ length: 20 }, () => null as string | null);
      memGrid[0] = "req_1";
      memGrid[1] = "req_1";
      memGrid[2] = "req_1";

      const state: BatchSchedulerState = {
        iteration: 0,
        activeRequests: [initialRequests[0]!],
        waitingQueue: [initialRequests[1]!],
        completedRequests: [],
        totalTokensGenerated: 2,
        totalDraftTokensProposed: 0,
        totalDraftTokensAccepted: 0,
        memoryBlockGrid: memGrid,
        iterationTimeline: [],
      };

      const nextState = scheduleOrcaIterationStep(state, baseConfig);

      expect(nextState.iteration).toBe(1);
      // req_2 should be admitted from waiting to active (prefilling)
      expect(nextState.waitingQueue.length).toBe(0);
      expect(nextState.activeRequests.length).toBe(2);

      const activePrefill = nextState.activeRequests.find((r) => r.id === "req_2");
      expect(activePrefill).toBeDefined();
      expect(activePrefill?.prefilledTokens).toBe(128); // 1st chunk of 128
      expect(activePrefill?.status).toBe("prefilling");
    });

    it("should complete request reaching maxNewTokens and free its memory blocks", () => {
      const finishedReq: InferenceRequest = {
        id: "req_done",
        prompt: "Short prompt",
        promptTokens: 16,
        prefilledTokens: 16,
        generatedTokens: ["t1", "t2", "t3", "t4"],
        maxNewTokens: 4, // Max reached
        arrivalIteration: 0,
        status: "decoding",
        ttft: 1,
        totalLatency: null,
        kvBlocksAllocated: 2,
        color: "#38bdf8",
        speculativeHistory: [],
      };

      const memGrid = Array.from({ length: 20 }, () => null as string | null);
      memGrid[0] = "req_done";
      memGrid[1] = "req_done";

      const state: BatchSchedulerState = {
        iteration: 3,
        activeRequests: [finishedReq],
        waitingQueue: [],
        completedRequests: [],
        totalTokensGenerated: 4,
        totalDraftTokensProposed: 6,
        totalDraftTokensAccepted: 4,
        memoryBlockGrid: memGrid,
        iterationTimeline: [],
      };

      const nextState = scheduleOrcaIterationStep(state, baseConfig);

      expect(nextState.completedRequests.length).toBe(1);
      expect(nextState.completedRequests[0]?.id).toBe("req_done");
      expect(nextState.completedRequests[0]?.status).toBe("completed");
      expect(nextState.completedRequests[0]?.totalLatency).toBe(4); // 4 - 0 = 4 iters
      expect(nextState.activeRequests.length).toBe(0);

      // Memory blocks should be deallocated (null)
      expect(nextState.memoryBlockGrid[0]).toBeNull();
      expect(nextState.memoryBlockGrid[1]).toBeNull();
    });

    it("should transition chunked prefilling request to decoding on final chunk", () => {
      const nearFinishedPrefill: InferenceRequest = {
        id: "req_prefill_done",
        prompt: "200 tok prompt",
        promptTokens: 200,
        prefilledTokens: 128, // 72 tokens left
        generatedTokens: [],
        maxNewTokens: 10,
        arrivalIteration: 0,
        status: "prefilling",
        ttft: null,
        totalLatency: null,
        kvBlocksAllocated: 9,
        color: "#10b981",
        speculativeHistory: [],
      };

      const state: BatchSchedulerState = {
        iteration: 1,
        activeRequests: [nearFinishedPrefill],
        waitingQueue: [],
        completedRequests: [],
        totalTokensGenerated: 0,
        totalDraftTokensProposed: 0,
        totalDraftTokensAccepted: 0,
        memoryBlockGrid: Array.from({ length: 20 }, () => "req_prefill_done" as string | null),
        iterationTimeline: [],
      };

      const nextState = scheduleOrcaIterationStep(state, baseConfig);

      const activeReq = nextState.activeRequests.find((r) => r.id === "req_prefill_done");
      expect(activeReq?.status).toBe("decoding");
      expect(activeReq?.prefilledTokens).toBe(200);
      expect(activeReq?.ttft).toBe(2); // First decode token at iteration 2
    });
  });

  // ==========================================================================
  // 8. STATIC VS CONTINUOUS BATCHING COMPARATIVE EFFICIENCY
  // ==========================================================================
  describe("8. Static vs Continuous Batching Efficiency Analytics", () => {
    it("should calculate speedup and bubble reduction percentage", () => {
      const staticStats = { totalIterations: 100, totalTokens: 200, peakConcurrency: 4 };
      const contStats = { totalIterations: 50, totalTokens: 200, peakConcurrency: 4 };

      const result = calculateContinuousBatchingEfficiency(staticStats, contStats);

      expect(result.staticThroughput).toBe(2.0); // 200 / 100
      expect(result.continuousThroughput).toBe(4.0); // 200 / 50
      expect(result.speedup).toBe(2.0);
      expect(result.bubbleReductionPercent).toBeGreaterThan(0);
    });

    it("should handle edge case with zero iterations gracefully", () => {
      const staticStats = { totalIterations: 0, totalTokens: 0, peakConcurrency: 0 };
      const contStats = { totalIterations: 0, totalTokens: 0, peakConcurrency: 0 };

      const result = calculateContinuousBatchingEfficiency(staticStats, contStats);
      expect(result.staticThroughput).toBe(0);
      expect(result.continuousThroughput).toBe(0);
      expect(result.speedup).toBe(1.0);
    });
  });

  // ==========================================================================
  // 9. DETERMINISTIC BOUNDARY & EDGE CASES
  // ==========================================================================
  describe("9. Deterministic Boundary & Edge Cases", () => {
    it("should handle K=1 boundary condition", () => {
      const expected = computeExpectedAcceptedTokens(0.8, 1);
      expect(expected).toBeCloseTo(1.8, 4);

      const speedup = computeSpeculativeSpeedup(expected, 0.05, 1);
      expect(speedup).toBeCloseTo(1.8 / 1.05, 4);
    });

    it("should handle K=8 lookahead window scaling", () => {
      const expected = computeExpectedAcceptedTokens(0.9, 8);
      expect(expected).toBeGreaterThan(5.0);

      const speedup = computeSpeculativeSpeedup(expected, 0.04, 8);
      expect(speedup).toBeGreaterThan(3.5);
    });

    it("should not admit requests beyond maxBatchSize", () => {
      const configWithSmallBatch: SchedulerConfig = {
        maxBatchSize: 1,
        prefillChunkBudget: 128,
        enableChunkedPrefill: true,
        lookaheadK: 3,
        draftCostRatio: 0.05,
        defaultAcceptanceRate: 0.8,
        kvCacheCapacityBlocks: 20,
        tokensPerBlock: 16,
        speculativeMode: "linear",
      };

      const state: BatchSchedulerState = {
        iteration: 0,
        activeRequests: [
          {
            id: "req_active_1",
            prompt: "P1",
            promptTokens: 16,
            prefilledTokens: 16,
            generatedTokens: ["tok"],
            maxNewTokens: 10,
            arrivalIteration: 0,
            status: "decoding",
            ttft: 1,
            totalLatency: null,
            kvBlocksAllocated: 2,
            color: "#38bdf8",
            speculativeHistory: [],
          },
        ],
        waitingQueue: [
          {
            id: "req_waiting_2",
            prompt: "P2",
            promptTokens: 16,
            prefilledTokens: 0,
            generatedTokens: [],
            maxNewTokens: 10,
            arrivalIteration: 0,
            status: "waiting",
            ttft: null,
            totalLatency: null,
            kvBlocksAllocated: 0,
            color: "#a855f7",
            speculativeHistory: [],
          },
        ],
        completedRequests: [],
        totalTokensGenerated: 1,
        totalDraftTokensProposed: 0,
        totalDraftTokensAccepted: 0,
        memoryBlockGrid: Array.from({ length: 20 }, () => null),
        iterationTimeline: [],
      };

      const nextState = scheduleOrcaIterationStep(state, configWithSmallBatch);

      expect(nextState.activeRequests.length).toBe(1);
      expect(nextState.waitingQueue.length).toBe(1);
      expect(nextState.waitingQueue[0]?.id).toBe("req_waiting_2");
    });
  });
});
