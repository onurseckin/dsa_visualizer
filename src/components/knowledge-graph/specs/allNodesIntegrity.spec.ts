import { describe, expect, it } from "vitest";
import { getAllAlgorithms } from "../../../algorithms/registry";
import { getAlgorithmTopics } from "../../../app/topics";
import { DSA_TREE_PLACEMENTS } from "../data/dsaTree";
import { ML_INFRA_TREE_PLACEMENTS } from "../mlInfraTree";

describe("Systemic Knowledge Node Category & Navigation Integrity Spec", () => {
  const algorithms = getAllAlgorithms();
  const allNodes = [
    ...DSA_TREE_PLACEMENTS.map((n) => ({ tree: "DSA", ...n })),
    ...ML_INFRA_TREE_PLACEMENTS.map((n) => ({ tree: "ML_INFRA", ...n })),
  ];

  it("ensures zero orphaned algorithms in ALGORITHM_REGISTRY across all 320 problems", () => {
    const nodeCategoryFolders = new Set([
      ...DSA_TREE_PLACEMENTS.map((n) => n.topicId),
      ...ML_INFRA_TREE_PLACEMENTS.map((n) => n.topicId),
    ]);

    const orphaned = algorithms.filter((algorithm) =>
      getAlgorithmTopics(algorithm).every((topicId) => !nodeCategoryFolders.has(topicId)),
    );

    expect(orphaned).toHaveLength(0);
  });

  it("gives every tree placement one or more registered problems", () => {
    for (const node of allNodes) {
      const matching = algorithms.filter((algorithm) =>
        getAlgorithmTopics(algorithm).includes(node.topicId),
      );

      expect(matching.length).toBeGreaterThan(0);
    }
  });
});
