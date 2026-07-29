import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

import { getLearningItemPlayground } from "../../../../types";
import { COMPUTE_ELECTIVE_EXPECTATIONS, COMPUTE_ELECTIVE_ITEMS } from "../index";

const FROZEN_EXPECTATIONS = [
  ["roofline-bound-estimator", "ml_accelerator_performance", "calculator"],
  ["tiled-gemm-memory-trace", "ml_accelerator_performance", "trace"],
  ["profiler-optimization-decision", "ml_accelerator_performance", "scenario"],
  ["ring-allreduce-trace", "ml_distributed_training", "trace"],
  ["distributed-parallelism-selection", "ml_distributed_training", "scenario"],
  ["distributed-memory-straggler", "ml_distributed_training", "debugging"],
  ["quantization-deployment-plan", "ml_compilation_quantization", "calculator"],
  ["compiler-graph-compatibility", "ml_compilation_quantization", "debugging"],
  ["portable-runtime-selection", "ml_compilation_quantization", "scenario"],
  ["bpe-token-budget", "ml_transformer_internals", "trace"],
  ["causal-attention-trace", "ml_transformer_internals", "trace"],
  ["kv-cache-memory-policy", "ml_transformer_internals", "calculator"],
] as const;

const MODULE_BY_ID = {
  "roofline-bound-estimator": "rooflineBoundEstimator.ts",
  "tiled-gemm-memory-trace": "tiledGemmMemoryTrace.ts",
  "profiler-optimization-decision": "profilerOptimizationDecision.ts",
  "ring-allreduce-trace": "ringAllreduceTrace.ts",
  "distributed-parallelism-selection": "distributedParallelismSelection.ts",
  "distributed-memory-straggler": "distributedMemoryStraggler.ts",
  "quantization-deployment-plan": "quantizationDeploymentPlan.ts",
  "compiler-graph-compatibility": "compilerGraphCompatibility.ts",
  "portable-runtime-selection": "portableRuntimeSelection.ts",
  "bpe-token-budget": "bpeTokenBudget.ts",
  "causal-attention-trace": "causalAttentionTrace.ts",
  "kv-cache-memory-policy": "kvCacheMemoryPolicy.ts",
} as const;

function snapshotValues(item: (typeof COMPUTE_ELECTIVE_ITEMS)[number], input: unknown) {
  const playground = getLearningItemPlayground(item);
  if (!playground) throw new Error(`${item.id}: no playground`);
  return playground.generateSteps(input).map((step) => JSON.stringify(step.primarySnapshot));
}

describe("E1-E4 compute electives manifest", () => {
  test("freezes the exact twelve IDs, topic mappings, and research modes", () => {
    expect(COMPUTE_ELECTIVE_EXPECTATIONS).toEqual(FROZEN_EXPECTATIONS);
    expect(COMPUTE_ELECTIVE_ITEMS.map((item) => [item.id, item.topicIds[0], item.kind])).toEqual(
      FROZEN_EXPECTATIONS,
    );
    expect(new Set(COMPUTE_ELECTIVE_ITEMS.map((item) => item.id)).size).toBe(12);
  });

  test("imports each item from its own semantic module", () => {
    const itemDirectory = resolve(process.cwd(), "src/learning/items/electives/compute");
    for (const item of COMPUTE_ELECTIVE_ITEMS) {
      const moduleName = MODULE_BY_ID[item.id as keyof typeof MODULE_BY_ID];
      const modulePath = resolve(itemDirectory, moduleName);
      expect(existsSync(modulePath)).toBe(true);
      expect(readFileSync(modulePath, "utf8")).toContain(`id: "${item.id}"`);
    }
  });

  test("provides primary verified sources and an explicit P/R/H/T learning contract", () => {
    for (const item of COMPUTE_ELECTIVE_ITEMS) {
      expect(item.topicIds).toHaveLength(1);
      expect(item.sources.length).toBeGreaterThan(0);
      expect(item.sources.every((source) => source.provenance === "verified")).toBe(true);
      expect(
        item.sources.every(
          (source) => source.provenance === "verified" && source.url.startsWith("https://"),
        ),
      ).toBe(true);
      expect(Object.keys(item.difficultyProfile).sort()).toEqual([
        "horizon",
        "prerequisite",
        "representations",
        "tradeoffs",
      ]);
      expect(item.objective.length).toBeGreaterThan(40);
      expect(item.completionEvidence.length).toBeGreaterThan(40);
    }
  });

  test("gives every item a browser-safe semantic executable playground with distinct cases", () => {
    for (const item of COMPUTE_ELECTIVE_ITEMS) {
      const playground = getLearningItemPlayground(item);
      expect(playground).toBeDefined();
      if (!playground) continue;
      expect(playground.execution.runtime).toBe("browser");
      expect(playground.execution.packages).toEqual([]);
      expect(playground.code).toContain(`def ${playground.execution.entrypoint}(`);
      expect(playground.starterCode).toContain("NotImplementedError");
      expect(playground.execution.outputContract?.length ?? 0).toBeGreaterThan(40);
      expect(playground.execution.cases.length).toBeGreaterThanOrEqual(3);
      expect(new Set(playground.execution.cases.map((entry) => entry.id)).size).toBe(
        playground.execution.cases.length,
      );
      expect(
        new Set(playground.execution.cases.map((entry) => JSON.stringify(entry.input))).size,
      ).toBe(playground.execution.cases.length);
    }
  });

  test("uses input-dependent, invariant-faithful visualizations and executes every CPython case", () => {
    const harnessPath = resolve(process.cwd(), "apps/python-runner/execution_harness.py");
    for (const item of COMPUTE_ELECTIVE_ITEMS) {
      const playground = getLearningItemPlayground(item);
      if (!playground) throw new Error(`${item.id}: no playground`);
      const steps = playground.generateSteps(playground.execution.cases[0].input);
      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(
        new Set(steps.map((step) => JSON.stringify(step.primarySnapshot))).size,
      ).toBeGreaterThanOrEqual(3);
      expect(
        steps.every(
          (step) => step.explanation.what.length > 15 && step.explanation.why.length > 15,
        ),
      ).toBe(true);
      expect(
        snapshotValues(item, playground.execution.cases[0].input),
        `${item.id}: snapshots must model the supplied input`,
      ).not.toEqual(snapshotValues(item, playground.execution.cases[1].input));
      const completed = spawnSync("python3", ["-I", harnessPath], {
        input: JSON.stringify({
          runId: `compute-${item.id}`,
          code: playground.code,
          spec: playground.execution,
        }),
        encoding: "utf8",
        timeout: 10_000,
      });
      expect(completed.status).toBe(0);
      const result = JSON.parse(completed.stdout) as { status: string };
      expect(result.status).toBe("passed");
    }
  });

  test("preserves the modeled quantity that each compute visualization teaches", () => {
    const byId = new Map(COMPUTE_ELECTIVE_ITEMS.map((item) => [item.id, item]));
    const snapshots = (id: keyof typeof MODULE_BY_ID, input: unknown) =>
      snapshotValues(byId.get(id)!, input).join(" ");

    expect(
      snapshots("roofline-bound-estimator", {
        flops: 200,
        bytes: 100,
        bandwidth_gbps: 50,
        peak_gflops: 500,
      }),
    ).toContain("100");
    expect(snapshots("tiled-gemm-memory-trace", { n: 5, tile: 2 })).toContain("150");
    expect(
      snapshots("profiler-optimization-decision", {
        memory_fraction: 0.7,
        compute_fraction: 0.2,
        launch_fraction: 0.1,
        minimum_fraction: 0.5,
      }),
    ).toContain("0.7");
    expect(snapshots("ring-allreduce-trace", { ranks: 4, tensor_bytes: 120 })).toContain("180");
    expect(
      snapshots("distributed-parallelism-selection", {
        model_gb: 200,
        memory_per_device_gb: 40,
        devices: 4,
        layers: 24,
        microbatches: 4,
      }),
    ).toContain("tensor");
    expect(
      snapshots("distributed-memory-straggler", {
        parameters_gb: 24,
        gradients_gb: 24,
        optimizer_gb: 48,
        ranks: 4,
        rank_seconds: [8, 8.1, 12],
        straggler_ratio: 1.2,
      }),
    ).toContain("straggler");
    expect(
      snapshots("quantization-deployment-plan", {
        max_abs: 1.4,
        bits: 4,
        error_budget: 0.05,
        granularity: "per-channel",
      }),
    ).toContain("0.2");
    expect(
      snapshots("compiler-graph-compatibility", {
        operators: ["MatMul", "CustomOp"],
        supported: ["MatMul"],
        dynamic_shapes: false,
      }),
    ).toContain("CustomOp");
    expect(
      snapshots("portable-runtime-selection", {
        targets: 3,
        portable_supported: true,
        specialized_latency_ms: 4,
        latency_slo_ms: 5,
      }),
    ).toContain("portable");
    expect(snapshots("bpe-token-budget", { pieces: ["caf", "é"], context_limit: 4 })).toContain(
      "5",
    );
    expect(
      snapshots("causal-attention-trace", {
        query: 1,
        keys: [1, 1, 10],
        values: [2, 4, 100],
        position: 1,
      }),
    ).toContain("0");
    expect(
      snapshots("kv-cache-memory-policy", {
        layers: 2,
        tokens: 8,
        batch: 2,
        kv_heads: 2,
        head_dim: 4,
        dtype_bytes: 2,
        capacity_bytes: 1000,
      }),
    ).toContain("evict-or-reject");
  });
});
