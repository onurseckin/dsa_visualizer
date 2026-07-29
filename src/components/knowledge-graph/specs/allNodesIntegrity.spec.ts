import { describe, expect, it } from "vitest";
import { getAllLearningItems } from "../../../learning/registry";
import { getLearningItemTopics } from "../../../app/topics";
import { DSA_TREE_PLACEMENTS } from "../data/dsaTree";
import { ML_INFRA_TREE_PLACEMENTS } from "../mlInfraTree";

describe("Systemic Knowledge Node Category & Navigation Integrity Spec", () => {
  const learningItems = getAllLearningItems();
  const allNodes = [
    ...DSA_TREE_PLACEMENTS.map((n) => ({ tree: "DSA", ...n })),
    ...ML_INFRA_TREE_PLACEMENTS.map((n) => ({ tree: "ML_INFRA", ...n })),
  ];

  it("ensures zero orphaned items in the transitional 320-item learning registry", () => {
    const nodeCategoryFolders = new Set([
      ...DSA_TREE_PLACEMENTS.map((n) => n.topicId),
      ...ML_INFRA_TREE_PLACEMENTS.map((n) => n.topicId),
    ]);

    const orphaned = learningItems.filter((item) =>
      getLearningItemTopics(item).every((topicId) => !nodeCategoryFolders.has(topicId)),
    );

    expect(orphaned).toHaveLength(0);
  });

  it("gives every tree placement one or more registered problems", () => {
    for (const node of allNodes) {
      const matching = learningItems.filter((item) =>
        getLearningItemTopics(item).includes(node.topicId),
      );

      expect(matching.length).toBeGreaterThan(0);
    }
  });
});
