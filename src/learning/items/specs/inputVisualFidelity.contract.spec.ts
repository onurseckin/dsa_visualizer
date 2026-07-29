import { describe, expect, test } from "vitest";

import { inputEvidenceSteps } from "../../authoring";
import { getLearningItemPlayground, type LearningItem } from "../../types";
import type { AlgorithmStep } from "../../../types/dsa";
import { PRODUCTION_OPERATIONS_ITEMS } from "../production-operations";
import { REQUIRED_FOUNDATION_ITEMS } from "../required-foundations";

const EXTERNALLY_OWNED_ITEM_IDS = new Set([
  "dataset-contract-validator",
  "tensor-dtype-device-boundary",
  "metric-threshold-guardrails",
  "evaluation-calibration-slices",
  "inference-slo-capacity",
  "reproducible-python-environment",
]);

const scopedItems = [...REQUIRED_FOUNDATION_ITEMS, ...PRODUCTION_OPERATIONS_ITEMS].filter(
  (item) => !EXTERNALLY_OWNED_ITEM_IDS.has(item.id),
);

function snapshotsFor(item: LearningItem, input: unknown): readonly string[] {
  const playground = getLearningItemPlayground(item);
  if (!playground) throw new Error(`${item.id}: missing playground`);
  return playground.generateSteps(input).map((step) => JSON.stringify(step.primarySnapshot));
}

function displayedValues(step: AlgorithmStep): readonly string[] {
  const snapshot = step.primarySnapshot;
  switch (snapshot.kind) {
    case "array":
      return snapshot.elements.map((element) => String(element.value));
    case "matrix":
      return snapshot.cells.map((cell) => String(cell.value));
    case "graph":
      return snapshot.nodes.map((node) => node.label ?? node.id);
    case "vector":
      return snapshot.vectors.map((vector) => vector.label);
    case "quantization":
      return [
        String(snapshot.originalValue),
        String(snapshot.quantizedValue),
        snapshot.title ?? "",
      ];
    default:
      return [];
  }
}

function expectedValues(expected: unknown): readonly string[] {
  if (typeof expected === "object" && expected !== null && !Array.isArray(expected)) {
    return Object.values(expected).map((value) => JSON.stringify(value) ?? "missing");
  }
  return [JSON.stringify(expected) ?? "missing"];
}

describe("required and production ML visual input fidelity", () => {
  test("adds an immutable, standalone input-state frame instead of decorating a conceptual frame", () => {
    const vectorStep: AlgorithmStep = {
      stepIndex: 0,
      codeLine: 1,
      explanation: { what: "Show the submitted vector value.", why: "It changes the trace." },
      auxiliaryState: {},
      variables: {},
      primarySnapshot: {
        kind: "vector",
        vectors: [{ id: "value", label: "Value", x: 1, y: 0 }],
      },
    };
    const gridStep: AlgorithmStep = {
      ...vectorStep,
      primarySnapshot: { kind: "grid", grid: [] },
    };

    const [inputState, vector, grid] = inputEvidenceSteps(
      [vectorStep, gridStep],
      { value: [1, 2] },
      ["value"],
      [
        {
          id: "selected",
          label: "Selected case",
          input: { value: [1, 2] },
          expected: { normalized: [1, 2] },
          comparison: "deep-equal",
        },
      ],
    );

    expect(inputState.primarySnapshot).toMatchObject({
      kind: "vector",
      vectors: [{ id: "input-value", label: "value=[1,2]" }],
    });
    expect(vector.primarySnapshot).toMatchObject({
      kind: "vector",
      vectors: [{ label: "Conceptual trace · Value" }],
    });
    expect(Object.isFrozen(vector)).toBe(true);
    expect(grid.primarySnapshot).toEqual(gridStep.primarySnapshot);
  });

  test("derives each scoped visualization trace from its first two authored inputs", () => {
    const invariantItemIds: string[] = [];
    const nonSemanticStateItemIds: string[] = [];
    for (const item of scopedItems) {
      const playground = getLearningItemPlayground(item);
      if (!playground) throw new Error(`${item.id}: missing playground`);
      const [firstCase, secondCase] = playground.execution.cases;

      expect(firstCase, `${item.id}: needs a first authored case`).toBeDefined();
      expect(secondCase, `${item.id}: needs a second authored case`).toBeDefined();
      const firstSteps = playground.generateSteps(firstCase.input);
      const secondSteps = playground.generateSteps(secondCase.input);
      if (
        snapshotsFor(item, firstCase.input).every(
          (snapshot, index) => snapshot === snapshotsFor(item, secondCase.input)[index],
        )
      ) {
        invariantItemIds.push(item.id);
      }
      const firstState = firstSteps[0] ? displayedValues(firstSteps[0]).join(" | ") : "";
      const secondState = secondSteps[0] ? displayedValues(secondSteps[0]).join(" | ") : "";
      if (!firstState || firstState === secondState || firstState.includes("Conceptual trace")) {
        nonSemanticStateItemIds.push(item.id);
      }
      const firstFinal = firstSteps.at(-1);
      const secondFinal = secondSteps.at(-1);
      expect(firstFinal, `${item.id}: needs a final expected-output frame`).toBeDefined();
      expect(secondFinal, `${item.id}: needs a second final expected-output frame`).toBeDefined();
      expect(
        firstFinal?.primarySnapshot,
        `${item.id}: final visual must vary across selected authored cases`,
      ).not.toEqual(secondFinal?.primarySnapshot);
      const firstFinalValues = firstFinal ? displayedValues(firstFinal).join(" | ") : "";
      for (const value of expectedValues(firstCase.expected)) {
        expect(
          firstFinalValues,
          `${item.id}: final visual must display authored expected value ${value}`,
        ).toContain(value);
      }
    }
    expect(invariantItemIds, "visual traces must expose input-specific decision state").toEqual([]);
    expect(
      nonSemanticStateItemIds,
      "first visual frame must render selected decision values",
    ).toEqual([]);
  });

  test("renders selected foundation inputs and production cost decisions", () => {
    const determinism = scopedItems.find((item) => item.id === "determinism-triage");
    const costAttribution = scopedItems.find((item) => item.id === "ml-cost-attribution");
    if (!determinism || !costAttribution) throw new Error("representative items are missing");

    const determinismPlayground = getLearningItemPlayground(determinism);
    const costPlayground = getLearningItemPlayground(costAttribution);
    if (!determinismPlayground || !costPlayground)
      throw new Error("representative playground missing");

    expect(
      displayedValues(
        determinismPlayground.generateSteps(determinismPlayground.execution.cases[0].input)[0],
      ),
    ).toEqual(expect.arrayContaining(["7", '"linux-x86_64"']));

    const costCase = costPlayground.execution.cases[1];
    const finalCostStep = costPlayground.generateSteps(costCase.input).at(-1);
    if (!finalCostStep) throw new Error("cost visualization has no final decision frame");
    expect(displayedValues(finalCostStep)).toEqual(expect.arrayContaining(["840", "8.4", "true"]));
  });
});
