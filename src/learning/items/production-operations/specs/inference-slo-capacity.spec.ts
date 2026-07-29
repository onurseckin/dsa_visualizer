import { test } from "vitest";
import { inferenceSloCapacity } from "../inference-slo-capacity";
import { expectFocusedProductionItem } from "./focusedItemContract";

test("uses Little's law and target utilization to size replicas under a latency SLO", () => {
  const arrivalRps = 100;
  const p95Ms = 80 + 25 + 15;
  const replicaRps = 40;
  const targetUtilization = 0.8;
  const replicas = Math.ceil(arrivalRps / (replicaRps * targetUtilization));

  expectFocusedProductionItem(inferenceSloCapacity, {
    id: "inference-slo-capacity",
    topic: "ml_inference_serving",
    kind: "calculator",
    caseId: "steady-online",
    expected: {
      concurrency: arrivalRps * (p95Ms / 1000),
      estimated_p95_ms: p95Ms,
      replicas,
      utilization: arrivalRps / (replicas * replicaRps),
      slo_met: p95Ms <= 150,
      hourly_cost: replicas * 0.5,
    },
  });
});
