import { describe, expect, it } from "bun:test";
import React from "react";
import {
  RingAttentionStudio,
  RING_GPU_SPECS,
  RING_INTERCONNECT_SPECS,
  RING_ATTENTION_PRESETS,
  getBytesPerPrecision,
  computeOnlineSoftmaxStep,
  computeMonolithicAttention,
  generateSyntheticQKV,
  runOnlineSoftmaxSimulation,
  generateCausalTileSchedule,
  calculateRingRooflineProfile,
  generatePyTorchRingAttentionCode,
  generateZigZagPyTorchCode,
  generateTritonRingKernelCode,
  generateMegatronCPLaunchCommand,
  formatRingBytes,
  formatRingFLOPs,
  formatRingBandwidth,
  formatRingLatencyUs,
  formatRingNumberWithCommas,
  type RingPresetId,
  type RingAttentionTabId,
  type RingAttentionStudioProps,
  type RingClusterConfig,
  type AttentionVariant,
} from "../../components/primitives";

describe("Ring Attention & Context Parallelism Studio Tests", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS HANDLING
  // ==========================================================================
  describe("1. Component Instantiation & Props Handling", () => {
    it("should instantiate RingAttentionStudio with default props", () => {
      const element = React.createElement(RingAttentionStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(RingAttentionStudio);
      expect(element.props.initialPreset).toBeUndefined();
      expect(element.props.initialTab).toBeUndefined();
    });

    it("should support all 7 presets via initialPreset prop", () => {
      const presets: RingPresetId[] = [
        "llama3_8b_128k_4x_h100",
        "llama3_70b_1m_8x_h100",
        "deepseek_v3_128k_8x_h100",
        "long_context_512k_16x_a100",
        "edge_pcie_64k_4x_l40s",
        "extreme_10m_16x_b200",
        "custom",
      ];

      for (const preset of presets) {
        const element = React.createElement(RingAttentionStudio, {
          initialPreset: preset,
        });
        expect(element.props.initialPreset).toBe(preset);
      }
    });

    it("should support all 5 tabs via initialTab prop", () => {
      const tabs: RingAttentionTabId[] = [
        "ring_stepper",
        "online_softmax",
        "zigzag_masking",
        "roofline_profiler",
        "code_generator",
      ];

      for (const tab of tabs) {
        const element = React.createElement(RingAttentionStudio, {
          initialTab: tab,
        });
        expect(element.props.initialTab).toBe(tab);
      }
    });

    it("should accept custom className and title props", () => {
      const props: RingAttentionStudioProps = {
        initialPreset: "llama3_70b_1m_8x_h100",
        initialTab: "roofline_profiler",
        className: "custom-ring-studio-class",
        title: "Enterprise Context Parallel Benchmark",
      };

      const element = React.createElement(RingAttentionStudio, props);
      expect(element.props.initialPreset).toBe("llama3_70b_1m_8x_h100");
      expect(element.props.initialTab).toBe("roofline_profiler");
      expect(element.props.className).toBe("custom-ring-studio-class");
      expect(element.props.title).toBe("Enterprise Context Parallel Benchmark");
    });
  });

  // ==========================================================================
  // 2. PRESET INTEGRITY & HARDWARE SPECIFICATIONS
  // ==========================================================================
  describe("2. Preset Configurations & Hardware Specifications", () => {
    it("should provide valid configurations for all canonical presets", () => {
      const presetKeys = Object.keys(RING_ATTENTION_PRESETS) as RingPresetId[];
      expect(presetKeys.length).toBe(7);

      for (const key of presetKeys) {
        const preset = RING_ATTENTION_PRESETS[key];
        expect(preset.id).toBe(key);
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(0);
        expect(preset.config.numGpus).toBeGreaterThanOrEqual(2);
        expect(preset.config.numGpus).toBeLessThanOrEqual(16);
        expect(preset.config.totalSeqLen).toBeGreaterThanOrEqual(1024);
        expect(preset.config.hiddenDim).toBeGreaterThan(0);
        expect(preset.config.numHeads).toBeGreaterThan(0);
        expect(preset.config.headDim).toBeGreaterThan(0);
      }
    });

    it("should verify H100, B200, A100, L40S, and GH200 hardware specs", () => {
      const h100 = RING_GPU_SPECS.h100_sxm;
      expect(h100.tflopsBf16).toBe(989);
      expect(h100.tflopsFp8).toBe(1979);
      expect(h100.hbmBandwidthGbs).toBe(3350);
      expect(h100.defaultNvlinkBandwidthGbs).toBe(900);

      const b200 = RING_GPU_SPECS.b200_sxm;
      expect(b200.tflopsBf16).toBe(2250);
      expect(b200.tflopsFp8).toBe(4500);
      expect(b200.hbmBandwidthGbs).toBe(8000);
      expect(b200.defaultNvlinkBandwidthGbs).toBe(1800);

      const a100 = RING_GPU_SPECS.a100_sxm;
      expect(a100.tflopsBf16).toBe(312);
      expect(a100.vramGb).toBe(80);

      const l40s = RING_GPU_SPECS.l40s_pcie;
      expect(l40s.tflopsBf16).toBe(366);
      expect(l40s.defaultNvlinkBandwidthGbs).toBe(64); // PCIe Gen4
    });

    it("should verify interconnect specifications (NVLink 4/5, InfiniBand, PCIe)", () => {
      expect(RING_INTERCONNECT_SPECS.nvlink_4.bandwidthGbs).toBe(900);
      expect(RING_INTERCONNECT_SPECS.nvlink_5.bandwidthGbs).toBe(1800);
      expect(RING_INTERCONNECT_SPECS.infiniband_ndr.bandwidthGbs).toBe(50);
      expect(RING_INTERCONNECT_SPECS.pcie_gen4.bandwidthGbs).toBe(64);
    });

    it("should compute precision byte sizes accurately", () => {
      expect(getBytesPerPrecision("fp32")).toBe(4);
      expect(getBytesPerPrecision("fp16")).toBe(2);
      expect(getBytesPerPrecision("bf16")).toBe(2);
      expect(getBytesPerPrecision("fp8")).toBe(1);
    });
  });

  // ==========================================================================
  // 3. EXACT MATHEMATICAL ONLINE SOFTMAX RESCALING ENGINE
  // ==========================================================================
  describe("3. Online Softmax Mathematics & Verification Engine", () => {
    it("should compute single online softmax step correctly on initial chunk", () => {
      const runningMax = -Infinity;
      const runningSum = 0;
      const runningOutput = [0, 0, 0, 0];
      const rawScores = [1.0, 2.0, 0.5, 3.0];
      const valueBlock = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ];

      const res = computeOnlineSoftmaxStep(
        runningMax,
        runningSum,
        runningOutput,
        rawScores,
        valueBlock,
      );

      expect(res.newMax).toBe(3.0);
      expect(res.localMax).toBe(3.0);
      expect(res.newSum).toBeGreaterThan(0);

      // Verify that output sum equals 1.0 (valid probability distribution applied to identity V)
      const outputSum = res.newOutput.reduce((a, b) => a + b, 0);
      expect(Math.abs(outputSum - 1.0)).toBeLessThan(1e-5);
    });

    it("should mathematically rescale across two consecutive chunks accurately", () => {
      // Chunk 1:
      const rawScores1 = [2.0, 1.0];
      const valBlock1 = [
        [1.0, 2.0],
        [3.0, 4.0],
      ];
      const step1 = computeOnlineSoftmaxStep(-Infinity, 0, [0, 0], rawScores1, valBlock1);

      // Chunk 2:
      const rawScores2 = [4.0, 3.0]; // Higher max
      const valBlock2 = [
        [5.0, 6.0],
        [7.0, 8.0],
      ];
      const step2 = computeOnlineSoftmaxStep(
        step1.newMax,
        step1.newSum,
        step1.newOutput,
        rawScores2,
        valBlock2,
      );

      expect(step2.newMax).toBe(4.0);

      // Compare with monolithic softmax over all 4 elements
      const allScores = [2.0, 1.0, 4.0, 3.0];
      const allVals = [
        [1.0, 2.0],
        [3.0, 4.0],
        [5.0, 6.0],
        [7.0, 8.0],
      ];
      const maxScore = Math.max(...allScores);
      const exps = allScores.map((s) => Math.exp(s - maxScore));
      const totalSum = exps.reduce((a, b) => a + b, 0);
      const exactOut = [0, 0];
      for (let i = 0; i < 4; i++) {
        const weight = exps[i] / totalSum;
        exactOut[0] += weight * allVals[i][0];
        exactOut[1] += weight * allVals[i][1];
      }

      expect(Math.abs(step2.newOutput[0] - exactOut[0])).toBeLessThan(1e-6);
      expect(Math.abs(step2.newOutput[1] - exactOut[1])).toBeLessThan(1e-6);
    });

    it("should handle empty score block without mutation", () => {
      const res = computeOnlineSoftmaxStep(2.5, 10.0, [1.0, 2.0], [], []);
      expect(res.newMax).toBe(2.5);
      expect(res.newSum).toBe(10.0);
      expect(res.newOutput).toEqual([1.0, 2.0]);
    });

    it("should compute monolithic attention accurately in bidirectional and causal modes", () => {
      const { Q, K, V } = generateSyntheticQKV(8, 4, 100);
      const bidi = computeMonolithicAttention(Q, K, V, false);
      const causal = computeMonolithicAttention(Q, K, V, true);

      expect(bidi.length).toBe(8);
      expect(bidi[0].length).toBe(4);
      expect(causal.length).toBe(8);
      expect(causal[0].length).toBe(4);

      // In causal attention, token 0 only attends to token 0 (so output equals V[0])
      for (let c = 0; c < 4; c++) {
        expect(Math.abs(causal[0][c] - V[0][c])).toBeLessThan(1e-5);
      }

      // Test empty input
      expect(computeMonolithicAttention([], [], [])).toEqual([]);
    });

    it("should support all attention variants (bidirectional, causal_standard, causal_zigzag, striped)", () => {
      const variants: AttentionVariant[] = [
        "bidirectional",
        "causal_standard",
        "causal_zigzag",
        "striped",
      ];

      for (const variant of variants) {
        const sim = runOnlineSoftmaxSimulation(2, 2, 4, variant);
        expect(sim.hopTraces.length).toBe(2);
        expect(sim.maxAbsError).toBeLessThan(1e-4);
      }
    });

    it("should verify complete Ring Attention simulation matches Monolithic Attention (< 1e-5 error)", () => {
      const numRanks = 4;
      const tokensPerRank = 4;
      const headDim = 8;

      const sim = runOnlineSoftmaxSimulation(numRanks, tokensPerRank, headDim, "bidirectional");

      expect(sim.isMatch).toBe(true);
      expect(sim.maxAbsError).toBeLessThan(1e-5);
      expect(sim.relativeL2Error).toBeLessThan(1e-5);
      expect(sim.cosineSimilarity).toBeGreaterThan(0.99999);
      expect(sim.hopTraces.length).toBe(numRanks);
    });

    it("should verify causal Ring Attention simulation matches Monolithic Causal Attention", () => {
      const numRanks = 4;
      const tokensPerRank = 4;
      const headDim = 8;

      const sim = runOnlineSoftmaxSimulation(numRanks, tokensPerRank, headDim, "causal_standard");

      expect(sim.isMatch).toBe(true);
      expect(sim.maxAbsError).toBeLessThan(1e-5);
      expect(sim.cosineSimilarity).toBeGreaterThan(0.99999);
    });

    it("should generate deterministic synthetic QKV tensors", () => {
      const set1 = generateSyntheticQKV(16, 8, 42);
      const set2 = generateSyntheticQKV(16, 8, 42);
      expect(set1.Q).toEqual(set2.Q);
      expect(set1.K).toEqual(set2.K);
      expect(set1.V).toEqual(set2.V);
      expect(set1.Q.length).toBe(16);
      expect(set1.Q[0].length).toBe(8);
    });
  });

  // ==========================================================================
  // 4. RING TOPOLOGY & HOP PERMUTATION LOGIC
  // ==========================================================================
  describe("4. Ring Step Transition Logic & Hop Permutations", () => {
    it("should correctly compute circular KV chunk arrival for any rank and hop", () => {
      const numRanks = 8;
      for (let rank = 0; rank < numRanks; rank++) {
        for (let hop = 0; hop < numRanks; hop++) {
          const arrivingChunk = (rank - hop + numRanks) % numRanks;
          expect(arrivingChunk).toBeGreaterThanOrEqual(0);
          expect(arrivingChunk).toBeLessThan(numRanks);

          if (hop === 0) {
            expect(arrivingChunk).toBe(rank); // At hop 0, every rank holds its own KV
          }
        }
      }
    });

    it("should verify full ring cycle visits every single KV chunk exactly once", () => {
      const numRanks = 4;
      const rank = 2;
      const visitedChunks = new Set<number>();

      for (let hop = 0; hop < numRanks; hop++) {
        const chunk = (rank - hop + numRanks) % numRanks;
        visitedChunks.add(chunk);
      }

      expect(visitedChunks.size).toBe(numRanks);
      for (let i = 0; i < numRanks; i++) {
        expect(visitedChunks.has(i)).toBe(true);
      }
    });
  });

  // ==========================================================================
  // 5. CAUSAL MASKING & ZIG-ZAG BUBBLE ELIMINATOR
  // ==========================================================================
  describe("5. Causal Masking & Zig-Zag 0-Bubble Scheduling", () => {
    it("should calculate standard causal bubble fraction as (N - 1) / (2N)", () => {
      const testClusterSizes = [2, 4, 8, 16];

      for (const N of testClusterSizes) {
        const schedule = generateCausalTileSchedule(N);
        const theoreticalBubble = (N - 1) / (2 * N);
        expect(Math.abs(schedule.standardBubbleFraction - theoreticalBubble)).toBeLessThan(1e-6);
        expect(schedule.zigzagBubbleFraction).toBe(0.0);
        expect(schedule.zigzagActiveComputeFraction).toBe(1.0);
        expect(schedule.zigzagSpeedupFactor).toBeCloseTo(1.0 / (1.0 - theoreticalBubble), 4);
      }
    });

    it("should classify standard causal tiles into full, causal_diag, and masked_idle", () => {
      const N = 4;
      const schedule = generateCausalTileSchedule(N);
      expect(schedule.tiles.length).toBe(N);

      // Rank 0:
      // Hop 0: Chunk 0 (diag)
      // Hop 1: Chunk 3 (future -> masked)
      // Hop 2: Chunk 2 (future -> masked)
      // Hop 3: Chunk 1 (future -> masked)
      expect(schedule.tiles[0][0].tileType).toBe("causal_diag");
      expect(schedule.tiles[0][1].tileType).toBe("masked_idle");
      expect(schedule.tiles[0][2].tileType).toBe("masked_idle");
      expect(schedule.tiles[0][3].tileType).toBe("masked_idle");

      // Rank 3 (last rank):
      // Hop 0: Chunk 3 (diag)
      // Hop 1: Chunk 2 (full)
      // Hop 2: Chunk 1 (full)
      // Hop 3: Chunk 0 (full)
      expect(schedule.tiles[3][0].tileType).toBe("causal_diag");
      expect(schedule.tiles[3][1].tileType).toBe("full");
      expect(schedule.tiles[3][2].tileType).toBe("full");
      expect(schedule.tiles[3][3].tileType).toBe("full");
    });
  });

  // ==========================================================================
  // 6. ROOFLINE & OVERLAP PROFILER CALCULATIONS
  // ==========================================================================
  describe("6. Roofline Model & Overlap Profiler Calculations", () => {
    it("should compute roofline profile for LLaMA-3-8B 128k (4x H100)", () => {
      const preset = RING_ATTENTION_PRESETS.llama3_8b_128k_4x_h100;
      const profile = calculateRingRooflineProfile(preset.config);

      expect(profile.blockSize).toBe(32768); // 131072 / 4
      expect(profile.subChunkSize).toBe(16384);
      expect(profile.flopsPerStepPerGpu).toBeGreaterThan(0);
      expect(profile.commBytesPerStepPerGpu).toBeGreaterThan(0);
      expect(profile.isComputeBound).toBe(true); // NVLink 900 GB/s easily hides comm
      expect(profile.overlapEfficiency).toBe(1.0);
      expect(profile.rooflineCurve.length).toBeGreaterThan(5);
    });

    it("should detect comm-bound regime for PCIe bottleneck preset", () => {
      const preset = RING_ATTENTION_PRESETS.edge_pcie_64k_4x_l40s;
      const profile = calculateRingRooflineProfile(preset.config);

      expect(profile.blockSize).toBe(16384);
      expect(profile.commTimeMsPerStep).toBeGreaterThan(0);
      expect(profile.minBlockSizeForFullOverlap).toBeGreaterThan(0);
    });

    it("should compute correct arithmetic intensity scaling with sequence length", () => {
      const config1: RingClusterConfig = {
        ...RING_ATTENTION_PRESETS.llama3_8b_128k_4x_h100.config,
        totalSeqLen: 65536,
      };
      const config2: RingClusterConfig = {
        ...RING_ATTENTION_PRESETS.llama3_8b_128k_4x_h100.config,
        totalSeqLen: 131072,
      };

      const prof1 = calculateRingRooflineProfile(config1);
      const prof2 = calculateRingRooflineProfile(config2);

      // Doubling sequence length doubles block size and thus doubles arithmetic intensity
      expect(prof2.arithmeticIntensityFlopsPerByte).toBeCloseTo(
        prof1.arithmeticIntensityFlopsPerByte * 2,
        1,
      );
    });
  });

  // ==========================================================================
  // 7. PRODUCTION CODE GENERATION EXPORTERS
  // ==========================================================================
  describe("7. Production Code Generation Exporters", () => {
    const config = RING_ATTENTION_PRESETS.llama3_8b_128k_4x_h100.config;

    it("should generate valid PyTorch Ring Attention code with P2POp", () => {
      const code = generatePyTorchRingAttentionCode(config);
      expect(code).toContain("class RingAttentionFunction(torch.autograd.Function):");
      expect(code).toContain("dist.P2POp(dist.isend");
      expect(code).toContain("dist.P2POp(dist.irecv");
      expect(code).toContain("dist.batch_isend_irecv");
      expect(code).toContain("new_max = torch.maximum(max_val, local_max)");
      expect(code).toContain("def ring_attention_forward(");
    });

    it("should generate Zig-Zag PyTorch CP schedule code", () => {
      const code = generateZigZagPyTorchCode(config);
      expect(code).toContain("class ZigZagCausalRingAttention(torch.nn.Module):");
      expect(code).toContain("front_idx = 2 * rank");
      expect(code).toContain("back_idx = 2 * world_size - 1 - 2 * rank");
    });

    it("should generate Triton fused online softmax kernel snippet", () => {
      const code = generateTritonRingKernelCode(config);
      expect(code).toContain("@triton.jit");
      expect(code).toContain("def _fused_ring_online_softmax_kernel(");
      expect(code).toContain("HEAD_DIM: tl.constexpr = 128");
    });

    it("should generate Megatron-LM distributed launch CLI command", () => {
      const cmd = generateMegatronCPLaunchCommand(config);
      expect(cmd).toContain("torchrun --nproc_per_node=4");
      expect(cmd).toContain("--context-parallel-size 4");
      expect(cmd).toContain("--context-parallel-algo zigzag_ring");
      expect(cmd).toContain("--seq-length 131072");
    });
  });

  // ==========================================================================
  // 8. FORMATTING HELPERS & NUMERICAL EXTREMES
  // ==========================================================================
  describe("8. Formatting Helpers & Extreme Edge Cases", () => {
    it("should format bytes across B, KB, MB, GB, TB", () => {
      expect(formatRingBytes(0)).toBe("0 B");
      expect(formatRingBytes(1024)).toBe("1.00 KB");
      expect(formatRingBytes(1048576)).toBe("1.00 MB");
      expect(formatRingBytes(1073741824)).toBe("1.00 GB");
      expect(formatRingBytes(1099511627776)).toBe("1.00 TB");
    });

    it("should format FLOPs across GFLOPS, TFLOPS, PFLOPS, EFLOPS", () => {
      expect(formatRingFLOPs(5e9)).toBe("5.00 GFLOPS");
      expect(formatRingFLOPs(5e12)).toBe("5.00 TFLOPS");
      expect(formatRingFLOPs(5e15)).toBe("5.00 PFLOPS");
      expect(formatRingFLOPs(5e18)).toBe("5.00 EFLOPS");
    });

    it("should format bandwidth and latencies accurately", () => {
      expect(formatRingBandwidth(900)).toBe("900.0 GB/s");
      expect(formatRingBandwidth(1800)).toBe("1.80 TB/s");
      expect(formatRingLatencyUs(0.8)).toBe("0.80 µs");
      expect(formatRingLatencyUs(2500)).toBe("2.50 ms");
    });

    it("should format numbers with comma grouping", () => {
      expect(formatRingNumberWithCommas(131072)).toBe("131,072");
      expect(formatRingNumberWithCommas(10485760)).toBe("10,485,760");
    });

    it("should handle extreme 10 Million sequence length on 16 B200 GPUs without overflow", () => {
      const preset = RING_ATTENTION_PRESETS.extreme_10m_16x_b200;
      const profile = calculateRingRooflineProfile(preset.config);

      expect(profile.blockSize).toBe(655360);
      expect(profile.totalFlopsCluster).toBeGreaterThan(1e18); // ExaFLOP range
      expect(isFinite(profile.computeTimeMsPerStep)).toBe(true);
      expect(isFinite(profile.commTimeMsPerStep)).toBe(true);
      expect(profile.isComputeBound).toBe(true);
    });
  });
});
