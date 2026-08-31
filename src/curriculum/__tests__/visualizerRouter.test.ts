import { describe, expect, it } from "bun:test";
import { ALL_COURSE_JOURNEYS } from "../catalog";
import {
  resolveVisualizerForTopic,
  validateCurriculumVisualizerCoverage,
} from "../visualizerRouter";

describe("Visualizer Router & Primary Stage Dispatch Engine Tests", () => {
  describe("1. Master Curriculum Coverage & Reachability", () => {
    it("validateCurriculumVisualizerCoverage should confirm 100% resolution across all 64 courses", () => {
      const report = validateCurriculumVisualizerCoverage();

      expect(report.totalCourses).toBe(64);
      expect(report.coveredCourses).toBe(64);
      expect(report.allCovered).toBe(true);
      expect(report.issues).toEqual([]);
    });

    it("every course journey in ALL_COURSE_JOURNEYS must resolve to a valid component", () => {
      for (const journey of ALL_COURSE_JOURNEYS) {
        const route = resolveVisualizerForTopic(journey.id);

        expect(route).toBeDefined();
        expect(route.componentName.length).toBeGreaterThan(0);
        expect(route.defaultDimensions.width).toBeGreaterThanOrEqual(800);
        expect(route.defaultDimensions.height).toBeGreaterThanOrEqual(480);
        expect(route.supportedControls.hasStepSlider).toBe(true);
        expect(route.supportedControls.hasInteractiveCanvas).toBe(true);
      }
    });
  });

  describe("2. Signature Component Routing & Category Classification", () => {
    it("should route FlashAttention to FlashAttentionTileVisualizer", () => {
      const route = resolveVisualizerForTopic("ml_flashattention_sram_tiling");
      expect(route.componentName).toBe("FlashAttentionTileVisualizer");
      expect(route.category).toBe("ml_systems");
      expect(route.hasMemoryTraceOverlay).toBe(true);
    });

    it("should route Ring-AllReduce and ZeRO-3 to RingAllReduceVisualizer", () => {
      const ringRoute = resolveVisualizerForTopic("ml_ring_allreduce_collective");
      expect(ringRoute.componentName).toBe("RingAllReduceVisualizer");
      expect(ringRoute.category).toBe("distributed");

      const zeroRoute = resolveVisualizerForTopic("ml_zero3_parameter_sharding");
      expect(zeroRoute.componentName).toBe("RingAllReduceVisualizer");
      expect(zeroRoute.category).toBe("distributed");
    });

    it("should route PagedAttention to PagedAttentionBlockVisualizer", () => {
      const route = resolveVisualizerForTopic("ml_pagedattention_cow_vllm");
      expect(route.componentName).toBe("PagedAttentionBlockVisualizer");
      expect(route.category).toBe("ml_systems");
    });

    it("should route Dinic Max-Flow to DinicFlowVisualizer", () => {
      const route = resolveVisualizerForTopic("dsa_graph_flows_and_cuts");
      expect(route.componentName).toBe("DinicFlowVisualizer");
      expect(route.category).toBe("dsa_primitive");
    });

    it("should route Fenwick Tree to FenwickTreeVisualizer", () => {
      const route = resolveVisualizerForTopic("dsa_advanced_range_queries");
      expect(route.componentName).toBe("FenwickTreeVisualizer");
      expect(route.category).toBe("dsa_primitive");
    });

    it("should route Convex Hull Sweep to ConvexHullSweepVisualizer", () => {
      const route = resolveVisualizerForTopic("dsa_geometry_and_sweep_line");
      expect(route.componentName).toBe("ConvexHullSweepVisualizer");
      expect(route.category).toBe("dsa_primitive");
    });

    it("should route Attention SDPA and RoPE to AttentionMapVisualizer", () => {
      const sdpa = resolveVisualizerForTopic("ml_attention_causal_sdpa");
      expect(sdpa.componentName).toBe("AttentionMapVisualizer");

      const rope = resolveVisualizerForTopic("ml_rope_gqa_attention");
      expect(rope.componentName).toBe("AttentionMapVisualizer");
    });

    it("should route Affine Quantization to QuantizationVisualizer", () => {
      const route = resolveVisualizerForTopic("ml_affine_quantization_int8");
      expect(route.componentName).toBe("QuantizationVisualizer");
      expect(route.category).toBe("ml_systems");
    });
  });

  describe("3. Shorthand & Prefix Resolution Resilience", () => {
    it("should resolve shorthand IDs without dsa_ or ml_ prefix", () => {
      const flash = resolveVisualizerForTopic("flashattention_sram_tiling");
      expect(flash.componentName).toBe("FlashAttentionTileVisualizer");

      const flow = resolveVisualizerForTopic("graph_flows_and_cuts");
      expect(flow.componentName).toBe("DinicFlowVisualizer");

      const paged = resolveVisualizerForTopic("pagedattention_cow_vllm");
      expect(paged.componentName).toBe("PagedAttentionBlockVisualizer");
    });

    it("should return a resilient default fallback for unknown topic IDs", () => {
      const unknownDsa = resolveVisualizerForTopic("dsa_unknown_future_algo");
      expect(unknownDsa).toBeDefined();
      expect(unknownDsa.componentName).toBe("ArrayVisualizer");
      expect(unknownDsa.category).toBe("dsa_primitive");

      const unknownMl = resolveVisualizerForTopic("ml_quantum_transformer");
      expect(unknownMl).toBeDefined();
      expect(unknownMl.componentName).toBe("MatrixVisualizer");
      expect(unknownMl.category).toBe("ml_systems");
    });
  });
});
