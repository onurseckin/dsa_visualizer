import { describe, expect, it } from "vitest";
import { getAllLearningItems } from "../../../learning/registry";
import { getLearningItemTopics } from "../../../app/topics";
import { ML_INFRA_LEGACY_TOPIC_TRANSITION } from "../../../curriculum/topics";
import { DSA_TREE_PLACEMENTS } from "../data/dsaTree";
import { ML_INFRA_TREE_PLACEMENTS } from "../mlInfraTree";

describe("Systemic Knowledge Node Category & Navigation Integrity Spec", () => {
  const learningItems = getAllLearningItems();

  it("isolates transitional legacy ML enrollment without hiding unrelated orphaned items", () => {
    const navigableTopicIds = new Set([
      ...DSA_TREE_PLACEMENTS.map((placement) => placement.topicId),
      ...ML_INFRA_TREE_PLACEMENTS.map((placement) => placement.topicId),
    ]);
    const transitionalLegacyMlTopicIds = new Set<string>(ML_INFRA_LEGACY_TOPIC_TRANSITION.topicIds);

    const unexplainedOrphans = learningItems.filter((item) => {
      const topicIds = getLearningItemTopics(item);
      const isNavigable = topicIds.some((topicId) => navigableTopicIds.has(topicId));
      const isTransitionalLegacyMl = topicIds.every((topicId) =>
        transitionalLegacyMlTopicIds.has(topicId),
      );
      return !isNavigable && !isTransitionalLegacyMl;
    });

    expect(unexplainedOrphans).toEqual([]);
    expect(
      learningItems.some((item) =>
        getLearningItemTopics(item).some((topicId) => transitionalLegacyMlTopicIds.has(topicId)),
      ),
    ).toBe(true);
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
