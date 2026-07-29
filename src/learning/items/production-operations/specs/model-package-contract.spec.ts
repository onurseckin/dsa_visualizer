import { test } from "vitest";
import { modelPackageContract } from "../model-package-contract";
import { expectFocusedProductionItem } from "./focusedItemContract";

test("rejects a package whose preprocessing and smoke test contracts are absent", () => {
  expectFocusedProductionItem(modelPackageContract, {
    id: "model-package-contract",
    topic: "ml_model_registry",
    kind: "debugging",
    caseId: "missing-contracts",
    expected: {
      valid: false,
      missing: ["preprocessing", "smoke_test"],
      signature: "features:list[number]->scores:list[number]",
      deterministic_smoke_test: false,
    },
  });
});
