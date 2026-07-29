import { describe, it } from "vitest";

import { runReproductionManifest } from "../run-reproduction-manifest";
import { expectReproducibleDeliveryItem } from "./itemContract";

describe("run-reproduction-manifest", () => {
  it("authors a rubric-pending scenario with an executable manifest validator", () => {
    expectReproducibleDeliveryItem(runReproductionManifest, {
      id: "run-reproduction-manifest",
      topicId: "ml_experiment_lineage",
      kind: "scenario",
      snapshotKind: "graph",
    });
  });
});
