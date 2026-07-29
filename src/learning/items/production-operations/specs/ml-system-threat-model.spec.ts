import { test } from "vitest";
import { mlSystemThreatModel } from "../ml-system-threat-model";
import { expectFocusedProductionItem } from "./focusedItemContract";

test("maps credential, artifact, data, and endpoint threats to lifecycle controls", () => {
  expectFocusedProductionItem(mlSystemThreatModel, {
    id: "ml-system-threat-model",
    topic: "ml_governance_security_cost",
    kind: "scenario",
    caseId: "exposed-supply-chain",
    expected: {
      threats: ["credential-theft", "data-poisoning", "artifact-tampering", "endpoint-abuse"],
      controls: [
        "short-lived-identity",
        "data-provenance-validation",
        "signed-artifact-verification",
        "authentication-rate-limits",
      ],
      risk_score: 12,
    },
  });
});
