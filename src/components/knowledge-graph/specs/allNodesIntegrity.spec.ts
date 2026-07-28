import { describe, expect, it } from "vitest";
import { getAllAlgorithms } from "../../../algorithms/registry";
import { getAlgorithmCategories } from "../../../app/categories";
import type { CategoryType } from "../../../types/dsa";
import { TOPIC_ROADMAP_NODES } from "../data/topicRoadmapNodes";
import { ML_INFRA_NODES } from "../mlInfraGraphData";

describe("Systemic Knowledge Node Category & Navigation Integrity Spec", () => {
  const algorithms = getAllAlgorithms();
  const allNodes = [
    ...TOPIC_ROADMAP_NODES.map((n) => ({ tree: "DSA", ...n })),
    ...ML_INFRA_NODES.map((n) => ({ tree: "ML_INFRA", ...n })),
  ];

  it("ensures zero orphaned algorithms in ALGORITHM_REGISTRY across all 320 problems", () => {
    const nodeCategoryFolders = new Set([
      ...TOPIC_ROADMAP_NODES.map((n) => n.categoryFolder),
      ...ML_INFRA_NODES.map((n) => n.categoryFolder),
    ]);

    const orphaned = algorithms.filter((alg) => {
      const cats = getAlgorithmCategories(alg);
      const allCats = new Set([...cats, alg.category, alg.mlInfraCategory].filter(Boolean));
      for (const c of allCats) {
        if (nodeCategoryFolders.has(c as string)) return false;
      }
      return true;
    });

    expect(orphaned).toHaveLength(0);
  });

  it("verifies 100% 1-to-1 match between node definition counts and registered algorithms across all 34 nodes", () => {
    for (const node of allNodes) {
      const matching = algorithms.filter((alg) => {
        const algCats = new Set<string>();
        getAlgorithmCategories(alg).forEach((c) => algCats.add(c));
        if (alg.category) algCats.add(alg.category);
        if (alg.mlInfraCategory) algCats.add(alg.mlInfraCategory);
        return algCats.has(node.categoryFolder);
      });

      expect(node.algorithmCount).toBe(matching.length);
    }
  });

  it("verifies category search routing produces exact promised problem count for every node", () => {
    for (const node of allNodes) {
      const matching = algorithms.filter((alg) => {
        const algCats = getAlgorithmCategories(alg);
        return algCats.includes(node.categoryFolder as CategoryType);
      });

      expect(matching.length).toBeGreaterThan(0);
      expect(matching.length).toBe(node.algorithmCount);
    }
  });
});
