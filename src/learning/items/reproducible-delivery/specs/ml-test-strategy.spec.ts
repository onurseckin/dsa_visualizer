import { describe, expect, it } from "vitest";

import { mlTestStrategy } from "../ml-test-strategy";
import { expectReproducibleDeliveryItem } from "./itemContract";

describe("ml-test-strategy", () => {
  it("uses a rubric for strategy and an executable coverage validator", () => {
    expectReproducibleDeliveryItem(mlTestStrategy, {
      id: "ml-test-strategy",
      topicId: "ml_workflow_orchestration",
      kind: "scenario",
      snapshotKind: "array",
    });
    expect(mlTestStrategy.rubric.criteria.map((criterion) => criterion.id)).toContain(
      "model-behavior",
    );
  });
});
