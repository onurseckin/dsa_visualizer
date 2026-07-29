import { spawnSync } from "node:child_process";
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

describe("E1-E4 compute electives manifest", () => {
  test("freezes the exact twelve IDs, topic mappings, and research modes", () => {
    expect(COMPUTE_ELECTIVE_EXPECTATIONS).toEqual(FROZEN_EXPECTATIONS);
    expect(COMPUTE_ELECTIVE_ITEMS.map((item) => [item.id, item.topicIds[0], item.kind])).toEqual(
      FROZEN_EXPECTATIONS,
    );
    expect(new Set(COMPUTE_ELECTIVE_ITEMS.map((item) => item.id)).size).toBe(12);
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

  test("uses changing invariant-driven visualizations and executes every CPython case", () => {
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
});
