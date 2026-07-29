import { describe, expect, it } from "vitest";

import { mlPipelineRetryCache } from "../ml-pipeline-retry-cache";
import { expectReproducibleDeliveryItem } from "./itemContract";

describe("ml-pipeline-retry-cache", () => {
  it("traces DAG order, content-addressed cache keys, and retry safety", () => {
    expectReproducibleDeliveryItem(mlPipelineRetryCache, {
      id: "ml-pipeline-retry-cache",
      topicId: "ml_workflow_orchestration",
      kind: "trace",
      snapshotKind: "graph",
    });
    expect(mlPipelineRetryCache.execution!.outputContract).toContain("SHA-256");
    expect(
      JSON.stringify(
        mlPipelineRetryCache.generateSteps(mlPipelineRetryCache.execution!.cases[0]!.input),
      ),
    ).toContain("cache");
  });
});
