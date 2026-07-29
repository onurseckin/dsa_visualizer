import { metricThresholdGuardrails } from "../metric-threshold-guardrails";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(metricThresholdGuardrails, {
  id: "metric-threshold-guardrails",
  kind: "calculator",
  snapshotKind: "matrix",
  contractTerm: "flag_rate",
});
