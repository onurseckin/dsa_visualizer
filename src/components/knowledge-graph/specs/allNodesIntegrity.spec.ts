import { describe, expect, it } from "vitest";
import { getAllLearningItems } from "../../../learning/registry";
import { getLearningItemTopics } from "../../../app/topics";
import { DSA_TREE_PLACEMENTS } from "../data/dsaTree";
import { ML_INFRA_TREE_PLACEMENTS } from "../mlInfraTree";

describe("Systemic Knowledge Node Category & Navigation Integrity Spec", () => {
  const learningItems = getAllLearningItems();

  it("keeps every active learning item reachable from a curriculum placement", () => {
    const navigableTopicIds = new Set([
      ...DSA_TREE_PLACEMENTS.map((placement) => placement.topicId),
      ...ML_INFRA_TREE_PLACEMENTS.map((placement) => placement.topicId),
    ]);

    const orphanedItems = learningItems.filter(
      (item) => !getLearningItemTopics(item).some((topicId) => navigableTopicIds.has(topicId)),
    );

    expect(orphanedItems).toEqual([]);
  });

  it("keeps every established DSA placement backed by registered problems", () => {
    for (const node of DSA_TREE_PLACEMENTS) {
      const matching = learningItems.filter((item) =>
        getLearningItemTopics(item).includes(node.topicId),
      );

      expect(matching.length).toBeGreaterThan(0);
    }
  });
});
