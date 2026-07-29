import { cases, defineDsaExecution, input } from "./helpers";

export const graphShortestPathsExecutions = [
  defineDsaExecution({
    id: "dijkstra-shortest-path",
    entrypoint: "dijkstra",
    invocation: { kind: "function", arguments: [input("graph"), input("start")] },
    cases: cases(
      {
        label: "Relaxed indirect route",
        input: {
          graph: {
            A: [
              ["B", 1],
              ["C", 4],
            ],
            B: [["C", 2]],
            C: [],
          },
          start: "A",
        },
        expected: { A: 0, B: 1, C: 3 },
      },
      {
        label: "Single reachable node",
        input: { graph: { A: [] }, start: "A" },
        expected: { A: 0 },
      },
      {
        label: "Several competing routes",
        input: {
          graph: {
            A: [
              ["B", 5],
              ["C", 1],
            ],
            B: [["D", 1]],
            C: [
              ["B", 2],
              ["D", 8],
            ],
            D: [],
          },
          start: "A",
        },
        expected: { A: 0, B: 3, C: 1, D: 4 },
      },
    ),
    audit: {
      signature: "dijkstra(graph, start_node) -> dict[node, number]",
      defaultInputShape: "{ startNodeId: string; nodes: GraphNode[]; edges: WeightedGraphEdge[] }",
      argumentMapping: ["graph <- $.graph", "start_node <- $.start"],
      mutation: "Does not mutate graph; mutates internal distance/heap state.",
      returnBehavior: "Returns finite shortest distances for the authored reachable graph.",
    },
  }),
  defineDsaExecution({
    id: "bellman-ford",
    entrypoint: "bellman_ford",
    invocation: {
      kind: "function",
      arguments: [input("nodes"), input("edges"), input("start")],
    },
    cases: cases(
      {
        label: "Negative edge without cycle",
        input: {
          nodes: ["A", "B", "C"],
          edges: [
            ["A", "B", 4],
            ["A", "C", 5],
            ["B", "C", -2],
          ],
          start: "A",
        },
        expected: [{ A: 0, B: 4, C: 2 }, false],
      },
      {
        label: "Single node",
        input: { nodes: ["A"], edges: [], start: "A" },
        expected: [{ A: 0 }, false],
      },
      {
        label: "Reachable negative cycle",
        input: {
          nodes: ["A", "B", "C"],
          edges: [
            ["A", "B", 1],
            ["B", "C", -2],
            ["C", "B", -2],
          ],
          start: "A",
        },
        expected: [{ A: 0, B: -7, C: -5 }, true],
      },
    ),
    audit: {
      signature: "bellman_ford(nodes, edges, start_node) -> tuple[dict, bool]",
      defaultInputShape: "{ startNodeId: string; nodes: GraphNode[]; edges: WeightedGraphEdge[] }",
      argumentMapping: ["nodes <- $.nodes", "edges <- $.edges", "start_node <- $.start"],
      mutation: "Mutates only an internal distance map.",
      returnBehavior: "Returns distances after relaxation and a reachable-negative-cycle flag.",
    },
  }),
  defineDsaExecution({
    id: "floyd-warshall",
    entrypoint: "floyd_warshall",
    invocation: { kind: "function", arguments: [input("nodes"), input("edges")] },
    cases: cases(
      {
        label: "Two directed weights",
        input: {
          nodes: ["A", "B"],
          edges: [
            ["A", "B", 3],
            ["B", "A", 4],
          ],
        },
        expected: [
          [0, 3],
          [4, 0],
        ],
      },
      { label: "Single node matrix", input: { nodes: ["A"], edges: [] }, expected: [[0]] },
      {
        label: "Three-node all-pairs relaxation",
        input: {
          nodes: ["A", "B", "C"],
          edges: [
            ["A", "B", 2],
            ["B", "C", 3],
            ["C", "A", 4],
            ["A", "C", 10],
            ["B", "A", 8],
            ["C", "B", 1],
          ],
        },
        expected: [
          [0, 2, 5],
          [7, 0, 3],
          [4, 1, 0],
        ],
      },
    ),
    audit: {
      signature: "floyd_warshall(nodes, edges) -> list[list[number]]",
      defaultInputShape: "{ nodes: GraphNode[]; edges: WeightedGraphEdge[] }",
      argumentMapping: ["nodes <- $.nodes", "edges <- $.edges"],
      mutation: "Mutates an internal all-pairs distance matrix.",
      returnBehavior: "Returns finite directed all-pairs shortest distances in node order.",
    },
  }),
] as const;
