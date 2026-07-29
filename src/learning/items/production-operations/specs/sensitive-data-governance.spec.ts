import { test } from "vitest";
import { sensitiveDataGovernance } from "../sensitive-data-governance";
import { expectFocusedProductionItem } from "./focusedItemContract";

test("propagates a deletion request through storage, audit, and model-impact review", () => {
  expectFocusedProductionItem(sensitiveDataGovernance, {
    id: "sensitive-data-governance",
    topic: "ml_governance_security_cost",
    kind: "debugging",
    caseId: "deletion-request",
    expected: {
      actions: [
        "delete-record",
        "revoke-feature-access",
        "append-audit-event",
        "review-unlearning",
      ],
      retained: false,
      affected_models: ["risk-v3", "risk-v4"],
      consent_valid: true,
    },
  });
});
