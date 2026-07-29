import { ALGORITHMS } from "../algorithms/registry";
import { adaptAlgorithmDefinition } from "./algorithmAdapters";
import { REQUIRED_FOUNDATION_ITEMS } from "./items/required-foundations";
import {
  isCodeLearningItem,
  isTriviaEligibleLearningItem,
  type CodeLearningItem,
  type LearningItem,
} from "./types";

/**
 * One deliberately temporary migration checkpoint. Task 16 removes this
 * adapter-only state when the 88 DSA + 69 ML target registry cuts over.
 */
export const TRANSITIONAL_LEARNING_REGISTRY_STATE = Object.freeze({
  enabled: true,
  legacyExpectedItemCount: 320,
  requiredFoundationsExpectedItemCount: 18,
  expectedItemCount: 338,
  removalTask: 16,
} as const);

export const LEGACY_LEARNING_ITEMS: readonly LearningItem[] = Object.freeze(
  ALGORITHMS.map(adaptAlgorithmDefinition),
);

export const LEARNING_ITEMS: readonly LearningItem[] = Object.freeze([
  ...LEGACY_LEARNING_ITEMS,
  ...REQUIRED_FOUNDATION_ITEMS,
]);

export function assertTransitionalLearningItemCount(items: readonly LearningItem[]): void {
  if (items.length !== TRANSITIONAL_LEARNING_REGISTRY_STATE.expectedItemCount) {
    throw new Error(
      `Transitional learning registry expected ${TRANSITIONAL_LEARNING_REGISTRY_STATE.expectedItemCount} items, received ${items.length}.`,
    );
  }
}

if (TRANSITIONAL_LEARNING_REGISTRY_STATE.enabled) {
  assertTransitionalLearningItemCount(LEARNING_ITEMS);
}

export const buildLearningItemRegistry = (
  items: readonly LearningItem[],
): Readonly<Record<string, LearningItem>> => {
  const registry = Object.create(null) as Record<string, LearningItem>;
  for (const item of items) {
    if (Object.hasOwn(registry, item.id)) {
      throw new Error(`Duplicate canonical learning item id: ${item.id}`);
    }
    registry[item.id] = item;
  }
  return Object.freeze(registry);
};

export const LEARNING_ITEM_REGISTRY = buildLearningItemRegistry(LEARNING_ITEMS);

export const CODE_LEARNING_ITEMS: readonly CodeLearningItem[] = Object.freeze(
  LEARNING_ITEMS.filter(isCodeLearningItem),
);

export function getLearningItem(id: string): LearningItem | undefined {
  return Object.hasOwn(LEARNING_ITEM_REGISTRY, id) ? LEARNING_ITEM_REGISTRY[id] : undefined;
}

export function getAllLearningItems(): LearningItem[] {
  return [...LEARNING_ITEMS];
}

export function getTriviaLearningItems(): CodeLearningItem[] {
  return CODE_LEARNING_ITEMS.filter(isTriviaEligibleLearningItem);
}
