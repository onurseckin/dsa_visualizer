import { describe, expect, it } from "vitest";
import {
  DEFAULT_DISTANCE_METRICS_KNN_INPUT,
  DISTANCE_METRICS_KNN_CODE,
  distanceMetricsKnn,
  generateDistanceMetricsKnnSteps,
} from "../distanceMetricsKnn";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("distanceMetricsKnn algorithm spec", () => {
  it("should have correct ML Infra Level 4 metadata", () => {
    expect(distanceMetricsKnn.id).toBe("distance-metrics-knn");
    expect(distanceMetricsKnn.isMlInfra).toBe(true);
    expect(distanceMetricsKnn.mlInfraLevel).toBe(4);
    expect(distanceMetricsKnn.category).toBe("ml_vector_search");
    expect(distanceMetricsKnn.defaultInput).toEqual(DEFAULT_DISTANCE_METRICS_KNN_INPUT);
    expect(distanceMetricsKnn.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" },
    ]);
  });

  it("should compute correct k-NN using Euclidean metric", () => {
    const steps = generateDistanceMetricsKnnSteps(DEFAULT_DISTANCE_METRICS_KNN_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.complete).toBe(true);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
    const sortedCount = snap.elements.filter((el) => el.state === "sorted").length;
    expect(sortedCount).toBe(2);
  });

  it("should support Manhattan and Cosine metrics", () => {
    const manhattanSteps = generateDistanceMetricsKnnSteps({
      query: [0, 0],
      dataset: [
        [1, 1],
        [2, 0],
      ],
      k: 1,
      metric: "manhattan",
    });
    expect(manhattanSteps.length).toBeGreaterThan(0);

    const cosineSteps = generateDistanceMetricsKnnSteps({
      query: [1, 0],
      dataset: [
        [1, 0],
        [0, 1],
      ],
      k: 1,
      metric: "cosine",
    });
    expect(cosineSteps.length).toBeGreaterThan(0);
  });
});

describe("distanceMetricsKnn trivia metadata", () => {
  const meta = distanceMetricsKnn.trivia;
  const lines = DISTANCE_METRICS_KNN_CODE.replace(/\s+$/, "").split("\n");

  it("points skipLines and hints at valid lines", () => {
    expect(meta).toBeDefined();
    const skipped = meta?.skipLines ?? [];
    const hinted = (meta?.hints ?? []).map((entry) => entry.line);
    expect(hinted.length).toBeGreaterThanOrEqual(2);
    [...skipped, ...hinted].forEach((line) => {
      expect(line).toBeGreaterThanOrEqual(1);
      expect(line).toBeLessThanOrEqual(lines.length);
    });
  });

  it("never offers a distractor that is actually a correct line", () => {
    const real = new Set(lines.map((line) => line.trim()));
    const distractors = meta?.distractors ?? [];
    expect(distractors.length).toBeGreaterThanOrEqual(3);
    distractors.forEach((distractor) => {
      expect(real.has(distractor.trim())).toBe(false);
    });
  });
});
