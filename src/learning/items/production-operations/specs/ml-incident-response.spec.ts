import { test } from "vitest";
import { mlIncidentResponse } from "../ml-incident-response";
import { expectFocusedProductionItem } from "./focusedItemContract";

test("contains a schema break with fallback and data repair instead of reflexive retraining", () => {
  expectFocusedProductionItem(mlIncidentResponse, {
    id: "ml-incident-response",
    topic: "ml_observability_incidents",
    kind: "debugging",
    caseId: "schema-break",
    expected: {
      first_signal: "schema_error",
      action: "fallback-and-repair-data",
      preserve: ["request-sample", "schema-version", "model-version"],
      retrain: false,
    },
  });
});
