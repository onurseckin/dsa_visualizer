import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface BipartiteGraphCheckInput {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export const BIPARTITE_CHECK_CODE = `from collections import deque

def is_bipartite(graph):
    color = {}
    for node in graph:
        if node not in color:
            color[node] = 0
            queue = deque([node])
            while queue:
                u = queue.popleft()
                for v in graph[u]:
                    if v not in color:
                        color[v] = 1 - color[u]
                        queue.append(v)
                    elif color[v] == color[u]:
                        return False
    return True`;

export const BIPARTITE_CHECK_TRIVIA: TriviaMeta = {
  skipLines: [1, 2],
  distractors: [
    "color[v] = color[u]",
    "if color[v] != color[u]: return False",
    "queue.pop()",
    "color[start] = 1",
  ],
  hints: [
    {
      line: 4,
      hint: "Stores assigned vertex colors (0 or 1) in a map/dictionary.",
    },
    {
      line: 13,
      hint: "Assign opposite color (1 - color[u]) to unvisited neighbors.",
    },
    {
      line: 15,
      hint: "If a neighbor already shares the same color, an odd-length cycle exists, breaking 2-colorability.",
    },
    {
      line: 17,
      hint: "If all connected components are 2-colored without conflict, the graph is bipartite.",
    },
  ],
  lineExplanations: {
    1: "Imports deque for efficient O(1) queue operations during BFS traversal.",
    3: "Defines 2-coloring bipartite graph validation algorithm accepting an adjacency list.",
    4: "Initializes color assignment dictionary mapping node IDs to color 0 or 1.",
    5: "Sweeps every vertex in the graph to ensure all disconnected components are checked.",
    7: "Assigns initial color 0 to unvisited root of a new connected component.",
    8: "Initializes BFS queue with the component root node.",
    10: "Pops next vertex u from the front of the queue.",
    11: "Scans each neighbor v adjacent to node u.",
    13: "Assigns opposite color (1 - color[u]) to unvisited neighbor v.",
    15: "Detects color collision when adjacent nodes share identical color.",
    16: "Returns False immediately when an odd-length cycle conflict is discovered.",
    17: "Confirms graph is 2-colorable (bipartite) after all components pass without conflict.",
  },
};

export const DEFAULT_BIPARTITE_INPUT: BipartiteGraphCheckInput = {
  nodes: [
    { id: "A", label: "A", x: 150, y: 100, state: "default" },
    { id: "B", label: "B", x: 350, y: 100, state: "default" },
    { id: "C", label: "C", x: 350, y: 250, state: "default" },
    { id: "D", label: "D", x: 150, y: 250, state: "default" },
  ],
  edges: [
    { from: "A", to: "B" },
    { from: "B", to: "C" },
    { from: "C", to: "D" },
    { from: "D", to: "A" },
  ],
};

export function generateBipartiteCheckSteps(input: BipartiteGraphCheckInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const nodes = input.nodes.map((n) => ({ ...n }));
  const edges = input.edges.map((e) => ({ ...e }));

  const adj: Record<string, string[]> = {};
  for (const n of nodes) {
    adj[n.id] = [];
  }
  for (const e of edges) {
    adj[e.from].push(e.to);
    adj[e.to].push(e.from);
  }

  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 3,
    explanation: {
      what: "Initialized Bipartite Graph 2-Coloring Check.",
      why: "A graph is bipartite if its nodes can be colored using 2 colors (Group 0 & Group 1) with no adjacent nodes sharing a color.",
    },
    primarySnapshot: { kind: "graph", nodes: [...nodes], edges: [...edges] },
    auxiliaryState: {
      visited: [],
      customState: { Colors: "{}" },
    },
    variables: { totalNodes: nodes.length, totalEdges: edges.length },
  });

  const color: Record<string, number> = {};
  let isBipartite = true;

  for (const startNode of nodes) {
    if (color[startNode.id] === undefined) {
      color[startNode.id] = 0;
      const queue: string[] = [startNode.id];

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 7,
        explanation: {
          what: `Started 2-coloring component from node "${startNode.id}" (assigned Color 0).`,
          why: "Uncolored component root assigned initial color 0.",
        },
        primarySnapshot: {
          kind: "graph",
          nodes: nodes.map((n) => ({
            ...n,
            group: color[n.id],
            state: n.id === startNode.id ? "active" : "default",
          })),
          edges: [...edges],
        },
        auxiliaryState: {
          queue: [...queue],
          customState: {
            Colors: Object.entries(color)
              .map(([k, v]) => `${k}:${v}`)
              .join(", "),
          },
        },
        variables: { startNode: startNode.id, initialColor: 0 },
      });

      while (queue.length > 0) {
        const u = queue.shift()!;

        for (const v of adj[u] || []) {
          if (color[v] === undefined) {
            color[v] = 1 - color[u];
            queue.push(v);

            steps.push({
              stepIndex: stepIdx++,
              codeLine: 13,
              explanation: {
                what: `Colored neighbor "${v}" with Color ${color[v]} (opposite of "${u}": ${color[u]}).`,
                why: "Adjacent nodes in a bipartite graph must have opposite colors.",
              },
              primarySnapshot: {
                kind: "graph",
                nodes: nodes.map((n) => ({
                  ...n,
                  group: color[n.id],
                  state: n.id === v ? "swap" : n.id === u ? "active" : "default",
                })),
                edges: edges.map((e) => ({
                  ...e,
                  isPath: (e.from === u && e.to === v) || (e.from === v && e.to === u),
                })),
              },
              auxiliaryState: {
                queue: [...queue],
                customState: {
                  Colors: Object.entries(color)
                    .map(([k, v]) => `${k}:${v}`)
                    .join(", "),
                },
              },
              variables: { node: u, neighbor: v, color: color[v] },
            });
          } else if (color[v] === color[u]) {
            isBipartite = false;

            steps.push({
              stepIndex: stepIdx++,
              codeLine: 15,
              explanation: {
                what: `Conflict detected on edge ${u} -- ${v}! Both nodes share Color ${color[u]}.`,
                why: "An odd-length cycle prevents 2-coloring. Graph is NOT bipartite.",
              },
              primarySnapshot: {
                kind: "graph",
                nodes: nodes.map((n) => ({
                  ...n,
                  group: color[n.id],
                  state: n.id === u || n.id === v ? "pivot" : "default",
                })),
                edges: edges.map((e) => ({
                  ...e,
                  isPath: (e.from === u && e.to === v) || (e.from === v && e.to === u),
                })),
              },
              auxiliaryState: {
                customState: {
                  Result: "NOT BIPARTITE",
                  Conflict: `${u} -- ${v} (both Color ${color[u]})`,
                },
              },
              variables: { isBipartite: false, conflictU: u, conflictV: v },
            });
            break;
          }
        }

        if (!isBipartite) break;
      }
    }
    if (!isBipartite) break;
  }

  if (isBipartite) {
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 17,
      explanation: {
        what: "Graph is BIPARTITE! Successfully 2-colored all vertices with zero conflicts.",
        why: "No odd-length cycles exist in the graph.",
      },
      primarySnapshot: {
        kind: "graph",
        nodes: nodes.map((n) => ({
          ...n,
          group: color[n.id],
          state: "sorted",
        })),
        edges: edges.map((e) => ({
          ...e,
          isTraversed: true,
        })),
      },
      auxiliaryState: {
        customState: {
          Result: "BIPARTITE (2-Colorable)",
          Set_0: nodes
            .filter((n) => color[n.id] === 0)
            .map((n) => n.id)
            .join(", "),
          Set_1: nodes
            .filter((n) => color[n.id] === 1)
            .map((n) => n.id)
            .join(", "),
        },
      },
      variables: { isBipartite: true },
    });
  }

  return steps;
}

export const bipartiteGraphCheck: AlgorithmDefinition<BipartiteGraphCheckInput> = {
  id: "bipartite-graph-check",
  title: "Bipartite Graph Check (2-Coloring)",
  category: "graph_traversal",
  categories: ["graph_traversal"],
  difficulty: "Medium",
  description:
    "Determines whether an undirected graph is bipartite (2-colorable). Given an undirected graph with V vertices and E edges, return whether the vertices can be partitioned into two independent sets U and V such that every edge connects a vertex in U to a vertex in V (no edges exist between vertices within the same set). Equivalently, a graph is bipartite if and only if it contains no odd-length cycles. Perform a 2-coloring traversal (using BFS or DFS) across all connected components, assigning alternate colors (0 and 1) to adjacent vertices. If any edge connects two vertices assigned the exact same color, return false; otherwise, return true.",
  constraints: [
    "1 <= V <= 1000",
    "0 <= E <= 5000",
    "Graph is undirected and may contain multiple disconnected components",
    "Self-loops automatically render a graph non-bipartite",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nodes = [A, B, C, D], edges = 4-cycle (A-B-C-D-A)",
      outputDisplay: "BIPARTITE (Set 0: [A, C], Set 1: [B, D])",
      title: "Even 4-Cycle Bipartite Graph",
      input: DEFAULT_BIPARTITE_INPUT,
      output: "BIPARTITE: Set 0 = [A, C], Set 1 = [B, D]",
      explanation: "Even length cycles are 2-colorable.",
    },
    {
      kind: "complex",
      inputDisplay: "nodes = [1, 2, 3, 4, 5, 6], tree edges",
      outputDisplay: "BIPARTITE",
      title: "Tree Structure (Always Bipartite)",
      input: {
        nodes: [
          { id: "1", label: "1", x: 250, y: 50, state: "default" },
          { id: "2", label: "2", x: 150, y: 150, state: "default" },
          { id: "3", label: "3", x: 350, y: 150, state: "default" },
          { id: "4", label: "4", x: 100, y: 250, state: "default" },
          { id: "5", label: "5", x: 200, y: 250, state: "default" },
          { id: "6", label: "6", x: 350, y: 250, state: "default" },
        ],
        edges: [
          { from: "1", to: "2" },
          { from: "1", to: "3" },
          { from: "2", to: "4" },
          { from: "2", to: "5" },
          { from: "3", to: "6" },
        ],
      },
      output: "BIPARTITE",
      explanation: "All trees are bipartite because they contain zero cycles.",
    },
    {
      kind: "negative",
      inputDisplay: "nodes = [A, B, C], edges = 3-cycle triangle (A-B-C-A)",
      outputDisplay: "NOT BIPARTITE (Odd Cycle Detected)",
      title: "Triangle Graph (Odd Cycle Conflict)",
      input: {
        nodes: [
          { id: "A", label: "A", x: 250, y: 80, state: "default" },
          { id: "B", label: "B", x: 150, y: 220, state: "default" },
          { id: "C", label: "C", x: 350, y: 220, state: "default" },
        ],
        edges: [
          { from: "A", to: "B" },
          { from: "B", to: "C" },
          { from: "C", to: "A" },
        ],
      },
      output: "NOT BIPARTITE",
      explanation: "Triangle has odd cycle length 3, making 2-coloring impossible.",
    },
  ],
  code: BIPARTITE_CHECK_CODE,
  timeComplexity: {
    best: "O(V + E)",
    average: "O(V + E)",
    worst: "O(V + E)",
  },
  spaceComplexity: "O(V)",
  complexityAnalysis: {
    time: "Each vertex and edge is visited at most once during 2-coloring BFS/DFS, yielding O(V + E) runtime.",
    space: "The color table and traversal queue/stack consume O(V) memory.",
  },
  topicGuide: {
    overview:
      "A bipartite graph (or 2-colorable graph) can be partitioned into two independent sets U and V such that every edge joins a vertex in U to a vertex in V. Bipartite testing checks for the structural absence of odd-length cycles. It forms the prerequisite step for maximum bipartite matching algorithms (Hopcroft-Karp, Ford-Fulkerson on augmented networks) and resource assignment problems.",
    sections: [
      {
        heading: "Core Concept: 2-Coloring & Parity Invariants",
        body: "By assigning color 0 to an arbitrary starting node and propagating color 1 - c to all adjacent neighbors, we establish an alternating parity along every path. If a neighbor has already been assigned a color and that color equals the current node's color, an edge exists between two nodes in the same partition — proving the existence of an odd cycle.",
      },
      {
        heading: "Systems & Practical Applications",
        body: "Bipartite graph verification is used in compiler register allocation (interference graph partitioning), job scheduling (matching tasks to execution nodes), recommendation systems (user-item bipartite graphs), and error-correcting low-density parity-check (LDPC) codes.",
      },
      {
        heading: "Implementation Nuances & Component Sweeping",
        body: "Graphs may consist of multiple disconnected components. A single BFS/DFS from an arbitrary node only validates its connected component. The algorithm must maintain an outer loop iterating over all vertices v from 0 to V-1, launching a 2-coloring traversal whenever an uncolored vertex is encountered.",
      },
      {
        heading: "Edge Cases & Conflict Detection",
        body: "Graphs containing self-loops (an edge connecting vertex v to itself) fail immediately, as color[v] == color[v]. Isolated vertices with no edges are trivially bipartite. Trees and forest structures are always bipartite because they contain no cycles.",
      },
    ],
    keyTerms: [
      {
        term: "Bipartite Graph",
        definition:
          "A graph whose vertices can be partitioned into two disjoint sets such that every edge connects a vertex in one set to a vertex in the other.",
      },
      {
        term: "2-Coloring",
        definition:
          "Assigning one of two colors to each vertex such that no two adjacent vertices share the same color.",
      },
      {
        term: "Odd Cycle",
        definition:
          "A closed circuit with an odd number of edges (e.g. triangle of length 3, pentagon of length 5), which makes 2-coloring mathematically impossible.",
      },
      {
        term: "Independent Set",
        definition: "A set of vertices in a graph no two of which are adjacent to each other.",
      },
    ],
  },
  trivia: BIPARTITE_CHECK_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 12",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 12,
      section: "12.4 Bipartiteness check",
    },
  ],
  defaultInput: DEFAULT_BIPARTITE_INPUT,
  generateSteps: generateBipartiteCheckSteps,
};
