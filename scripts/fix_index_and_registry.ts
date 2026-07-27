import fs from "fs";
import path from "path";

const topicFolders = [
  "ml_tensor_algebra",
  "ml_gemm_roofline",
  "ml_autograd_dags",
  "ml_precision_quantization",
  "ml_vector_search",
  "ml_tokenization",
  "ml_attention_geometry",
  "ml_convolutions",
  "ml_tree_ensembles",
  "ml_hardware_kernels",
  "ml_distributed_systems",
  "ml_llm_serving",
];

// Fix index.ts in each topic folder
for (const folder of topicFolders) {
  const folderPath = path.join(process.cwd(), "src", "algorithms", folder);
  if (!fs.existsSync(folderPath)) continue;

  const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".ts") && !f.endsWith(".spec.ts") && f !== "index.ts");
  const exports: string[] = [];

  for (const file of files) {
    const modName = file.replace(".ts", "");
    exports.push(`export * from "./${modName}";`);
  }

  fs.writeFileSync(path.join(folderPath, "index.ts"), exports.join("\n") + "\n", "utf8");
}
console.log("Fixed all topic index.ts exports!");

// Rebuild registry.ts cleanly
const registryPath = path.join(process.cwd(), "src", "algorithms", "registry.ts");

// Let's read git checkout of registry.ts to start clean if needed, or parse unique entries
const allImports: string[] = [];
const allEntries: Map<string, string> = new Map();

for (const folder of topicFolders) {
  const folderPath = path.join(process.cwd(), "src", "algorithms", folder);
  if (!fs.existsSync(folderPath)) continue;

  const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".ts") && !f.endsWith(".spec.ts") && f !== "index.ts");

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const content = fs.readFileSync(filePath, "utf8");

    const varMatch = content.match(/export const (\w+): AlgorithmDefinition/);
    const idMatch = content.match(/id: ["']([^"']+)["']/);

    if (varMatch && idMatch) {
      const varName = varMatch[1];
      const algId = idMatch[1];

      allImports.push(`import { ${varName} } from "./${folder}/${file.replace(".ts", "")}";`);
      allEntries.set(algId, `  "${algId}": ${varName} as AlgorithmDefinition,`);
    }
  }
}

// Read clean base registry (from original before updates)
// We can construct a pristine registry.ts with all imports and unique registry entries
const registryCode = `import type { AlgorithmDefinition } from "../types/dsa";
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

// Extended ML Infra Curriculum Imports
${allImports.join("\n")}

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

  // Extended ML Infra Curriculum
${Array.from(allEntries.values()).join("\n")}
};

export const getAlgorithm = (id: string): AlgorithmDefinition | undefined => {
  return ALGORITHM_REGISTRY[id];
};

export const getAllAlgorithms = (): AlgorithmDefinition[] => {
  return Array.from(new Set(Object.values(ALGORITHM_REGISTRY)));
};
`;

fs.writeFileSync(registryPath, registryCode, "utf8");
console.log("Successfully rebuilt src/algorithms/registry.ts cleanly!");
