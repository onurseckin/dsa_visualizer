import { cases, defineDsaExecution, input } from "./helpers";

export const graphSpanningTreesExecutions = [
  defineDsaExecution({
    id: "kruskal-mst",
    entrypoint: "kruskal_mst",
    invocation: { kind: "function", arguments: [input("nodes"), input("edges")] },
    cases: cases(
      {
        label: "Three-node tree",
        input: {
          nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
          edges: [
            { from: "A", to: "B", weight: 1 },
            { from: "B", to: "C", weight: 2 },
            { from: "A", to: "C", weight: 5 },
          ],
        },
        expected: [
          { from: "A", to: "B", weight: 1 },
          { from: "B", to: "C", weight: 2 },
        ],
        comparison: "unordered",
      },
      {
        label: "Single node",
        input: { nodes: [{ id: "A" }], edges: [] },
        expected: [],
        comparison: "unordered",
      },
      {
        label: "Four-node competing edges",
        input: {
          nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
          edges: [
            { from: "A", to: "B", weight: 4 },
            { from: "A", to: "C", weight: 1 },
            { from: "C", to: "B", weight: 2 },
            { from: "B", to: "D", weight: 1 },
            { from: "C", to: "D", weight: 5 },
          ],
        },
        expected: [
          { from: "A", to: "C", weight: 1 },
          { from: "B", to: "D", weight: 1 },
          { from: "C", to: "B", weight: 2 },
        ],
        comparison: "unordered",
      },
    ),
    audit: {
      signature: "kruskal_mst(nodes, edges) -> list[edge]",
      defaultInputShape: "{ nodes: GraphNode[]; edges: WeightedGraphEdge[] }",
      argumentMapping: ["nodes <- $.nodes", "edges <- $.edges"],
      mutation: "Mutates internal union-find state; does not mutate authored arrays.",
      returnBehavior: "Returns selected edge objects in nondecreasing weight order.",
    },
  }),
  defineDsaExecution({
    id: "prim-mst",
    entrypoint: "prim_mst",
    invocation: { kind: "function", arguments: [input("n"), input("edges")] },
    cases: cases(
      {
        label: "Three-node connected graph",
        input: {
          n: 3,
          edges: [
            [0, 1, 1],
            [1, 2, 2],
            [0, 2, 5],
          ],
        },
        expected: 3,
      },
      { label: "Single node", input: { n: 1, edges: [] }, expected: 0 },
      {
        label: "Disconnected graph",
        input: {
          n: 4,
          edges: [
            [0, 1, 2],
            [2, 3, 1],
          ],
        },
        expected: -1,
      },
    ),
    audit: {
      signature: "prim_mst(num_nodes, edges) -> number",
      defaultInputShape: "{ numNodes: number; edges: Array<[number, number, number]> }",
      argumentMapping: ["num_nodes <- $.n", "edges <- $.edges"],
      mutation: "Mutates internal visited and priority-queue state.",
      returnBehavior: "Returns MST total weight, or -1 when disconnected.",
    },
  }),
  defineDsaExecution({
    id: "disjoint-set-union",
    entrypoint: "DSU",
    invocation: {
      kind: "class-method",
      constructor: [input("n")],
      setup: [
        { method: "union", arguments: [input("a1"), input("b1")] },
        { method: "union", arguments: [input("a2"), input("b2")] },
      ],
      method: "find",
      arguments: [input("query")],
    },
    cases: cases(
      {
        label: "Three-node union chain",
        input: { n: 4, a1: 1, b1: 2, a2: 2, b2: 3, query: 3 },
        expected: 1,
      },
      {
        label: "Single redundant union",
        input: { n: 1, a1: 0, b1: 0, a2: 0, b2: 0, query: 0 },
        expected: 0,
      },
      {
        label: "Offset component chain",
        input: { n: 7, a1: 3, b1: 4, a2: 4, b2: 5, query: 5 },
        expected: 3,
      },
    ),
    audit: {
      signature: "DSU(n).union(i, j); find(i) -> int",
      defaultInputShape: "{ numNodes: number; operations: DsuOperation[] }",
      argumentMapping: ["n <- $.n", "two setup unions", "find <- $.query"],
      mutation: "Setup unions mutate parent/rank state; find may compress paths.",
      returnBehavior:
        "Returns the deterministic union-by-rank representative after processing authored unions in order.",
    },
  }),
] as const;
