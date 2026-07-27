import { describe, expect, it } from "vitest";
import {
  ivfPqAdcSearch,
  DEFAULT_IVF_PQ_ADC_INPUT,
  generateIvfPqAdcSearchSteps,
} from "../ivfPqAdcSearch";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("ivfPqAdcSearch algorithm spec", () => {
  it("should have correct ML Infra Level 4 metadata", () => {
    expect(ivfPqAdcSearch.id).toBe("ivf-pq-adc-search");
    expect(ivfPqAdcSearch.isMlInfra).toBe(true);
    expect(ivfPqAdcSearch.mlInfraLevel).toBe(4);
    expect(ivfPqAdcSearch.category).toBe("ml_vector_search");
    expect(ivfPqAdcSearch.defaultInput).toEqual(DEFAULT_IVF_PQ_ADC_INPUT);
    expect(ivfPqAdcSearch.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" },
    ]);
  });

  it("should probe coarse centroids and compute exact ADC lookup distances", () => {
    const steps = generateIvfPqAdcSearchSteps(DEFAULT_IVF_PQ_ADC_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(29);

    const distTable = lastStep.auxiliaryState.distanceTable;
    expect(distTable).toBeDefined();
    expect(distTable?.V1).toBe(2);
    expect(distTable?.V0).toBe(25);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
    expect(snap.elements.length).toBe(2);
    expect(snap.elements[0].state).toBe("sorted");
  });

  it("should support probing multiple coarse centroids when nprobe > 1", () => {
    const inputMulti = {
      ...DEFAULT_IVF_PQ_ADC_INPUT,
      query: [5.0, 5.0],
      nprobe: 2,
    };
    const steps = generateIvfPqAdcSearchSteps(inputMulti);
    const lastStep = steps[steps.length - 1];
    const distTable = lastStep.auxiliaryState.distanceTable;
    expect(distTable?.V2).toBeDefined();
  });
});

describe("ivfPqAdcSearch trivia metadata", () => {
  const meta = ivfPqAdcSearch.trivia;
  const lines = ivfPqAdcSearch.code.replace(/\s+$/, "").split("\n");

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
