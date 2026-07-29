import { test } from "vitest";
import { inferenceTopologySelection } from "../inference-topology-selection";
import { expectFocusedProductionItem } from "./focusedItemContract";

test("selects asynchronous inference for durable noninteractive requests", () => {
  expectFocusedProductionItem(inferenceTopologySelection, {
    id: "inference-topology-selection",
    topic: "ml_inference_serving",
    kind: "scenario",
    caseId: "durable-async",
    expected: {
      topology: "asynchronous",
      freshness: "minutes",
      delivery: "durable-queue",
      reason: "response-not-required-inline",
    },
  });
});
