import type { AlgorithmDefinition } from '../types/dsa';
import { bfsGraph } from './graph/bfsGraph';
import { twoSum } from './leetcode/twoSum';
import { bubbleSort } from './sorting/bubbleSort';
import { quickSort } from './sorting/quickSort';

export { bfsGraph, bubbleSort, quickSort, twoSum };

export const ALGORITHM_REGISTRY: Record<string, AlgorithmDefinition> = {
  'bubble-sort': bubbleSort as AlgorithmDefinition,
  'quick-sort': quickSort as AlgorithmDefinition,
  'bfs-graph': bfsGraph as AlgorithmDefinition,
  'two-sum': twoSum as AlgorithmDefinition,
};

export const getAlgorithm = (id: string): AlgorithmDefinition | undefined => {
  return ALGORITHM_REGISTRY[id];
};

export const getAllAlgorithms = (): AlgorithmDefinition[] => {
  return Object.values(ALGORITHM_REGISTRY);
};
