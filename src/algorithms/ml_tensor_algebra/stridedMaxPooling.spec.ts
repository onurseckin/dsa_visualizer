import { describe, expect, it } from "vitest";
import {
  DEFAULT_STRIDEDMAXPOOLING_INPUT,
  generateStridedMaxPoolingSteps,
  stridedMaxPooling,
} from "./stridedMaxPooling";

const pooledResult = (input: Parameters<typeof generateStridedMaxPoolingSteps>[0]) => {
  const steps = generateStridedMaxPoolingSteps(input);
  return {
    steps,
    pooled: JSON.parse(String(steps.at(-1)?.variables.pooled)),
  };
};

describe("strided-max-pooling", () => {
  it("declares canonical metadata and explains every Python line", () => {
    expect(stridedMaxPooling.id).toBe("strided-max-pooling");
    expect(stridedMaxPooling.topicIds).toEqual(["ml_tensor_algebra", "arrays_and_hashing"]);

    const explanations = stridedMaxPooling.trivia?.lineExplanations;
    expect(explanations).toBeDefined();
    for (let line = 1; line <= stridedMaxPooling.code.split("\n").length; line += 1) {
      expect(explanations?.[line]).toEqual(expect.any(String));
    }
  });

  it("computes the authored non-overlapping pooling example", () => {
    const { steps, pooled } = pooledResult(DEFAULT_STRIDEDMAXPOOLING_INPUT);

    expect(pooled).toEqual([
      [6, 8],
      [9, 7],
    ]);
    expect(steps.some((step) => step.variables.isNewMax === true)).toBe(true);
    expect(steps.some((step) => step.variables.isNewMax === false)).toBe(true);
    expect(steps.at(-1)?.primarySnapshot.kind).toBe("matrix");
  });

  it("builds a square matrix from flat data and supports overlapping windows", () => {
    expect(
      pooledResult({
        data: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        poolSize: 2,
        stride: 1,
      }).pooled,
    ).toEqual([
      [5, 6],
      [8, 9],
    ]);
  });

  it("falls back safely and produces an empty result when the pool cannot fit", () => {
    expect(pooledResult({ data: [] }).pooled).toEqual([
      [6, 8],
      [9, 7],
    ]);
    expect(pooledResult({ matrix: [[5]], poolSize: 2, stride: 1 }).pooled).toEqual([]);
  });
});
