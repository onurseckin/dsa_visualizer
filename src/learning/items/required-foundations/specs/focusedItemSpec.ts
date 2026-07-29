import { describe, expect, it } from "vitest";

import { getLearningItemPlayground, type LearningItem } from "../../../types";

export function describeRequiredFoundation(
  item: LearningItem,
  expected: {
    readonly id: string;
    readonly kind: LearningItem["kind"];
    readonly snapshotKind: string;
    readonly contractTerm: string;
  },
): void {
  describe("focused required-foundation item", () => {
    it("keeps its exact identity, assessment mode, and completion contract", () => {
      expect(item.id).toBe(expected.id);
      expect(item.kind).toBe(expected.kind);
      expect(item.objective.trim().length).toBeGreaterThan(0);
      expect(item.completionEvidence.trim().length).toBeGreaterThan(0);
      if (item.kind === "algorithm") {
        throw new Error(`${expected.id} must use an authored nonalgorithm assessment`);
      }
      expect(item.assessment.payload).toBeDefined();
    });

    it(`teaches the ${expected.contractTerm} invariant through executable ${expected.snapshotKind} steps`, () => {
      const playground = getLearningItemPlayground(item);
      expect(playground).toBeDefined();
      if (!playground) return;
      expect(playground.execution.outputContract).toContain(expected.contractTerm);
      expect(playground.execution.cases.length).toBeGreaterThanOrEqual(3);
      const steps = playground.generateSteps(playground.execution.cases[0].input);
      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(steps.map((step) => step.primarySnapshot.kind)).toContain(expected.snapshotKind);
    });
  });
}
