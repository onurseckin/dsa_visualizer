import { describe, expect, it } from "vitest";
import { ALGORITHM_REGISTRY, getAllAlgorithms } from "../registry";

describe("ALGORITHM_REGISTRY sources metadata", () => {
  it("should contain exactly 40 algorithms", () => {
    const algorithms = getAllAlgorithms();
    expect(algorithms.length).toBe(40);
    expect(Object.keys(ALGORITHM_REGISTRY).length).toBe(40);
  });

  it("should have a non-empty sources array for every algorithm", () => {
    const algorithms = getAllAlgorithms();

    for (const alg of algorithms) {
      expect(alg.sources).toBeDefined();
      const sources = alg.sources ?? [];
      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);

      for (const source of sources) {
        expect(["leetcode", "book", "standard", "hackerrank", "other"]).toContain(source.kind);
        expect(typeof source.label).toBe("string");
        expect((source.label ?? "").length).toBeGreaterThan(0);

        if (source.kind === "book") {
          expect(source.bookTitle).toBe("Competitive Programmer's Handbook");
          expect(typeof source.chapter).toBe("number");
          expect(typeof source.section).toBe("string");
        }

        if (source.kind === "leetcode") {
          expect(typeof source.leetcodeId).toBe("number");
          expect(source.url ?? "").toMatch(/^https:\/\/leetcode\.com\/problems\//);
        }

        if (source.kind === "standard") {
          expect(source.label).toBe("Standard Algorithm");
        }
      }
    }
  });
});
