import type { TriviaSemanticLine } from "../types/trivia";

/*
 * One deliberately chosen retrieval line per DSA topic. These are authored
 * learning claims, not a copy of the implementation: the canonical answer
 * remains `algorithm.code`, while this catalog says which decision deserves
 * spaced recall and which misconception it diagnoses.
 */
export const ACTIVE_TRIVIA_SEMANTIC_METADATA: Readonly<
  Record<string, readonly TriviaSemanticLine[]>
> = Object.freeze({
  "two-sum": [
    {
      line: 5,
      role: "boundary",
      acceptedAnswers: ["if complement in seen.keys():"],
      misconceptionCode: "checks-after-insert",
      invariantPrompt: "Why must seen contain only indices before the current index?",
      predictionPrompt: "What changes when the current value is its own complement?",
    },
  ],
  "two-sum-sorted": [
    {
      line: 6,
      role: "boundary",
      misconceptionCode: "moves-both-pointers",
      invariantPrompt: "What ordering invariant lets one pointer move after this comparison?",
    },
  ],
  "valid-parentheses": [
    {
      line: 8,
      role: "boundary",
      misconceptionCode: "pops-empty-stack",
      predictionPrompt:
        "What should the function return for a closing bracket with an empty stack?",
    },
  ],
  "binary-search-1d": [
    {
      line: 7,
      role: "boundary",
      misconceptionCode: "forgets-equality",
      invariantPrompt:
        "Which candidate interval remains valid immediately before this equality check?",
    },
  ],
  "sliding-window-min": [
    {
      line: 11,
      role: "invariant",
      misconceptionCode: "keeps-dominated-index",
      invariantPrompt: "Why must deque values remain increasing from front to back?",
    },
  ],
  "reverse-linked-list": [
    {
      line: 6,
      role: "state-update",
      misconceptionCode: "loses-next-pointer",
      invariantPrompt: "Which pointer still preserves access to the unreversed suffix?",
    },
  ],
  "binary-tree-lca": [
    {
      line: 8,
      role: "boundary",
      misconceptionCode: "returns-one-branch-lca",
      invariantPrompt: "What does receiving one non-null result from each subtree prove?",
    },
  ],
  "binary-lifting-lca": [
    {
      line: 15,
      role: "state-update",
      misconceptionCode: "wrong-parent-lift",
      invariantPrompt: "What does up[node][0] represent after this assignment?",
    },
  ],
  "kmp-string-match": [
    {
      line: 9,
      role: "boundary",
      misconceptionCode: "drops-prefix-fallback",
      invariantPrompt: "What prefix/suffix relationship is being tested before extending LPS?",
    },
  ],
  "kth-largest-element": [
    {
      line: 7,
      role: "boundary",
      misconceptionCode: "keeps-oversized-heap",
      invariantPrompt: "Why does the heap contain exactly the k largest values seen so far?",
    },
  ],
  "n-queens": [
    {
      line: 12,
      role: "boundary",
      misconceptionCode: "misses-diagonal-conflict",
      predictionPrompt: "Which conflict makes this candidate column unavailable?",
    },
  ],
  "bfs-graph": [
    {
      line: 12,
      role: "boundary",
      misconceptionCode: "enqueues-duplicate-neighbor",
      invariantPrompt: "Why is marking a neighbor here necessary for BFS frontier uniqueness?",
    },
  ],
  "dijkstra-shortest-path": [
    {
      line: 11,
      role: "boundary",
      misconceptionCode: "relaxes-finalized-node",
      invariantPrompt: "Why is a popped visited node safe to skip with non-negative edges?",
    },
  ],
  "kruskal-mst": [
    {
      line: 13,
      role: "state-update",
      misconceptionCode: "unions-cycle-edge",
      invariantPrompt: "What partition invariant must hold before unioning two components?",
    },
  ],
  "topological-sort": [
    {
      line: 10,
      role: "invariant",
      misconceptionCode: "starts-nonzero-indegree",
      invariantPrompt: "Why may only zero-indegree nodes enter the initial queue?",
    },
  ],
  "ford-fulkerson": [
    {
      line: 10,
      role: "boundary",
      misconceptionCode: "misses-sink-base-case",
      predictionPrompt: "What residual capacity should the DFS report after reaching the sink?",
    },
  ],
  "coin-change-dp": [
    {
      line: 8,
      role: "state-update",
      misconceptionCode: "uses-unreachable-state",
      invariantPrompt: "What does dp[i] mean after all coins have been considered?",
    },
  ],
  "grid-paths-dp": [
    {
      line: 11,
      role: "boundary",
      misconceptionCode: "routes-through-obstacle",
      predictionPrompt: "How should the path count change when this cell is an obstacle?",
    },
  ],
  "merge-intervals": [
    {
      line: 8,
      role: "boundary",
      misconceptionCode: "misses-touching-overlap",
      invariantPrompt:
        "Why is the last merged interval the only interval that can overlap current?",
    },
  ],
  "interval-scheduling": [
    {
      line: 7,
      role: "boundary",
      misconceptionCode: "accepts-overlap",
      invariantPrompt: "What greedy invariant does last_end maintain after selecting an interval?",
    },
  ],
  "counting-bits": [
    {
      line: 4,
      role: "state-update",
      misconceptionCode: "drops-lowest-bit",
      invariantPrompt: "How does i >> 1 relate the current bit count to a solved subproblem?",
    },
  ],
  "euclid-gcd": [
    {
      line: 3,
      role: "state-update",
      misconceptionCode: "uses-quotient-not-remainder",
      invariantPrompt: "Why does replacing (a, b) with (b, a mod b) preserve the gcd?",
    },
  ],
  "nim-game": [
    {
      line: 7,
      role: "boundary",
      misconceptionCode: "misreads-zero-nim-sum",
      predictionPrompt: "Which player wins when the xor sum is zero?",
    },
  ],
  "segment-tree": [
    {
      line: 14,
      role: "invariant",
      misconceptionCode: "combines-wrong-children",
      invariantPrompt: "What range aggregate must this internal tree node store?",
    },
  ],
  "convex-hull": [
    {
      line: 13,
      role: "boundary",
      misconceptionCode: "keeps-clockwise-turn",
      invariantPrompt: "Why does this cross-product condition remove a non-hull point?",
    },
  ],
});
