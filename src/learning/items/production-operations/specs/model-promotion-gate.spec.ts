import { test } from "vitest";
import { modelPromotionGate } from "../model-promotion-gate";
import { expectFocusedProductionItem } from "./focusedItemContract";

test("blocks promotion on quality, lineage, and vulnerability evidence", () => {
  expectFocusedProductionItem(modelPromotionGate, {
    id: "model-promotion-gate",
    topic: "ml_model_registry",
    kind: "scenario",
    caseId: "multiple-blockers",
    expected: {
      decision: "blocked",
      blockers: ["quality", "lineage", "vulnerability"],
      passed: 3,
      required: 6,
    },
  });
});
