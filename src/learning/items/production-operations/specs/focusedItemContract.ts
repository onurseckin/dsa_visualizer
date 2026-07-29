import type { LearningItem, LearningItemKind } from "../../../types";
import { getLearningItemPlayground } from "../../../types";
import { expect } from "vitest";

export function expectFocusedProductionItem(
  item: LearningItem,
  expected: {
    readonly id: string;
    readonly topic: string;
    readonly kind: LearningItemKind;
    readonly caseId: string;
    readonly expected: unknown;
  },
): void {
  expect(item).toMatchObject({
    id: expected.id,
    kind: expected.kind,
    topicIds: [expected.topic],
  });
  const playground = getLearningItemPlayground(item);
  expect(playground).toBeDefined();
  expect(
    playground?.execution.cases.find((testCase) => testCase.id === expected.caseId)?.expected,
  ).toEqual(expected.expected);
  const frames = playground?.generateSteps(
    playground.execution.cases.find((testCase) => testCase.id === expected.caseId)?.input,
  );
  expect(frames?.length).toBeGreaterThanOrEqual(3);
}
