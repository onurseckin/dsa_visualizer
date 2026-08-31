import { describe, expect, it } from "bun:test";
import {
  HARDWARE_TARGETS,
  computeRooflineProfile,
  profileTopicWorkload,
} from "../performanceProfiler";

describe("Visual Performance Profiler & Roofline Model Engine Tests", () => {
  describe("1. Hardware Accelerator & CPU Profiles", () => {
    it("should provide complete specs for all canonical hardware targets", () => {
      const targets = Object.values(HARDWARE_TARGETS);
      expect(targets.length).toBeGreaterThanOrEqual(4);

      for (const target of targets) {
        expect(target.id.length).toBeGreaterThan(0);
        expect(target.name.length).toBeGreaterThan(0);
        expect(target.peakTflopsFp16).toBeGreaterThan(0);
        expect(target.peakTflopsFp32).toBeGreaterThan(0);
        expect(target.peakMemoryBandwidthGBs).toBeGreaterThan(0);
        expect(target.sramCapacityKB).toBeGreaterThan(0);
      }
    });

    it("NVIDIA H100 SXM5 should match Hopper datacenter specifications", () => {
      const h100 = HARDWARE_TARGETS.nvidia_h100_sxm5;
      expect(h100).toBeDefined();
      expect(h100.peakTflopsFp8).toBe(3958.0);
      expect(h100.peakTflopsFp16).toBe(1979.0);
      expect(h100.peakMemoryBandwidthGBs).toBe(3350.0);
      expect(h100.interconnectBandwidthGBs).toBe(900.0);
    });

    it("Apple M3 Max should match unified memory silicon specifications", () => {
      const m3 = HARDWARE_TARGETS.apple_m3_max;
      expect(m3).toBeDefined();
      expect(m3.peakTflopsFp16).toBe(104.0);
      expect(m3.peakMemoryBandwidthGBs).toBe(400.0);
    });
  });

  describe("2. Roofline Model Calculation & Regime Classification", () => {
    it("should compute exact arithmetic intensity and classify memory-bound workloads", () => {
      const h100 = HARDWARE_TARGETS.nvidia_h100_sxm5;
      // Workload: 1000 FLOPs, 10000 Bytes -> I = 0.1 FLOP/byte
      const profile = computeRooflineProfile(1000, 10000, h100, "fp16");

      expect(profile.arithmeticIntensity).toBe(0.1);
      expect(profile.ridgePoint).toBeCloseTo((1979.0 * 1000) / 3350.0, 2);
      expect(profile.operationalRegime).toBe("MEMORY_BOUND");
      expect(profile.attainablePerformanceTflops).toBeCloseTo((0.1 * 3350.0) / 1000, 4);
      expect(profile.bandwidthUtilizationPercent).toBe(100);
      expect(profile.computeUtilizationPercent).toBeLessThan(10);
    });

    it("should compute exact arithmetic intensity and classify compute-bound workloads", () => {
      const h100 = HARDWARE_TARGETS.nvidia_h100_sxm5;
      // Workload: 1e9 FLOPs, 1000 Bytes -> I = 1e6 FLOP/byte >> Ridge Point
      const profile = computeRooflineProfile(1e9, 1000, h100, "fp16");

      expect(profile.arithmeticIntensity).toBe(1e6);
      expect(profile.operationalRegime).toBe("COMPUTE_BOUND");
      expect(profile.attainablePerformanceTflops).toBe(1979.0); // Capped by peak compute
      expect(profile.computeUtilizationPercent).toBe(100);
    });

    it("should adjust ridge points and attainable performance across precision formats", () => {
      const h100 = HARDWARE_TARGETS.nvidia_h100_sxm5;
      const flops = 1e6;
      const bytes = 1e4; // I = 100 FLOP/byte

      const fp8Profile = computeRooflineProfile(flops, bytes, h100, "fp8");
      const fp16Profile = computeRooflineProfile(flops, bytes, h100, "fp16");
      const fp32Profile = computeRooflineProfile(flops, bytes, h100, "fp32");

      expect(fp8Profile.peakComputeTflops).toBe(3958.0);
      expect(fp16Profile.peakComputeTflops).toBe(1979.0);
      expect(fp32Profile.peakComputeTflops).toBe(67.0);

      // FP32 with I=100 is compute bound because Ridge Point = 67*1000 / 3350 = 20 FLOP/byte
      expect(fp32Profile.operationalRegime).toBe("COMPUTE_BOUND");
      expect(fp32Profile.attainablePerformanceTflops).toBe(67.0);
    });
  });

  describe("3. Topic Workload Profiling & Architectural Insights", () => {
    it("FlashAttention-2 should demonstrate massive memory traffic reduction vs Standard Attention", () => {
      const comparison = profileTopicWorkload("flash_attention_vs_standard");

      expect(comparison.workloadName).toContain("FlashAttention-2");
      expect(comparison.naiveProfile.operationalRegime).toBe("MEMORY_BOUND");
      expect(comparison.memoryTrafficReductionRatio).toBeGreaterThan(10);
      expect(comparison.speedup).toBeGreaterThan(1.5);
      expect(comparison.insights.length).toBeGreaterThanOrEqual(3);
    });

    it("Prefill vs Decode should reveal GEMM compute-bound vs GEMV memory-bound disparity", () => {
      const comparison = profileTopicWorkload("prefill_vs_decode");

      expect(comparison.naiveProfile.operationalRegime).toBe("MEMORY_BOUND"); // Decode
      expect(comparison.optimizedProfile.operationalRegime).toBe("COMPUTE_BOUND"); // Prefill
      expect(comparison.optimizedProfile.attainablePerformanceTflops).toBeGreaterThan(
        comparison.naiveProfile.attainablePerformanceTflops * 10,
      );
    });

    it("Dense GEMM tiling should boost arithmetic intensity and Tensor Core saturation", () => {
      const comparison = profileTopicWorkload("dense_gemm_tiling");

      expect(comparison.naiveProfile.operationalRegime).toBe("MEMORY_BOUND");
      expect(comparison.optimizedProfile.operationalRegime).toBe("COMPUTE_BOUND");
      expect(comparison.optimizedProfile.attainablePerformanceTflops).toBe(1979.0);
      expect(comparison.speedup).toBeGreaterThan(20);
    });

    it("Ring-AllReduce should demonstrate constant bandwidth scaling across ranks", () => {
      const comparison = profileTopicWorkload("ring_allreduce");

      expect(comparison.workloadName).toContain("Ring-AllReduce");
      expect(comparison.memoryTrafficReductionRatio).toBeGreaterThan(3);
      expect(comparison.speedup).toBeGreaterThan(3);
    });

    it("PagedAttention should demonstrate fragmentation elimination", () => {
      const comparison = profileTopicWorkload("paged_attention_vllm");

      expect(comparison.workloadName).toContain("PagedAttention");
      expect(comparison.insights.some((i) => i.includes("PagedAttention"))).toBe(true);
    });
  });
});
