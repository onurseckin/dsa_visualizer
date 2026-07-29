import { describe, expect, it } from "vitest";

import { modelArtifactLineage } from "../model-artifact-lineage";
import { expectReproducibleDeliveryItem } from "./itemContract";

describe("model-artifact-lineage", () => {
  it("traces a timestamped artifact ancestry DAG", () => {
    expectReproducibleDeliveryItem(modelArtifactLineage, {
      id: "model-artifact-lineage",
      topicId: "ml_experiment_lineage",
      kind: "trace",
      snapshotKind: "graph",
    });
    const steps = modelArtifactLineage.generateSteps(
      modelArtifactLineage.execution!.cases[0]!.input,
    );
    expect(steps.at(-1)?.primarySnapshot).toMatchObject({ kind: "graph" });
    expect(JSON.stringify(steps)).toContain("model-v17");
  });
});
