import type { AlgorithmDefinition } from '../types/dsa';
import { prefixSum } from './arrays_and_hashing/prefixSum';
import { twoSumSorted } from './two_pointers/twoSumSorted';
import { validParentheses } from './stack/validParentheses';
import { slidingWindowMin } from './sliding_window/slidingWindowMin';
import { fenwickTree } from './dataStructures/fenwickTree';
import { segmentTree } from './dataStructures/segmentTree';
import { kmpStringMatch } from './advanced/kmpStringMatch';
import { coinChangeDp } from './dynamicProgramming/coinChangeDp';
import { kadaneMaxSubarray } from './fundamentals/kadaneMaxSubarray';
import { twoPointers } from './fundamentals/twoPointers';
import { bfsGraph } from './graph/bfsGraph';
import { dijkstraShortestPath } from './graph/dijkstraShortestPath';
import { topologicalSort } from './graph/topologicalSort';
import { twoSum } from './leetcode/twoSum';
import { nimGame } from './mathGames/nimGame';
import { sievePrimes } from './mathGames/sievePrimes';
import { bubbleSort } from './sorting/bubbleSort';
import { quickSort } from './sorting/quickSort';
import { kruskalMst } from './trees/kruskalMst';

export {
  prefixSum,
  twoSumSorted,
  validParentheses,
  slidingWindowMin,
  bfsGraph,
  bubbleSort,
  coinChangeDp,
  dijkstraShortestPath,
  fenwickTree,
  kadaneMaxSubarray,
  kmpStringMatch,
  kruskalMst,
  nimGame,
  quickSort,
  segmentTree,
  sievePrimes,
  topologicalSort,
  twoPointers,
  twoSum,
};

export const ALGORITHM_REGISTRY: Record<string, AlgorithmDefinition> = {
  'prefix-sum': prefixSum as AlgorithmDefinition,
  'two-sum-sorted': twoSumSorted as AlgorithmDefinition,
  'valid-parentheses': validParentheses as AlgorithmDefinition,
  'sliding-window-min': slidingWindowMin as AlgorithmDefinition,
  'bubble-sort': bubbleSort as AlgorithmDefinition,
  'quick-sort': quickSort as AlgorithmDefinition,
  'kadane-max-subarray': kadaneMaxSubarray as AlgorithmDefinition,
  'two-pointers': twoPointers as AlgorithmDefinition,
  'fenwick-tree': fenwickTree as AlgorithmDefinition,
  'segment-tree': segmentTree as AlgorithmDefinition,
  'coin-change-dp': coinChangeDp as AlgorithmDefinition,
  'bfs-graph': bfsGraph as AlgorithmDefinition,
  'dijkstra-shortest-path': dijkstraShortestPath as AlgorithmDefinition,
  'topological-sort': topologicalSort as AlgorithmDefinition,
  'kruskal-mst': kruskalMst as AlgorithmDefinition,
  'kmp-string-match': kmpStringMatch as AlgorithmDefinition,
  'sieve-primes': sievePrimes as AlgorithmDefinition,
  'nim-game': nimGame as AlgorithmDefinition,
  'two-sum': twoSum as AlgorithmDefinition,
};

export const getAlgorithm = (id: string): AlgorithmDefinition | undefined => {
  return ALGORITHM_REGISTRY[id];
};

export const getAllAlgorithms = (): AlgorithmDefinition[] => {
  return Object.values(ALGORITHM_REGISTRY);
};
