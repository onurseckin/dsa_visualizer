import { describe, expect, it } from "vitest";

import { trainingServingSkew } from "../training-serving-skew";
import { expectReproducibleDeliveryItem } from "./itemContract";

describe("training-serving-skew", () => {
  it("diagnoses transform, schema, default, freshness, and clock skew", () => {
    expectReproducibleDeliveryItem(trainingServingSkew, {
      id: "training-serving-skew",
      topicId: "ml_feature_pipelines",
      kind: "debugging",
      snapshotKind: "matrix",
    });
    expect(trainingServingSkew.assessment.payload?.evidence.map((entry) => entry.label)).toContain(
      "Online request",
    );
  });
});
