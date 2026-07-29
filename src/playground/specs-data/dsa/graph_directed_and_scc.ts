import { cases, defineDsaExecution, input } from "./helpers";

export const graphDirectedAndSccExecutions = [
  defineDsaExecution({
    id: "topological-sort",
    entrypoint: "topological_sort",
    invocation: { kind: "function", arguments: [input("nodes"), input("edges")] },
    cases: cases(
      {
        label: "Three-node dependency chain",
        input: {
          nodes: ["A", "B", "C"],
          edges: [
            ["A", "B"],
            ["B", "C"],
          ],
        },
        expected: ["A", "B", "C"],
      },
      { label: "Single isolated node", input: { nodes: ["A"], edges: [] }, expected: ["A"] },
      {
        label: "Uniquely ordered branching DAG",
        input: {
          nodes: ["A", "B", "C", "D"],
          edges: [
            ["A", "B"],
            ["A", "C"],
            ["B", "C"],
            ["B", "D"],
            ["C", "D"],
          ],
        },
        expected: ["A", "B", "C", "D"],
      },
    ),
    audit: {
      signature: "topological_sort(nodes, edges) -> list[node]",
      defaultInputShape: "{ nodes: GraphNode[]; edges: GraphEdge[] }",
      argumentMapping: ["nodes <- $.nodes", "edges <- $.edges"],
      mutation: "Mutates only internal in-degree counts.",
      returnBehavior: "Returns Kahn order, or an empty list for a cycle.",
    },
  }),
  defineDsaExecution({
    id: "kosaraju-scc",
    entrypoint: "kosaraju_scc",
    invocation: { kind: "function", arguments: [input("n"), input("edges")] },
    cases: cases(
      {
        label: "Cycle with a tail",
        input: {
          n: 5,
          edges: [
            [0, 1],
            [1, 2],
            [2, 0],
            [1, 3],
            [3, 4],
          ],
        },
        expected: [[0, 2, 1], [3], [4]],
        comparison: "unordered",
      },
      {
        label: "Single component",
        input: { n: 1, edges: [] },
        expected: [[0]],
        comparison: "unordered",
      },
      {
        label: "Three chained components",
        input: {
          n: 6,
          edges: [
            [0, 1],
            [1, 0],
            [1, 2],
            [2, 3],
            [3, 2],
            [3, 4],
            [4, 5],
            [5, 4],
          ],
        },
        expected: [
          [0, 1],
          [2, 3],
          [4, 5],
        ],
        comparison: "unordered",
      },
    ),
    audit: {
      signature: "kosaraju_scc(n, edges) -> list[list[int]]",
      defaultInputShape: "{ numNodes: number; edges: Array<[number, number]> }",
      argumentMapping: ["n <- $.n", "edges <- $.edges"],
      mutation: "Mutates internal visitation, finish-order, and component lists.",
      returnBehavior: "Returns strongly connected components in second-pass discovery order.",
    },
  }),
  defineDsaExecution({
    id: "hierholzer-eulerian-path",
    entrypoint: "hierholzer",
    invocation: { kind: "function", arguments: [input("nodes"), input("edges")] },
    cases: cases(
      {
        label: "Directed cycle",
        input: {
          nodes: ["A", "B", "C"],
          edges: [
            ["A", "B"],
            ["B", "C"],
            ["C", "A"],
          ],
        },
        expected: ["A", "B", "C", "A"],
      },
      { label: "Isolated node", input: { nodes: ["A"], edges: [] }, expected: ["A"] },
      {
        label: "Unique open Euler trail",
        input: {
          nodes: ["A", "B", "C", "D"],
          edges: [
            ["A", "B"],
            ["B", "C"],
            ["C", "D"],
          ],
        },
        expected: ["A", "B", "C", "D"],
      },
    ),
    audit: {
      signature: "hierholzer(nodes, edges) -> list[node]",
      defaultInputShape: "{ nodes: GraphNode[]; edges: GraphEdge[] }",
      argumentMapping: ["nodes <- $.nodes", "edges <- $.edges"],
      mutation: "Consumes internal adjacency stacks.",
      returnBehavior:
        "Returns the directed Euler trail/circuit selected by reverse edge insertion.",
    },
  }),
  defineDsaExecution({
    id: "de-bruijn-sequence",
    entrypoint: "de_bruijn",
    invocation: { kind: "function", arguments: [input("k"), input("n")] },
    cases: cases(
      { label: "Binary pairs", input: { k: 2, n: 2 }, expected: "01100" },
      { label: "Unary symbols", input: { k: 1, n: 1 }, expected: "0" },
      { label: "Binary triples", input: { k: 2, n: 3 }, expected: "0011101000" },
    ),
    audit: {
      signature: "de_bruijn(k, n) -> str",
      defaultInputShape: "{ alphabetSize: number; subsequenceLength: number }",
      argumentMapping: ["k <- $.k", "n <- $.n"],
      mutation: "Consumes internal de Bruijn adjacency lists.",
      returnBehavior: "Returns a linearized sequence containing every length-n word.",
    },
  }),
  defineDsaExecution({
    id: "two-sat-solver",
    entrypoint: "solve_2sat",
    invocation: { kind: "function", arguments: [input("variables"), input("clauses")] },
    cases: cases(
      {
        label: "Forced true literal",
        input: { variables: ["x"], clauses: [["x", "x"]] },
        expected: [true, { x: true }],
      },
      {
        label: "Contradictory unit clauses",
        input: {
          variables: ["x"],
          clauses: [
            ["x", "x"],
            ["~x", "~x"],
          ],
        },
        expected: [false, {}],
      },
      {
        label: "Two forced literals",
        input: {
          variables: ["x", "y"],
          clauses: [
            ["x", "x"],
            ["~y", "~y"],
          ],
        },
        expected: [true, { x: true, y: false }],
      },
    ),
    audit: {
      signature: "solve_2sat(variables, clauses) -> tuple[bool, dict[str, bool]]",
      defaultInputShape: "{ variables: string[]; clauses: Array<[string, string]> }",
      argumentMapping: ["variables <- $.variables", "clauses <- $.clauses"],
      mutation: "Builds and traverses an internal implication graph.",
      returnBehavior: "Returns satisfiability and one SCC-derived assignment.",
    },
  }),
  defineDsaExecution({
    id: "successor-paths",
    entrypoint: "successor_paths",
    invocation: {
      kind: "function",
      arguments: [input("successor"), input("start"), input("steps")],
    },
    cases: cases(
      {
        label: "Tail into two-cycle",
        input: { successor: { A: "B", B: "C", C: "B" }, start: "A", steps: 4 },
        expected: ["B", 2, "C"],
      },
      {
        label: "Self cycle with zero steps",
        input: { successor: { A: "A" }, start: "A", steps: 0 },
        expected: ["A", 1, "A"],
      },
      {
        label: "Long walk into three-cycle",
        input: {
          successor: { A: "B", B: "C", C: "D", D: "B" },
          start: "A",
          steps: 10,
        },
        expected: ["B", 3, "B"],
      },
    ),
    audit: {
      signature: "successor_paths(succ, start_node, k_steps) -> tuple[node, int, node]",
      defaultInputShape:
        "{ nodes: string[]; successors: Record<string, string>; startNode: string; steps: number }",
      argumentMapping: ["succ <- $.successor", "start_node <- $.start", "k_steps <- $.steps"],
      mutation: "No input mutation.",
      returnBehavior: "Returns cycle entry, cycle length, and kth successor.",
    },
  }),
  defineDsaExecution({
    id: "dag-dp-longest-path",
    entrypoint: "dag_longest_path",
    invocation: { kind: "function", arguments: [input("nodes"), input("edges")] },
    cases: cases(
      {
        label: "Weighted branch",
        input: {
          nodes: ["A", "B", "C"],
          edges: [
            ["A", "B", 2],
            ["A", "C", 1],
            ["B", "C", 3],
          ],
        },
        expected: [5, ["A", "B", "C"]],
      },
      { label: "Single DAG node", input: { nodes: ["A"], edges: [] }, expected: [0, ["A"]] },
      {
        label: "Parallel routes",
        input: {
          nodes: ["A", "B", "C", "D"],
          edges: [
            ["A", "B", 5],
            ["A", "C", 3],
            ["B", "D", 6],
            ["C", "D", 10],
          ],
        },
        expected: [13, ["A", "C", "D"]],
      },
    ),
    audit: {
      signature: "dag_longest_path(nodes, edges) -> tuple[number, list[node]]",
      defaultInputShape: "{ nodes: GraphNode[]; edges: WeightedGraphEdge[] }",
      argumentMapping: ["nodes <- $.nodes", "edges <- $.edges"],
      mutation: "Mutates internal in-degree, distance, and parent maps.",
      returnBehavior: "Returns maximum DAG path weight and reconstructed node path.",
    },
  }),
] as const;
