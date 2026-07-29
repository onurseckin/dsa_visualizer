import { expect, it } from "vitest";
import { getLearningItemPlayground } from "../../../types";
import { datasetContractValidator } from "../dataset-contract-validator";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(datasetContractValidator, {
  id: "dataset-contract-validator",
  kind: "debugging",
  snapshotKind: "matrix",
  contractTerm: "exact",
});

it("makes contract, freshness, semantic, unexpected-field, and evolution evidence executable", () => {
  const playground = getLearningItemPlayground(datasetContractValidator);
  if (!playground) throw new Error("dataset-contract-validator: missing playground");
  const execution = playground.execution;
  expect(execution.outputContract).toContain("freshness");
  expect(execution.outputContract).toContain("compatible");
  expect(execution.outputContract).toContain("unexpected");
  expect(execution.cases).toContainEqual(
    expect.objectContaining({
      id: "breaking-evolution",
      expected: expect.objectContaining({
        valid: false,
        evolution: "breaking",
      }),
    }),
  );
  expect(execution.cases).toContainEqual(
    expect.objectContaining({
      id: "unexpected-fields",
      expected: expect.objectContaining({
        valid: false,
        errors: ["row 0: unexpected debug_note", "row 0: unexpected legacy_score"],
      }),
    }),
  );
  expect(execution.cases).toContainEqual(
    expect.objectContaining({
      id: "semantic-check-after-invalid-type",
      expected: {
        valid: false,
        errors: ["row 0: score expected float"],
        evolution: "compatible",
      },
    }),
  );
  expect(playground.generateSteps(execution.cases[0]!.input)).not.toEqual(
    playground.generateSteps(execution.cases[1]!.input),
  );
});
