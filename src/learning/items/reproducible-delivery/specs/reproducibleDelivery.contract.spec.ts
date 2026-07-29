import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { getLearningItemPlayground } from "../../../types";
import { REPRODUCIBLE_DELIVERY_IDS, REPRODUCIBLE_DELIVERY_ITEMS } from "../index";

const expectedIds = [
  "run-reproduction-manifest",
  "model-artifact-lineage",
  "experiment-comparison-debugging",
  "point-in-time-feature-join",
  "training-serving-skew",
  "feature-materialization-design",
  "ml-pipeline-retry-cache",
  "ml-test-strategy",
  "stale-artifact-pipeline-debugging",
] as const;

describe("R7-R9 reproducible delivery manifest", () => {
  it("freezes the exact nine semantic IDs in authored order", () => {
    expect(REPRODUCIBLE_DELIVERY_IDS).toEqual(expectedIds);
    expect(REPRODUCIBLE_DELIVERY_ITEMS.map((item) => item.id)).toEqual(expectedIds);
    expect(Object.isFrozen(REPRODUCIBLE_DELIVERY_IDS)).toBe(true);
    expect(Object.isFrozen(REPRODUCIBLE_DELIVERY_ITEMS)).toBe(true);
  });

  it("authors exactly three items and at least two modes per frozen topic", () => {
    for (const topicId of [
      "ml_experiment_lineage",
      "ml_feature_pipelines",
      "ml_workflow_orchestration",
    ] as const) {
      const items = REPRODUCIBLE_DELIVERY_ITEMS.filter((item) => item.topicIds.includes(topicId));
      expect(items).toHaveLength(3);
      expect(new Set(items.map((item) => item.kind)).size).toBeGreaterThanOrEqual(2);
    }
  });

  it("executes every canonical reference and typed case through the CPython harness", () => {
    const harness = resolve(process.cwd(), "apps/python-runner/execution_harness.py");

    for (const item of REPRODUCIBLE_DELIVERY_ITEMS) {
      const playground = getLearningItemPlayground(item)!;
      const request = {
        runId: `contract-${item.id}`,
        code: playground.code,
        spec: playground.execution,
      };
      const run = spawnSync("python3", [harness], {
        input: JSON.stringify(request),
        encoding: "utf8",
      });

      expect(run.status).toBe(0);
      const result = JSON.parse(run.stdout) as {
        status: string;
        cases: readonly { id: string; status: string; actual?: unknown; stderr: string }[];
      };
      expect(result.status).toBe("passed");
      expect(result.cases).toHaveLength(3);
      expect(result.cases.every((testCase) => testCase.status === "passed")).toBe(true);
    }
  });
});
