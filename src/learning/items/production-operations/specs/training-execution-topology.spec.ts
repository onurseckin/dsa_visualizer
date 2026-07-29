import { test } from "vitest";
import { trainingExecutionTopology } from "../training-execution-topology";
import { expectFocusedProductionItem } from "./focusedItemContract";

test("selects Kubernetes when gang scheduling and topology control are required", () => {
  expectFocusedProductionItem(trainingExecutionTopology, {
    id: "training-execution-topology",
    topic: "ml_training_platform",
    kind: "scenario",
    caseId: "gang-scheduled",
    expected: {
      topology: "kubernetes",
      checkpoint_required: true,
      reasons: ["gang-scheduling", "topology-control", "preemption-recovery"],
    },
  });
});
