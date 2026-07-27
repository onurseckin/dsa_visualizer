import { describe, expect, it } from "vitest";
import {
  lshVectorHashing,
  DEFAULT_LSH_VECTOR_HASHING_INPUT,
  generateLshVectorHashingSteps,
} from "../lshVectorHashing";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("lshVectorHashing algorithm spec", () => {
  it("should have correct ML Infra Level 4 metadata", () => {
    expect(lshVectorHashing.id).toBe("lsh-vector-hashing");
    expect(lshVectorHashing.isMlInfra).toBe(true);
    expect(lshVectorHashing.mlInfraLevel).toBe(4);
    expect(lshVectorHashing.category).toBe("ml_vector_search");
    expect(lshVectorHashing.defaultInput).toEqual(DEFAULT_LSH_VECTOR_HASHING_INPUT);
    expect(lshVectorHashing.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" },
    ]);
  });

  it("should compute correct LSH binary hash codes and Hamming distance ranking", () => {
    const steps = generateLshVectorHashingSteps(DEFAULT_LSH_VECTOR_HASHING_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(22);

    const distTable = lastStep.auxiliaryState.distanceTable;
    expect(distTable).toBeDefined();
    expect(distTable?.V0).toBe(0);
    expect(distTable?.V1).toBe(1);
    expect(distTable?.V2).toBe(2);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
    expect(snap.elements.length).toBe(4);
    expect(snap.elements[0].state).toBe("sorted");
  });

  it("should handle multi-dimensional hyperplanes", () => {
    const input3D = {
      vectors: [
        { id: "V0", values: [1.0, 2.0, 1.0] },
        { id: "V1", values: [1.0, -1.0, 1.0] },
        { id: "V2", values: [-2.0, -2.0, -2.0] },
      ],
      hyperplanes: [
        [1.0, 0.0, 0.0],
        [0.0, 1.0, 0.0],
        [0.0, 0.0, 1.0],
      ],
      query: [1.0, 1.0, 1.0],
    };
    const steps = generateLshVectorHashingSteps(input3D);
    const lastStep = steps[steps.length - 1];
    const distTable = lastStep.auxiliaryState.distanceTable;
    expect(distTable?.V0).toBe(0);
    expect(distTable?.V1).toBe(1);
    expect(distTable?.V2).toBe(3);
  });
});

describe("lshVectorHashing trivia metadata", () => {
  const meta = lshVectorHashing.trivia;
  const lines = lshVectorHashing.code.replace(/\s+$/, "").split("\n");

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
