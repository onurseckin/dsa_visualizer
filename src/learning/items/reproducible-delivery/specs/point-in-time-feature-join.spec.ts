import { describe, expect, it } from "vitest";

import { pointInTimeFeatureJoin } from "../point-in-time-feature-join";
import { expectReproducibleDeliveryItem } from "./itemContract";

describe("point-in-time-feature-join", () => {
  it("contrasts point-in-time eligible and future feature records", () => {
    expectReproducibleDeliveryItem(pointInTimeFeatureJoin, {
      id: "point-in-time-feature-join",
      topicId: "ml_feature_pipelines",
      kind: "trace",
      snapshotKind: "matrix",
    });
    const input = pointInTimeFeatureJoin.execution!.cases[0]!.input;
    expect(JSON.stringify(input)).toMatch(/2026-0[67]-/);
    expect(JSON.stringify(pointInTimeFeatureJoin.generateSteps(input))).toContain("future");
  });
});
