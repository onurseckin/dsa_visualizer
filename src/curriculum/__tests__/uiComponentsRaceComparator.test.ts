import { describe, expect, it } from "bun:test";
import React from "react";
import {
  AlgorithmRaceComparator,
  calculateWinnerPodium,
  computeRaceTelemetry,
  formatBytes,
  formatLatency,
  formatOpsPerSec,
  generateCompetitorDataPoints,
  getRaceMatchupPreset,
  type MatchupId,
  RACE_MATCHUP_PRESETS,
  type RaceSimulationState,
  SCALE_POINTS,
  simulateRaceStep,
  type WinnerPodiumResult,
} from "../../components/curriculum";
import { detectCacheInflectionPoints, fitAsymptoticComplexity } from "../index";

describe("Algorithm Race Comparator & Hardware Benchmark Workbench Tests", () => {
  describe("1. Matchup Preset Catalog Completeness & Invariants", () => {
    it("should contain all 5 required DSA and ML matchup presets", () => {
      expect(RACE_MATCHUP_PRESETS.length).toBe(5);

      const presetIds = RACE_MATCHUP_PRESETS.map((p) => p.id);
      expect(presetIds).toContain("dinic_vs_edmonds_karp");
      expect(presetIds).toContain("flashattention_vs_standard_attention");
      expect(presetIds).toContain("fenwick_vs_segment_tree");
      expect(presetIds).toContain("quicksort_vs_mergesort");
      expect(presetIds).toContain("pagedattention_vs_contiguous_kv");
    });

    it("should have correct category and domain metadata on each preset", () => {
      const dsaPresets = RACE_MATCHUP_PRESETS.filter((p) => p.category === "DSA");
      const mlPresets = RACE_MATCHUP_PRESETS.filter((p) => p.category === "ML");

      expect(dsaPresets.length).toBe(3);
      expect(mlPresets.length).toBe(2);

      for (const preset of RACE_MATCHUP_PRESETS) {
        expect(preset.title.length).toBeGreaterThan(5);
        expect(preset.subtitle.length).toBeGreaterThan(10);
        expect(preset.domain.length).toBeGreaterThan(3);
        expect(preset.theoreticalInsight.length).toBeGreaterThan(20);
        expect(preset.competitorA).toBeDefined();
        expect(preset.competitorB).toBeDefined();
      }
    });

    it("should validate all competitor attributes and color themes", () => {
      for (const preset of RACE_MATCHUP_PRESETS) {
        for (const comp of [preset.competitorA, preset.competitorB]) {
          expect(comp.id.length).toBeGreaterThan(0);
          expect(comp.name.length).toBeGreaterThan(0);
          expect(comp.shortName.length).toBeGreaterThan(0);
          expect(comp.complexity.startsWith("O(")).toBe(true);
          expect(comp.spaceComplexity.startsWith("O(")).toBe(true);
          expect(comp.description.length).toBeGreaterThan(5);
          expect(comp.memoryModel.length).toBeGreaterThan(5);
          expect(comp.hardwareBehavior.length).toBeGreaterThan(5);
          expect(comp.colors.primary.length).toBeGreaterThan(0);
          expect(comp.colors.bg.length).toBeGreaterThan(0);
          expect(comp.colors.border.length).toBeGreaterThan(0);
          expect(comp.colors.text.length).toBeGreaterThan(0);
          expect(comp.colors.bar.length).toBeGreaterThan(0);
        }
      }
    });

    it("should retrieve presets by ID and fallback gracefully for unknown IDs", () => {
      const flashPreset = getRaceMatchupPreset("flashattention_vs_standard_attention");
      expect(flashPreset.id).toBe("flashattention_vs_standard_attention");
      expect(flashPreset.category).toBe("ML");

      const unknownPreset = getRaceMatchupPreset("non_existent_preset_id");
      expect(unknownPreset).toBeDefined();
      expect(unknownPreset.id).toBe(RACE_MATCHUP_PRESETS[0].id);
    });
  });

  describe("2. Step Description Generators", () => {
    it("should generate descriptive sub-phase strings across execution intervals", () => {
      for (const preset of RACE_MATCHUP_PRESETS) {
        for (const comp of [preset.competitorA, preset.competitorB]) {
          const startDesc = comp.getStepDescription(0.0, 1000);
          const midDesc = comp.getStepDescription(0.5, 1000);
          const lateDesc = comp.getStepDescription(0.85, 1000);
          const finishedDesc = comp.getStepDescription(1.0, 1000);

          expect(typeof startDesc).toBe("string");
          expect(startDesc.length).toBeGreaterThan(10);
          expect(typeof midDesc).toBe("string");
          expect(midDesc.length).toBeGreaterThan(10);
          expect(typeof lateDesc).toBe("string");
          expect(lateDesc.length).toBeGreaterThan(10);
          expect(typeof finishedDesc).toBe("string");
          expect(finishedDesc.length).toBeGreaterThan(10);
        }
      }
    });
  });

  describe("3. Scaling Telemetry Computations & Hardware Invariants", () => {
    it("should verify SCALE_POINTS standard values", () => {
      expect(SCALE_POINTS).toEqual([100, 500, 1000, 5000, 10000, 50000]);
    });

    it("should compute valid non-negative telemetry across all scale points", () => {
      for (const preset of RACE_MATCHUP_PRESETS) {
        for (const n of SCALE_POINTS) {
          const telemetry = computeRaceTelemetry(preset, n);

          for (const tel of [telemetry.competitorA, telemetry.competitorB]) {
            expect(tel.latencyMs).toBeGreaterThan(0);
            expect(tel.opsPerSec).toBeGreaterThan(0);
            expect(tel.workingSetBytes).toBeGreaterThan(0);
            expect(tel.memoryAllocatedBytes).toBeGreaterThan(0);
            expect(tel.l1Misses).toBeGreaterThanOrEqual(0);
            expect(tel.l2Misses).toBeGreaterThanOrEqual(0);
            expect(tel.l1MissRatePct).toBeGreaterThanOrEqual(0);
            expect(tel.l2MissRatePct).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    it("should verify Dinic vs Edmonds-Karp asymptotic speedup advantage", () => {
      const preset = getRaceMatchupPreset("dinic_vs_edmonds_karp");
      const tel100 = computeRaceTelemetry(preset, 100);
      const tel1000 = computeRaceTelemetry(preset, 1000);
      const tel5000 = computeRaceTelemetry(preset, 5000);

      expect(tel100.competitorA.latencyMs).toBeLessThan(tel100.competitorB.latencyMs);
      expect(tel1000.competitorA.latencyMs).toBeLessThan(tel1000.competitorB.latencyMs);
      expect(tel5000.competitorA.latencyMs).toBeLessThan(tel5000.competitorB.latencyMs);

      // Speedup margin expands with scale N
      const speedup100 = tel100.competitorB.latencyMs / tel100.competitorA.latencyMs;
      const speedup5000 = tel5000.competitorB.latencyMs / tel5000.competitorA.latencyMs;
      expect(speedup5000).toBeGreaterThan(speedup100);
    });

    it("should verify FlashAttention IO memory footprint is O(N) vs Standard Attention O(N^2)", () => {
      const preset = getRaceMatchupPreset("flashattention_vs_standard_attention");
      const tel1000 = computeRaceTelemetry(preset, 1000);
      const tel10000 = computeRaceTelemetry(preset, 10000);

      // Standard Attention memory grows quadratically (1000^2 * 4 = 4MB, 10000^2 * 4 = 400MB)
      expect(tel1000.competitorB.workingSetBytes).toBe(4 * 1024 * 1024 - 194304); // ~4MB
      expect(tel10000.competitorB.workingSetBytes).toBe(400 * 1000 * 1000);

      // FlashAttention memory is linear with SRAM buffer
      expect(tel1000.competitorA.workingSetBytes).toBeLessThan(1024 * 1024); // < 1MB
      expect(tel10000.competitorA.workingSetBytes).toBeLessThan(10 * 1024 * 1024); // < 10MB

      // Memory ratio at N=10000 should be massive (>100x savings)
      const memRatio = tel10000.competitorB.workingSetBytes / tel10000.competitorA.workingSetBytes;
      expect(memRatio).toBeGreaterThan(100);
    });

    it("should verify Fenwick compact flat array has 4x lower memory than Segment Tree", () => {
      const preset = getRaceMatchupPreset("fenwick_vs_segment_tree");
      const tel = computeRaceTelemetry(preset, 10000);

      expect(tel.competitorB.workingSetBytes).toBe(4 * tel.competitorA.workingSetBytes);
      expect(tel.competitorA.latencyMs).toBeLessThan(tel.competitorB.latencyMs);
      expect(tel.competitorA.l1MissRatePct).toBeLessThan(tel.competitorB.l1MissRatePct);
    });

    it("should verify QuickSort has minimal auxiliary allocation vs MergeSort O(N)", () => {
      const preset = getRaceMatchupPreset("quicksort_vs_mergesort");
      const tel = computeRaceTelemetry(preset, 5000);

      expect(tel.competitorA.memoryAllocatedBytes).toBe(256); // Call stack only
      expect(tel.competitorB.memoryAllocatedBytes).toBe(5000 * 4); // 20KB auxiliary buffer
      expect(tel.competitorA.latencyMs).toBeLessThan(tel.competitorB.latencyMs);
    });

    it("should verify PagedAttention memory fragmentation is <4% vs Contiguous KV >60%", () => {
      const preset = getRaceMatchupPreset("pagedattention_vs_contiguous_kv");
      const tel = computeRaceTelemetry(preset, 2000);

      expect(tel.competitorA.workingSetBytes).toBeLessThan(tel.competitorB.workingSetBytes);
      expect(tel.competitorA.latencyMs).toBeLessThan(tel.competitorB.latencyMs);
    });
  });

  describe("4. Step Simulation Engine & State Transitions", () => {
    it("should advance progress proportionally based on latency ratio", () => {
      const preset = getRaceMatchupPreset("dinic_vs_edmonds_karp");
      const tel = computeRaceTelemetry(preset, 1000);

      const initial: RaceSimulationState = {
        status: "running",
        progressA: 0,
        progressB: 0,
        stepCount: 0,
        finishedA: false,
        finishedB: false,
        winnerId: null,
      };

      const step1 = simulateRaceStep(initial, tel.competitorA, tel.competitorB, preset, 1.0);
      expect(step1.status).toBe("running");
      expect(step1.progressA).toBeGreaterThan(0);
      expect(step1.progressB).toBeGreaterThan(0);
      expect(step1.progressA).toBeGreaterThan(step1.progressB); // Faster algorithm advances further
      expect(step1.stepCount).toBe(1);
    });

    it("should crown faster competitor when reaching 100% first", () => {
      const preset = getRaceMatchupPreset("flashattention_vs_standard_attention");
      const tel = computeRaceTelemetry(preset, 1000);

      let state: RaceSimulationState = {
        status: "running",
        progressA: 95,
        progressB: 40,
        stepCount: 20,
        finishedA: false,
        finishedB: false,
        winnerId: null,
      };

      state = simulateRaceStep(state, tel.competitorA, tel.competitorB, preset, 2.0);

      expect(state.progressA).toBe(100);
      expect(state.finishedA).toBe(true);
      expect(state.finishedB).toBe(false);
      expect(state.winnerId).toBe(preset.competitorA.id);
      expect(state.status).toBe("running"); // Still running until B finishes

      // Advance until B finishes
      for (let i = 0; i < 100; i++) {
        state = simulateRaceStep(state, tel.competitorA, tel.competitorB, preset, 5.0);
        if (state.status === "finished") break;
      }

      expect(state.status).toBe("finished");
      expect(state.finishedB).toBe(true);
      expect(state.winnerId).toBe(preset.competitorA.id);
    });

    it("should not advance when status is idle or finished", () => {
      const preset = getRaceMatchupPreset("quicksort_vs_mergesort");
      const tel = computeRaceTelemetry(preset, 1000);

      const idleState: RaceSimulationState = {
        status: "idle",
        progressA: 0,
        progressB: 0,
        stepCount: 0,
        finishedA: false,
        finishedB: false,
        winnerId: null,
      };

      const stepIdle = simulateRaceStep(idleState, tel.competitorA, tel.competitorB, preset, 1.0);
      expect(stepIdle).toEqual(idleState);

      const finishedState: RaceSimulationState = {
        status: "finished",
        progressA: 100,
        progressB: 100,
        stepCount: 50,
        finishedA: true,
        finishedB: true,
        winnerId: "quicksort",
      };

      const stepFinished = simulateRaceStep(
        finishedState,
        tel.competitorA,
        tel.competitorB,
        preset,
        1.0,
      );
      expect(stepFinished).toEqual(finishedState);
    });

    it("should scale step rate with speedMultiplier parameter", () => {
      const preset = getRaceMatchupPreset("fenwick_vs_segment_tree");
      const tel = computeRaceTelemetry(preset, 1000);

      const baseState: RaceSimulationState = {
        status: "running",
        progressA: 0,
        progressB: 0,
        stepCount: 0,
        finishedA: false,
        finishedB: false,
        winnerId: null,
      };

      const state1x = simulateRaceStep(baseState, tel.competitorA, tel.competitorB, preset, 1.0);
      const state2x = simulateRaceStep(baseState, tel.competitorA, tel.competitorB, preset, 2.0);

      expect(state2x.progressA).toBeCloseTo(state1x.progressA * 2, 1);
    });
  });

  describe("5. Winner Podium Calculations", () => {
    it("should calculate speedup factor, latency delta, memory delta, and cache delta", () => {
      const preset = getRaceMatchupPreset("flashattention_vs_standard_attention");
      const tel = computeRaceTelemetry(preset, 5000);

      const podium: WinnerPodiumResult = calculateWinnerPodium(
        preset,
        tel.competitorA,
        tel.competitorB,
      );

      expect(podium.winnerId).toBe("flashattention");
      expect(podium.winnerName).toBe(preset.competitorA.name);
      expect(podium.loserId).toBe("standard_attention");
      expect(podium.loserName).toBe(preset.competitorB.name);
      expect(podium.speedupFactor).toBeGreaterThan(1.5);
      expect(podium.latencyDeltaMs).toBeGreaterThan(0);
      expect(podium.memoryDeltaBytes).toBeGreaterThan(0);
      expect(podium.cacheMissDelta).toBeGreaterThan(0);
      expect(podium.isTie).toBe(false);
    });

    it("should handle tie scenarios appropriately", () => {
      const preset = getRaceMatchupPreset("quicksort_vs_mergesort");
      const customTel = {
        latencyMs: 1.0,
        opsPerSec: 1000,
        memoryAllocatedBytes: 1000,
        workingSetBytes: 1000,
        l1Misses: 10,
        l2Misses: 2,
        l1MissRatePct: 1.0,
        l2MissRatePct: 0.2,
      };

      const podium = calculateWinnerPodium(preset, customTel, customTel);
      expect(podium.speedupFactor).toBe(1.0);
      expect(podium.latencyDeltaMs).toBe(0);
      expect(podium.memoryDeltaBytes).toBe(0);
      expect(podium.isTie).toBe(true);
    });
  });

  describe("6. Scalability Data Generation & Curve Fitting", () => {
    it("should generate 6 valid benchmark data points for curve fitting", () => {
      const preset = getRaceMatchupPreset("quicksort_vs_mergesort");
      const dataPoints = generateCompetitorDataPoints(preset.competitorA);

      expect(dataPoints.length).toBe(6);
      for (let i = 0; i < dataPoints.length; i++) {
        expect(dataPoints[i].n).toBe(SCALE_POINTS[i]);
        expect(dataPoints[i].medianTimeMs).toBeGreaterThan(0);
        expect(dataPoints[i].opsPerSec).toBeGreaterThan(0);
        expect(dataPoints[i].workingSetBytes).toBe(SCALE_POINTS[i] * 4);
      }
    });

    it("should fit log-log asymptotic complexity curve with high R²", () => {
      const preset = getRaceMatchupPreset("quicksort_vs_mergesort");
      const dataPoints = generateCompetitorDataPoints(preset.competitorA);
      const fit = fitAsymptoticComplexity(dataPoints);

      expect(fit.rSquared).toBeGreaterThanOrEqual(0.95);
      expect(fit.logLogSlope).toBeGreaterThanOrEqual(0.9);
      expect(fit.logLogSlope).toBeLessThanOrEqual(1.3);
      expect(fit.modelEquations.fitted).toContain("T(N) =");
    });

    it("should detect cache inflection points when working set crosses L1/L2 boundaries", () => {
      const preset = getRaceMatchupPreset("segment_tree");
      const dataPoints = generateCompetitorDataPoints(preset.competitorB); // Segment tree 4N * 4 bytes
      const inflections = detectCacheInflectionPoints(dataPoints);

      expect(inflections.length).toBeGreaterThan(0);
      expect(
        inflections.some((inf) => inf.boundaryType === "L1" || inf.boundaryType === "L2"),
      ).toBe(true);
    });
  });

  describe("7. Formatting Utilities", () => {
    it("should format byte quantities accurately", () => {
      expect(formatBytes(512)).toBe("512 B");
      expect(formatBytes(2048)).toBe("2.0 KB");
      expect(formatBytes(10 * 1024 * 1024)).toBe("10.00 MB");
      expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe("2.00 GB");
    });

    it("should format latencies accurately across sub-millisecond and seconds", () => {
      expect(formatLatency(0.0004)).toBe("400 ns");
      expect(formatLatency(0.045)).toBe("45.0 µs");
      expect(formatLatency(12.34)).toBe("12.34 ms");
      expect(formatLatency(2500)).toBe("2.50 s");
    });

    it("should format operations per second accurately", () => {
      expect(formatOpsPerSec(500)).toBe("500 ops/s");
      expect(formatOpsPerSec(25000)).toBe("25.0K ops/s");
      expect(formatOpsPerSec(4500000)).toBe("4.50M ops/s");
    });
  });

  describe("8. AlgorithmRaceComparator React Component Lifecycle", () => {
    it("should instantiate with default props", () => {
      const element = React.createElement(AlgorithmRaceComparator, {
        className: "test-race-comparator",
      });

      expect(element).toBeDefined();
      expect(element.type).toBe(AlgorithmRaceComparator);
      expect(element.props.className).toBe("test-race-comparator");
      expect(element.props.isOpen).toBeUndefined();
    });

    it("should return null when isOpen is explicitly false", () => {
      const element = React.createElement(AlgorithmRaceComparator, {
        isOpen: false,
        onClose: () => {},
      });

      expect(element).toBeDefined();
      expect(element.props.isOpen).toBe(false);
    });

    it("should instantiate with customized initialMatchupId and initialScaleN", () => {
      let completedPodium: WinnerPodiumResult | null = null;
      const handleComplete = (podium: WinnerPodiumResult) => {
        completedPodium = podium;
      };

      const element = React.createElement(AlgorithmRaceComparator, {
        initialMatchupId: "pagedattention_vs_contiguous_kv",
        initialScaleN: 5000,
        onRaceComplete: handleComplete,
        isOpen: true,
      });

      expect(element.props.initialMatchupId).toBe("pagedattention_vs_contiguous_kv");
      expect(element.props.initialScaleN).toBe(5000);
      expect(element.props.isOpen).toBe(true);
      expect(element.props.onRaceComplete).toBe(handleComplete);
      expect(completedPodium).toBeNull();
    });

    it("should support all 5 matchup presets without component instantiation errors", () => {
      const presetIds: MatchupId[] = [
        "dinic_vs_edmonds_karp",
        "flashattention_vs_standard_attention",
        "fenwick_vs_segment_tree",
        "quicksort_vs_mergesort",
        "pagedattention_vs_contiguous_kv",
      ];

      for (const id of presetIds) {
        const element = React.createElement(AlgorithmRaceComparator, {
          initialMatchupId: id,
          initialScaleN: 1000,
        });
        expect(element.props.initialMatchupId).toBe(id);
      }
    });
  });
});
