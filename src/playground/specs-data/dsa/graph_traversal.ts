import { cases, defineDsaExecution, input } from "./helpers";

export const graphTraversalExecutions = [
  defineDsaExecution({
    id: "bfs-graph",
    entrypoint: "bfs",
    invocation: { kind: "function", arguments: [input("graph"), input("start")] },
    cases: cases(
      {
        label: "Breadth-first branch order",
        input: {
          graph: { A: ["B", "C"], B: ["D"], C: [], D: [] },
          start: "A",
        },
        expected: ["A", "B", "C", "D"],
      },
      {
        label: "Single node",
        input: { graph: { A: [] }, start: "A" },
        expected: ["A"],
      },
      {
        label: "Cycle with converging frontier",
        input: {
          graph: {
            A: ["B", "C"],
            B: ["A", "D"],
            C: ["A", "D"],
            D: ["B", "C"],
          },
          start: "A",
        },
        expected: ["A", "B", "C", "D"],
      },
    ),
    audit: {
      signature: "bfs(graph, start_node) -> list[node]",
      defaultInputShape: "{ startNodeId: string; nodes: GraphNode[]; edges: GraphEdge[] }",
      argumentMapping: ["graph <- $.graph", "start_node <- $.start"],
      mutation: "Mutates internal visited, queue, and traversal state.",
      returnBehavior: "Returns nodes in first-visit breadth-first order.",
    },
  }),
  defineDsaExecution({
    id: "number-of-islands",
    entrypoint: "num_islands",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Two islands",
        input: [
          ["1", "1", "0"],
          ["0", "1", "0"],
          ["0", "0", "1"],
        ],
        expected: 2,
      },
      { label: "Empty grid", input: [], expected: 0 },
      {
        label: "Three separated components",
        input: [
          ["1", "0", "1", "0"],
          ["1", "0", "0", "0"],
          ["0", "0", "1", "1"],
          ["0", "0", "0", "1"],
        ],
        expected: 3,
      },
    ),
    audit: {
      signature: "num_islands(grid) -> int",
      defaultInputShape: "string[][]",
      argumentMapping: ["grid <- $"],
      mutation: "Does not mutate grid; tracks visited coordinates.",
      returnBehavior: "Returns the number of four-neighbor land components.",
    },
  }),
  defineDsaExecution({
    id: "dfs-graph",
    entrypoint: "dfs_graph",
    invocation: { kind: "function", arguments: [input("graph"), input("start")] },
    cases: cases(
      {
        label: "LIFO branch order",
        input: {
          graph: { A: ["B", "C"], B: ["D"], C: [], D: [] },
          start: "A",
        },
        expected: ["A", "C", "B", "D"],
      },
      {
        label: "Single node",
        input: { graph: { A: [] }, start: "A" },
        expected: ["A"],
      },
      {
        label: "Cycle traversal",
        input: {
          graph: {
            A: ["B", "C"],
            B: ["A", "D"],
            C: ["A", "D"],
            D: ["B", "C"],
          },
          start: "A",
        },
        expected: ["A", "C", "D", "B"],
      },
    ),
    audit: {
      signature: "dfs_graph(graph, start_node) -> list[node]",
      defaultInputShape: "{ startNodeId: string; nodes: GraphNode[]; edges: GraphEdge[] }",
      argumentMapping: ["graph <- $.graph", "start_node <- $.start"],
      mutation: "Mutates internal stack and visited state.",
      returnBehavior: "Returns iterative LIFO first-visit order.",
    },
  }),
  defineDsaExecution({
    id: "bipartite-graph-check",
    entrypoint: "is_bipartite",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Even cycle",
        input: { A: ["B", "D"], B: ["A", "C"], C: ["B", "D"], D: ["A", "C"] },
        expected: true,
      },
      {
        label: "Triangle conflict",
        input: { A: ["B", "C"], B: ["A", "C"], C: ["A", "B"] },
        expected: false,
      },
      {
        label: "Disconnected bipartite components",
        input: { A: ["B"], B: ["A"], C: [], D: ["E"], E: ["D"] },
        expected: true,
      },
    ),
    audit: {
      signature: "is_bipartite(graph) -> bool",
      defaultInputShape: "{ nodes: GraphNode[]; edges: GraphEdge[] }",
      argumentMapping: ["graph <- $"],
      mutation: "Does not mutate graph; assigns internal two-colors.",
      returnBehavior: "Returns whether every component is two-colorable.",
    },
  }),
] as const;
