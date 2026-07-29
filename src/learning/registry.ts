import { ALGORITHMS } from "../algorithms/registry";
import { adaptAlgorithmDefinition } from "./algorithmAdapters";
import {
  isCodeLearningItem,
  isTriviaEligibleLearningItem,
  type CodeLearningItem,
  type LearningItem,
} from "./types";

export const DSA_LEARNING_ITEMS: readonly LearningItem[] = Object.freeze(
  ALGORITHMS.map(adaptAlgorithmDefinition),
);

export const ML_INFRA_LEARNING_ITEMS: readonly LearningItem[] = Object.freeze([]);

export const LEARNING_ITEMS: readonly LearningItem[] = Object.freeze([
  ...DSA_LEARNING_ITEMS,
  ...ML_INFRA_LEARNING_ITEMS,
]);

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
