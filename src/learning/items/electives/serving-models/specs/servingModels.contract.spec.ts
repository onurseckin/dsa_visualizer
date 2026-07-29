import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

import { getLearningItemPlayground } from "../../../../types";
import { SERVING_MODEL_ELECTIVE_EXPECTATIONS, SERVING_MODEL_ELECTIVE_ITEMS } from "../index";

const FROZEN_EXPECTATIONS = [
  ["paged-kv-cache-allocation", "ml_llm_serving", "trace"],
  ["continuous-batching-trace", "ml_llm_serving", "trace"],
  ["llm-serving-policy", "ml_llm_serving", "scenario"],
  ["exact-vs-hnsw-search", "ml_vector_retrieval", "trace"],
  ["vector-index-tradeoffs", "ml_vector_retrieval", "calculator"],
  ["retrieval-regression-debugging", "ml_vector_retrieval", "debugging"],
  ["histogram-split-gain", "ml_tree_ensemble_systems", "calculator"],
  ["tree-model-system-selection", "ml_tree_ensemble_systems", "scenario"],
  ["tabular-pipeline-debugging", "ml_tree_ensemble_systems", "debugging"],
  ["convolution-lowering-trace", "ml_vision_sequence_models", "trace"],
  ["recurrent-bptt-trace", "ml_vision_sequence_models", "trace"],
  ["vision-sequence-system-selection", "ml_vision_sequence_models", "scenario"],
] as const;

describe("E5-E8 serving and model-system electives manifest", () => {
  test("freezes the exact twelve IDs, topic mappings, modes, and three-item topic coverage", () => {
    expect(SERVING_MODEL_ELECTIVE_EXPECTATIONS).toEqual(FROZEN_EXPECTATIONS);
    expect(
      SERVING_MODEL_ELECTIVE_ITEMS.map((item) => [item.id, item.topicIds[0], item.kind]),
    ).toEqual(FROZEN_EXPECTATIONS);
    expect(SERVING_MODEL_ELECTIVE_ITEMS).toHaveLength(12);
    expect(new Set(SERVING_MODEL_ELECTIVE_ITEMS.map((item) => item.id)).size).toBe(12);
    for (const topic of [
      "ml_llm_serving",
      "ml_vector_retrieval",
      "ml_tree_ensemble_systems",
      "ml_vision_sequence_models",
    ]) {
      const items = SERVING_MODEL_ELECTIVE_ITEMS.filter((item) => item.topicIds[0] === topic);
      expect(items).toHaveLength(3);
      expect(new Set(items.map((item) => item.kind)).size).toBeGreaterThanOrEqual(2);
    }
  });

  test("uses verified primary sources with explicit P/R/H/T objectives and completion evidence", () => {
    for (const item of SERVING_MODEL_ELECTIVE_ITEMS) {
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

  test("provides semantic standard-library playgrounds and does not claim unbundled vector or GPU execution", () => {
    for (const item of SERVING_MODEL_ELECTIVE_ITEMS) {
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
    const hnswTrace = getLearningItemPlayground(
      SERVING_MODEL_ELECTIVE_ITEMS.find((item) => item.id === "exact-vs-hnsw-search")!,
    );
    expect(hnswTrace?.code).not.toMatch(/hnswlib|faiss|gpu|cuda/i);
    expect(hnswTrace?.execution.outputContract).toContain("simulation");
  });

  test("uses at least three distinct invariant-driven frames and passes every reference case in CPython", () => {
    const harnessPath = resolve(process.cwd(), "apps/python-runner/execution_harness.py");
    for (const item of SERVING_MODEL_ELECTIVE_ITEMS) {
      const playground = getLearningItemPlayground(item);
      if (!playground) throw new Error(`${item.id}: missing playground`);
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
          runId: `serving-models-${item.id}`,
          code: playground.code,
          spec: playground.execution,
        }),
        encoding: "utf8",
        maxBuffer: 2 * 1024 * 1024,
        timeout: 30_000,
      });
      expect(completed.status, `${item.id}: ${completed.stderr}`).toBe(0);
      expect(JSON.parse(completed.stdout) as { status: string }).toMatchObject({
        status: "passed",
      });
    }
  });
});
