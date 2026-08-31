import { describe, expect, it } from "bun:test";
import React from "react";
import {
  MoEExpertParallelStudio,
  MOE_PRESETS,
  PIPELINE_STEPS,
  softmax,
  computeTopKRouting,
  computeDeepSeekBiasRouting,
  updateDeepSeekBiases,
  simulateDeepSeekBiasConvergence,
  computeAuxiliaryLoss,
  calculateExpertCapacity,
  generateDeterministicLogits,
  simulateAllToAllDispatchCombine,
  calculateMoeCommunicationVolume,
  calculateExpertLoadImbalance,
  formatBytes,
  getGpuColor,
  type MoEPresetId,
} from "../../components/primitives/index";

describe("MoEExpertParallelStudio & Expert Parallelism Distributed Engine", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS CONFIGURATION
  // ==========================================================================
  describe("1. Component Instantiation & Props", () => {
    it("should instantiate MoEExpertParallelStudio with default props", () => {
      const element = React.createElement(MoEExpertParallelStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(MoEExpertParallelStudio);
    });

    it("should instantiate with custom preset, config overrides, and callbacks", () => {
      const onStepChangeMock = () => {};
      const onPresetChangeMock = () => {};

      const element = React.createElement(MoEExpertParallelStudio, {
        initialPreset: "deepseek_v3",
        initialConfig: {
          numExperts: 32,
          topK: 4,
          capacityFactor: 1.5,
          auxLossAlpha: 0.03,
          routingStrategy: "deepseek_bias",
          biasStepSize: 0.2,
        },
        width: 1200,
        height: 720,
        standalone: true,
        title: "Distributed Mixture-of-Experts Research Studio",
        onStepChange: onStepChangeMock,
        onPresetChange: onPresetChangeMock,
      });

      expect(element.props.initialPreset).toBe("deepseek_v3");
      expect(element.props.initialConfig?.numExperts).toBe(32);
      expect(element.props.initialConfig?.topK).toBe(4);
      expect(element.props.initialConfig?.capacityFactor).toBe(1.5);
      expect(element.props.initialConfig?.auxLossAlpha).toBe(0.03);
      expect(element.props.initialConfig?.routingStrategy).toBe("deepseek_bias");
      expect(element.props.initialConfig?.biasStepSize).toBe(0.2);
      expect(element.props.width).toBe(1200);
      expect(element.props.height).toBe(720);
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Distributed Mixture-of-Experts Research Studio");
    });
  });

  // ==========================================================================
  // 2. PRESET INTEGRITY & VALIDATION
  // ==========================================================================
  describe("2. Preset Configurations Integrity", () => {
    const presetIds: MoEPresetId[] = [
      "mixtral_8x7b",
      "deepseek_v3",
      "switch_transformer",
      "load_imbalance_straggler",
      "capacity_drop_stress",
      "gshard_top2",
      "custom",
    ];

    it("should contain all 7 production presets", () => {
      for (const id of presetIds) {
        const preset = MOE_PRESETS[id];
        expect(preset).toBeDefined();
        expect(preset.id).toBe(id);
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.subtitle.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(0);
        expect(preset.architectureFamily.length).toBeGreaterThan(0);
        expect(preset.sampleTokens.length).toBeGreaterThanOrEqual(4);
        expect(preset.highlightConcepts.length).toBeGreaterThanOrEqual(3);
      }
    });

    it("every preset should have valid MoE and EP configuration parameters", () => {
      for (const id of presetIds) {
        const { config } = MOE_PRESETS[id];
        expect(config.numExperts).toBeGreaterThanOrEqual(4);
        expect(config.topK).toBeGreaterThanOrEqual(1);
        expect(config.topK).toBeLessThanOrEqual(config.numExperts);
        expect(config.numGpus).toBeGreaterThanOrEqual(2);
        expect(config.numGpus).toBeLessThanOrEqual(config.numExperts);
        expect(config.numTokens).toBeGreaterThanOrEqual(8);
        expect(config.capacityFactor).toBeGreaterThan(0);
        expect(config.auxLossAlpha).toBeGreaterThanOrEqual(0);
        expect(config.hiddenDim).toBeGreaterThanOrEqual(512);
        expect([1, 2, 4]).toContain(config.bytesPerElement);
        expect(["balanced", "clustered", "heavy_straggler", "adversarial"]).toContain(
          config.routingBias,
        );
      }
    });

    it("deepseek_v3 preset should configure 64 micro-experts, top-8, and deepseek_bias strategy", () => {
      const preset = MOE_PRESETS.deepseek_v3;
      expect(preset.config.numExperts).toBe(64);
      expect(preset.config.topK).toBe(8);
      expect(preset.config.numGpus).toBe(8);
      expect(preset.config.bytesPerElement).toBe(1); // FP8
      expect(preset.config.routingStrategy).toBe("deepseek_bias");
      expect(preset.config.auxLossAlpha).toBe(0.0);
    });
  });

  // ==========================================================================
  // 3. SOFTMAX NUMERICAL STABILITY & PROBABILITY MATHEMATICS
  // ==========================================================================
  describe("3. Numerically Stable Softmax", () => {
    it("should compute exact normalized probabilities summing to 1.0", () => {
      const logits = [2.0, 1.0, 0.1];
      const probs = softmax(logits);

      expect(probs.length).toBe(3);
      const sum = probs.reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - 1.0)).toBeLessThan(1e-6);
      expect(probs[0]).toBeGreaterThan(probs[1]!);
      expect(probs[1]).toBeGreaterThan(probs[2]!);
    });

    it("should be numerically stable with very large logits (no NaN overflow)", () => {
      const logits = [1000, 1001, 1002];
      const probs = softmax(logits);

      expect(probs.every((p) => Number.isFinite(p) && !Number.isNaN(p))).toBe(true);
      const sum = probs.reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - 1.0)).toBeLessThan(1e-6);

      // Invariance to constant addition: softmax(x + c) == softmax(x)
      const baseProbs = softmax([0, 1, 2]);
      for (let i = 0; i < 3; i++) {
        expect(Math.abs(probs[i]! - baseProbs[i]!)).toBeLessThan(1e-5);
      }
    });

    it("should produce exact uniform distribution for identical logits", () => {
      const logits = [3.5, 3.5, 3.5, 3.5];
      const probs = softmax(logits);

      for (const p of probs) {
        expect(Math.abs(p - 0.25)).toBeLessThan(1e-6);
      }
    });

    it("should handle edge cases: single element and empty array", () => {
      expect(softmax([42])).toEqual([1.0]);
      expect(softmax([])).toEqual([]);
    });
  });

  // ==========================================================================
  // 4. TOP-K SPARSE GATING ROUTER LOGIC
  // ==========================================================================
  describe("4. Top-k Sparse Gating Routing Router", () => {
    it("should route k=1 (Switch Transformer) to single top expert with weight 1.0", () => {
      const logits = [
        [1.0, 5.0, 2.0, 0.5],
        [4.0, 1.0, 0.2, 3.0],
      ];
      const result = computeTopKRouting(logits, 1, 0);

      expect(result.selectedExperts.length).toBe(2);
      expect(result.selectedExperts[0]).toEqual([1]); // Expert 1 has logit 5.0
      expect(result.selectedExperts[1]).toEqual([0]); // Expert 0 has logit 4.0

      expect(result.weights[0]).toEqual([1.0]);
      expect(result.weights[1]).toEqual([1.0]);
    });

    it("should route k=2 (Mixtral 8x7B) and normalize top-2 weights to sum to 1.0", () => {
      const logits = [[1.0, 4.0, 3.0, 0.2, -1.0, 0.0, 2.0, -0.5]];
      const result = computeTopKRouting(logits, 2, 0);

      expect(result.selectedExperts[0]).toEqual([1, 2]); // Experts with logits 4.0 and 3.0
      expect(result.weights[0]?.length).toBe(2);

      const wSum = result.weights[0]!.reduce((a, b) => a + b, 0);
      expect(Math.abs(wSum - 1.0)).toBeLessThan(1e-6);
      expect(result.weights[0]![0]).toBeGreaterThan(result.weights[0]![1]!);
    });

    it("should clamp k when k > numExperts", () => {
      const logits = [[1.0, 2.0]];
      const result = computeTopKRouting(logits, 5, 0);

      expect(result.selectedExperts[0]?.length).toBe(2);
      expect(result.weights[0]?.length).toBe(2);
    });

    it("should inject deterministic jitter when noiseStd > 0", () => {
      const logits = [[2.0, 2.05, 1.95, 2.01]];
      const resultNoNoise = computeTopKRouting(logits, 2, 0, 42);
      const resultWithNoise = computeTopKRouting(logits, 2, 0.5, 42);

      expect(resultNoNoise.routingProbs[0]).toBeDefined();
      expect(resultWithNoise.routingProbs[0]).toBeDefined();
      expect(resultWithNoise.selectedExperts[0]?.length).toBe(2);
    });
  });

  // ==========================================================================
  // 5. DEEPSEEK-V3 AUXILIARY-LOSS-FREE BIAS ROUTING MECHANISM
  // ==========================================================================
  describe("5. DeepSeek-V3 Dynamic Bias Routing Mechanism", () => {
    it("should select top-k experts based on biased scores s_i = logits_i + b_i", () => {
      // Expert 0 has raw logit 4.0, Expert 1 has raw logit 3.0
      // But Expert 1 has bias +2.0 (s1 = 5.0), and Expert 0 has bias -2.0 (s0 = 2.0)
      const logits = [[4.0, 3.0, 1.0, 0.5]];
      const biases = [-2.0, 2.0, 0.0, 0.0];
      const k = 1;

      const result = computeDeepSeekBiasRouting(logits, biases, k, 0);

      expect(result.selectedExperts[0]).toEqual([1]); // Expert 1 selected due to dynamic bias
      expect(result.biasedScores[0]).toEqual([2.0, 5.0, 1.0, 0.5]);
    });

    it("should normalize gating weights strictly over unbiased raw logits", () => {
      const logits = [[5.0, 4.0, 1.0, 0.0]];
      const biases = [0.0, 0.0, 0.0, 0.0];
      const k = 2;

      const result = computeDeepSeekBiasRouting(logits, biases, k, 0);

      expect(result.selectedExperts[0]).toEqual([0, 1]);
      // Weights are Softmax over raw logits [5.0, 4.0]
      const expectedSoftmax = softmax([5.0, 4.0]);
      expect(Math.abs(result.weights[0]![0]! - expectedSoftmax[0]!)).toBeLessThan(1e-5);
      expect(Math.abs(result.weights[0]![1]! - expectedSoftmax[1]!)).toBeLessThan(1e-5);
    });

    it("should update dynamic biases: decrementing overloaded and incrementing underloaded experts", () => {
      const currentBiases = [0.0, 0.0, 0.0, 0.0];
      const expertLoads = [8, 0, 4, 4]; // Target is 4 tokens/expert
      const targetLoad = 4;
      const gamma = 0.1;

      const { updatedBiases, deltas } = updateDeepSeekBiases(
        currentBiases,
        expertLoads,
        targetLoad,
        gamma,
      );

      // Expert 0 load is 8 (overloaded by 4): delta = -0.1 * (4 / 4) = -0.1
      expect(deltas[0]).toBe(-0.1);
      expect(updatedBiases[0]).toBe(-0.1);

      // Expert 1 load is 0 (underloaded by 4): delta = -0.1 * (-4 / 4) = +0.1
      expect(deltas[1]).toBe(0.1);
      expect(updatedBiases[1]).toBe(0.1);

      // Experts 2 & 3 are at target load: delta = 0
      expect(deltas[2]).toBe(0.0);
      expect(updatedBiases[2]).toBe(0.0);
      expect(deltas[3]).toBe(0.0);
      expect(updatedBiases[3]).toBe(0.0);
    });

    it("should simulate multi-step convergence driving down load imbalance without aux loss", () => {
      // Create skewed synthetic logits where Experts 0 & 1 are initially heavily favoured
      const skewedLogits = generateDeterministicLogits(32, 8, "clustered", 42);
      const k = 2;

      const history = simulateDeepSeekBiasConvergence(skewedLogits, k, 10, 0.5);

      expect(history.length).toBe(10);
      expect(history[0]?.auxLoss).toBe(0.0); // Aux-loss-free!
      expect(history[9]?.auxLoss).toBe(0.0);

      // Initial imbalance should be significantly higher than converged step imbalance
      const initialImbalance = history[0]!.imbalanceRatio;
      const convergedImbalance = history[9]!.imbalanceRatio;

      expect(initialImbalance).toBeGreaterThan(1.5);
      expect(convergedImbalance).toBeLessThan(initialImbalance);
    });

    it("should handle empty logits in computeDeepSeekBiasRouting gracefully", () => {
      const result = computeDeepSeekBiasRouting([], [0, 0], 2);
      expect(result.selectedExperts).toEqual([]);
      expect(result.weights).toEqual([]);
      expect(result.biasedScores).toEqual([]);
    });
  });

  // ==========================================================================
  // 6. AUXILIARY LOAD BALANCING LOSS (L_aux = alpha * E * sum(f_i * P_i))
  // ==========================================================================
  describe("6. Auxiliary Load Balancing Loss Calculation", () => {
    it("should return alpha under perfectly uniform routing", () => {
      const numTokens = 8;
      const numExperts = 4;
      const alpha = 0.02;

      // Uniform routing: every expert has count 2, and every token has prob 0.25
      const uniformProbs = Array.from({ length: numTokens }, () => [0.25, 0.25, 0.25, 0.25]);
      const uniformCounts = [2, 2, 2, 2];

      const { loss, f_fractions, p_probs } = computeAuxiliaryLoss(
        uniformProbs,
        uniformCounts,
        numTokens,
        numExperts,
        alpha,
      );

      for (const f of f_fractions) {
        expect(Math.abs(f - 0.25)).toBeLessThan(1e-6);
      }
      for (const p of p_probs) {
        expect(Math.abs(p - 0.25)).toBeLessThan(1e-6);
      }

      // Analytical: alpha * E * sum(f_i * P_i) = alpha * 4 * (4 * (1/4 * 1/4)) = alpha * 1.0 = alpha
      expect(Math.abs(loss - alpha)).toBeLessThan(1e-4);
    });

    it("should return higher loss under imbalanced clustered routing", () => {
      const numTokens = 8;
      const numExperts = 4;
      const alpha = 0.02;

      // Imbalanced routing: all tokens routed to Expert 0
      const imbalancedProbs = Array.from({ length: numTokens }, () => [1.0, 0.0, 0.0, 0.0]);
      const imbalancedCounts = [8, 0, 0, 0];

      const { loss } = computeAuxiliaryLoss(
        imbalancedProbs,
        imbalancedCounts,
        numTokens,
        numExperts,
        alpha,
      );

      // Analytical: alpha * E * (1.0 * 1.0 + 0 + 0 + 0) = alpha * 4 * 1.0 = 4 * alpha
      expect(Math.abs(loss - 4 * alpha)).toBeLessThan(1e-4);
      expect(loss).toBeGreaterThan(alpha);
    });

    it("should scale linearly with alpha", () => {
      const numTokens = 4;
      const numExperts = 2;
      const probs = [
        [0.8, 0.2],
        [0.7, 0.3],
        [0.9, 0.1],
        [0.6, 0.4],
      ];
      const counts = [3, 1];

      const loss1 = computeAuxiliaryLoss(probs, counts, numTokens, numExperts, 0.01).loss;
      const loss2 = computeAuxiliaryLoss(probs, counts, numTokens, numExperts, 0.02).loss;

      expect(Math.abs(loss2 - 2 * loss1)).toBeLessThan(1e-4);
    });

    it("should handle 0 tokens or 0 experts without error", () => {
      expect(computeAuxiliaryLoss([], [], 0, 4, 0.01).loss).toBe(0);
      expect(computeAuxiliaryLoss([[0.5, 0.5]], [1, 1], 1, 0, 0.01).loss).toBe(0);
    });
  });

  // ==========================================================================
  // 7. EXPERT CAPACITY FACTOR & TOKEN DROPPING
  // ==========================================================================
  describe("7. Expert Capacity Factor & Token Dropping", () => {
    it("should compute exact capacity with C=1.0, C=1.25, C=1.5, and C=0.75", () => {
      // 32 tokens, top-2, 8 experts -> base average = 2 * 32 / 8 = 8 tokens/expert
      expect(calculateExpertCapacity(32, 2, 8, 1.0)).toBe(8);
      expect(calculateExpertCapacity(32, 2, 8, 1.25)).toBe(10);
      expect(calculateExpertCapacity(32, 2, 8, 1.5)).toBe(12);
      expect(calculateExpertCapacity(32, 2, 8, 0.75)).toBe(6);
    });

    it("should apply ceiling rounding for non-integer capacity products", () => {
      // 10 tokens, top-1, 4 experts -> base average = 10 / 4 = 2.5 tokens
      // 2.5 * 1.1 = 2.75 -> ceil is 3
      expect(calculateExpertCapacity(10, 1, 4, 1.1)).toBe(3);
    });

    it("should enforce minimum capacity of 1 token", () => {
      expect(calculateExpertCapacity(1, 1, 100, 0.1)).toBe(1);
    });
  });

  // ==========================================================================
  // 8. ALL-TO-ALL DISPATCH & COMBINE SIMULATION
  // ==========================================================================
  describe("8. All-to-All Collective Simulation across GPU Cluster", () => {
    it("should simulate balanced All-to-All dispatch with 0 drops under adequate capacity", () => {
      const numTokens = 8;
      const topK = 2;
      const numExperts = 4;
      const numGpus = 2; // 2 experts per GPU (GPU 0 has E0, E1; GPU 1 has E2, E3)
      const capacityFactor = 1.5;

      // Deterministic assignments: 2 tokens to each expert
      const routingAssignments = [
        [
          { expertId: 0, weight: 0.6 },
          { expertId: 2, weight: 0.4 },
        ],
        [
          { expertId: 0, weight: 0.7 },
          { expertId: 3, weight: 0.3 },
        ],
        [
          { expertId: 1, weight: 0.5 },
          { expertId: 2, weight: 0.5 },
        ],
        [
          { expertId: 1, weight: 0.8 },
          { expertId: 3, weight: 0.2 },
        ],
        [
          { expertId: 0, weight: 0.6 },
          { expertId: 2, weight: 0.4 },
        ],
        [
          { expertId: 1, weight: 0.6 },
          { expertId: 3, weight: 0.4 },
        ],
        [
          { expertId: 0, weight: 0.5 },
          { expertId: 2, weight: 0.5 },
        ],
        [
          { expertId: 1, weight: 0.5 },
          { expertId: 3, weight: 0.5 },
        ],
      ];

      const sim = simulateAllToAllDispatchCombine(
        numTokens,
        topK,
        numExperts,
        numGpus,
        capacityFactor,
        routingAssignments,
      );

      expect(sim.expertCapacity).toBe(6); // ceil(2*8/4 * 1.5) = 6
      expect(sim.totalDroppedAssignments).toBe(0);
      expect(sim.dropRate).toBe(0);

      // Verify Dispatch Matrix is 2x2
      expect(sim.gpuDispatchMatrix.length).toBe(2);
      expect(sim.gpuDispatchMatrix[0]?.length).toBe(2);
      expect(sim.gpuDispatchMatrix[1]?.length).toBe(2);

      // Total token-expert assignments = 8 * 2 = 16
      const totalDispatches =
        sim.gpuDispatchMatrix[0]![0]! +
        sim.gpuDispatchMatrix[0]![1]! +
        sim.gpuDispatchMatrix[1]![0]! +
        sim.gpuDispatchMatrix[1]![1]!;
      expect(totalDispatches).toBe(16);

      // Combine matrix matches dispatch matrix when 0 drops
      expect(sim.gpuCombineMatrix[0]![0]).toBe(sim.gpuDispatchMatrix[0]![0]);
      expect(sim.gpuCombineMatrix[1]![0]).toBe(sim.gpuDispatchMatrix[0]![1]);
    });

    it("should drop excess overflowing tokens when capacity limit is breached", () => {
      const numTokens = 8;
      const topK = 1;
      const numExperts = 2;
      const numGpus = 2;
      const capacityFactor = 0.5; // Capacity = ceil(1 * 8 / 2 * 0.5) = 2 tokens/expert

      // All 8 tokens routed to Expert 0
      const routingAssignments = Array.from({ length: 8 }, () => [{ expertId: 0, weight: 1.0 }]);

      const sim = simulateAllToAllDispatchCombine(
        numTokens,
        topK,
        numExperts,
        numGpus,
        capacityFactor,
        routingAssignments,
      );

      expect(sim.expertCapacity).toBe(2);
      expect(sim.expertProcessedTokens[0]?.length).toBe(2);
      expect(sim.expertDroppedTokens[0]?.length).toBe(6);
      expect(sim.totalDroppedAssignments).toBe(6);
      expect(sim.dropRate).toBe(75.0); // 6 / 8 = 75%
    });

    it("should correctly distinguish local transfers vs cross-GPU transfers", () => {
      const numTokens = 4;
      const topK = 1;
      const numExperts = 4;
      const numGpus = 2; // GPU 0: [E0, E1], GPU 1: [E2, E3]
      const capacityFactor = 2.0;

      // Token 0 (on GPU 0) -> E0 (on GPU 0, local)
      // Token 1 (on GPU 0) -> E2 (on GPU 1, cross-GPU)
      // Token 2 (on GPU 1) -> E3 (on GPU 1, local)
      // Token 3 (on GPU 1) -> E1 (on GPU 0, cross-GPU)
      const routingAssignments = [
        [{ expertId: 0, weight: 1.0 }],
        [{ expertId: 2, weight: 1.0 }],
        [{ expertId: 3, weight: 1.0 }],
        [{ expertId: 1, weight: 1.0 }],
      ];

      const tokenSources = [0, 0, 1, 1];

      const sim = simulateAllToAllDispatchCombine(
        numTokens,
        topK,
        numExperts,
        numGpus,
        capacityFactor,
        routingAssignments,
        tokenSources,
      );

      expect(sim.localTransfers).toBe(2);
      expect(sim.crossGpuTransfers).toBe(2);
      expect(sim.gpuDispatchMatrix[0]![0]).toBe(1); // GPU 0 to GPU 0 (local)
      expect(sim.gpuDispatchMatrix[0]![1]).toBe(1); // GPU 0 to GPU 1 (cross)
      expect(sim.gpuDispatchMatrix[1]![0]).toBe(1); // GPU 1 to GPU 0 (cross)
      expect(sim.gpuDispatchMatrix[1]![1]).toBe(1); // GPU 1 to GPU 1 (local)
    });
  });

  // ==========================================================================
  // 9. ALL-TO-ALL COMMUNICATION VOLUME & BANDWIDTH CALCULATIONS
  // ==========================================================================
  describe("9. Communication Volume & Bandwidth Analytics", () => {
    it("should calculate exact byte transfer volume for given precision and dimensions", () => {
      const numTokens = 32;
      const topK = 2;
      const hiddenDim = 4096;
      const bytesPerElement = 2; // FP16 (2 bytes per float)
      const numGpus = 4;
      const crossGpuTransfers = 48;

      const comm = calculateMoeCommunicationVolume(
        numTokens,
        topK,
        hiddenDim,
        bytesPerElement,
        numGpus,
        crossGpuTransfers,
      );

      // Each token activation is 4096 * 2 = 8192 bytes (8 KB)
      const expectedPerToken = 4096 * 2;
      expect(comm.dispatchBytes).toBe(48 * expectedPerToken);
      expect(comm.combineBytes).toBe(48 * expectedPerToken);
      expect(comm.totalBytes).toBe(2 * 48 * expectedPerToken);
      expect(comm.perGpuVolumeBytes).toBe(comm.totalBytes / 4);
    });

    it("should format bytes human-readably (B, KB, MB, GB)", () => {
      expect(formatBytes(512)).toBe("512 B");
      expect(formatBytes(2048)).toBe("2.0 KB");
      expect(formatBytes(1048576 * 5)).toBe("5.00 MB");
      expect(formatBytes(1073741824 * 3.5)).toBe("3.50 GB");
    });
  });

  // ==========================================================================
  // 10. LOAD IMBALANCE STATISTICS
  // ==========================================================================
  describe("10. Expert Load Imbalance Analytics", () => {
    it("should calculate imbalance ratio and standard deviation for uniform distribution", () => {
      const counts = [10, 10, 10, 10];
      const stats = calculateExpertLoadImbalance(counts);

      expect(stats.imbalanceRatio).toBe(1.0);
      expect(stats.standardDeviation).toBe(0.0);
      expect(stats.meanLoad).toBe(10);
      expect(stats.maxLoad).toBe(10);
      expect(stats.minLoad).toBe(10);
    });

    it("should detect extreme imbalance bottleneck spike", () => {
      const counts = [40, 0, 0, 0];
      const stats = calculateExpertLoadImbalance(counts);

      // Mean = 10, Max = 40 -> Imbalance Ratio = 40 / 10 = 4.0x
      expect(stats.imbalanceRatio).toBe(4.0);
      expect(stats.meanLoad).toBe(10);
      expect(stats.maxLoad).toBe(40);
      expect(stats.minLoad).toBe(0);
      expect(stats.standardDeviation).toBeGreaterThan(15);
    });

    it("should handle empty array gracefully", () => {
      const stats = calculateExpertLoadImbalance([]);
      expect(stats.imbalanceRatio).toBe(1.0);
      expect(stats.maxLoad).toBe(0);
    });
  });

  // ==========================================================================
  // 11. PIPELINE METADATA & SYNTHETIC LOGITS GENERATION
  // ==========================================================================
  describe("11. Pipeline Steps & Deterministic Scenario Logits", () => {
    it("should have all 8 pipeline steps with valid metadata", () => {
      expect(PIPELINE_STEPS.length).toBe(8);
      for (const step of PIPELINE_STEPS) {
        expect(step.id).toBeDefined();
        expect(step.name.length).toBeGreaterThan(0);
        expect(step.shortName.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
        expect(step.equation.length).toBeGreaterThan(0);
      }
    });

    it("should generate deterministic logits for different bias profiles", () => {
      const balanced = generateDeterministicLogits(16, 8, "balanced", 42);
      expect(balanced.length).toBe(16);
      expect(balanced[0]?.length).toBe(8);

      const straggler = generateDeterministicLogits(16, 8, "heavy_straggler", 42);
      // In heavy straggler mode, expert 0 should consistently have high logits
      let expert0Dominates = 0;
      for (const row of straggler) {
        if (row[0]! > row[2]! && row[0]! > row[3]!) {
          expert0Dominates++;
        }
      }
      expect(expert0Dominates).toBeGreaterThan(14);
    });

    it("should return valid GPU colors for any rank", () => {
      for (let i = 0; i < 16; i++) {
        const color = getGpuColor(i);
        expect(color.startsWith("#")).toBe(true);
      }
    });
  });
});
