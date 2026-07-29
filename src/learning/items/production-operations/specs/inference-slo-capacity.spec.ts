import { expect, test } from "vitest";
import { getLearningItemPlayground } from "../../../types";
import { inferenceSloCapacity } from "../inference-slo-capacity";
import { expectFocusedProductionItem } from "./focusedItemContract";

test("uses Little's law and target utilization to size replicas under a latency SLO", () => {
  const arrivalRps = 100;
  const meanEndToEndLatencyMs = 90;
  const measuredEndToEndP95Ms = 135;
  const replicaRps = 40;
  const targetUtilization = 0.8;
  const replicas = Math.ceil(arrivalRps / (replicaRps * targetUtilization));

  expectFocusedProductionItem(inferenceSloCapacity, {
    id: "inference-slo-capacity",
    topic: "ml_inference_serving",
    kind: "calculator",
    caseId: "steady-online",
    expected: {
      concurrency: arrivalRps * (meanEndToEndLatencyMs / 1000),
      measured_end_to_end_p95_ms: measuredEndToEndP95Ms,
      replicas,
      utilization: arrivalRps / (replicas * replicaRps),
      slo_met: measuredEndToEndP95Ms <= 150,
      hourly_cost: replicas * 0.5,
    },
  });
  const playground = getLearningItemPlayground(inferenceSloCapacity);
  if (!playground) throw new Error("inference-slo-capacity: missing playground");
  expect(playground.generateSteps(playground.execution.cases[0]!.input)).not.toEqual(
    playground.generateSteps(playground.execution.cases[1]!.input),
  );
});
