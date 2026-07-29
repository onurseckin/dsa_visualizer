import { cases, defineDsaExecution, input, namespaceInput, result } from "./helpers";

export const treeFundamentalsExecutions = [
  defineDsaExecution({
    id: "binary-tree-lca",
    entrypoint: "lowest_common_ancestor",
    invocation: {
      kind: "function",
      arguments: [namespaceInput("root"), input("p"), input("q")],
      result: result("return", ["val"]),
    },
    cases: cases(
      {
        label: "Targets in opposite subtrees",
        input: {
          root: {
            val: 3,
            left: { val: 5, left: null, right: null },
            right: { val: 1, left: null, right: null },
          },
          p: 5,
          q: 1,
        },
        expected: 3,
      },
      {
        label: "Root is a target",
        input: { root: { val: 7, left: null, right: null }, p: 7, q: 7 },
        expected: 7,
      },
      {
        label: "Deep sibling targets",
        input: {
          root: {
            val: 10,
            left: {
              val: 5,
              left: { val: 2, left: null, right: null },
              right: { val: 7, left: null, right: null },
            },
            right: {
              val: 15,
              left: { val: 12, left: null, right: null },
              right: { val: 20, left: null, right: null },
            },
          },
          p: 2,
          q: 7,
        },
        expected: 5,
      },
    ),
    audit: {
      signature: "lowest_common_ancestor(root, p, q) -> node | None",
      defaultInputShape: "{ rootId: string; pVal: number; qVal: number; nodes: TreeNode[] }",
      argumentMapping: ["root <- namespace($.root)", "p <- $.p", "q <- $.q"],
      mutation: "Does not mutate the converted tree.",
      returnBehavior: "Returns the LCA node; the contract selects its public val field.",
    },
  }),
  defineDsaExecution({
    id: "tree-diameter",
    entrypoint: "tree_diameter",
    invocation: {
      kind: "function",
      arguments: [input("n"), input("adj"), input("start")],
    },
    cases: cases(
      {
        label: "Three-node chain",
        input: { n: 3, adj: { A: ["B"], B: ["A", "C"], C: ["B"] }, start: "A" },
        expected: ["C", "A", 2],
      },
      {
        label: "Single node",
        input: { n: 1, adj: { A: [] }, start: "A" },
        expected: ["A", "A", 0],
      },
      {
        label: "Branched tree",
        input: {
          n: 6,
          adj: {
            A: ["B", "C"],
            B: ["A", "D", "E"],
            C: ["A", "F"],
            D: ["B"],
            E: ["B"],
            F: ["C"],
          },
          start: "A",
        },
        expected: ["D", "F", 4],
      },
    ),
    audit: {
      signature: "tree_diameter(n, adj, start_node=1) -> tuple[node, node, int]",
      defaultInputShape: "{ rootId: string; nodes: TreeNode[] }",
      argumentMapping: ["n <- $.n", "adj <- $.adj", "start_node <- $.start"],
      mutation: "Does not mutate adjacency lists.",
      returnBehavior: "Returns the two discovered diameter endpoints and edge length.",
    },
  }),
] as const;
