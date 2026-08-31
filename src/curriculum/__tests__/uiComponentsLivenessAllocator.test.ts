import { describe, expect, it } from "bun:test";
import React from "react";
import {
  AlignmentBytes,
  AllocationStrategy,
  CompilerLivenessAllocatorView,
  DType,
  DTYPE_NAMES,
  DTYPE_SIZES,
  TensorNode,
  WORKLOAD_PRESETS,
  WorkloadConfig,
  WorkloadPresetId,
  alignOffset,
  allocateMemoryArena,
  buildWorkloadGraph,
  computeWorkloadMetrics,
  formatBytes,
  formatElements,
  generateInductorCode,
  generatePyTorchEagerCode,
  generateTritonKernelCode,
  intervalsOverlap,
  memoryRangesOverlap,
  verifyInterferenceDisjointness,
} from "../../components/profiler/CompilerLivenessAllocatorView";

describe("Compiler Operator Fusion & Memory Liveness Arena Allocator Tests", () => {
  // ==========================================================================
  // 1. Component Instantiation & Props Handling
  // ==========================================================================
  describe("1. Component Instantiation & Props Handling", () => {
    it("should instantiate CompilerLivenessAllocatorView with default props", () => {
      const element = React.createElement(CompilerLivenessAllocatorView, {});

      expect(element).toBeDefined();
      expect(element.type).toBe(CompilerLivenessAllocatorView);
      expect(element.props.initialPreset).toBeUndefined();
      expect(element.props.initialFusionMode).toBeUndefined();
      expect(element.props.initialStrategy).toBeUndefined();
      expect(element.props.initialDtype).toBeUndefined();
      expect(element.props.title).toBeUndefined();
    });

    it("should accept custom props for preset, fusion mode, strategy, precision, and alignment", () => {
      const element = React.createElement(CompilerLivenessAllocatorView, {
        initialPreset: "flash_attention_2",
        initialFusionMode: "triton_fused",
        initialStrategy: "best_fit",
        initialDtype: "fp8",
        initialBatchSize: 8,
        initialSeqLen: 4096,
        initialHiddenDim: 2048,
        initialAlignment: 256,
        title: "Custom LLM FlashAttention Memory Profiler",
        className: "custom-compiler-allocator-class",
      });

      expect(element.props.initialPreset).toBe("flash_attention_2");
      expect(element.props.initialFusionMode).toBe("triton_fused");
      expect(element.props.initialStrategy).toBe("best_fit");
      expect(element.props.initialDtype).toBe("fp8");
      expect(element.props.initialBatchSize).toBe(8);
      expect(element.props.initialSeqLen).toBe(4096);
      expect(element.props.initialHiddenDim).toBe(2048);
      expect(element.props.initialAlignment).toBe(256);
      expect(element.props.title).toBe("Custom LLM FlashAttention Memory Profiler");
      expect(element.props.className).toBe("custom-compiler-allocator-class");
    });
  });

  // ==========================================================================
  // 2. Data Types & Precision Math
  // ==========================================================================
  describe("2. Data Types & Precision Math", () => {
    it("should define valid byte sizes for all supported data types", () => {
      expect(DTYPE_SIZES.fp32).toBe(4);
      expect(DTYPE_SIZES.fp16).toBe(2);
      expect(DTYPE_SIZES.bf16).toBe(2);
      expect(DTYPE_SIZES.fp8).toBe(1);
      expect(DTYPE_SIZES.int8).toBe(1);
    });

    it("should provide human-readable names for all data types", () => {
      const dtypes: DType[] = ["fp32", "fp16", "bf16", "fp8", "int8"];
      for (const dt of dtypes) {
        expect(DTYPE_NAMES[dt]).toBeDefined();
        expect(typeof DTYPE_NAMES[dt]).toBe("string");
        expect(DTYPE_NAMES[dt].length).toBeGreaterThan(0);
      }
    });

    it("should format byte quantities accurately across units", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(512)).toBe("512 B");
      expect(formatBytes(1024)).toBe("1.00 KB");
      expect(formatBytes(1536)).toBe("1.50 KB");
      expect(formatBytes(1048576)).toBe("1.00 MB");
      expect(formatBytes(26214400)).toBe("25.00 MB");
      expect(formatBytes(1073741824)).toBe("1.00 GB");
    });

    it("should format element counts accurately", () => {
      expect(formatElements(500)).toBe("500");
      expect(formatElements(1500)).toBe("1.5k");
      expect(formatElements(2000000)).toBe("2.00M");
      expect(formatElements(1500000000)).toBe("1.50B");
    });
  });

  // ==========================================================================
  // 3. Alignment and Interval Geometric Helpers
  // ==========================================================================
  describe("3. Alignment and Interval Geometric Helpers", () => {
    it("should calculate aligned offsets for 64B, 128B, 256B, and 512B boundaries", () => {
      const alignments: AlignmentBytes[] = [64, 128, 256, 512];

      for (const align of alignments) {
        expect(alignOffset(0, align)).toBe(0);
        expect(alignOffset(1, align)).toBe(align);
        expect(alignOffset(align, align)).toBe(align);
        expect(alignOffset(align + 1, align)).toBe(align * 2);
        expect(alignOffset(align * 3, align)).toBe(align * 3);
      }
    });

    it("should correctly detect temporal interval overlap [s_a, e_a] and [s_b, e_b]", () => {
      // Overlapping intervals
      expect(intervalsOverlap(0, 3, 2, 5)).toBe(true);
      expect(intervalsOverlap(2, 5, 0, 3)).toBe(true);
      expect(intervalsOverlap(1, 4, 2, 3)).toBe(true); // Subset
      expect(intervalsOverlap(2, 3, 1, 4)).toBe(true); // Superset
      expect(intervalsOverlap(2, 2, 2, 2)).toBe(true); // Point overlap
      expect(intervalsOverlap(1, 3, 3, 5)).toBe(true); // Shared boundary step

      // Disjoint intervals
      expect(intervalsOverlap(0, 2, 3, 5)).toBe(false);
      expect(intervalsOverlap(4, 6, 1, 3)).toBe(false);
    });

    it("should correctly detect 1D spatial memory range overlap [off_a, off_a + size_a)", () => {
      // Overlapping byte ranges
      expect(memoryRangesOverlap(0, 100, 50, 100)).toBe(true);
      expect(memoryRangesOverlap(50, 100, 0, 100)).toBe(true);
      expect(memoryRangesOverlap(0, 200, 50, 50)).toBe(true);

      // Disjoint abutting ranges (end of A is start of B)
      expect(memoryRangesOverlap(0, 100, 100, 100)).toBe(false);
      expect(memoryRangesOverlap(100, 100, 0, 100)).toBe(false);

      // Disjoint separated ranges
      expect(memoryRangesOverlap(0, 50, 100, 50)).toBe(false);
      expect(memoryRangesOverlap(200, 50, 0, 100)).toBe(false);
    });
  });

  // ==========================================================================
  // 4. Workload Preset Graphs & Dimension Integrity
  // ==========================================================================
  describe("4. Workload Preset Graphs & Dimension Integrity", () => {
    const presetIds: WorkloadPresetId[] = [
      "transformer_mha",
      "swiglu_mlp",
      "fused_layernorm_gelu",
      "flash_attention_2",
      "conv_bn_relu",
    ];

    it("should define all 5 required preset workloads", () => {
      for (const id of presetIds) {
        expect(WORKLOAD_PRESETS[id]).toBeDefined();
        expect(WORKLOAD_PRESETS[id].id).toBe(id);
        expect(WORKLOAD_PRESETS[id].name.length).toBeGreaterThan(0);
        expect(WORKLOAD_PRESETS[id].description.length).toBeGreaterThan(0);
      }
    });

    it("should build Transformer Multi-Head Attention workload graph with quadratic S^2 attention score tensors", () => {
      const config: WorkloadConfig = {
        batchSize: 2,
        seqLen: 1024,
        hiddenDim: 512,
        numHeads: 8,
        dtype: "fp16",
        alignment: 128,
        fusionMode: "unfused",
        allocationStrategy: "greedy_size",
      };

      const graph = buildWorkloadGraph(config, "transformer_mha");
      expect(graph.id).toBe("transformer_mha");
      expect(graph.tensors.length).toBeGreaterThanOrEqual(10);
      expect(graph.steps.length).toBe(8);

      const xInput = graph.tensors.find((t) => t.id === "x_input");
      expect(xInput).toBeDefined();
      expect(xInput!.shape).toEqual([2, 1024, 512]);
      expect(xInput!.numElements).toBe(2 * 1024 * 512);
      expect(xInput!.sizeBytes).toBe(2 * 1024 * 512 * 2); // FP16 = 2B

      const attnScores = graph.tensors.find((t) => t.id === "attn_scores_raw");
      expect(attnScores).toBeDefined();
      expect(attnScores!.shape).toEqual([2, 8, 1024, 1024]);
      expect(attnScores!.numElements).toBe(2 * 8 * 1024 * 1024);
      expect(attnScores!.isEliminatedByFusion).toBe(false); // in unfused mode
    });

    it("should build SwiGLU MLP Block with gate, up, silu, and down linear projections", () => {
      const config: WorkloadConfig = {
        batchSize: 4,
        seqLen: 512,
        hiddenDim: 1024,
        intermediateDim: 2752,
        dtype: "bf16",
        alignment: 256,
        fusionMode: "unfused",
        allocationStrategy: "first_fit",
      };

      const graph = buildWorkloadGraph(config, "swiglu_mlp");
      expect(graph.id).toBe("swiglu_mlp");
      expect(graph.tensors.some((t) => t.id === "w_gate")).toBe(true);
      expect(graph.tensors.some((t) => t.id === "w_up")).toBe(true);
      expect(graph.tensors.some((t) => t.id === "silu_gate")).toBe(true);
      expect(graph.tensors.some((t) => t.id === "w_down")).toBe(true);

      const gateProj = graph.tensors.find((t) => t.id === "gate_proj");
      expect(gateProj).toBeDefined();
      expect(gateProj!.shape).toEqual([4, 512, 2752]);
      expect(gateProj!.sizeBytes).toBe(4 * 512 * 2752 * 2); // BF16 = 2B
    });

    it("should build Fused LayerNorm + GELU MLP block", () => {
      const config: WorkloadConfig = {
        batchSize: 2,
        seqLen: 256,
        hiddenDim: 768,
        dtype: "fp32",
        alignment: 64,
        fusionMode: "unfused",
        allocationStrategy: "best_fit",
      };

      const graph = buildWorkloadGraph(config, "fused_layernorm_gelu");
      expect(graph.id).toBe("fused_layernorm_gelu");
      expect(graph.tensors.some((t) => t.id === "ln_gamma_beta")).toBe(true);
      expect(graph.tensors.some((t) => t.id === "ln_stats")).toBe(true);
      expect(graph.tensors.some((t) => t.id === "gelu_out")).toBe(true);
    });

    it("should build FlashAttention-2 Block with tiled online softmax in SRAM", () => {
      const config: WorkloadConfig = {
        batchSize: 2,
        seqLen: 2048,
        hiddenDim: 1024,
        numHeads: 16,
        dtype: "fp16",
        alignment: 128,
        fusionMode: "triton_fused",
        allocationStrategy: "greedy_size",
      };

      const graph = buildWorkloadGraph(config, "flash_attention_2");
      expect(graph.id).toBe("flash_attention_2");
      const s2ScoreMatrix = graph.tensors.find((t) => t.id === "attn_unfused_s2_matrix");
      expect(s2ScoreMatrix).toBeDefined();
      // In triton_fused mode, S^2 matrix is eliminated from DRAM allocation!
      expect(s2ScoreMatrix!.isEliminatedByFusion).toBe(true);
    });

    it("should build Conv-BN-ReLU Block with 4D tensors [B, C, H, W]", () => {
      const config: WorkloadConfig = {
        batchSize: 8,
        seqLen: 1024,
        hiddenDim: 256,
        spatialH: 32,
        spatialW: 32,
        channels: 64,
        dtype: "fp32",
        alignment: 128,
        fusionMode: "unfused",
        allocationStrategy: "greedy_size",
      };

      const graph = buildWorkloadGraph(config, "conv_bn_relu");
      expect(graph.id).toBe("conv_bn_relu");
      const inputImg = graph.tensors.find((t) => t.id === "input_img");
      expect(inputImg).toBeDefined();
      expect(inputImg!.shape).toEqual([8, 64, 32, 32]);
      expect(inputImg!.numElements).toBe(8 * 64 * 32 * 32);
      expect(inputImg!.sizeBytes).toBe(8 * 64 * 32 * 32 * 4); // FP32 = 4B
    });
  });

  // ==========================================================================
  // 5. Memory Allocator Algorithms & Disjointness Invariant
  // ==========================================================================
  describe("5. Memory Allocator Algorithms & Disjointness Invariant", () => {
    const strategies: AllocationStrategy[] = [
      "naive_linear",
      "greedy_size",
      "first_fit",
      "best_fit",
    ];

    const alignments: AlignmentBytes[] = [64, 128, 256, 512];

    for (const strategy of strategies) {
      it(`should allocate collision-free buffers and satisfy interference invariant for strategy: ${strategy}`, () => {
        const config: WorkloadConfig = {
          batchSize: 2,
          seqLen: 512,
          hiddenDim: 256,
          dtype: "fp16",
          alignment: 128,
          fusionMode: "unfused",
          allocationStrategy: strategy,
        };

        const graph = buildWorkloadGraph(config, "transformer_mha");
        const blocks = allocateMemoryArena(graph.tensors, strategy, 128);

        expect(blocks.length).toBe(graph.tensors.length);

        // Verify interference disjointness
        const check = verifyInterferenceDisjointness(blocks);
        expect(check.isValid).toBe(true);
        expect(check.violations.length).toBe(0);

        // Verify alignment of all placed blocks
        for (const block of blocks) {
          if (!block.isEliminatedByFusion && block.sizeBytes > 0) {
            expect(block.offset % 128).toBe(0);
            expect(block.sizeBytes % 128).toBe(0);
          }
        }
      });
    }

    it("should guarantee that Naive Linear places blocks sequentially with arena size equal to sum of aligned sizes", () => {
      const config: WorkloadConfig = {
        batchSize: 2,
        seqLen: 256,
        hiddenDim: 128,
        dtype: "fp32",
        alignment: 128,
        fusionMode: "unfused",
        allocationStrategy: "naive_linear",
      };

      const graph = buildWorkloadGraph(config, "swiglu_mlp");
      const blocks = allocateMemoryArena(graph.tensors, "naive_linear", 128);

      const activeBlocks = blocks.filter((b) => !b.isEliminatedByFusion);
      const expectedTotal = activeBlocks.reduce((sum, b) => sum + b.sizeBytes, 0);
      const peakMemory = activeBlocks.reduce((max, b) => Math.max(max, b.offset + b.sizeBytes), 0);

      expect(peakMemory).toBe(expectedTotal);
    });

    it("should achieve memory reuse in greedy_size, first_fit, and best_fit compared to naive_linear", () => {
      const config: WorkloadConfig = {
        batchSize: 2,
        seqLen: 512,
        hiddenDim: 256,
        dtype: "fp16",
        alignment: 128,
        fusionMode: "unfused",
        allocationStrategy: "naive_linear",
      };

      const graph = buildWorkloadGraph(config, "transformer_mha");

      const naiveBlocks = allocateMemoryArena(graph.tensors, "naive_linear", 128);
      const greedyBlocks = allocateMemoryArena(graph.tensors, "greedy_size", 128);
      const firstFitBlocks = allocateMemoryArena(graph.tensors, "first_fit", 128);
      const bestFitBlocks = allocateMemoryArena(graph.tensors, "best_fit", 128);

      const peakNaive = Math.max(...naiveBlocks.map((b) => b.offset + b.sizeBytes));
      const peakGreedy = Math.max(...greedyBlocks.map((b) => b.offset + b.sizeBytes));
      const peakFirstFit = Math.max(...firstFitBlocks.map((b) => b.offset + b.sizeBytes));
      const peakBestFit = Math.max(...bestFitBlocks.map((b) => b.offset + b.sizeBytes));

      // Reused peak memory must be strictly less than naive linear sum of all buffers
      expect(peakGreedy).toBeLessThan(peakNaive);
      expect(peakFirstFit).toBeLessThan(peakNaive);
      expect(peakBestFit).toBeLessThan(peakNaive);
    });

    it("should verify alignment across all 64B, 128B, 256B, and 512B configurations", () => {
      for (const align of alignments) {
        const config: WorkloadConfig = {
          batchSize: 2,
          seqLen: 128,
          hiddenDim: 128,
          dtype: "fp32",
          alignment: align,
          fusionMode: "unfused",
          allocationStrategy: "greedy_size",
        };

        const graph = buildWorkloadGraph(config, "fused_layernorm_gelu");
        const blocks = allocateMemoryArena(graph.tensors, "greedy_size", align);

        for (const block of blocks) {
          if (!block.isEliminatedByFusion) {
            expect(block.offset % align).toBe(0);
            expect(block.sizeBytes % align).toBe(0);
          }
        }
      }
    });
  });

  // ==========================================================================
  // 6. Comprehensive Disjointness Invariant Test on Synthetic Workloads
  // ==========================================================================
  describe("6. Mathematical Disjointness Invariant on Synthetic Scenarios", () => {
    it("should verify disjointness for strictly consecutive disjoint lifetime tensors (should reuse offset 0)", () => {
      const syntheticTensors: TensorNode[] = [
        {
          id: "t0",
          name: "tensor_0",
          producerOp: "Op0",
          consumerOps: ["Op1"],
          shape: [1000],
          shapeStr: "[1000]",
          numElements: 1000,
          sizeBytes: 4000,
          startStep: 0,
          endStep: 1,
          isEliminatedByFusion: false,
          category: "activation",
          colorHex: "#FF0000",
        },
        {
          id: "t1",
          name: "tensor_1",
          producerOp: "Op2",
          consumerOps: ["Op3"],
          shape: [1000],
          shapeStr: "[1000]",
          numElements: 1000,
          sizeBytes: 4000,
          startStep: 2,
          endStep: 3,
          isEliminatedByFusion: false,
          category: "activation",
          colorHex: "#00FF00",
        },
        {
          id: "t2",
          name: "tensor_2",
          producerOp: "Op4",
          consumerOps: ["Op5"],
          shape: [1000],
          shapeStr: "[1000]",
          numElements: 1000,
          sizeBytes: 4000,
          startStep: 4,
          endStep: 5,
          isEliminatedByFusion: false,
          category: "activation",
          colorHex: "#0000FF",
        },
      ];

      const blocks = allocateMemoryArena(syntheticTensors, "greedy_size", 128);
      const check = verifyInterferenceDisjointness(blocks);
      expect(check.isValid).toBe(true);

      // All 3 non-overlapping tensors should reuse offset 0
      expect(blocks[0].offset).toBe(0);
      expect(blocks[1].offset).toBe(0);
      expect(blocks[2].offset).toBe(0);
    });

    it("should verify disjointness for completely concurrent overlapping tensors (must allocate disjoint offsets)", () => {
      const syntheticTensors: TensorNode[] = [
        {
          id: "t0",
          name: "tensor_0",
          producerOp: "Op0",
          consumerOps: ["Op3"],
          shape: [1000],
          shapeStr: "[1000]",
          numElements: 1000,
          sizeBytes: 1024,
          startStep: 0,
          endStep: 5,
          isEliminatedByFusion: false,
          category: "activation",
          colorHex: "#FF0000",
        },
        {
          id: "t1",
          name: "tensor_1",
          producerOp: "Op0",
          consumerOps: ["Op3"],
          shape: [1000],
          shapeStr: "[1000]",
          numElements: 1000,
          sizeBytes: 2048,
          startStep: 1,
          endStep: 4,
          isEliminatedByFusion: false,
          category: "activation",
          colorHex: "#00FF00",
        },
        {
          id: "t2",
          name: "tensor_2",
          producerOp: "Op0",
          consumerOps: ["Op3"],
          shape: [1000],
          shapeStr: "[1000]",
          numElements: 1000,
          sizeBytes: 4096,
          startStep: 2,
          endStep: 3,
          isEliminatedByFusion: false,
          category: "activation",
          colorHex: "#0000FF",
        },
      ];

      const blocks = allocateMemoryArena(syntheticTensors, "greedy_size", 128);
      const check = verifyInterferenceDisjointness(blocks);
      expect(check.isValid).toBe(true);

      // Verify no two blocks have overlapping address space
      for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
          expect(
            memoryRangesOverlap(
              blocks[i].offset,
              blocks[i].sizeBytes,
              blocks[j].offset,
              blocks[j].sizeBytes,
            ),
          ).toBe(false);
        }
      }
    });

    it("should catch intentional artificial memory overlap violations", () => {
      const violatedBlocks = [
        {
          tensorId: "t0",
          tensorName: "tensor_0",
          offset: 0,
          sizeBytes: 1024,
          rawSizeBytes: 1000,
          startStep: 0,
          endStep: 3,
          color: "#FFF",
          category: "activation" as const,
          isEliminatedByFusion: false,
        },
        {
          tensorId: "t1",
          tensorName: "tensor_1",
          offset: 512, // Overlaps with t0 [0, 1024)
          sizeBytes: 1024,
          rawSizeBytes: 1000,
          startStep: 1, // Overlaps temporally with t0 [0, 3]
          endStep: 4,
          color: "#FFF",
          category: "activation" as const,
          isEliminatedByFusion: false,
        },
      ];

      const check = verifyInterferenceDisjointness(violatedBlocks);
      expect(check.isValid).toBe(false);
      expect(check.violations.length).toBe(1);
      expect(check.violations[0].tensorA).toBe("tensor_0");
      expect(check.violations[0].tensorB).toBe("tensor_1");
    });
  });

  // ==========================================================================
  // 7. Compiler Operator Fusion Transitions & Metrics
  // ==========================================================================
  describe("7. Compiler Operator Fusion Transitions & Metrics", () => {
    it("should compute accurate peak memory reduction and DRAM traffic reduction for Transformer MHA", () => {
      const baseConfig: WorkloadConfig = {
        batchSize: 2,
        seqLen: 1024,
        hiddenDim: 512,
        numHeads: 8,
        dtype: "fp16",
        alignment: 128,
        fusionMode: "unfused",
        allocationStrategy: "greedy_size",
      };

      const unfusedGraph = buildWorkloadGraph(baseConfig, "transformer_mha");
      const unfusedMetrics = computeWorkloadMetrics(unfusedGraph, baseConfig);

      const inductorGraph = buildWorkloadGraph(
        { ...baseConfig, fusionMode: "inductor_fused" },
        "transformer_mha",
      );
      const inductorMetrics = computeWorkloadMetrics(inductorGraph, {
        ...baseConfig,
        fusionMode: "inductor_fused",
      });

      const tritonGraph = buildWorkloadGraph(
        { ...baseConfig, fusionMode: "triton_fused" },
        "transformer_mha",
      );
      const tritonMetrics = computeWorkloadMetrics(tritonGraph, {
        ...baseConfig,
        fusionMode: "triton_fused",
      });

      // Peak memory should drop as fusion increases
      expect(inductorMetrics.peakMemoryBytes).toBeLessThanOrEqual(unfusedMetrics.peakMemoryBytes);
      expect(tritonMetrics.peakMemoryBytes).toBeLessThan(inductorMetrics.peakMemoryBytes);

      // DRAM traffic should drop significantly
      expect(inductorMetrics.totalDramTrafficBytes).toBeLessThan(
        unfusedMetrics.totalDramTrafficBytes,
      );
      expect(tritonMetrics.totalDramTrafficBytes).toBeLessThan(
        inductorMetrics.totalDramTrafficBytes,
      );

      // Kernel launches should decrease
      expect(inductorMetrics.totalKernelLaunches).toBeLessThan(unfusedMetrics.totalKernelLaunches);
      expect(tritonMetrics.totalKernelLaunches).toBeLessThan(inductorMetrics.totalKernelLaunches);

      // Reductions should be within [0, 100]%
      expect(tritonMetrics.peakMemoryReductionPercent).toBeGreaterThan(0);
      expect(tritonMetrics.peakMemoryReductionPercent).toBeLessThanOrEqual(100);
      expect(tritonMetrics.dramTrafficReductionPercent).toBeGreaterThan(0);
      expect(tritonMetrics.kernelLaunchReductionPercent).toBeGreaterThan(0);
    });

    it("should eliminate intermediate buffers from DRAM in SwiGLU MLP under Triton Fusion", () => {
      const config: WorkloadConfig = {
        batchSize: 2,
        seqLen: 512,
        hiddenDim: 512,
        intermediateDim: 1376,
        dtype: "bf16",
        alignment: 128,
        fusionMode: "triton_fused",
        allocationStrategy: "greedy_size",
      };

      const graph = buildWorkloadGraph(config, "swiglu_mlp");
      const siluGate = graph.tensors.find((t) => t.id === "silu_gate");
      const gateProj = graph.tensors.find((t) => t.id === "gate_proj");
      const upProj = graph.tensors.find((t) => t.id === "up_proj");

      expect(siluGate!.isEliminatedByFusion).toBe(true);
      expect(gateProj!.isEliminatedByFusion).toBe(true);
      expect(upProj!.isEliminatedByFusion).toBe(true);

      const metrics = computeWorkloadMetrics(graph, config);
      expect(metrics.isDisjoint).toBe(true);
      expect(metrics.peakMemoryReductionPercent).toBeGreaterThan(40);
    });
  });

  // ==========================================================================
  // 8. Timeline Stepping & Live Tensor Set Tracking
  // ==========================================================================
  describe("8. Timeline Stepping & Live Tensor Set Tracking", () => {
    it("should accurately track active tensors and active memory across all execution steps", () => {
      const config: WorkloadConfig = {
        batchSize: 2,
        seqLen: 256,
        hiddenDim: 256,
        dtype: "fp16",
        alignment: 128,
        fusionMode: "unfused",
        allocationStrategy: "greedy_size",
      };

      const graph = buildWorkloadGraph(config, "transformer_mha");
      const metrics = computeWorkloadMetrics(graph, config);

      for (let step = 0; step <= graph.totalSteps; step++) {
        const activeTensors = metrics.activeTensorsAtStep(step);
        const activeMem = metrics.activeMemoryAtStep(step);

        expect(Array.isArray(activeTensors)).toBe(true);

        // Every returned active tensor must have startStep <= step <= endStep
        for (const block of activeTensors) {
          expect(block.startStep).toBeLessThanOrEqual(step);
          expect(step).toBeLessThanOrEqual(block.endStep);
          expect(block.isEliminatedByFusion).toBe(false);
        }

        // Active memory must match sum of sizes of active blocks
        const expectedSum = activeTensors.reduce((sum, b) => sum + b.sizeBytes, 0);
        expect(activeMem).toBe(expectedSum);
      }
    });

    it("should return zero active tensors for invalid step out of bounds", () => {
      const config: WorkloadConfig = {
        batchSize: 2,
        seqLen: 256,
        hiddenDim: 256,
        dtype: "fp16",
        alignment: 128,
        fusionMode: "unfused",
        allocationStrategy: "greedy_size",
      };

      const graph = buildWorkloadGraph(config, "transformer_mha");
      const metrics = computeWorkloadMetrics(graph, config);

      const activeFuture = metrics.activeTensorsAtStep(999);
      expect(activeFuture.length).toBe(0);
      expect(metrics.activeMemoryAtStep(999)).toBe(0);
    });
  });

  // ==========================================================================
  // 9. Code Generators Output Verification
  // ==========================================================================
  describe("9. Code Generators Output Verification", () => {
    const config: WorkloadConfig = {
      batchSize: 2,
      seqLen: 1024,
      hiddenDim: 512,
      numHeads: 8,
      intermediateDim: 2048,
      dtype: "fp16",
      alignment: 128,
      fusionMode: "triton_fused",
      allocationStrategy: "greedy_size",
    };

    it("should generate valid PyTorch Eager code containing torch modules and forward methods", () => {
      const presets: WorkloadPresetId[] = [
        "transformer_mha",
        "swiglu_mlp",
        "fused_layernorm_gelu",
        "flash_attention_2",
        "conv_bn_relu",
      ];

      for (const preset of presets) {
        const eagerCode = generatePyTorchEagerCode(preset, config);
        expect(eagerCode).toContain("import torch");
        expect(eagerCode.length).toBeGreaterThan(100);
      }
    });

    it("should generate TorchInductor IR code with loop fusion descriptions", () => {
      const inductorCode = generateInductorCode("transformer_mha", config);
      expect(inductorCode).toContain("@triton.jit");
      expect(inductorCode).toContain("tl.load");
      expect(inductorCode).toContain("tl.store");
    });

    it("should generate valid Triton Mega-Kernel code with shared memory tiling and online softmax", () => {
      const tritonCode = generateTritonKernelCode("transformer_mha", config);
      expect(tritonCode).toContain("@triton.jit");
      expect(tritonCode).toContain("tl.dot");
      expect(tritonCode).toContain("m_i = tl.zeros");
      expect(tritonCode).toContain("tl.store");
    });

    it("should generate Fused SwiGLU Triton kernel with combined GEMM and activation in registers", () => {
      const tritonSwiGLU = generateTritonKernelCode("swiglu_mlp", config);
      expect(tritonSwiGLU).toContain("@triton.jit");
      expect(tritonSwiGLU).toContain("fused_swiglu_gemm_kernel");
      expect(tritonSwiGLU).toContain("tl.sigmoid");
    });
  });

  // ==========================================================================
  // 10. Edge Cases & Boundary Conditions
  // ==========================================================================
  describe("10. Edge Cases & Boundary Conditions", () => {
    it("should handle single tensor allocation without error", () => {
      const singleTensor: TensorNode[] = [
        {
          id: "solo",
          name: "solo_tensor",
          producerOp: "Op",
          consumerOps: ["Out"],
          shape: [100],
          shapeStr: "[100]",
          numElements: 100,
          sizeBytes: 400,
          startStep: 0,
          endStep: 0,
          isEliminatedByFusion: false,
          category: "input",
          colorHex: "#3B82F6",
        },
      ];

      const blocks = allocateMemoryArena(singleTensor, "greedy_size", 128);
      expect(blocks.length).toBe(1);
      expect(blocks[0].offset).toBe(0);
      expect(blocks[0].sizeBytes).toBe(512); // 400 aligned to 128 = 512
      const check = verifyInterferenceDisjointness(blocks);
      expect(check.isValid).toBe(true);
    });

    it("should handle empty tensor list gracefully", () => {
      const blocks = allocateMemoryArena([], "greedy_size", 128);
      expect(blocks.length).toBe(0);
      const check = verifyInterferenceDisjointness(blocks);
      expect(check.isValid).toBe(true);
    });

    it("should handle workload with 100% eliminated tensors in full mega-kernel", () => {
      const allEliminated: TensorNode[] = [
        {
          id: "elim1",
          name: "elim1",
          producerOp: "Op",
          consumerOps: ["Op2"],
          shape: [10],
          shapeStr: "[10]",
          numElements: 10,
          sizeBytes: 40,
          startStep: 0,
          endStep: 1,
          isEliminatedByFusion: true,
          category: "activation",
          colorHex: "#FF0",
        },
      ];

      const blocks = allocateMemoryArena(allEliminated, "greedy_size", 128);
      expect(blocks.length).toBe(1);
      expect(blocks[0].isEliminatedByFusion).toBe(true);
      expect(blocks[0].sizeBytes).toBe(0);
    });
  });
});
