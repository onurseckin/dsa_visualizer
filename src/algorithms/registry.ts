import type { AlgorithmDefinition } from "../types/dsa";
import { prefixSum } from "./arrays_and_hashing/prefixSum";
import { twoSum } from "./arrays_and_hashing/twoSum";
import { kadaneMaxSubarray } from "./arrays_and_hashing/kadaneMaxSubarray";
import { bubbleSort } from "./arrays_and_hashing/bubbleSort";
import { twoSumSorted } from "./two_pointers/twoSumSorted";
import { twoPointers } from "./two_pointers/twoPointers";
import { quickSort } from "./two_pointers/quickSort";
import { slidingWindowMin } from "./sliding_window/slidingWindowMin";
import { validParentheses } from "./stack_and_queue/validParentheses";
import { nearestSmallerElement } from "./stack_and_queue/nearestSmallerElement";
import { binarySearchMatrix } from "./binary_search/binarySearchMatrix";
import { reverseLinkedList } from "./linked_list/reverseLinkedList";
import { binaryTreeLca } from "./tree_fundamentals/binaryTreeLca";
import { treeDiameter } from "./tree_queries_and_diameter/treeDiameter";
import { triePrefixTree } from "./tries_and_strings/triePrefixTree";
import { zAlgorithm } from "./tries_and_strings/zAlgorithm";
import { kmpStringMatch } from "./tries_and_strings/kmpStringMatch";
import { kthLargestElement } from "./heap_and_priority_queue/kthLargestElement";
import { nQueens } from "./backtracking/nQueens";
import { bfsGraph } from "./graph_traversal/bfsGraph";
import { numberOfIslands } from "./graph_traversal/numberOfIslands";
import { dijkstraShortestPath } from "./graph_shortest_paths/dijkstraShortestPath";
import { bellmanFord } from "./graph_shortest_paths/bellmanFord";
import { floydWarshall } from "./graph_shortest_paths/floydWarshall";
import { kruskalMst } from "./graph_spanning_trees/kruskalMst";
import { primMst } from "./graph_spanning_trees/primMst";
import { topologicalSort } from "./graph_directed_and_scc/topologicalSort";
import { kosarajuScc } from "./graph_directed_and_scc/kosarajuScc";
import { fordFulkerson } from "./graph_flows_and_cuts/fordFulkerson";
import { minimumPathCover } from "./graph_flows_and_cuts/minimumPathCover";
import { coinChangeDp } from "./dp_1d/coinChangeDp";
import { longestIncreasingSubsequence } from "./dp_1d/longestIncreasingSubsequence";
import { knapsack01 } from "./dp_1d/knapsack01";
import { editDistance } from "./dp_2d/editDistance";
import { gridPathsDp } from "./dp_2d/gridPathsDp";
import { countingTilings } from "./dp_2d/countingTilings";
import { tspBitmaskDp } from "./dp_2d/tspBitmaskDp";
import { mergeIntervals } from "./intervals/mergeIntervals";
import { huffmanCoding } from "./greedy_algorithms/huffmanCoding";
import { intervalScheduling } from "./greedy_algorithms/intervalScheduling";
import { tasksAndDeadlines } from "./greedy_algorithms/tasksAndDeadlines";
import { countingBits } from "./bit_manipulation/countingBits";
import { sievePrimes } from "./math_and_number_theory/sievePrimes";
import { euclidGcd } from "./math_and_number_theory/euclidGcd";
import { modularExponentiationInverse } from "./math_and_number_theory/modularExponentiationInverse";
import { extendedEuclideanAlgorithm } from "./math_and_number_theory/extendedEuclideanAlgorithm";
import { chineseRemainderTheorem } from "./math_and_number_theory/chineseRemainderTheorem";
import { eulerTotientFunction } from "./math_and_number_theory/eulerTotientFunction";
import { binomialCoefficientsPascal } from "./math_and_number_theory/binomialCoefficientsPascal";
import { catalanNumbers } from "./math_and_number_theory/catalanNumbers";
import { nimGame } from "./game_theory/nimGame";
import { fenwickTree } from "./advanced_range_queries/fenwickTree";
import { segmentTree } from "./advanced_range_queries/segmentTree";
import { segmentTreeLazy } from "./advanced_range_queries/segmentTreeLazy";
import { sparseTableRmq } from "./advanced_range_queries/sparseTableRmq";
import { sqrtDecomposition } from "./advanced_range_queries/sqrtDecomposition";
import { moAlgorithm } from "./advanced_range_queries/moAlgorithm";
import { dynamicSegmentTree } from "./advanced_range_queries/dynamicSegmentTree";
import { persistentSegmentTree } from "./advanced_range_queries/persistentSegmentTree";
import { mergeSort } from "./two_pointers/mergeSort";
import { binarySearch1d } from "./binary_search/binarySearch1d";
import { meetInTheMiddle } from "./binary_search/meetInTheMiddle";
import { convexHull } from "./geometry_and_sweep_line/convexHull";
import { polygonArea } from "./geometry_and_sweep_line/polygonArea";
import { inclusionExclusionPrinciple } from "./math_and_number_theory/inclusionExclusionPrinciple";
import { matrixExponentiation } from "./math_and_number_theory/matrixExponentiation";
import { markovChains } from "./math_and_number_theory/markovChains";
import { spragueGrundyTheorem } from "./game_theory/spragueGrundyTheorem";
import { stringHashing } from "./tries_and_strings/stringHashing";
import { lineSegmentIntersection } from "./geometry_and_sweep_line/lineSegmentIntersection";
import { sweepLineIntersections } from "./geometry_and_sweep_line/sweepLineIntersections";
import { closestPairOfPoints } from "./geometry_and_sweep_line/closestPairOfPoints";
import { hierholzerEulerianPath } from "./graph_directed_and_scc/hierholzerEulerianPath";
import { deBruijnSequence } from "./graph_directed_and_scc/deBruijnSequence";
import { twoSatSolver } from "./graph_directed_and_scc/twoSatSolver";
import { successorPaths } from "./graph_directed_and_scc/successorPaths";
import { dagDpLongestPath } from "./graph_directed_and_scc/dagDpLongestPath";
import { dfsGraph } from "./graph_traversal/dfsGraph";
import { bipartiteGraphCheck } from "./graph_traversal/bipartiteGraphCheck";
import { edmondsKarpMaxFlow } from "./graph_flows_and_cuts/edmondsKarpMaxFlow";
import { eulerTourTechnique } from "./tree_queries_and_diameter/eulerTourTechnique";
import { dsuOnTree } from "./tree_queries_and_diameter/dsuOnTree";
import { binaryLiftingLca } from "./tree_queries_and_diameter/binaryLiftingLca";
import { disjointSetUnion } from "./graph_spanning_trees/disjointSetUnion";
import { generatingPermutations } from "./backtracking/generatingPermutations";
import { knightsTourWarnsdorff } from "./backtracking/knightsTourWarnsdorff";
import { hamiltonianPathDp } from "./backtracking/hamiltonianPathDp";
import { generatingSubsets } from "./backtracking/generatingSubsets";

import { tensorStrideOffset } from "./ml_infra/tensorStrideOffset";
import { autogradVjpDag } from "./ml_infra/autogradVjpDag";
import { fusedSoftmaxLse } from "./ml_infra/fusedSoftmaxLse";
import { hnswVectorSearch } from "./ml_infra/hnswVectorSearch";
import { bpeTokenizer } from "./ml_infra/bpeTokenizer";
import { im2colConvTiling } from "./ml_infra/im2colConvTiling";
import { flashAttentionTiling } from "./ml_infra/flashAttentionTiling";
import { smoothquantScaling } from "./ml_infra/smoothquantScaling";
import { ringAllreducePartition } from "./ml_infra/ringAllreducePartition";
import { continuousBatchingScheduler } from "./ml_infra/continuousBatchingScheduler";

export const ALGORITHM_REGISTRY: Record<string, AlgorithmDefinition> = {
  "prefix-sum": prefixSum as AlgorithmDefinition,
  "two-sum": twoSum as AlgorithmDefinition,
  "kadane-max-subarray": kadaneMaxSubarray as AlgorithmDefinition,
  "bubble-sort": bubbleSort as AlgorithmDefinition,
  "two-sum-sorted": twoSumSorted as AlgorithmDefinition,
  "two-pointers": twoPointers as AlgorithmDefinition,
  "quick-sort": quickSort as AlgorithmDefinition,
  "sliding-window-min": slidingWindowMin as AlgorithmDefinition,
  "valid-parentheses": validParentheses as AlgorithmDefinition,
  "nearest-smaller-element": nearestSmallerElement as AlgorithmDefinition,
  "binary-search-matrix": binarySearchMatrix as AlgorithmDefinition,
  "reverse-linked-list": reverseLinkedList as AlgorithmDefinition,
  "binary-tree-lca": binaryTreeLca as AlgorithmDefinition,
  "tree-diameter": treeDiameter as AlgorithmDefinition,
  "trie-prefix-tree": triePrefixTree as AlgorithmDefinition,
  "z-algorithm": zAlgorithm as AlgorithmDefinition,
  "kmp-string-match": kmpStringMatch as AlgorithmDefinition,
  "kth-largest-element": kthLargestElement as AlgorithmDefinition,
  "n-queens": nQueens as AlgorithmDefinition,
  "bfs-graph": bfsGraph as AlgorithmDefinition,
  "number-of-islands": numberOfIslands as AlgorithmDefinition,
  "dijkstra-shortest-path": dijkstraShortestPath as AlgorithmDefinition,
  "bellman-ford": bellmanFord as AlgorithmDefinition,
  "floyd-warshall": floydWarshall as AlgorithmDefinition,
  "kruskal-mst": kruskalMst as AlgorithmDefinition,
  "prim-mst": primMst as AlgorithmDefinition,
  "topological-sort": topologicalSort as AlgorithmDefinition,
  "kosaraju-scc": kosarajuScc as AlgorithmDefinition,
  "ford-fulkerson": fordFulkerson as AlgorithmDefinition,
  "minimum-path-cover": minimumPathCover as AlgorithmDefinition,
  "coin-change-dp": coinChangeDp as AlgorithmDefinition,
  "longest-increasing-subsequence": longestIncreasingSubsequence as AlgorithmDefinition,
  "knapsack-01": knapsack01 as AlgorithmDefinition,
  "edit-distance": editDistance as AlgorithmDefinition,
  "grid-paths-dp": gridPathsDp as AlgorithmDefinition,
  "counting-tilings": countingTilings as AlgorithmDefinition,
  "tsp-bitmask-dp": tspBitmaskDp as AlgorithmDefinition,
  "merge-intervals": mergeIntervals as AlgorithmDefinition,
  "huffman-coding": huffmanCoding as AlgorithmDefinition,
  "interval-scheduling": intervalScheduling as AlgorithmDefinition,
  "tasks-and-deadlines": tasksAndDeadlines as AlgorithmDefinition,
  "counting-bits": countingBits as AlgorithmDefinition,
  "sieve-primes": sievePrimes as AlgorithmDefinition,
  "euclid-gcd": euclidGcd as AlgorithmDefinition,
  "modular-exponentiation-inverse": modularExponentiationInverse as AlgorithmDefinition,
  "extended-euclidean-algorithm": extendedEuclideanAlgorithm as AlgorithmDefinition,
  "chinese-remainder-theorem": chineseRemainderTheorem as AlgorithmDefinition,
  "euler-totient-function": eulerTotientFunction as AlgorithmDefinition,
  "binomial-coefficients-pascal": binomialCoefficientsPascal as AlgorithmDefinition,
  "catalan-numbers": catalanNumbers as AlgorithmDefinition,
  "nim-game": nimGame as AlgorithmDefinition,
  "fenwick-tree": fenwickTree as AlgorithmDefinition,
  "segment-tree": segmentTree as AlgorithmDefinition,
  "segment-tree-lazy": segmentTreeLazy as AlgorithmDefinition,
  "sparse-table-rmq": sparseTableRmq as AlgorithmDefinition,
  "sqrt-decomposition": sqrtDecomposition as AlgorithmDefinition,
  "mo-algorithm": moAlgorithm as AlgorithmDefinition,
  "dynamic-segment-tree": dynamicSegmentTree as AlgorithmDefinition,
  "persistent-segment-tree": persistentSegmentTree as AlgorithmDefinition,
  "merge-sort": mergeSort as AlgorithmDefinition,
  "binary-search-1d": binarySearch1d as AlgorithmDefinition,
  "meet-in-the-middle": meetInTheMiddle as AlgorithmDefinition,
  "convex-hull": convexHull as AlgorithmDefinition,
  "polygon-area": polygonArea as AlgorithmDefinition,
  "inclusion-exclusion-principle": inclusionExclusionPrinciple as AlgorithmDefinition,
  "matrix-exponentiation": matrixExponentiation as AlgorithmDefinition,
  "markov-chains": markovChains as AlgorithmDefinition,
  "sprague-grundy-theorem": spragueGrundyTheorem as AlgorithmDefinition,
  "string-hashing": stringHashing as AlgorithmDefinition,
  "line-segment-intersection": lineSegmentIntersection as AlgorithmDefinition,
  "sweep-line-intersections": sweepLineIntersections as AlgorithmDefinition,
  "closest-pair-of-points": closestPairOfPoints as AlgorithmDefinition,
  "hierholzer-eulerian-path": hierholzerEulerianPath as AlgorithmDefinition,
  "de-bruijn-sequence": deBruijnSequence as AlgorithmDefinition,
  "two-sat-solver": twoSatSolver as AlgorithmDefinition,
  "successor-paths": successorPaths as AlgorithmDefinition,
  "dag-dp-longest-path": dagDpLongestPath as AlgorithmDefinition,
  "dfs-graph": dfsGraph as AlgorithmDefinition,
  "bipartite-graph-check": bipartiteGraphCheck as AlgorithmDefinition,
  "edmonds-karp-max-flow": edmondsKarpMaxFlow as AlgorithmDefinition,
  "euler-tour-technique": eulerTourTechnique as AlgorithmDefinition,
  "dsu-on-tree": dsuOnTree as AlgorithmDefinition,
  "binary-lifting-lca": binaryLiftingLca as AlgorithmDefinition,
  "disjoint-set-union": disjointSetUnion as AlgorithmDefinition,
  "generating-permutations": generatingPermutations as AlgorithmDefinition,
  "knights-tour-warnsdorff": knightsTourWarnsdorff as AlgorithmDefinition,
  "hamiltonian-path-dp": hamiltonianPathDp as AlgorithmDefinition,
  "generating-subsets": generatingSubsets as AlgorithmDefinition,
  // ML Infra Algorithms
  "tensor-stride-offset": tensorStrideOffset as AlgorithmDefinition,
  "autograd-vjp-dag": autogradVjpDag as AlgorithmDefinition,
  "fused-softmax-lse": fusedSoftmaxLse as AlgorithmDefinition,
  "hnsw-vector-search": hnswVectorSearch as AlgorithmDefinition,
  "bpe-tokenizer": bpeTokenizer as AlgorithmDefinition,
  "im2col-conv-tiling": im2colConvTiling as AlgorithmDefinition,
  "flash-attention-tiling": flashAttentionTiling as AlgorithmDefinition,
  "smoothquant-scaling": smoothquantScaling as AlgorithmDefinition,
  "ring-allreduce-partition": ringAllreducePartition as AlgorithmDefinition,
  "continuous-batching-scheduler": continuousBatchingScheduler as AlgorithmDefinition,
};

export const getAlgorithm = (id: string): AlgorithmDefinition | undefined => {
  return ALGORITHM_REGISTRY[id];
};

export const getAllAlgorithms = (): AlgorithmDefinition[] => {
  return Object.values(ALGORITHM_REGISTRY);
};
