import { test } from "vitest";
import { trainingSchedulerDebugging } from "../training-scheduler-debugging";
import { expectFocusedProductionItem } from "./focusedItemContract";

test("prioritizes quota evidence before placement or workload execution", () => {
  expectFocusedProductionItem(trainingSchedulerDebugging, {
    id: "training-scheduler-debugging",
    topic: "ml_training_platform",
    kind: "debugging",
    caseId: "quota-starvation",
    expected: {
      phase: "admission",
      diagnosis: "quota-exhausted",
      recovery: "reduce-request-or-raise-quota",
      checkpoint_usable: false,
    },
  });
});
