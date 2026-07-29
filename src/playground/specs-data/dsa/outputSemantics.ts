export type DsaOutputSemanticsStrategy =
  | "exact-canonical"
  | "unordered-recursive"
  | "unordered-outer"
  | "unique-fixtures"
  | "projected-invariant";

export interface DsaOutputSemanticsAudit {
  readonly strategy: DsaOutputSemanticsStrategy;
  readonly rationale: string;
  readonly contractMarker?: string;
}

const exact = (rationale: string, contractMarker?: string): DsaOutputSemanticsAudit => ({
  strategy: "exact-canonical",
  rationale,
  ...(contractMarker === undefined ? {} : { contractMarker }),
});

const strategy = (
  value: Exclude<DsaOutputSemanticsStrategy, "exact-canonical">,
  rationale: string,
): DsaOutputSemanticsAudit => ({ strategy: value, rationale });

export const DSA_OUTPUT_SEMANTICS_AUDIT = {
  "bellman-ford": exact(
    "Reachable negative cycles return a stable None sentinel instead of schedule-dependent distances.",
    "None",
  ),
  "bfs-graph": exact(
    "Traversal ties follow authored adjacency-list order.",
    "authored adjacency-list order",
  ),
  "binary-lifting-lca": exact("A rooted tree has one lowest common ancestor for the query."),
  "binary-search-1d": exact(
    "Fixtures contain no duplicate target, so the matching index is unique.",
  ),
  "binary-search-matrix": exact("Membership is a unique boolean result."),
  "binary-tree-lca": exact("A rooted tree has one lowest common ancestor for the query."),
  "binomial-coefficients-pascal": exact("The requested binomial coefficient is unique."),
  "bipartite-graph-check": exact("Bipartiteness is a unique boolean result."),
  "bubble-sort": exact("Ascending sorted values form a unique sequence."),
  "catalan-numbers": exact("The requested Catalan number is unique."),
  "chinese-remainder-theorem": exact(
    "The contract requests the least non-negative simultaneous solution.",
  ),
  "closest-pair-of-points": exact("The minimum pair distance is unique even when a pair is tied."),
  "coin-change-dp": exact("The minimum coin count is unique."),
  "convex-hull": exact(
    "Monotone-chain output starts at the lexicographic minimum and keeps counter-clockwise order.",
    "lexicographically smallest point",
  ),
  "counting-bits": exact("Each index has one population count."),
  "counting-tilings": exact("The domino tiling count is unique."),
  "dag-dp-longest-path": exact("Authored fixtures have a unique maximum-weight path."),
  "de-bruijn-sequence": exact(
    "The implementation contract fixes reverse edge-insertion order for canonical linearization.",
    "reverse edge-insertion order",
  ),
  "dfs-graph": exact(
    "Traversal ties follow authored adjacency-list insertion and LIFO order.",
    "authored adjacency-list order",
  ),
  "dijkstra-shortest-path": exact("Shortest-distance maps are unique for the authored graph."),
  "disjoint-set-union": exact(
    "The API exposes the representative selected by ordered union-by-rank.",
    "union-by-rank representative",
  ),
  "dsu-on-tree": exact("Each rooted subtree has one distinct-color count."),
  "dynamic-segment-tree": exact("The requested range sum is unique."),
  "edit-distance": exact("Levenshtein distance is a unique scalar even when edit scripts tie."),
  "edmonds-karp-max-flow": exact("Maximum-flow value is unique even when flow assignments tie."),
  "euclid-gcd": exact("The greatest common divisor is unique."),
  "euler-totient-function": exact("Euler's totient value is unique."),
  "euler-tour-technique": exact(
    "DFS timestamps and flattening use authored edge order.",
    "authored edge order",
  ),
  "extended-euclidean-algorithm": exact(
    "The API grades coefficients selected by the canonical recursive quotient recurrence.",
    "recursive quotient recurrence",
  ),
  "fenwick-tree": exact("The inclusive range sum after updates is unique."),
  "floyd-warshall": exact("All-pairs shortest distances are unique."),
  "ford-fulkerson": exact("Maximum-flow value is unique even when augmenting paths tie."),
  "generating-permutations": strategy(
    "unordered-outer",
    "Permutation enumeration order is irrelevant, while element order inside each permutation matters.",
  ),
  "generating-subsets": strategy(
    "unordered-recursive",
    "A power set and every subset are both mathematical sets.",
  ),
  "grid-paths-dp": exact("The valid path count is unique."),
  "hamiltonian-path-dp": exact("Existence is a unique boolean result."),
  "hierholzer-eulerian-path": strategy(
    "unique-fixtures",
    "Every authored graph has exactly one trail from its declared first node.",
  ),
  "huffman-coding": exact(
    "The API fixes heap stability and left-zero/right-one construction.",
    "stable heap insertion",
  ),
  "inclusion-exclusion-principle": exact("The divisible-value count is unique."),
  "interval-scheduling": strategy(
    "unordered-outer",
    "The selected compatible intervals form a set, so outer order is irrelevant while each [start, end] pair remains ordered.",
  ),
  "kadane-max-subarray": exact("Only the maximum sum is returned, so tied ranges are equivalent."),
  "kmp-string-match": exact("All match-start indices form a unique ascending sequence."),
  "knapsack-01": exact("Only the maximum value is returned, so tied item sets are equivalent."),
  "knights-tour-warnsdorff": exact(
    "Warnsdorff ties use a fixed candidate-move order.",
    "fixed candidate-move order",
  ),
  "kosaraju-scc": strategy(
    "unordered-recursive",
    "Both SCC membership and the partition's component order are mathematical sets.",
  ),
  "kruskal-mst": strategy(
    "unordered-recursive",
    "Authored fixtures have a unique MST edge set; equal-weight emission order is irrelevant.",
  ),
  "kth-largest-element": exact("The kth order statistic is unique."),
  "line-segment-intersection": exact("Intersection existence is a unique boolean result."),
  "longest-increasing-subsequence": exact(
    "Only LIS length is returned, so tied subsequences are equivalent.",
  ),
  "markov-chains": exact("The authored transition order determines one state distribution."),
  "matrix-exponentiation": exact("The reduced Fibonacci value is unique."),
  "meet-in-the-middle": exact("Subset-sum existence is a unique boolean result."),
  "merge-intervals": exact("The maximal merged intervals have one ascending representation."),
  "merge-sort": exact("Ascending sorted values form a unique sequence."),
  "minimum-path-cover": exact("Only the minimum cover size is returned."),
  "mo-algorithm": exact("Range sums are returned in authored query order."),
  "modular-exponentiation-inverse": exact(
    "The least non-negative inverse modulo the authored prime is unique.",
  ),
  "n-queens": strategy(
    "unordered-outer",
    "Board enumeration order is irrelevant, while row order inside each board matters.",
  ),
  "nearest-smaller-element": exact("Each position's nearest smaller value is unique."),
  "nim-game": strategy(
    "unique-fixtures",
    "Each winning authored position has exactly one move that makes the nim sum zero.",
  ),
  "number-of-islands": exact("The component count is unique."),
  "persistent-segment-tree": exact("Every requested versioned range sum is unique."),
  "polygon-area": exact("Absolute shoelace area is unique."),
  "prefix-sum": exact("Each prefix total is uniquely determined."),
  "prim-mst": exact("Only total MST weight is returned."),
  "quick-sort": exact("Ascending sorted values form a unique sequence."),
  "reverse-linked-list": exact("Reversing a linked list produces one value order."),
  "segment-tree": exact("The inclusive range sum after replacement is unique."),
  "segment-tree-lazy": exact("The inclusive range sum after range addition is unique."),
  "sieve-primes": exact("Primes through the limit form one ascending sequence."),
  "sliding-window-min": exact("Each complete window has one minimum value."),
  "sparse-table-rmq": exact("The requested range minimum is unique."),
  "sprague-grundy-theorem": exact("The recurrence fixes every Grundy value and combined xor."),
  "sqrt-decomposition": exact("The inclusive range sum after replacement is unique."),
  "string-hashing": exact("Verified match starts form one ascending sequence."),
  "successor-paths": exact("The cycle entry, length, and kth successor are unique."),
  "sweep-line-intersections": strategy(
    "unordered-recursive",
    "The intersection collection and the two segment IDs in each pair are sets.",
  ),
  "tasks-and-deadlines": exact("The returned total reward is unique."),
  "topological-sort": strategy(
    "unique-fixtures",
    "Every authored DAG has exactly one valid topological order.",
  ),
  "tree-diameter": strategy(
    "projected-invariant",
    "Grading projects diameter length because endpoint orientation and tied endpoints are non-unique.",
  ),
  "trie-prefix-tree": exact("Prefix membership is a unique boolean result."),
  "tsp-bitmask-dp": exact("Only minimum tour cost is returned."),
  "two-pointers": exact(
    "The API requests the first matching window encountered by the scan.",
    "first matching",
  ),
  "two-sat-solver": exact("Authored satisfiable fixtures force every literal."),
  "two-sum": exact("Authored fixtures have at most one matching index pair."),
  "two-sum-sorted": exact("Authored fixtures have at most one matching index pair."),
  "valid-parentheses": exact("Validity is a unique boolean result."),
  "z-algorithm": exact("All match-start indices form a unique ascending sequence."),
} as const satisfies Record<string, DsaOutputSemanticsAudit>;
