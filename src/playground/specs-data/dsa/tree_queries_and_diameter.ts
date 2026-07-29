import { cases, defineDsaExecution, input } from "./helpers";

export const treeQueriesAndDiameterExecutions = [
  defineDsaExecution({
    id: "euler-tour-technique",
    entrypoint: "euler_tour",
    invocation: {
      kind: "function",
      arguments: [input("n"), input("edges"), input("values")],
    },
    cases: cases(
      {
        label: "Root with two children",
        input: {
          n: 3,
          edges: [
            [0, 1],
            [0, 2],
          ],
          values: [10, 20, 30],
        },
        expected: [
          [0, 1, 2],
          [2, 1, 2],
          [0, 1, 2],
        ],
      },
      {
        label: "Single node",
        input: { n: 1, edges: [], values: [100] },
        expected: [[0], [0], [0]],
      },
      {
        label: "Two branching subtrees",
        input: {
          n: 6,
          edges: [
            [0, 1],
            [0, 2],
            [1, 3],
            [1, 4],
            [2, 5],
          ],
          values: [5, 10, 15, 20, 25, 30],
        },
        expected: [
          [0, 1, 4, 2, 3, 5],
          [5, 3, 5, 2, 3, 5],
          [0, 1, 3, 4, 2, 5],
        ],
      },
    ),
    audit: {
      signature: "euler_tour(n, edges, values) -> tuple[list[int], list[int], list[int]]",
      defaultInputShape: "{ n: number; edges: Array<[number, number]>; values: number[] }",
      argumentMapping: ["n <- $.n", "edges <- $.edges", "values <- $.values"],
      mutation: "Builds adjacency and timestamp arrays without mutating the authored input.",
      returnBehavior:
        "Returns entry times, inclusive exit times, and DFS flattening order using authored edge order.",
    },
  }),
  defineDsaExecution({
    id: "dsu-on-tree",
    entrypoint: "dsu_on_tree",
    invocation: {
      kind: "function",
      arguments: [input("n"), input("edges"), input("colors")],
    },
    cases: cases(
      {
        label: "Repeated root color",
        input: {
          n: 3,
          edges: [
            [0, 1],
            [0, 2],
          ],
          colors: [1, 2, 1],
        },
        expected: [2, 1, 1],
      },
      {
        label: "Single colored node",
        input: { n: 1, edges: [], colors: [42] },
        expected: [1],
      },
      {
        label: "Balanced colored subtrees",
        input: {
          n: 6,
          edges: [
            [0, 1],
            [0, 2],
            [1, 3],
            [1, 4],
            [2, 5],
          ],
          colors: [1, 2, 1, 2, 3, 3],
        },
        expected: [3, 2, 2, 1, 1, 1],
      },
    ),
    audit: {
      signature: "dsu_on_tree(n, edges, colors) -> list[int]",
      defaultInputShape: "{ n: number; edges: Array<[number, number]>; colors: number[] }",
      argumentMapping: ["n <- $.n", "edges <- $.edges", "colors <- $.colors"],
      mutation: "Uses an internal frequency sack; authored edges and colors are not mutated.",
      returnBehavior: "Returns the distinct-color count for every rooted subtree.",
    },
  }),
  defineDsaExecution({
    id: "binary-lifting-lca",
    entrypoint: "binary_lifting_lca",
    invocation: {
      kind: "function",
      arguments: [input("n"), input("edges"), input("u"), input("v")],
    },
    cases: cases(
      {
        label: "Sibling leaves",
        input: {
          n: 7,
          edges: [
            [0, 1],
            [0, 2],
            [1, 3],
            [1, 4],
            [2, 5],
            [2, 6],
          ],
          u: 3,
          v: 4,
        },
        expected: 1,
      },
      {
        label: "Single node",
        input: { n: 1, edges: [], u: 0, v: 0 },
        expected: 0,
      },
      {
        label: "Leaves in right subtree",
        input: {
          n: 7,
          edges: [
            [0, 1],
            [0, 2],
            [1, 3],
            [1, 4],
            [2, 5],
            [2, 6],
          ],
          u: 5,
          v: 6,
        },
        expected: 2,
      },
    ),
    audit: {
      signature: "binary_lifting_lca(n, edges, u, v) -> int",
      defaultInputShape: "{ n: number; edges: Array<[number, number]>; u: number; v: number }",
      argumentMapping: ["n <- $.n", "edges <- $.edges", "u <- $.u", "v <- $.v"],
      mutation: "Builds depth and jump tables without mutating the authored tree.",
      returnBehavior: "Returns the lowest common ancestor node index.",
    },
  }),
] as const;
