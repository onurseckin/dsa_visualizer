import { expect, it } from "vitest";
import { getLearningItemPlayground } from "../../../types";
import { evaluationCalibrationSlices } from "../evaluation-calibration-slices";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(evaluationCalibrationSlices, {
  id: "evaluation-calibration-slices",
  kind: "calculator",
  snapshotKind: "matrix",
  contractTerm: "Brier",
});

it("reports a threshold curve, calibration, ranking, and slice evidence", () => {
  const playground = getLearningItemPlayground(evaluationCalibrationSlices);
  if (!playground) throw new Error("evaluation-calibration-slices: missing playground");
  const execution = playground.execution;
  expect(execution.outputContract).toContain("average_precision");
  expect(execution.outputContract).toContain("tp");
  expect(execution.outputContract).toContain("threshold_curve");
  expect(execution.cases).toContainEqual(
    expect.objectContaining({
      id: "slice-gap",
      expected: expect.objectContaining({
        __all__: expect.objectContaining({
          tp: 1,
          average_precision: 0.833333,
          threshold_curve: [
            expect.objectContaining({
              threshold: 0.3,
              tp: 2,
              fp: 1,
              precision: 0.666667,
              recall: 1,
            }),
            expect.objectContaining({
              threshold: 0.5,
              tp: 1,
              fp: 0,
              precision: 1,
              recall: 0.5,
            }),
          ],
        }),
      }),
    }),
  );
  expect(playground.generateSteps(execution.cases[0]!.input)).not.toEqual(
    playground.generateSteps(execution.cases[1]!.input),
  );
  const ties = execution.cases.filter((testCase) => testCase.id.startsWith("tied-score"));
  expect(ties).toHaveLength(2);
  expect(ties[0]?.expected).toEqual(ties[1]?.expected);
});
