import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { validatePythonExecutionSpec } from "@dsa-visualizer/execution-contracts";
import { describe, expect, test } from "vitest";

import {
  getLearningItem,
  LEARNING_ITEMS,
  TRANSITIONAL_LEARNING_REGISTRY_STATE,
} from "../../../registry";
import {
  getLearningItemPlayground,
  isCodeLearningItem,
  isRubricLearningItem,
  isValidLearningSourceUrl,
  type LearningItem,
} from "../../../types";
import { REQUIRED_FOUNDATION_ITEMS } from "../index";

export const REQUIRED_FOUNDATION_EXPECTATIONS = [
  ["reproducible-python-environment", "ml_python_scientific_computing", "debugging"],
  ["tensor-dtype-device-boundary", "ml_python_scientific_computing", "trace"],
  ["determinism-triage", "ml_python_scientific_computing", "scenario"],
  ["ml-target-feedback-loop", "ml_problem_framing", "scenario"],
  ["metric-threshold-guardrails", "ml_problem_framing", "calculator"],
  ["leakage-proxy-debugging", "ml_problem_framing", "debugging"],
  ["dataset-contract-validator", "ml_data_contracts_splits", "debugging"],
  ["time-group-split-builder", "ml_data_contracts_splits", "trace"],
  ["dataset-lineage-graph", "ml_data_contracts_splits", "scenario"],
  ["tensor-layout-explorer", "ml_numerical_tensors", "trace"],
  ["stable-softmax-repair", "ml_numerical_tensors", "debugging"],
  ["precision-policy", "ml_numerical_tensors", "scenario"],
  ["baseline-model-selection", "ml_model_evaluation", "scenario"],
  ["evaluation-calibration-slices", "ml_model_evaluation", "calculator"],
  ["generalization-failure-diagnosis", "ml_model_evaluation", "debugging"],
  ["reverse-mode-autodiff", "ml_training_autodiff", "trace"],
  ["training-loop-state", "ml_training_autodiff", "debugging"],
  ["activation-checkpoint-tradeoff", "ml_training_autodiff", "calculator"],
] as const;

const requiredFoundationItems: readonly LearningItem[] = REQUIRED_FOUNDATION_ITEMS;

describe("required R1-R6 foundation enrollment", () => {
  test.each(REQUIRED_FOUNDATION_EXPECTATIONS)(
    "enrolls %s exactly once under %s as %s",
    (id, topicId, kind) => {
      const item = getLearningItem(id);

      expect(item, `missing required foundation ${id}`).toBeDefined();
      expect(item?.id).toBe(id);
      expect(item?.topicIds).toEqual([topicId]);
      expect(item?.kind).toBe(kind);
    },
  );

  test("exports exactly the frozen 18 standalone definition files", () => {
    const expectedIds = REQUIRED_FOUNDATION_EXPECTATIONS.map(([id]) => id);
    const definitionDirectory = resolve(process.cwd(), "src/learning/items/required-foundations");
    const definitionFiles = readdirSync(definitionDirectory)
      .filter((file) => file.endsWith(".ts") && file !== "index.ts")
      .map((file) => file.replace(/\.ts$/, ""))
      .sort();

    expect(REQUIRED_FOUNDATION_ITEMS.map((item) => item.id)).toEqual(expectedIds);
    expect(definitionFiles).toEqual([...expectedIds].sort());
    expect(new Set(REQUIRED_FOUNDATION_ITEMS).size).toBe(18);
    expect(LEARNING_ITEMS.filter((item) => expectedIds.includes(item.id as never))).toEqual(
      REQUIRED_FOUNDATION_ITEMS,
    );
  });

  test("keeps the explicit additive 320 + 18 = 338 transition", () => {
    expect(TRANSITIONAL_LEARNING_REGISTRY_STATE).toEqual({
      enabled: true,
      legacyExpectedItemCount: 320,
      requiredFoundationsExpectedItemCount: 18,
      expectedItemCount: 338,
      removalTask: 16,
    });
    expect(LEARNING_ITEMS).toHaveLength(338);
  });

  test("authors exactly three items per required topic and five qualitative scenarios", () => {
    const topicCounts = new Map<string, number>();
    for (const item of requiredFoundationItems) {
      const [topicId] = item.topicIds;
      topicCounts.set(topicId, (topicCounts.get(topicId) ?? 0) + 1);
    }
    expect([...topicCounts.values()]).toEqual([3, 3, 3, 3, 3, 3]);

    const scenarios = requiredFoundationItems.filter(isRubricLearningItem);
    expect(scenarios.map((item) => item.id)).toEqual([
      "determinism-triage",
      "ml-target-feedback-loop",
      "dataset-lineage-graph",
      "precision-policy",
      "baseline-model-selection",
    ]);
    for (const item of scenarios) {
      expect(item).not.toHaveProperty("code");
      expect(item.rubric.criteria.some((criterion) => criterion.critical)).toBe(true);
      expect(item.playground).toBeDefined();
    }
  });

  test("requires authored objectives, completion evidence, assessment payloads, and official sources", () => {
    const officialHosts = new Set([
      "developers.google.com",
      "docs.nvidia.com",
      "docs.python.org",
      "docs.pytorch.org",
      "docs.scipy.org",
      "numpy.org",
      "scikit-learn.org",
      "www.tensorflow.org",
    ]);

    for (const item of requiredFoundationItems) {
      expect(item.description.trim().length).toBeGreaterThan(40);
      expect(item.objective.trim().length).toBeGreaterThan(40);
      expect(item.completionEvidence.trim().length).toBeGreaterThan(40);
      if (item.kind === "algorithm") {
        throw new Error(`${item.id} must use an authored nonalgorithm assessment`);
      }
      expect(item.assessment.payload).toBeDefined();
      expect(item.assessment.payload).toMatchObject({
        changedContext: true,
        isomorphicRetest: true,
      });
      expect(item.sources.length).toBeGreaterThan(0);
      for (const source of item.sources) {
        expect(source.provenance).toBe("verified");
        if (source.provenance !== "verified") continue;
        expect(isValidLearningSourceUrl(source.url)).toBe(true);
        expect(officialHosts.has(new URL(source.url).hostname)).toBe(true);
      }
    }
  });

  test("gives every item a semantic executable playground with three distinct cases", () => {
    const numpyIds: string[] = [];

    for (const item of requiredFoundationItems) {
      const playground = getLearningItemPlayground(item);
      expect(playground, `${item.id} needs a playground`).toBeDefined();
      if (!playground) continue;

      expect(validatePythonExecutionSpec(playground.execution)).toEqual({
        ok: true,
        value: playground.execution,
      });
      expect(playground.execution.outputContract?.trim().length).toBeGreaterThan(30);
      expect(playground.execution.cases).toHaveLength(3);
      expect(new Set(playground.execution.cases.map((testCase) => testCase.id)).size).toBe(3);
      expect(
        new Set(playground.execution.cases.map((testCase) => JSON.stringify(testCase.input))).size,
      ).toBe(3);
      expect(
        new Set(playground.execution.cases.map((testCase) => JSON.stringify(testCase.expected)))
          .size,
      ).toBeGreaterThanOrEqual(2);
      expect(playground.code).toContain(`def ${playground.execution.entrypoint}(`);
      expect(playground.starterCode).toContain(`def ${playground.execution.entrypoint}(`);
      expect(playground.starterCode).toContain("NotImplementedError");
      expect(playground.starterCode).not.toMatch(/\bpass\b/);
      expect(playground.starterCode).not.toBe(playground.code);

      if (playground.execution.packages.includes("numpy")) numpyIds.push(item.id);
      if (isCodeLearningItem(item)) {
        expect(item.execution).toBeDefined();
      }
    }

    expect(numpyIds).toEqual(["tensor-dtype-device-boundary", "tensor-layout-explorer"]);
    expect(
      requiredFoundationItems.filter((item) => !numpyIds.includes(item.id)).every(
        (item) => getLearningItemPlayground(item)?.execution.packages.length === 0,
      ),
    ).toBe(true);
  });

  test("produces at least three explanatory, changing, in-range visualization steps", () => {
    for (const item of requiredFoundationItems) {
      const playground = getLearningItemPlayground(item);
      if (!playground) continue;
      const steps = playground.generateSteps(playground.execution.cases[0].input);
      const lineCount = playground.code.split("\n").length;

      expect(steps.length, `${item.id} needs at least three steps`).toBeGreaterThanOrEqual(3);
      expect(steps.map((step) => step.stepIndex)).toEqual(steps.map((_, index) => index));
      for (const step of steps) {
        expect(step.codeLine, `${item.id} step ${step.stepIndex} code line`).toBeGreaterThanOrEqual(
          1,
        );
        expect(step.codeLine, `${item.id} step ${step.stepIndex} code line`).toBeLessThanOrEqual(
          lineCount,
        );
        expect(
          step.explanation.what.trim().length,
          `${item.id} step ${step.stepIndex} what`,
        ).toBeGreaterThan(15);
        expect(
          step.explanation.why.trim().length,
          `${item.id} step ${step.stepIndex} why`,
        ).toBeGreaterThan(15);
      }
      expect(
        new Set(steps.map((step) => JSON.stringify(step.primarySnapshot))).size,
      ).toBeGreaterThan(1);
    }
  });

  test("parses every reference and starter and executes all standard-library cases", () => {
    const harnessPath = resolve(process.cwd(), "apps/python-runner/execution_harness.py");
    const parseInputs: { id: string; code: string }[] = [];

    for (const item of requiredFoundationItems) {
      const playground = getLearningItemPlayground(item);
      if (!playground) continue;
      parseInputs.push(
        { id: `${item.id}:reference`, code: playground.code },
        { id: `${item.id}:starter`, code: playground.starterCode },
      );
      if (playground.execution.packages.length > 0) continue;

      const completed = spawnSync("python3", ["-I", harnessPath], {
        input: JSON.stringify({
          runId: `required-${item.id}`,
          code: playground.code,
          spec: playground.execution,
        }),
        encoding: "utf8",
        maxBuffer: 2 * 1024 * 1024,
        timeout: 10_000,
      });
      expect(completed.error, `${item.id}: harness process`).toBeUndefined();
      expect(completed.status, `${item.id}: ${completed.stderr}`).toBe(0);
      const result = JSON.parse(completed.stdout) as {
        status: string;
        cases: readonly { id: string; status: string; stderr: string }[];
      };
      expect(result.status, `${item.id}: ${JSON.stringify(result.cases)}`).toBe("passed");
      expect(result.cases.every((testCase) => testCase.status === "passed")).toBe(true);
    }

    const parsed = spawnSync(
      "python3",
      [
        "-I",
        "-c",
        "import ast,json,sys; items=json.load(sys.stdin); [ast.parse(item['code'], filename=item['id']) for item in items]",
      ],
      { input: JSON.stringify(parseInputs), encoding: "utf8", timeout: 10_000 },
    );
    expect(parsed.error).toBeUndefined();
    expect({ status: parsed.status, stderr: parsed.stderr }).toMatchObject({
      status: 0,
      stderr: "",
    });
  });
});
