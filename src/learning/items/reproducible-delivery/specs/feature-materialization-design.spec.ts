import { describe, expect, it } from "vitest";

import { featureMaterializationDesign } from "../feature-materialization-design";
import { expectReproducibleDeliveryItem } from "./itemContract";

describe("feature-materialization-design", () => {
  it("keeps architecture choice rubric-based and validates the plan artifact", () => {
    expectReproducibleDeliveryItem(featureMaterializationDesign, {
      id: "feature-materialization-design",
      topicId: "ml_feature_pipelines",
      kind: "scenario",
      snapshotKind: "graph",
    });
    expect(featureMaterializationDesign.prompt.constraints).toContain(
      "State how event time, freshness, and late data are handled.",
    );
    expect(
      featureMaterializationDesign.rubric.criteria.some((criterion) => criterion.critical),
    ).toBe(true);
  });
});
