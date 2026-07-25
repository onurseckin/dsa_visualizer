import type { AlgorithmDefinition } from '../types/dsa';
import { prefixSum } from './arrays_and_hashing/prefixSum';
import { twoSum } from './arrays_and_hashing/twoSum';
import { kadaneMaxSubarray } from './arrays_and_hashing/kadaneMaxSubarray';
import { bubbleSort } from './arrays_and_hashing/bubbleSort';
import { twoSumSorted } from './two_pointers/twoSumSorted';
import { twoPointers } from './two_pointers/twoPointers';
import { quickSort } from './two_pointers/quickSort';
import { validParentheses } from './stack/validParentheses';
import { binarySearchMatrix } from './binary_search/binarySearchMatrix';
import { slidingWindowMin } from './sliding_window/slidingWindowMin';
import { reverseLinkedList } from './linked_list/reverseLinkedList';
import { binaryTreeLca } from './trees/binaryTreeLca';
import { triePrefixTree } from './tries/triePrefixTree';
import { kthLargestElement } from './heap/kthLargestElement';
import { nQueens } from './backtracking/nQueens';
import { bfsGraph } from './graphs/bfsGraph';
import { numberOfIslands } from './graphs/numberOfIslands';
import { coinChangeDp } from './dp_1d/coinChangeDp';
import { mergeIntervals } from './intervals/mergeIntervals';
import { huffmanCoding } from './greedy/huffmanCoding';
import { dijkstraShortestPath } from './advanced_graphs/dijkstraShortestPath';
import { topologicalSort } from './advanced_graphs/topologicalSort';
import { kruskalMst } from './advanced_graphs/kruskalMst';
import { bellmanFord } from './advanced_graphs/bellmanFord';
import { editDistance } from './dp_2d/editDistance';
import { sievePrimes } from './math_and_geometry/sievePrimes';
import { nimGame } from './math_and_geometry/nimGame';
import { convexHull } from './math_and_geometry/convexHull';
import { countingBits } from './bit_manipulation/countingBits';
import { fenwickTree } from './advanced_range_and_cp/fenwickTree';
import { segmentTree } from './advanced_range_and_cp/segmentTree';
import { kmpStringMatch } from './advanced_range_and_cp/kmpStringMatch';

export const ALGORITHM_REGISTRY: Record<string, AlgorithmDefinition> = {
  'prefix-sum': prefixSum as AlgorithmDefinition,
  'two-sum': twoSum as AlgorithmDefinition,
  'kadane-max-subarray': kadaneMaxSubarray as AlgorithmDefinition,
  'bubble-sort': bubbleSort as AlgorithmDefinition,
  'two-sum-sorted': twoSumSorted as AlgorithmDefinition,
  'two-pointers': twoPointers as AlgorithmDefinition,
  'quick-sort': quickSort as AlgorithmDefinition,
  'valid-parentheses': validParentheses as AlgorithmDefinition,
  'binary-search-matrix': binarySearchMatrix as AlgorithmDefinition,
  'sliding-window-min': slidingWindowMin as AlgorithmDefinition,
  'reverse-linked-list': reverseLinkedList as AlgorithmDefinition,
  'binary-tree-lca': binaryTreeLca as AlgorithmDefinition,
  'trie-prefix-tree': triePrefixTree as AlgorithmDefinition,
  'kth-largest-element': kthLargestElement as AlgorithmDefinition,
  'n-queens': nQueens as AlgorithmDefinition,
  'bfs-graph': bfsGraph as AlgorithmDefinition,
  'number-of-islands': numberOfIslands as AlgorithmDefinition,
  'coin-change-dp': coinChangeDp as AlgorithmDefinition,
  'merge-intervals': mergeIntervals as AlgorithmDefinition,
  'huffman-coding': huffmanCoding as AlgorithmDefinition,
  'dijkstra-shortest-path': dijkstraShortestPath as AlgorithmDefinition,
  'topological-sort': topologicalSort as AlgorithmDefinition,
  'kruskal-mst': kruskalMst as AlgorithmDefinition,
  'bellman-ford': bellmanFord as AlgorithmDefinition,
  'edit-distance': editDistance as AlgorithmDefinition,
  'sieve-primes': sievePrimes as AlgorithmDefinition,
  'nim-game': nimGame as AlgorithmDefinition,
  'convex-hull': convexHull as AlgorithmDefinition,
  'counting-bits': countingBits as AlgorithmDefinition,
  'fenwick-tree': fenwickTree as AlgorithmDefinition,
  'segment-tree': segmentTree as AlgorithmDefinition,
  'kmp-string-match': kmpStringMatch as AlgorithmDefinition,
};

export const getAlgorithm = (id: string): AlgorithmDefinition | undefined => {
  return ALGORITHM_REGISTRY[id];
};

export const getAllAlgorithms = (): AlgorithmDefinition[] => {
  return Object.values(ALGORITHM_REGISTRY);
};
