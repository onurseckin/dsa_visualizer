import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import type { PythonRunResult } from "@dsa-visualizer/execution-contracts";
import { describe, expect, test } from "vitest";

import { getLearningItemPlayground } from "../../../types";
import { PRODUCTION_OPERATIONS_EXPECTATIONS, PRODUCTION_OPERATIONS_ITEMS } from "../index";

const harnessPath = resolve(process.cwd(), "apps/python-runner/execution_harness.py");

const FROZEN_EXPECTATIONS = [
  ["training-execution-topology", "ml_training_platform", "scenario"],
  ["training-resource-sizing", "ml_training_platform", "calculator"],
  ["training-scheduler-debugging", "ml_training_platform", "debugging"],
  ["model-package-contract", "ml_model_registry", "debugging"],
  ["model-registry-state-machine", "ml_model_registry", "trace"],
  ["model-promotion-gate", "ml_model_registry", "scenario"],
  ["inference-topology-selection", "ml_inference_serving", "scenario"],
  ["inference-slo-capacity", "ml_inference_serving", "calculator"],
  ["rollout-regression-debugging", "ml_inference_serving", "debugging"],
  ["ml-observability-signals", "ml_observability_incidents", "scenario"],
  ["drift-alert-calibration", "ml_observability_incidents", "calculator"],
  ["ml-incident-response", "ml_observability_incidents", "debugging"],
  ["ml-system-threat-model", "ml_governance_security_cost", "scenario"],
  ["sensitive-data-governance", "ml_governance_security_cost", "debugging"],
  ["ml-cost-attribution", "ml_governance_security_cost", "calculator"],
] as const;

describe("R10-R14 production operations manifest", () => {
  test("contains the exact frozen IDs, topics, and research modes in authored order", () => {
    expect(PRODUCTION_OPERATIONS_EXPECTATIONS).toEqual(FROZEN_EXPECTATIONS);
    expect(
      PRODUCTION_OPERATIONS_ITEMS.map((item) => [item.id, item.topicIds[0], item.kind]),
    ).toEqual(FROZEN_EXPECTATIONS);
    expect(new Set(PRODUCTION_OPERATIONS_ITEMS.map((item) => item.id)).size).toBe(15);
  });

  test("authors exactly three items and at least two modes for every topic", () => {
    const byTopic = new Map<string, typeof PRODUCTION_OPERATIONS_ITEMS>();
    for (const item of PRODUCTION_OPERATIONS_ITEMS) {
      const topic = item.topicIds[0];
      byTopic.set(topic, [...(byTopic.get(topic) ?? []), item]);
    }

    expect([...byTopic.values()].map((items) => items.length)).toEqual([3, 3, 3, 3, 3]);
    expect(
      [...byTopic.values()].every((items) => new Set(items.map((item) => item.kind)).size >= 2),
    ).toBe(true);
  });

  test("provides primary sources, precise P/R/H/T, objectives, and completion evidence", () => {
    for (const item of PRODUCTION_OPERATIONS_ITEMS) {
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
      expect(item.objective.length).toBeGreaterThan(30);
      expect(item.completionEvidence.length).toBeGreaterThan(30);
    }
  });

  test("gives every item a semantic executable playground and changing invariant frames", () => {
    for (const item of PRODUCTION_OPERATIONS_ITEMS) {
      const playground = getLearningItemPlayground(item);
      expect(playground).toBeDefined();
      if (!playground) throw new Error(`${item.id}: missing playground`);
      expect(playground.code).toContain(`def ${playground.execution.entrypoint}(`);
      expect(playground.starterCode).toContain(`def ${playground.execution.entrypoint}(`);
      expect(playground.starterCode).toContain("NotImplementedError");
      expect(playground.execution.runtime).toBe("browser");
      expect(playground.execution.packages).toEqual([]);
      expect(playground.execution.outputContract?.length ?? 0).toBeGreaterThan(30);
      expect(playground.execution.cases.length).toBeGreaterThanOrEqual(3);
      expect(new Set(playground.execution.cases.map((testCase) => testCase.id)).size).toBe(
        playground.execution.cases.length,
      );

      const steps = playground.generateSteps(playground.execution.cases[0]?.input);
      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(
        new Set(steps.map((step) => JSON.stringify(step.primarySnapshot))).size,
      ).toBeGreaterThanOrEqual(3);
      expect(steps.every((step) => step.explanation.what && step.explanation.why)).toBe(true);
    }
  });

  test("passes all authored reference cases through the production CPython harness", () => {
    const failures: string[] = [];
    for (const item of PRODUCTION_OPERATIONS_ITEMS) {
      const playground = getLearningItemPlayground(item);
      if (!playground) {
        failures.push(`${item.id}: missing playground`);
        continue;
      }
      const completed = spawnSync("python3", ["-I", harnessPath], {
        input: JSON.stringify({
          runId: `production-operations-${item.id}`,
          code: playground.code,
          spec: playground.execution,
        }),
        encoding: "utf8",
        maxBuffer: 2 * 1024 * 1024,
        timeout: 30_000,
      });
      if (completed.error || completed.status !== 0) {
        failures.push(
          `${item.id}: ${completed.error?.message ?? completed.stderr ?? "harness failed"}`,
        );
        continue;
      }
      const result = JSON.parse(completed.stdout) as PythonRunResult;
      const failedCases = result.cases.filter((testCase) => testCase.status !== "passed");
      if (result.status !== "passed" || failedCases.length > 0) {
        failures.push(
          `${item.id}: ${JSON.stringify(
            failedCases.map((testCase) => ({
              id: testCase.id,
              stderr: testCase.stderr,
              actual: testCase.actual,
            })),
          )}`,
        );
      }
    }
    expect(failures).toEqual([]);
  });
});
