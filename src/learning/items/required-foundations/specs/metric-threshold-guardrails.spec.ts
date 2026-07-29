import { expect, it } from "vitest";
import { getLearningItemPlayground } from "../../../types";
import { metricThresholdGuardrails } from "../metric-threshold-guardrails";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(metricThresholdGuardrails, {
  id: "metric-threshold-guardrails",
  kind: "calculator",
  snapshotKind: "matrix",
  contractTerm: "flag_rate",
});

it("selects a feasible threshold using costs and segment guardrails", () => {
  const playground = getLearningItemPlayground(metricThresholdGuardrails);
  if (!playground) throw new Error("metric-threshold-guardrails: missing playground");
  const execution = playground.execution;
  expect(execution.outputContract).toContain("expected_cost");
  expect(execution.outputContract).toContain("segment_guardrail_met");
  expect(execution.cases).toContainEqual(
    expect.objectContaining({
      id: "cost-aware-segments",
      expected: expect.objectContaining({ selected_threshold: 0.7 }),
    }),
  );
  expect(playground.generateSteps(execution.cases[0]!.input)).not.toEqual(
    playground.generateSteps(execution.cases[1]!.input),
  );
});
