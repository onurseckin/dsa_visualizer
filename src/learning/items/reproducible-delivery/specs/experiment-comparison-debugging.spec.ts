import { describe, expect, it } from "vitest";

import { experimentComparisonDebugging } from "../experiment-comparison-debugging";
import { expectReproducibleDeliveryItem } from "./itemContract";

describe("experiment-comparison-debugging", () => {
  it("exposes confounders and metric comparability in run records", () => {
    expectReproducibleDeliveryItem(experimentComparisonDebugging, {
      id: "experiment-comparison-debugging",
      topicId: "ml_experiment_lineage",
      kind: "debugging",
      snapshotKind: "matrix",
    });
    expect(
      experimentComparisonDebugging.assessment.payload?.evidence.map((entry) => entry.label),
    ).toEqual(["Baseline run", "Candidate run"]);
    expect(experimentComparisonDebugging.assessment.payload?.failingTests).toContain(
      "Reject a comparison when metric protocol or dataset snapshot differs.",
    );
  });
});
