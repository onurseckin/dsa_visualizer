import { test } from "vitest";
import { rolloutRegressionDebugging } from "../rollout-regression-debugging";
import { expectFocusedProductionItem } from "./focusedItemContract";

test("identifies an input schema mismatch before blaming model quality", () => {
  expectFocusedProductionItem(rolloutRegressionDebugging, {
    id: "rollout-regression-debugging",
    topic: "ml_inference_serving",
    kind: "debugging",
    caseId: "schema-mismatch",
    expected: {
      diagnosis: "schema-mismatch",
      action: "halt-rollout-and-restore-compatible-schema",
      layer: "request-contract",
      rollback: true,
    },
  });
});
