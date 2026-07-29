import { test } from "vitest";
import { modelRegistryStateMachine } from "../model-registry-state-machine";
import { expectFocusedProductionItem } from "./focusedItemContract";

test("traces the legal candidate-to-deployed registry lifecycle", () => {
  expectFocusedProductionItem(modelRegistryStateMachine, {
    id: "model-registry-state-machine",
    topic: "ml_model_registry",
    kind: "trace",
    caseId: "deploy-approved",
    expected: {
      state: "deployed",
      accepted: true,
      history: ["candidate", "approved", "deployed"],
      rejected_event: null,
    },
  });
});
