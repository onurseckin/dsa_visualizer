import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import {
  validatePythonExecutionSpec,
  type PythonRunResult,
} from "@dsa-visualizer/execution-contracts";
import { describe, expect, it } from "vitest";

import { ML_PLATFORM_CAPSTONES } from "../index";
import { batchMlPlatformCapstone } from "../batchMlPlatformCapstone";
import { realtimeMlPlatformCapstone } from "../realtimeMlPlatformCapstone";

const harnessPath = resolve(process.cwd(), "apps/python-runner/execution_harness.py");
const expectedIds = [
  "batch-ml-platform-capstone",
  "ml-incident-capstone",
  "realtime-ml-platform-capstone",
] as const;

describe("ML platform capstone contract", () => {
  it("contains exactly the three frozen R15 IDs with auditable rubric evidence", () => {
    expect(ML_PLATFORM_CAPSTONES.map((item) => item.id).sort()).toEqual(expectedIds);
    expect(new Set(ML_PLATFORM_CAPSTONES.map((item) => item.id)).size).toBe(3);

    for (const item of ML_PLATFORM_CAPSTONES) {
      expect(item.topicIds).toEqual(["ml_platform_capstone"]);
      expect(item.kind).toBe("capstone");
      expect(item.objective.length).toBeGreaterThan(40);
      expect(item.completionEvidence.length).toBeGreaterThan(30);
      expect(item.sources.every((source) => source.provenance === "verified")).toBe(true);
      expect(item.rubric.criteria.length).toBeGreaterThanOrEqual(6);
      expect(item.rubric.criteria.some((criterion) => criterion.critical)).toBe(true);
      const playground = item.playground;
      expect(playground).toBeDefined();
      if (!playground) throw new Error(`Expected ${item.id} to have a playground`);
      expect(playground.starterCode).toContain("NotImplementedError");
      expect(playground.starterCode).not.toBe(playground.code);
      expect(validatePythonExecutionSpec(playground.execution).ok).toBe(true);
      expect(playground.execution.cases).toHaveLength(3);
      expect(playground.execution.outputContract?.length).toBeGreaterThan(30);
      const steps = playground.generateSteps(playground.execution.cases[0]?.input);
      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(
        new Set(steps.map((step) => JSON.stringify(step.primarySnapshot))).size,
      ).toBeGreaterThan(1);
    }
  });

  it("uses distinct batch and real-time design rubrics", () => {
    expect(batchMlPlatformCapstone.rubric).not.toBe(realtimeMlPlatformCapstone.rubric);
    expect(batchMlPlatformCapstone.rubric.criteria.map(({ id }) => id)).toEqual([
      "decision",
      "snapshot",
      "training-backfill",
      "publication",
      "delayed-evaluation",
      "governance-cost",
      "tradeoff-reasoning",
    ]);
    expect(realtimeMlPlatformCapstone.rubric.criteria.map(({ id }) => id)).toEqual([
      "decision-slo",
      "feature-consistency",
      "capacity-overload",
      "canary-compatibility",
      "rollback-fallback",
      "delayed-evaluation",
      "governance-security-cost",
      "tradeoff-reasoning",
    ]);
    expect(
      batchMlPlatformCapstone.rubric.criteria
        .filter(({ critical }) => critical)
        .map(({ id }) => id),
    ).toEqual(["snapshot", "publication"]);
    expect(
      realtimeMlPlatformCapstone.rubric.criteria
        .filter(({ critical }) => critical)
        .map(({ id }) => id),
    ).toEqual([
      "feature-consistency",
      "canary-compatibility",
      "rollback-fallback",
      "governance-security-cost",
    ]);
  });

  it.each(ML_PLATFORM_CAPSTONES)("executes $id canonical Python cases", (item) => {
    const playground = item.playground;
    if (!playground) throw new Error(`Expected ${item.id} to have a playground`);
    const completed = spawnSync("python3", ["-I", harnessPath], {
      input: JSON.stringify({
        runId: `capstone-${item.id}`,
        code: playground.code,
        spec: playground.execution,
      }),
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
      timeout: 30_000,
    });

    if (completed.error) throw completed.error;
    expect(completed.status).toBe(0);
    const result = JSON.parse(completed.stdout) as PythonRunResult;
    expect(result.status).toBe("passed");
    expect(result.cases.every((testCase) => testCase.status === "passed")).toBe(true);
  });
});
