import { describe, expect, it } from "vitest";
import { ALGORITHM_REGISTRY, getAllAlgorithms } from "../registry";

describe("ALGORITHM_REGISTRY sources metadata", () => {
  it("should contain all registered algorithms", () => {
    const algorithms = getAllAlgorithms();
    expect(algorithms.length).toBeGreaterThanOrEqual(40);
    expect(Object.keys(ALGORITHM_REGISTRY).length).toBeGreaterThanOrEqual(40);
  });

  it("should have a non-empty sources array for every algorithm", () => {
    const algorithms = getAllAlgorithms();

    for (const alg of algorithms) {
      const sources = alg.sources ?? [];
      expect(Array.isArray(sources)).toBe(true);

      for (const source of sources) {
        expect(["leetcode", "book", "standard", "hackerrank", "ml_infra", "other"]).toContain(
          source.kind || source.type,
        );
        if (source.label) {
          expect(typeof source.label).toBe("string");
        }

        if (source.kind === "book" || source.type === "book") {
          expect(source.bookTitle).toBe("Competitive Programmer's Handbook");
        }

        if (source.kind === "leetcode" || source.type === "leetcode") {
          expect(source.url ?? "").toMatch(/^https:\/\/leetcode\.com\/problems\//);
        }
      }
    }
  });
});
