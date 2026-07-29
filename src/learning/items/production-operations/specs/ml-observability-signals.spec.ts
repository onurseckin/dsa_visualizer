import { test } from "vitest";
import { mlObservabilitySignals } from "../ml-observability-signals";
import { expectFocusedProductionItem } from "./focusedItemContract";

test("separates service, data, model, fairness, and business signals by owner and latency", () => {
  expectFocusedProductionItem(mlObservabilitySignals, {
    id: "ml-observability-signals",
    topic: "ml_observability_incidents",
    kind: "scenario",
    caseId: "full-stack",
    expected: {
      service: ["p99_latency"],
      data: ["missing_feature_rate"],
      model: ["delayed_precision"],
      fairness: ["slice_false_negative_rate"],
      business: ["approved_application_rate"],
      immediate: 2,
      delayed: 3,
    },
  });
});
