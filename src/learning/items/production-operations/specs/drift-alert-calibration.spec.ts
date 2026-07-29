import { test } from "vitest";
import { driftAlertCalibration } from "../drift-alert-calibration";
import { expectFocusedProductionItem } from "./focusedItemContract";

test("suppresses a drift page until minimum samples and delayed labels are available", () => {
  const reference = [0.5, 0.5];
  const current = [0.64, 0.36];
  const psi = reference.reduce(
    (total, referenceRatio, index) =>
      total + (current[index]! - referenceRatio) * Math.log(current[index]! / referenceRatio),
    0,
  );
  const currentSamples = 100;
  const sampleEligible = currentSamples >= 200;

  expectFocusedProductionItem(driftAlertCalibration, {
    id: "drift-alert-calibration",
    topic: "ml_observability_incidents",
    kind: "calculator",
    caseId: "too-few-samples",
    expected: {
      psi: Number(psi.toFixed(6)),
      sample_eligible: sampleEligible,
      drift_alert: sampleEligible && psi >= 0.05,
      performance_ready: false,
      alerted_segments: [],
    },
  });
});
