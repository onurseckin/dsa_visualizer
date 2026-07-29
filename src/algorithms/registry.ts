import type { AlgorithmDefinition } from "../types/dsa";
import { dynamicSegmentTree } from "./advanced_range_queries/dynamicSegmentTree";
import { fenwickTree } from "./advanced_range_queries/fenwickTree";
import { moAlgorithm } from "./advanced_range_queries/moAlgorithm";
import { persistentSegmentTree } from "./advanced_range_queries/persistentSegmentTree";
import { segmentTree } from "./advanced_range_queries/segmentTree";
import { segmentTreeLazy } from "./advanced_range_queries/segmentTreeLazy";
import { sparseTableRmq } from "./advanced_range_queries/sparseTableRmq";
import { sqrtDecomposition } from "./advanced_range_queries/sqrtDecomposition";
import { bubbleSort } from "./arrays_and_hashing/bubbleSort";
import { kadaneMaxSubarray } from "./arrays_and_hashing/kadaneMaxSubarray";
import { prefixSum } from "./arrays_and_hashing/prefixSum";
import { twoSum } from "./arrays_and_hashing/twoSum";
import { generatingPermutations } from "./backtracking/generatingPermutations";
import { generatingSubsets } from "./backtracking/generatingSubsets";
import { hamiltonianPathDp } from "./backtracking/hamiltonianPathDp";
import { knightsTourWarnsdorff } from "./backtracking/knightsTourWarnsdorff";
import { nQueens } from "./backtracking/nQueens";
import { binarySearch1d } from "./binary_search/binarySearch1d";
import { binarySearchMatrix } from "./binary_search/binarySearchMatrix";
import { meetInTheMiddle } from "./binary_search/meetInTheMiddle";
import { countingBits } from "./bit_manipulation/countingBits";
import { coinChangeDp } from "./dp_1d/coinChangeDp";
import { knapsack01 } from "./dp_1d/knapsack01";
import { longestIncreasingSubsequence } from "./dp_1d/longestIncreasingSubsequence";
import { countingTilings } from "./dp_2d/countingTilings";
import { editDistance } from "./dp_2d/editDistance";
import { gridPathsDp } from "./dp_2d/gridPathsDp";
import { tspBitmaskDp } from "./dp_2d/tspBitmaskDp";
import { nimGame } from "./game_theory/nimGame";
import { spragueGrundyTheorem } from "./game_theory/spragueGrundyTheorem";
import { closestPairOfPoints } from "./geometry_and_sweep_line/closestPairOfPoints";
import { convexHull } from "./geometry_and_sweep_line/convexHull";
import { lineSegmentIntersection } from "./geometry_and_sweep_line/lineSegmentIntersection";
import { polygonArea } from "./geometry_and_sweep_line/polygonArea";
import { sweepLineIntersections } from "./geometry_and_sweep_line/sweepLineIntersections";
import { dagDpLongestPath } from "./graph_directed_and_scc/dagDpLongestPath";
import { deBruijnSequence } from "./graph_directed_and_scc/deBruijnSequence";
import { hierholzerEulerianPath } from "./graph_directed_and_scc/hierholzerEulerianPath";
import { kosarajuScc } from "./graph_directed_and_scc/kosarajuScc";
import { successorPaths } from "./graph_directed_and_scc/successorPaths";
import { topologicalSort } from "./graph_directed_and_scc/topologicalSort";
import { twoSatSolver } from "./graph_directed_and_scc/twoSatSolver";
import { edmondsKarpMaxFlow } from "./graph_flows_and_cuts/edmondsKarpMaxFlow";
import { fordFulkerson } from "./graph_flows_and_cuts/fordFulkerson";
import { minimumPathCover } from "./graph_flows_and_cuts/minimumPathCover";
import { bellmanFord } from "./graph_shortest_paths/bellmanFord";
import { dijkstraShortestPath } from "./graph_shortest_paths/dijkstraShortestPath";
import { floydWarshall } from "./graph_shortest_paths/floydWarshall";
import { disjointSetUnion } from "./graph_spanning_trees/disjointSetUnion";
import { kruskalMst } from "./graph_spanning_trees/kruskalMst";
import { primMst } from "./graph_spanning_trees/primMst";
import { bfsGraph } from "./graph_traversal/bfsGraph";
import { bipartiteGraphCheck } from "./graph_traversal/bipartiteGraphCheck";
import { dfsGraph } from "./graph_traversal/dfsGraph";
import { numberOfIslands } from "./graph_traversal/numberOfIslands";
import { huffmanCoding } from "./greedy_algorithms/huffmanCoding";
import { intervalScheduling } from "./greedy_algorithms/intervalScheduling";
import { tasksAndDeadlines } from "./greedy_algorithms/tasksAndDeadlines";
import { kthLargestElement } from "./heap_and_priority_queue/kthLargestElement";
import { mergeIntervals } from "./intervals/mergeIntervals";
import { reverseLinkedList } from "./linked_list/reverseLinkedList";
import { binomialCoefficientsPascal } from "./math_and_number_theory/binomialCoefficientsPascal";
import { catalanNumbers } from "./math_and_number_theory/catalanNumbers";
import { chineseRemainderTheorem } from "./math_and_number_theory/chineseRemainderTheorem";
import { euclidGcd } from "./math_and_number_theory/euclidGcd";
import { eulerTotientFunction } from "./math_and_number_theory/eulerTotientFunction";
import { extendedEuclideanAlgorithm } from "./math_and_number_theory/extendedEuclideanAlgorithm";
import { inclusionExclusionPrinciple } from "./math_and_number_theory/inclusionExclusionPrinciple";
import { markovChains } from "./math_and_number_theory/markovChains";
import { matrixExponentiation } from "./math_and_number_theory/matrixExponentiation";
import { modularExponentiationInverse } from "./math_and_number_theory/modularExponentiationInverse";
import { sievePrimes } from "./math_and_number_theory/sievePrimes";
import { slidingWindowMin } from "./sliding_window/slidingWindowMin";
import { nearestSmallerElement } from "./stack_and_queue/nearestSmallerElement";
import { validParentheses } from "./stack_and_queue/validParentheses";
import { binaryTreeLca } from "./tree_fundamentals/binaryTreeLca";
import { binaryLiftingLca } from "./tree_queries_and_diameter/binaryLiftingLca";
import { dsuOnTree } from "./tree_queries_and_diameter/dsuOnTree";
import { eulerTourTechnique } from "./tree_queries_and_diameter/eulerTourTechnique";
import { treeDiameter } from "./tree_queries_and_diameter/treeDiameter";
import { kmpStringMatch } from "./tries_and_strings/kmpStringMatch";
import { stringHashing } from "./tries_and_strings/stringHashing";
import { triePrefixTree } from "./tries_and_strings/triePrefixTree";
import { zAlgorithm } from "./tries_and_strings/zAlgorithm";
import { mergeSort } from "./two_pointers/mergeSort";
import { quickSort } from "./two_pointers/quickSort";
import { twoPointers } from "./two_pointers/twoPointers";
import { twoSumSorted } from "./two_pointers/twoSumSorted";

import { trialDivisionPrimality } from "./math_and_number_theory/trialDivisionPrimality";
import { divisorFunctions } from "./math_and_number_theory/divisorFunctions";
import { goldbachConjecture } from "./math_and_number_theory/goldbachConjecture";
import { zeckendorfTheorem } from "./math_and_number_theory/zeckendorfTheorem";
import { lagrangeFourSquare } from "./math_and_number_theory/lagrangeFourSquare";
import { pythagoreanTriples } from "./math_and_number_theory/pythagoreanTriples";
import { wilsonTheorem } from "./math_and_number_theory/wilsonTheorem";
import { derangements } from "./math_and_number_theory/derangements";
import { burnsideLemma } from "./math_and_number_theory/burnsideLemma";
import { pruferCode } from "./math_and_number_theory/pruferCode";
import { stirlingNumbersSecond } from "./math_and_number_theory/stirlingNumbersSecond";
import { tribonacciMatrix } from "./math_and_number_theory/tribonacciMatrix";
import { pathCountingMatrix } from "./math_and_number_theory/pathCountingMatrix";
import { minPlusMatrixMultiplication } from "./math_and_number_theory/minPlusMatrixMultiplication";
import { kirchhoffMatrixTree } from "./math_and_number_theory/kirchhoffMatrixTree";
import { probabilityDpExpectation } from "./math_and_number_theory/probabilityDpExpectation";
import { tossStrangeCoins } from "./math_and_number_theory/tossStrangeCoins";
import { millerRabinPrimality } from "./math_and_number_theory/millerRabinPrimality";
import { fisherYatesShuffle } from "./math_and_number_theory/fisherYatesShuffle";
import { gameStateMinimax } from "./game_theory/gameStateMinimax";
import { stoneGameDp } from "./game_theory/stoneGameDp";
import { mexSubtractionGame } from "./game_theory/mexSubtractionGame";
import { bitwiseTrieXor } from "./tries_and_strings/bitwiseTrieXor";
import { ahoCorasick } from "./tries_and_strings/ahoCorasick";
import { manacherAlgorithm } from "./tries_and_strings/manacherAlgorithm";
import { suffixArrayLcp } from "./tries_and_strings/suffixArrayLcp";
import { sqrtHeavyLight } from "./advanced_range_queries/sqrtHeavyLight";
import { integerPartitionSqrt } from "./advanced_range_queries/integerPartitionSqrt";
import { mergeSortTree } from "./advanced_range_queries/mergeSortTree";
import { segmentTree2d } from "./advanced_range_queries/segmentTree2d";
import { pickTheorem } from "./geometry_and_sweep_line/pickTheorem";
import { manhattanDistanceRotation } from "./geometry_and_sweep_line/manhattanDistanceRotation";
import { pointInPolygon } from "./geometry_and_sweep_line/pointInPolygon";
import { skylineProblem } from "./geometry_and_sweep_line/skylineProblem";
import { rectangleAreaUnion } from "./geometry_and_sweep_line/rectangleAreaUnion";

export const ALGORITHMS = [
  prefixSum,
  twoSum,
  kadaneMaxSubarray,
  bubbleSort,
  twoSumSorted,
  twoPointers,
  quickSort,
  slidingWindowMin,
  validParentheses,
  nearestSmallerElement,
  binarySearchMatrix,
  reverseLinkedList,
  binaryTreeLca,
  treeDiameter,
  triePrefixTree,
  zAlgorithm,
  kmpStringMatch,
  kthLargestElement,
  nQueens,
  bfsGraph,
  numberOfIslands,
  dijkstraShortestPath,
  bellmanFord,
  floydWarshall,
  kruskalMst,
  primMst,
  topologicalSort,
  kosarajuScc,
  fordFulkerson,
  minimumPathCover,
  coinChangeDp,
  longestIncreasingSubsequence,
  knapsack01,
  editDistance,
  gridPathsDp,
  countingTilings,
  tspBitmaskDp,
  mergeIntervals,
  huffmanCoding,
  intervalScheduling,
  tasksAndDeadlines,
  countingBits,
  sievePrimes,
  euclidGcd,
  modularExponentiationInverse,
  extendedEuclideanAlgorithm,
  chineseRemainderTheorem,
  eulerTotientFunction,
  binomialCoefficientsPascal,
  catalanNumbers,
  nimGame,
  fenwickTree,
  segmentTree,
  segmentTreeLazy,
  sparseTableRmq,
  sqrtDecomposition,
  moAlgorithm,
  dynamicSegmentTree,
  persistentSegmentTree,
  mergeSort,
  binarySearch1d,
  meetInTheMiddle,
  convexHull,
  polygonArea,
  inclusionExclusionPrinciple,
  matrixExponentiation,
  markovChains,
  spragueGrundyTheorem,
  stringHashing,
  lineSegmentIntersection,
  sweepLineIntersections,
  closestPairOfPoints,
  hierholzerEulerianPath,
  deBruijnSequence,
  twoSatSolver,
  successorPaths,
  dagDpLongestPath,
  dfsGraph,
  bipartiteGraphCheck,
  edmondsKarpMaxFlow,
  eulerTourTechnique,
  dsuOnTree,
  binaryLiftingLca,
  disjointSetUnion,
  generatingPermutations,
  knightsTourWarnsdorff,
  hamiltonianPathDp,
  generatingSubsets,
  trialDivisionPrimality,
  divisorFunctions,
  goldbachConjecture,
  zeckendorfTheorem,
  lagrangeFourSquare,
  pythagoreanTriples,
  wilsonTheorem,
  derangements,
  burnsideLemma,
  pruferCode,
  stirlingNumbersSecond,
  tribonacciMatrix,
  pathCountingMatrix,
  minPlusMatrixMultiplication,
  kirchhoffMatrixTree,
  probabilityDpExpectation,
  tossStrangeCoins,
  millerRabinPrimality,
  fisherYatesShuffle,
  gameStateMinimax,
  stoneGameDp,
  mexSubtractionGame,
  bitwiseTrieXor,
  ahoCorasick,
  manacherAlgorithm,
  suffixArrayLcp,
  sqrtHeavyLight,
  integerPartitionSqrt,
  mergeSortTree,
  segmentTree2d,
  pickTheorem,
  manhattanDistanceRotation,
  pointInPolygon,
  skylineProblem,
  rectangleAreaUnion,
] as const satisfies readonly AlgorithmDefinition[];

const buildAlgorithmRegistry = (
  algorithms: readonly AlgorithmDefinition[],
): Readonly<Record<string, AlgorithmDefinition>> => {
  const registry = Object.create(null) as Record<string, AlgorithmDefinition>;

  for (const algorithm of algorithms) {
    if (Object.hasOwn(registry, algorithm.id)) {
      throw new Error(`Duplicate canonical algorithm id: ${algorithm.id}`);
    }
    registry[algorithm.id] = algorithm;
  }

  return Object.freeze(registry);
};

export const ALGORITHM_REGISTRY = buildAlgorithmRegistry(ALGORITHMS);

export const getAlgorithm = (id: string): AlgorithmDefinition | undefined =>
  Object.hasOwn(ALGORITHM_REGISTRY, id) ? ALGORITHM_REGISTRY[id] : undefined;

export const getAllAlgorithms = (): AlgorithmDefinition[] => [...ALGORITHMS];
