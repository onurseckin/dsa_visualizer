import { cases, defineDsaExecution, input } from "./helpers";

export const backtrackingExecutions = [
  defineDsaExecution({
    id: "n-queens",
    entrypoint: "solve_n_queens",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Single queen", input: 1, expected: [["Q"]] },
      { label: "Unsatisfiable two board", input: 2, expected: [] },
      {
        label: "Two four-board solutions",
        input: 4,
        expected: [
          [".Q..", "...Q", "Q...", "..Q."],
          ["..Q.", "Q...", "...Q", ".Q.."],
        ],
      },
    ),
    audit: {
      signature: "solve_n_queens(n: int) -> list[list[str]]",
      defaultInputShape: "{ n: number }",
      argumentMapping: ["n <- $"],
      mutation: "Mutates and backtracks an internal board.",
      returnBehavior: "Returns every board solution in deterministic column order.",
    },
  }),
  defineDsaExecution({
    id: "generating-permutations",
    entrypoint: "permute",
    invocation: { kind: "function", arguments: [input("elements")] },
    cases: cases(
      {
        label: "Two elements",
        input: { elements: [1, 2] },
        expected: [
          [1, 2],
          [2, 1],
        ],
      },
      { label: "Empty permutation", input: { elements: [] }, expected: [[]] },
      {
        label: "Three elements",
        input: { elements: [1, 2, 3] },
        expected: [
          [1, 2, 3],
          [1, 3, 2],
          [2, 1, 3],
          [2, 3, 1],
          [3, 1, 2],
          [3, 2, 1],
        ],
      },
    ),
    audit: {
      signature: "permute(nums: list[int]) -> list[list[int]]",
      defaultInputShape: "{ elements: number[] }",
      argumentMapping: ["nums <- $.elements"],
      mutation: "Backtracks an internal current permutation; does not mutate nums.",
      returnBehavior: "Returns positional permutations in depth-first order.",
    },
  }),
  defineDsaExecution({
    id: "knights-tour-warnsdorff",
    entrypoint: "knights_tour_warnsdorff",
    invocation: {
      kind: "function",
      arguments: [input("size"), input("startRow"), input("startCol")],
    },
    cases: cases(
      {
        label: "Single-square tour",
        input: { size: 1, startRow: 0, startCol: 0 },
        expected: [true, [[0]]],
      },
      {
        label: "Impossible three board",
        input: { size: 3, startRow: 0, startCol: 0 },
        expected: [
          false,
          [
            [0, 3, 6],
            [5, -1, 1],
            [2, 7, 4],
          ],
        ],
      },
      {
        label: "Complete five board",
        input: { size: 5, startRow: 0, startCol: 0 },
        expected: [
          true,
          [
            [0, 13, 8, 19, 2],
            [23, 18, 1, 14, 9],
            [12, 7, 24, 3, 20],
            [17, 22, 5, 10, 15],
            [6, 11, 16, 21, 4],
          ],
        ],
      },
    ),
    audit: {
      signature: "knights_tour_warnsdorff(n, start_r, start_c) -> tuple[bool, board]",
      defaultInputShape: "{ size: number; startRow: number; startCol: number }",
      argumentMapping: ["n <- $.size", "start_r <- $.startRow", "start_c <- $.startCol"],
      mutation: "Writes visit order into an internal board.",
      returnBehavior: "Returns completion status and the deterministic Warnsdorff board.",
    },
  }),
  defineDsaExecution({
    id: "hamiltonian-path-dp",
    entrypoint: "hamiltonian_path_dp",
    invocation: { kind: "function", arguments: [input("numNodes"), input("edges")] },
    cases: cases(
      {
        label: "Four-node path",
        input: {
          numNodes: 4,
          edges: [
            [0, 1],
            [1, 2],
            [2, 3],
          ],
        },
        expected: true,
      },
      {
        label: "Isolated node",
        input: {
          numNodes: 4,
          edges: [
            [0, 1],
            [0, 2],
          ],
        },
        expected: false,
      },
      {
        label: "Five-node cycle",
        input: {
          numNodes: 5,
          edges: [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 4],
            [4, 0],
          ],
        },
        expected: true,
      },
    ),
    audit: {
      signature: "hamiltonian_path_dp(n: int, edges: list[tuple[int, int]]) -> bool",
      defaultInputShape: "{ numNodes: number; edges: Array<[number, number]>; isCircuit: boolean }",
      argumentMapping: ["n <- $.numNodes", "edges <- $.edges"],
      mutation: "Builds internal adjacency and bitmask tables.",
      returnBehavior: "Returns whether an undirected Hamiltonian path exists.",
    },
  }),
  defineDsaExecution({
    id: "generating-subsets",
    entrypoint: "subsets",
    invocation: { kind: "function", arguments: [input("elements")] },
    cases: cases(
      {
        label: "Two-element power set",
        input: { elements: [1, 2] },
        expected: [[], [2], [1], [1, 2]],
        comparison: "unordered",
      },
      {
        label: "Empty power set",
        input: { elements: [] },
        expected: [[]],
        comparison: "unordered",
      },
      {
        label: "Three-element power set",
        input: { elements: [1, 2, 3] },
        expected: [[], [3], [2], [2, 3], [1], [1, 3], [1, 2], [1, 2, 3]],
        comparison: "unordered",
      },
    ),
    audit: {
      signature: "subsets(nums: list[int]) -> list[list[int]]",
      defaultInputShape: "{ elements: number[] }",
      argumentMapping: ["nums <- $.elements"],
      mutation: "Backtracks an internal subset; does not mutate nums.",
      returnBehavior: "Returns the power set in exclude-before-include DFS order.",
    },
  }),
] as const;
