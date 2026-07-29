import { describe, expect, it } from "vitest";

import { staleArtifactPipelineDebugging } from "../stale-artifact-pipeline-debugging";
import { expectReproducibleDeliveryItem } from "./itemContract";

describe("stale-artifact-pipeline-debugging", () => {
  it("diagnoses stale inputs, code, schema, and unsafe retry evidence", () => {
    expectReproducibleDeliveryItem(staleArtifactPipelineDebugging, {
      id: "stale-artifact-pipeline-debugging",
      topicId: "ml_workflow_orchestration",
      kind: "debugging",
      snapshotKind: "graph",
    });
    expect(staleArtifactPipelineDebugging.assessment.payload?.failingTests).toContain(
      "Invalidate cached output when any declared digest changes.",
    );
  });
});
