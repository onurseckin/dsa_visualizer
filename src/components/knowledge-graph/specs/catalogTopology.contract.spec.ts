import { describe, expect, it } from "vitest";
import { TOPIC_CATALOG } from "../../../curriculum/topics";
import type { CurriculumPlacement } from "../../../curriculum/trees";
import { DSA_TREE_PLACEMENTS } from "../data/dsaTree";
import { ML_INFRA_TREE_PLACEMENTS } from "../mlInfraTree";

const trees = [
  { id: "dsa", placements: DSA_TREE_PLACEMENTS },
  { id: "ml-infra", placements: ML_INFRA_TREE_PLACEMENTS },
] as const;

function duplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value)) return true;
    seen.add(value);
    return false;
  });
}

describe("topic placement and tree catalog contract", () => {
  it("uses unique placement ids per tree and valid placement-local prerequisites", () => {
    const violations = trees.flatMap((tree) => {
      const placementIds = tree.placements.map((placement) => placement.id);
      const declaredPlacements = new Set(placementIds);
      const invalidPrerequisites = tree.placements.flatMap((placement) =>
        placement.prerequisites
          .filter((prerequisiteId) => !declaredPlacements.has(prerequisiteId))
          .map((prerequisiteId) => ({
            treeId: tree.id,
            placementId: placement.id,
            prerequisiteId,
          })),
      );
      return [
        ...duplicateValues(placementIds).map((placementId) => ({
          treeId: tree.id,
          duplicatePlacementId: placementId,
        })),
        ...invalidPrerequisites,
      ];
    });

    expect(violations).toEqual([]);
  });

  it("references reusable topics from the canonical topic catalog", () => {
    const topicIds = new Set(TOPIC_CATALOG.map((topic) => topic.id));
    const invalidTopicReferences = trees.flatMap((tree) =>
      tree.placements
        .filter((placement) => !topicIds.has(placement.topicId))
        .map((placement) => ({
          treeId: tree.id,
          placementId: placement.id,
          topicId: placement.topicId,
        })),
    );

    expect(invalidTopicReferences).toEqual([]);
  });

  it("keeps tree presentation free of duplicated problem catalog facts", () => {
    const nodesWithStaticCatalogFacts = trees
      .flatMap((tree) =>
        tree.placements.map((placement: CurriculumPlacement) => ({
          treeId: tree.id,
          placementId: placement.id,
          hasAlgorithmCount: Object.hasOwn(placement, "algorithmCount"),
          hasQuestions: Object.hasOwn(placement, "questions"),
        })),
      )
      .filter(({ hasAlgorithmCount, hasQuestions }) => hasAlgorithmCount || hasQuestions);

    expect(nodesWithStaticCatalogFacts).toEqual([]);
  });
});
