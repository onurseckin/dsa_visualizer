import type { AlgorithmDefinition } from '../types/dsa';
import { prefixSum } from './arrays_and_hashing/prefixSum';
import { twoSum } from './arrays_and_hashing/twoSum';
import { kadaneMaxSubarray } from './arrays_and_hashing/kadaneMaxSubarray';
import { bubbleSort } from './arrays_and_hashing/bubbleSort';
import { twoSumSorted } from './two_pointers/twoSumSorted';
import { twoPointers } from './two_pointers/twoPointers';
import { quickSort } from './two_pointers/quickSort';
import { slidingWindowMin } from './sliding_window/slidingWindowMin';
import { validParentheses } from './stack_and_queue/validParentheses';
import { binarySearchMatrix } from './binary_search/binarySearchMatrix';
import { reverseLinkedList } from './linked_list/reverseLinkedList';
import { binaryTreeLca } from './tree_fundamentals/binaryTreeLca';
import { treeDiameter } from './tree_queries_and_diameter/treeDiameter';
import { triePrefixTree } from './tries_and_strings/triePrefixTree';
import { zAlgorithm } from './tries_and_strings/zAlgorithm';
import { kmpStringMatch } from './tries_and_strings/kmpStringMatch';
import { kthLargestElement } from './heap_and_priority_queue/kthLargestElement';
import { nQueens } from './backtracking/nQueens';
import { bfsGraph } from './graph_traversal/bfsGraph';
import { numberOfIslands } from './graph_traversal/numberOfIslands';
import { dijkstraShortestPath } from './graph_shortest_paths/dijkstraShortestPath';
import { bellmanFord } from './graph_shortest_paths/bellmanFord';
import { floydWarshall } from './graph_shortest_paths/floydWarshall';
import { kruskalMst } from './graph_spanning_trees/kruskalMst';
import { topologicalSort } from './graph_directed_and_scc/topologicalSort';
import { kosarajuScc } from './graph_directed_and_scc/kosarajuScc';
import { fordFulkerson } from './graph_flows_and_cuts/fordFulkerson';
import { coinChangeDp } from './dp_1d/coinChangeDp';
import { editDistance } from './dp_2d/editDistance';
import { mergeIntervals } from './intervals/mergeIntervals';
import { huffmanCoding } from './greedy_algorithms/huffmanCoding';
import { countingBits } from './bit_manipulation/countingBits';
import { sievePrimes } from './math_and_number_theory/sievePrimes';
import { euclidGcd } from './math_and_number_theory/euclidGcd';
import { nimGame } from './game_theory/nimGame';
import { fenwickTree } from './advanced_range_queries/fenwickTree';
import { segmentTree } from './advanced_range_queries/segmentTree';
import { segmentTreeLazy } from './advanced_range_queries/segmentTreeLazy';
import { convexHull } from './geometry_and_sweep_line/convexHull';
import { polygonArea } from './geometry_and_sweep_line/polygonArea';

export const ALGORITHM_REGISTRY: Record<string, AlgorithmDefinition> = {
  'prefix-sum': prefixSum as AlgorithmDefinition,
  'two-sum': twoSum as AlgorithmDefinition,
  'kadane-max-subarray': kadaneMaxSubarray as AlgorithmDefinition,
  'bubble-sort': bubbleSort as AlgorithmDefinition,
  'two-sum-sorted': twoSumSorted as AlgorithmDefinition,
  'two-pointers': twoPointers as AlgorithmDefinition,
  'quick-sort': quickSort as AlgorithmDefinition,
  'sliding-window-min': slidingWindowMin as AlgorithmDefinition,
  'valid-parentheses': validParentheses as AlgorithmDefinition,
  'binary-search-matrix': binarySearchMatrix as AlgorithmDefinition,
  'reverse-linked-list': reverseLinkedList as AlgorithmDefinition,
  'binary-tree-lca': binaryTreeLca as AlgorithmDefinition,
  'tree-diameter': treeDiameter as AlgorithmDefinition,
  'trie-prefix-tree': triePrefixTree as AlgorithmDefinition,
  'z-algorithm': zAlgorithm as AlgorithmDefinition,
  'kmp-string-match': kmpStringMatch as AlgorithmDefinition,
  'kth-largest-element': kthLargestElement as AlgorithmDefinition,
  'n-queens': nQueens as AlgorithmDefinition,
  'bfs-graph': bfsGraph as AlgorithmDefinition,
  'number-of-islands': numberOfIslands as AlgorithmDefinition,
  'dijkstra-shortest-path': dijkstraShortestPath as AlgorithmDefinition,
  'bellman-ford': bellmanFord as AlgorithmDefinition,
  'floyd-warshall': floydWarshall as AlgorithmDefinition,
  'kruskal-mst': kruskalMst as AlgorithmDefinition,
  'topological-sort': topologicalSort as AlgorithmDefinition,
  'kosaraju-scc': kosarajuScc as AlgorithmDefinition,
  'ford-fulkerson': fordFulkerson as AlgorithmDefinition,
  'coin-change-dp': coinChangeDp as AlgorithmDefinition,
  'edit-distance': editDistance as AlgorithmDefinition,
  'merge-intervals': mergeIntervals as AlgorithmDefinition,
  'huffman-coding': huffmanCoding as AlgorithmDefinition,
  'counting-bits': countingBits as AlgorithmDefinition,
  'sieve-primes': sievePrimes as AlgorithmDefinition,
  'euclid-gcd': euclidGcd as AlgorithmDefinition,
  'nim-game': nimGame as AlgorithmDefinition,
  'fenwick-tree': fenwickTree as AlgorithmDefinition,
  'segment-tree': segmentTree as AlgorithmDefinition,
  'segment-tree-lazy': segmentTreeLazy as AlgorithmDefinition,
  'convex-hull': convexHull as AlgorithmDefinition,
  'polygon-area': polygonArea as AlgorithmDefinition,
};

export const getAlgorithm = (id: string): AlgorithmDefinition | undefined => {
  return ALGORITHM_REGISTRY[id];
};

export const getAllAlgorithms = (): AlgorithmDefinition[] => {
  return Object.values(ALGORITHM_REGISTRY);
};
