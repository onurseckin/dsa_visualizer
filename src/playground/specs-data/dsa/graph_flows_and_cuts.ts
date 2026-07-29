import { cases, defineDsaExecution, input } from "./helpers";

export const graphFlowsAndCutsExecutions = [
  defineDsaExecution({
    id: "ford-fulkerson",
    entrypoint: "ford_fulkerson",
    invocation: {
      kind: "function",
      arguments: [input("nodes"), input("edges"), input("source"), input("sink")],
    },
    cases: cases(
      {
        label: "Two independent paths",
        input: {
          nodes: ["S", "A", "B", "T"],
          edges: [
            ["S", "A", 3],
            ["A", "T", 3],
            ["S", "B", 2],
            ["B", "T", 2],
          ],
          source: "S",
          sink: "T",
        },
        expected: 5,
      },
      {
        label: "Parallel source-to-sink capacities",
        input: {
          nodes: ["S", "T"],
          edges: [
            ["S", "T", 2],
            ["S", "T", 3],
          ],
          source: "S",
          sink: "T",
        },
        expected: 5,
      },
      {
        label: "Residual rerouting required",
        input: {
          nodes: ["S", "A", "B", "T"],
          edges: [
            ["S", "A", 1],
            ["S", "B", 1],
            ["A", "B", 1],
            ["A", "T", 1],
            ["B", "T", 1],
          ],
          source: "S",
          sink: "T",
        },
        expected: 2,
      },
    ),
    audit: {
      signature: "ford_fulkerson(nodes, edges, source, sink) -> number",
      defaultInputShape:
        "{ nodes: GraphNode[]; edges: CapacityEdge[]; sourceId: string; sinkId: string }",
      argumentMapping: [
        "nodes <- $.nodes",
        "edges <- $.edges",
        "source <- $.source",
        "sink <- $.sink",
      ],
      mutation: "Mutates an internal residual-flow map.",
      returnBehavior: "Returns maximum source-to-sink flow, including reverse residual rerouting.",
    },
  }),
  defineDsaExecution({
    id: "minimum-path-cover",
    entrypoint: "min_path_cover",
    invocation: { kind: "function", arguments: [input("n"), input("edges")] },
    cases: cases(
      {
        label: "Diamond DAG",
        input: {
          n: 4,
          edges: [
            [0, 1],
            [0, 2],
            [1, 3],
            [2, 3],
          ],
        },
        expected: 2,
      },
      { label: "Empty graph", input: { n: 0, edges: [] }, expected: 0 },
      {
        label: "Five-node chain",
        input: {
          n: 5,
          edges: [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 4],
          ],
        },
        expected: 1,
      },
    ),
    audit: {
      signature: "min_path_cover(n, edges) -> int",
      defaultInputShape: "{ numNodes: number; edges: Array<[number, number]> }",
      argumentMapping: ["n <- $.n", "edges <- $.edges"],
      mutation: "Mutates internal bipartite matching state.",
      returnBehavior: "Returns the minimum vertex-disjoint path cover size for the DAG.",
    },
  }),
  defineDsaExecution({
    id: "edmonds-karp-max-flow",
    entrypoint: "edmonds_karp",
    invocation: {
      kind: "function",
      arguments: [input("capacity"), input("source"), input("sink")],
    },
    cases: cases(
      {
        label: "Four-node network",
        input: {
          capacity: [
            [0, 3, 2, 0],
            [0, 0, 1, 2],
            [0, 0, 0, 4],
            [0, 0, 0, 0],
          ],
          source: 0,
          sink: 3,
        },
        expected: 5,
      },
      {
        label: "Disconnected sink",
        input: {
          capacity: [
            [0, 3, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
          source: 0,
          sink: 2,
        },
        expected: 0,
      },
      {
        label: "Classic six-node network",
        input: {
          capacity: [
            [0, 16, 13, 0, 0, 0],
            [0, 0, 10, 12, 0, 0],
            [0, 4, 0, 0, 14, 0],
            [0, 0, 9, 0, 0, 20],
            [0, 0, 0, 7, 0, 4],
            [0, 0, 0, 0, 0, 0],
          ],
          source: 0,
          sink: 5,
        },
        expected: 23,
      },
    ),
    audit: {
      signature: "edmonds_karp(capacity, source, sink) -> number",
      defaultInputShape: "{ capacity: number[][]; source: number; sink: number }",
      argumentMapping: ["capacity <- $.capacity", "source <- $.source", "sink <- $.sink"],
      mutation: "Does not mutate capacity; mutates an internal residual-flow matrix.",
      returnBehavior: "Returns BFS-augmenting-path maximum flow.",
    },
  }),
] as const;
