import { describe, expect, it } from "bun:test";
import React from "react";
import {
  KVCacheCompressionStudio,
  KV_CACHE_GPU_SPECS,
  KV_CACHE_PRESETS,
  calculateKvCacheMemoryBytes,
  calculateGroupQuantizationParams,
  simulateStreamingEviction,
  calculateServingCapacityAndLatency,
  formatBytes,
  formatNumberWithCommas,
  formatLatencyMs,
  formatBandwidthGbps,
  formatTflops,
  generateTritonQuantizedKvKernel,
  generateVllmServingConfig,
  generatePyTorchStreamingCacheReference,
  generateCudaDequantHeader,
  type KVCachePresetId,
  type KVCacheTabId,
  type KVCacheStudioProps,
  type INT4GroupSize,
} from "../../components/primitives/KVCacheCompressionStudio";

describe("KV Cache Compression & Quantization Studio (CS336 / MIT 6.5940)", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS HANDLING
  // ==========================================================================
  describe("1. Component Instantiation & Props Handling", () => {
    it("should instantiate KVCacheCompressionStudio with default props", () => {
      const element = React.createElement(KVCacheCompressionStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(KVCacheCompressionStudio);
      expect(element.props.initialPreset).toBeUndefined();
      expect(element.props.initialTab).toBeUndefined();
    });

    it("should support all 8 presets via initialPreset prop", () => {
      const presets: KVCachePresetId[] = [
        "llama3_8b_gqa",
        "llama3_70b_gqa",
        "mistral_7b_gqa",
        "deepseek_v3_mla",
        "falcon_40b_mqa",
        "gpt3_175b_mha",
        "qwen25_72b_gqa",
        "custom",
      ];

      for (const preset of presets) {
        const element = React.createElement(KVCacheCompressionStudio, {
          initialPreset: preset,
        });
        expect(element.props.initialPreset).toBe(preset);
      }
    });

    it("should support all 5 tabs via initialTab prop", () => {
      const tabs: KVCacheTabId[] = [
        "architecture_footprint",
        "quantization_lab",
        "streaming_eviction",
        "serving_capacity",
        "kernel_code_gen",
      ];

      for (const tab of tabs) {
        const element = React.createElement(KVCacheCompressionStudio, {
          initialTab: tab,
        });
        expect(element.props.initialTab).toBe(tab);
      }
    });

    it("should accept custom className, title, and initialGpu props", () => {
      const props: KVCacheStudioProps = {
        initialPreset: "deepseek_v3_mla",
        initialTab: "serving_capacity",
        initialGpu: "b200",
        className: "custom-kv-studio-root",
        title: "Enterprise Multi-Tenant KV Profiler",
      };

      const element = React.createElement(KVCacheCompressionStudio, props);
      expect(element.props.initialPreset).toBe("deepseek_v3_mla");
      expect(element.props.initialTab).toBe("serving_capacity");
      expect(element.props.initialGpu).toBe("b200");
      expect(element.props.className).toBe("custom-kv-studio-root");
      expect(element.props.title).toBe("Enterprise Multi-Tenant KV Profiler");
    });
  });

  // ==========================================================================
  // 2. KV CACHE MEMORY FOOTPRINT & ARCHITECTURAL COMPARISONS
  // ==========================================================================
  describe("2. KV Cache Memory Footprint & Mathematical Precision", () => {
    it("should compute exact bytes for GPT-3 175B Standard MHA (FP16)", () => {
      // GPT-3 175B: B=1, S=2048, L=96, H_Q=96, H_KV=96, d_k=128, FP16 (2 bytes)
      // Elements per token per layer = 2 * 96 * 128 = 24,576
      // Elements per token all layers = 24,576 * 96 = 2,359,296
      // Total elements = 1 * 2048 * 2,359,296 = 4,831,838,208
      // Total bytes = 4,831,838,208 * 2 = 9,663,676,416 bytes
      const res = calculateKvCacheMemoryBytes(1, 2048, 96, 96, 96, 128, "fp16", "mha");

      expect(res.elementsPerTokenPerLayer).toBe(24576);
      expect(res.totalElements).toBe(4831838208);
      expect(res.totalBytes).toBe(9663676416);
      expect(res.compressionRatioVsFp16Mha).toBe(1.0);
    });

    it("should compute exact 4:1 compression for Llama-3-8B GQA (FP16)", () => {
      // Llama-3-8B: B=16, S=8192, L=32, H_Q=32, H_KV=8, d_k=128, FP16
      // Elements per token per layer = 2 * 8 * 128 = 2048
      // Total elements = 16 * 8192 * 32 * 2048 = 8,589,934,592
      // Total bytes = 8,589,934,592 * 2 = 17,179,869,184 bytes (16 GiB)
      const res = calculateKvCacheMemoryBytes(16, 8192, 32, 32, 8, 128, "fp16", "gqa");

      expect(res.elementsPerTokenPerLayer).toBe(2048);
      expect(res.totalElements).toBe(8589934592);
      expect(res.totalBytes).toBe(17179869184);
      expect(res.compressionRatioVsFp16Mha).toBe(4.0);
    });

    it("should compute exact 128:1 compression for Falcon-40B MQA (FP16)", () => {
      // Falcon-40B: B=1, S=2048, L=60, H_Q=128, H_KV=1, d_k=64
      // Elements per token per layer = 2 * 1 * 64 = 128
      const res = calculateKvCacheMemoryBytes(1, 2048, 60, 128, 1, 64, "fp16", "mqa");

      expect(res.elementsPerTokenPerLayer).toBe(128);
      expect(res.compressionRatioVsFp16Mha).toBe(128.0);
    });

    it("should compute exact 56.88x architectural compression for DeepSeek-V3 MLA", () => {
      // DeepSeek-V3 MLA: d_c=512, d_r=64 -> 576 floats per token per layer
      // Standard MHA baseline with H_Q=128, d_k=128 -> 2 * 128 * 128 = 32,768 floats
      // Compression ratio = 32768 / 576 = 56.8888...
      const res = calculateKvCacheMemoryBytes(1, 8192, 61, 128, 128, 128, "fp16", "mla", 512, 64);

      expect(res.elementsPerTokenPerLayer).toBe(576);
      expect(res.compressionRatioVsFp16Mha).toBeCloseTo(32768 / 576, 3);
    });

    it("should compute INT4 group-wise effective bits and metadata overhead", () => {
      // Symmetric INT4 with group size 64: 4 + 16/64 = 4.25 bits/weight
      const resSym64 = calculateKvCacheMemoryBytes(
        1,
        1024,
        32,
        32,
        8,
        128,
        "int4",
        "gqa",
        512,
        64,
        64,
        false,
      );
      expect(resSym64.bitsPerWeight).toBe(4.25);

      // Asymmetric INT4 with group size 64: 4 + 32/64 = 4.50 bits/weight
      const resAsym64 = calculateKvCacheMemoryBytes(
        1,
        1024,
        32,
        32,
        8,
        128,
        "int4",
        "gqa",
        512,
        64,
        64,
        true,
      );
      expect(resAsym64.bitsPerWeight).toBe(4.5);

      // Symmetric INT4 with group size 32: 4 + 16/32 = 4.50 bits/weight
      const resSym32 = calculateKvCacheMemoryBytes(
        1,
        1024,
        32,
        32,
        8,
        128,
        "int4",
        "gqa",
        512,
        64,
        32,
        false,
      );
      expect(resSym32.bitsPerWeight).toBe(4.5);

      // Symmetric INT4 with group size 128: 4 + 16/128 = 4.125 bits/weight
      const resSym128 = calculateKvCacheMemoryBytes(
        1,
        1024,
        32,
        32,
        8,
        128,
        "int4",
        "gqa",
        512,
        64,
        128,
        false,
      );
      expect(resSym128.bitsPerWeight).toBe(4.125);
    });

    it("should handle edge cases with 0 sequence length, 0 batch size, or 0 layers", () => {
      const resSeqZero = calculateKvCacheMemoryBytes(1, 0, 32, 32, 8, 128, "fp16");
      expect(resSeqZero.totalBytes).toBe(0);
      expect(resSeqZero.totalElements).toBe(0);
      expect(resSeqZero.compressionRatioVsFp16Mha).toBe(1);

      const resBatchZero = calculateKvCacheMemoryBytes(0, 1024, 32, 32, 8, 128, "fp16");
      expect(resBatchZero.totalBytes).toBe(0);
      expect(resBatchZero.totalElements).toBe(0);

      const resLayersZero = calculateKvCacheMemoryBytes(1, 1024, 0, 32, 8, 128, "fp16");
      expect(resLayersZero.totalBytes).toBe(0);
      expect(resLayersZero.totalElements).toBe(0);
    });
  });

  // ==========================================================================
  // 3. QUANTIZATION LAB ENGINE & RECONSTRUCTION ACCURACY
  // ==========================================================================
  describe("3. Quantization Lab Engine & Outlier Resilience", () => {
    const testVector = [
      0.5, -1.2, 2.4, -0.8, 1.1, -2.9, 0.1, 3.2, -0.4, 1.8, -1.5, 0.9, 8.8, -0.2, 1.4, -3.1,
    ];

    it("should return high fidelity for FP16 and FP32 pass-through", () => {
      const resFp16 = calculateGroupQuantizationParams(testVector, "fp16");
      expect(resFp16.snrDb).toBeGreaterThan(60);
      expect(resFp16.cosineSim).toBeGreaterThan(0.9999);
      expect(resFp16.mse).toBeLessThan(1e-4);
      expect(resFp16.effectiveBitsPerWeight).toBe(16);
      expect(resFp16.compressionRatio).toBe(1.0);
    });

    it("should perform valid INT8 Symmetric quantization with scale and zero points", () => {
      const resInt8Sym = calculateGroupQuantizationParams(testVector, "int8", "symmetric");
      expect(resInt8Sym.scales.length).toBe(1);
      expect(resInt8Sym.zeroPoints[0]).toBe(0);
      expect(resInt8Sym.scales[0]).toBeCloseTo(8.8 / 127.0, 3);
      expect(resInt8Sym.cosineSim).toBeGreaterThan(0.99);
      expect(resInt8Sym.snrDb).toBeGreaterThan(25);
      expect(resInt8Sym.effectiveBitsPerWeight).toBe(8);
      expect(resInt8Sym.compressionRatio).toBe(2.0);
    });

    it("should perform valid INT8 Asymmetric quantization with correct zero-point shift", () => {
      const resInt8Asym = calculateGroupQuantizationParams(testVector, "int8", "asymmetric");
      expect(resInt8Asym.scales.length).toBe(1);
      expect(resInt8Asym.zeroPoints[0]).toBeGreaterThan(0);
      expect(resInt8Asym.cosineSim).toBeGreaterThan(0.99);
      expect(resInt8Asym.snrDb).toBeGreaterThan(25);
    });

    it("should perform valid Group-Wise INT4 quantization across group sizes", () => {
      const groupSizes: INT4GroupSize[] = [16, 32, 64, 128, 256];
      for (const g of groupSizes) {
        const res = calculateGroupQuantizationParams(testVector, "int4", "symmetric", g);
        expect(res.quantized.length).toBe(testVector.length);
        expect(res.dequantized.length).toBe(testVector.length);
        expect(res.effectiveBitsPerWeight).toBeCloseTo(4 + 16 / g, 4);
        expect(res.cosineSim).toBeGreaterThan(0.95);
      }
    });

    it("should correctly quantize to FP8 E4M3 and FP8 E5M2", () => {
      const resE4M3 = calculateGroupQuantizationParams(testVector, "fp8_e4m3");
      expect(resE4M3.scales.length).toBe(1);
      expect(resE4M3.cosineSim).toBeGreaterThan(0.98);
      expect(resE4M3.effectiveBitsPerWeight).toBe(8);

      const resE5M2 = calculateGroupQuantizationParams(testVector, "fp8_e5m2");
      expect(resE5M2.scales.length).toBe(1);
      expect(resE5M2.cosineSim).toBeGreaterThan(0.95);
      expect(resE5M2.effectiveBitsPerWeight).toBe(8);
    });

    it("should correctly quantize to discrete FP4 E2M1 codebook levels", () => {
      const resFp4 = calculateGroupQuantizationParams(testVector, "fp4", "symmetric", 16);
      expect(resFp4.quantized.length).toBe(testVector.length);
      expect(resFp4.effectiveBitsPerWeight).toBe(5); // 4 + 16/16 = 5
      expect(resFp4.cosineSim).toBeGreaterThan(0.9);
    });

    it("should detect outlier indices with activation spikes", () => {
      const outlierVector = new Array(64).fill(0.2);
      outlierVector[12] = 8.5; // Outlier
      outlierVector[45] = -9.0; // Outlier

      const res = calculateGroupQuantizationParams(outlierVector, "int4", "symmetric", 16);
      expect(res.outlierIndices).toContain(12);
      expect(res.outlierIndices).toContain(45);
    });

    it("should handle empty vector gracefully", () => {
      const emptyRes = calculateGroupQuantizationParams([], "int4");
      expect(emptyRes.original.length).toBe(0);
      expect(emptyRes.quantized.length).toBe(0);
      expect(emptyRes.mse).toBe(0);
      expect(emptyRes.snrDb).toBe(100);
      expect(emptyRes.cosineSim).toBe(1);
    });
  });

  // ==========================================================================
  // 4. STREAMING EVICTION & ATTENTION SINKS SIMULATOR
  // ==========================================================================
  describe("4. Streaming Eviction & Attention Sinks Simulator", () => {
    it("should preserve initial sink tokens permanently under StreamingLLM", () => {
      const sim = simulateStreamingEviction(48, 16, 4, "streaming_llm", 1024);

      expect(sim.steps.length).toBe(48);
      expect(sim.maxCapacity).toBe(16);
      expect(sim.sinkTokens).toBe(4);

      // At step 40 (far beyond cache budget 16), tokens 0, 1, 2, 3 must be retained as sinks
      const step40 = sim.steps[40];
      expect(step40.cachedTokenIndices).toContain(0);
      expect(step40.cachedTokenIndices).toContain(1);
      expect(step40.cachedTokenIndices).toContain(2);
      expect(step40.cachedTokenIndices).toContain(3);

      expect(step40.tokenRoles[0]).toBe("sink");
      expect(step40.tokenRoles[1]).toBe("sink");
      expect(step40.tokenRoles[2]).toBe("sink");
      expect(step40.tokenRoles[3]).toBe("sink");

      // Intermediate tokens should be evicted
      expect(step40.tokenRoles[10]).toBe("evicted");

      // Total cached count should equal cache budget
      expect(step40.cachedTokenIndices.length).toBe(16);

      // Perplexity should stay stable (< 5.0)
      expect(step40.perplexity).toBeLessThan(5.0);
    });

    it("should simulate catastrophic perplexity explosion under LRU window without sinks", () => {
      const sim = simulateStreamingEviction(48, 16, 4, "lru_window", 1024);

      // At step 40 (beyond budget 16), tokens 0, 1, 2, 3 must be evicted!
      const step40 = sim.steps[40];
      expect(step40.tokenRoles[0]).toBe("evicted");
      expect(step40.tokenRoles[1]).toBe("evicted");
      expect(step40.cachedTokenIndices).not.toContain(0);
      expect(step40.cachedTokenIndices).not.toContain(1);

      // Perplexity must blow up exponentially (> 50)
      expect(step40.perplexity).toBeGreaterThan(50.0);
    });

    it("should maintain low perplexity and prioritize heavy hitters in H2O", () => {
      const sim = simulateStreamingEviction(48, 16, 4, "h2o", 1024);

      const step40 = sim.steps[40];
      expect(step40.cachedTokenIndices).toContain(0); // Sinks kept
      expect(step40.perplexity).toBeLessThan(5.0);

      // Check if some heavy hitters are present
      const hasHeavyHitter = Object.values(step40.tokenRoles).some(
        (role) => role === "heavy_hitter",
      );
      expect(hasHeavyHitter).toBe(true);
    });

    it("should retain all tokens under Full Cache policy with linear memory growth", () => {
      const sim = simulateStreamingEviction(48, 16, 4, "full_cache", 1024);

      const step40 = sim.steps[40];
      expect(step40.cachedTokenIndices.length).toBe(41); // 0 to 40
      expect(step40.cacheMemoryBytes).toBe(41 * 1024);
      expect(step40.perplexity).toBeLessThan(4.5);
    });
  });

  // ==========================================================================
  // 5. GPU SERVING CAPACITY & ROOFLINE ESTIMATOR
  // ==========================================================================
  describe("5. GPU Serving Capacity & Roofline Latency Estimator", () => {
    it("should compute valid VRAM waterfall and max concurrency on H100 SXM", () => {
      const h100 = KV_CACHE_GPU_SPECS.h100_sxm;
      const llama3_8b = KV_CACHE_PRESETS.llama3_8b_gqa.config;

      const result = calculateServingCapacityAndLatency(
        h100,
        llama3_8b,
        "fp16",
        64,
        false,
        2048,
        512,
        0.9,
        2.5,
        16,
      );

      expect(result.waterfall.totalVramGb).toBe(80);
      expect(result.waterfall.modelWeightsGb).toBeCloseTo(16.06, 1);
      expect(result.waterfall.availableKvGb).toBeGreaterThan(45);
      expect(result.waterfall.maxConcurrentRequests).toBeGreaterThan(20);
      expect(result.waterfall.pagedBlocks).toBeGreaterThan(1000);
      expect(result.waterfall.internalFragmentationPct).toBeLessThan(3.0);

      expect(result.performance.ttftMs).toBeGreaterThan(0);
      expect(result.performance.tpotMs).toBeGreaterThan(0);
      expect(result.performance.throughputTokensSec).toBeGreaterThan(0);
    });

    it("should show dramatic concurrency increase for INT4 vs FP16", () => {
      const a100 = KV_CACHE_GPU_SPECS.a100_80gb;
      const qwen25 = KV_CACHE_PRESETS.qwen25_72b_gqa.config;

      const fp16Res = calculateServingCapacityAndLatency(
        a100,
        qwen25,
        "fp16",
        64,
        false,
        2048,
        512,
      );

      const int4Res = calculateServingCapacityAndLatency(
        a100,
        qwen25,
        "int4",
        64,
        false,
        2048,
        512,
      );

      // INT4 allows higher concurrent capacity because weights & KV cache are 4x smaller
      expect(int4Res.waterfall.maxConcurrentRequests).toBeGreaterThan(
        fp16Res.waterfall.maxConcurrentRequests,
      );
    });

    it("should verify DeepSeek-V3 MLA serving capacity on B200 SXM", () => {
      const b200 = KV_CACHE_GPU_SPECS.b200;
      const deepseek_v3 = KV_CACHE_PRESETS.deepseek_v3_mla.config;

      const result = calculateServingCapacityAndLatency(
        b200,
        deepseek_v3,
        "fp8_e4m3",
        64,
        false,
        4096,
        1024,
      );

      expect(result.waterfall.totalVramGb).toBe(192);
      expect(result.waterfall.kvPerRequestMb).toBeGreaterThan(0);
      expect(result.performance.throughputTokensSec).toBeGreaterThan(100);
    });
  });

  // ==========================================================================
  // 6. CODE GENERATOR ENGINES
  // ==========================================================================
  describe("6. Exportable Kernel & Configuration Generators", () => {
    it("should generate valid OpenAI Triton fused quantized KV kernel", () => {
      const code = generateTritonQuantizedKvKernel("gqa", "int4", 64, false);

      expect(code).toContain("@triton.jit");
      expect(code).toContain("def _fused_dequant_kv_attention_decode_kernel");
      expect(code).toContain("HEAD_RATIO: tl.constexpr = NUM_HEADS_Q // NUM_HEADS_KV");
      expect(code).toContain("pid_head_kv = pid_head_q // HEAD_RATIO");
      expect(code).toContain("tl.load");
      expect(code).toContain("tl.store");
      expect(code).toContain("tl.exp");
      expect(code).toContain("Fast INT4 Nibble Unpacking");
    });

    it("should generate valid vLLM serving launch CLI command and python script", () => {
      const code = generateVllmServingConfig(
        "llama3_70b_gqa",
        "h100_sxm",
        "fp8_e4m3",
        64,
        8192,
        0.92,
        128,
      );

      expect(code).toContain("vllm serve meta-llama/Meta-Llama-3-70B-Instruct");
      expect(code).toContain("--gpu-memory-utilization 0.92");
      expect(code).toContain("--max-model-len 8192");
      expect(code).toContain("--max-num-seqs 128");
      expect(code).toContain("--kv-cache-dtype fp8_e4m3");
      expect(code).toContain("--block-size 16");
      expect(code).toContain("AsyncLLMEngine.from_engine_args");
    });

    it("should generate valid PyTorch StreamingKVCache reference implementation", () => {
      const code = generatePyTorchStreamingCacheReference(4, 1024, 32, 8, 128);

      expect(code).toContain("class StreamingKVCache:");
      expect(code).toContain("num_sink_tokens: int = 4");
      expect(code).toContain("window_size: int = 1024");
      expect(code).toContain("self.num_sink_tokens = num_sink_tokens");
      expect(code).toContain("def update(");
      expect(code).toContain("k_cat[:, :, :self.num_sink_tokens, :]");
      expect(code).toContain("k_cat[:, :, -self.window_size:, :]");
      expect(code).toContain("torch.cat([k_sinks, k_window], dim=2)");
    });

    it("should generate valid CUDA C++ dequantization header", () => {
      const code = generateCudaDequantHeader("int4", 64, false);

      expect(code).toContain("#pragma once");
      expect(code).toContain("namespace ml_systems");
      expect(code).toContain("__device__ __forceinline__ half2 dequantize_int4_packed_half2");
      expect(code).toContain("__shfl_down_sync");
      expect(code).toContain("__hmul2");
    });
  });

  // ==========================================================================
  // 7. FORMATTING HELPERS & GPU REGISTRY
  // ==========================================================================
  describe("7. Formatting Utilities & GPU Registry Integrity", () => {
    it("should format bytes accurately across units", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(512)).toBe("512.0 B");
      expect(formatBytes(1024)).toBe("1.00 KB");
      expect(formatBytes(1048576)).toBe("1.00 MB");
      expect(formatBytes(1073741824)).toBe("1.00 GB");
      expect(formatBytes(1099511627776)).toBe("1.00 TB");
    });

    it("should format numbers with comma separation", () => {
      expect(formatNumberWithCommas(1234)).toBe("1,234");
      expect(formatNumberWithCommas(1234567)).toBe("1,234,567");
      expect(formatNumberWithCommas(0)).toBe("0");
    });

    it("should format latency in µs, ms, and seconds", () => {
      expect(formatLatencyMs(0.25)).toBe("250.0 µs");
      expect(formatLatencyMs(12.34)).toBe("12.34 ms");
      expect(formatLatencyMs(1250)).toBe("1.25 s");
    });

    it("should format bandwidth and TFLOPS", () => {
      expect(formatBandwidthGbps(3350)).toBe("3,350 GB/s");
      expect(formatTflops(1979)).toBe("1,979 TFLOPS");
    });

    it("should verify hardware specs for all 6 GPUs", () => {
      const gpuKeys = ["h100_sxm", "a100_80gb", "b200", "rtx_4090", "l40s", "m3_max"];
      for (const key of gpuKeys) {
        const spec = KV_CACHE_GPU_SPECS[key];
        expect(spec).toBeDefined();
        expect(spec.vramGb).toBeGreaterThan(0);
        expect(spec.hbmBandwidthGbs).toBeGreaterThan(0);
        expect(spec.tflopsFp16).toBeGreaterThan(0);
        expect(spec.smCount).toBeGreaterThan(0);
      }
    });

    it("should verify model specs for all 8 presets", () => {
      const presetKeys: KVCachePresetId[] = [
        "llama3_8b_gqa",
        "llama3_70b_gqa",
        "mistral_7b_gqa",
        "deepseek_v3_mla",
        "falcon_40b_mqa",
        "gpt3_175b_mha",
        "qwen25_72b_gqa",
        "custom",
      ];
      for (const key of presetKeys) {
        const preset = KV_CACHE_PRESETS[key];
        expect(preset).toBeDefined();
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.config.layers).toBeGreaterThan(0);
        expect(preset.config.numHeads).toBeGreaterThan(0);
      }
    });
  });
});
