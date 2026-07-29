import { describe, expect, it } from "vitest";

import { arraySteps, inputEvidenceSteps } from "../index";

const cases = [
  {
    id: "small",
    label: "Small workload",
    input: { workers: 2, rate: 4 },
    expected: { capacity: 8, saturated: false },
    comparison: "deep-equal",
  },
  {
    id: "large",
    label: "Large workload",
    input: { workers: 3, rate: 9 },
    expected: { capacity: 27, saturated: true },
    comparison: "deep-equal",
  },
] as const;

describe("inputEvidenceSteps", () => {
  it("surrounds explicitly conceptual frames with selected input and expected output evidence", () => {
    const conceptual = arraySteps([
      {
        codeLine: 2,
        what: "Explain a reusable capacity concept.",
        why: "This frame is intentionally not the selected case output.",
        values: ["workers × rate"],
        activeIndices: [0],
      },
      {
        codeLine: 3,
        what: "Connect the concept to a decision.",
        why: "The relationship is reusable across cases.",
        values: ["compare to demand"],
        activeIndices: [0],
      },
    ]);

    const small = inputEvidenceSteps(conceptual, cases[0].input, ["workers", "rate"], cases);
    const large = inputEvidenceSteps(conceptual, cases[1].input, ["workers", "rate"], cases);

    expect(small).toHaveLength(4);
    expect(small[1]?.explanation.what).toContain("Conceptual trace");
    expect(small.at(-1)?.explanation.what).toContain("authored expected output");
    expect(small[0]?.primarySnapshot).toEqual(
      expect.objectContaining({
        elements: expect.arrayContaining([
          expect.objectContaining({ label: "workers", value: "2" }),
        ]),
      }),
    );
    expect(small.at(-1)?.primarySnapshot).toEqual(
      expect.objectContaining({
        elements: expect.arrayContaining([
          expect.objectContaining({ label: "capacity", value: "8" }),
        ]),
      }),
    );
    expect(large.at(-1)?.primarySnapshot).toEqual(
      expect.objectContaining({
        elements: expect.arrayContaining([
          expect.objectContaining({ label: "capacity", value: "27" }),
        ]),
      }),
    );
    expect(small.at(-1)?.primarySnapshot).not.toEqual(large.at(-1)?.primarySnapshot);
  });

  it("does not label conceptual constants as output for a custom, unauthored input", () => {
    const conceptual = arraySteps([
      {
        codeLine: 2,
        what: "Explain a reusable concept.",
        why: "It is conceptual.",
        values: [999],
        activeIndices: [0],
      },
      {
        codeLine: 3,
        what: "Explain a second reusable concept.",
        why: "It remains conceptual.",
        values: [999],
        activeIndices: [0],
      },
    ]);

    const steps = inputEvidenceSteps(conceptual, { workers: 7, rate: 11 }, ["workers"], cases);

    expect(steps.at(-1)?.explanation.what).toContain("No authored expected output");
    expect(JSON.stringify(steps.at(-1)?.primarySnapshot)).not.toContain("999");
  });
});
