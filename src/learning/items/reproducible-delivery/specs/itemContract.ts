import {
  validatePythonExecutionSpec,
  type PythonTestCase,
} from "@dsa-visualizer/execution-contracts";
import { expect } from "vitest";

import { getLearningItemPlayground, type LearningItem } from "../../../types";

export function expectReproducibleDeliveryItem(
  item: LearningItem,
  expected: {
    readonly id: string;
    readonly topicId:
      | "ml_experiment_lineage"
      | "ml_feature_pipelines"
      | "ml_workflow_orchestration";
    readonly kind: LearningItem["kind"];
    readonly snapshotKind: "array" | "graph" | "matrix";
  },
): void {
  expect(item).toMatchObject({
    id: expected.id,
    topicIds: [expected.topicId],
    kind: expected.kind,
    sources: [{ provenance: "verified" }],
  });
  expect(item.objective.length).toBeGreaterThan(24);
  expect(item.completionEvidence.length).toBeGreaterThan(24);
  expect(Object.values(item.difficultyProfile).every((score) => Number.isInteger(score))).toBe(
    true,
  );
  expect(item.sources.every((source) => source.provenance === "verified")).toBe(true);

  const playground = getLearningItemPlayground(item);
  expect(playground).toBeDefined();
  expect(playground?.starterCode).toContain("NotImplementedError");
  expect(playground?.code).toMatch(/^def [a-z_]+\(/);
  expect(validatePythonExecutionSpec(playground!.execution).ok).toBe(true);
  expect(playground?.execution.outputContract?.length).toBeGreaterThan(24);
  expect(playground?.execution.cases).toHaveLength(3);

  const cases = playground!.execution.cases as readonly PythonTestCase[];
  expect(new Set(cases.map((testCase) => testCase.id)).size).toBe(3);
  expect(new Set(cases.map((testCase) => JSON.stringify(testCase.input))).size).toBe(3);

  for (const testCase of cases) {
    const steps = playground!.generateSteps(testCase.input);
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps.every((step) => step.primarySnapshot.kind === expected.snapshotKind)).toBe(true);
    expect(new Set(steps.map((step) => JSON.stringify(step.primarySnapshot))).size).toBeGreaterThan(
      1,
    );
    expect(steps.every((step) => step.explanation.what && step.explanation.why)).toBe(true);
  }
}
