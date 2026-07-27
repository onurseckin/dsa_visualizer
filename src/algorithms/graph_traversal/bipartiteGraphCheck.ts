import type { AlgorithmDefinition, AlgorithmStep, GraphEdgeItem, GraphNodeItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface BipartiteGraphCheckInput {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export const BIPARTITE_CHECK_CODE = `def is_bipartite(nodes, edges):
    adj = {u: [] for u in nodes}
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)

    color = {}  # 0 or 1
    for start in nodes:
        if start not in color:
            color[start] = 0
            queue = [start]
            while queue:
                u = queue.pop(0)
                for v in adj[u]:
                    if v not in color:
                        color[v] = 1 - color[u]
                        queue.append(v)
                    elif color[v] == color[u]:
                        return False, {}  # Conflict: Odd cycle detected

    return True, color`;

export const BIPARTITE_CHECK_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4],
  distractors: [
    "color[v] = color[u]",
    "if color[v] != color[u]: return False",
    "queue.pop()",
    "color[start] = 1",
  ],
  hints: [
    {
      line: 7,
      hint: "Stores assigned vertex colors (0 or 1) in a map/dictionary.",
    },
    {
      line: 16,
      hint: "Assign opposite color (1 - color[u]) to unvisited neighbors.",
    },
    {
      line: 18,
      hint: "If a neighbor already shares the same color, an odd-length cycle exists, breaking 2-colorability.",
    },
    {
      line: 21,
      hint: "If all connected components are 2-colored without conflict, the graph is bipartite.",
    },
  ],
  lineExplanations: {
    1: "Defines 2-coloring bipartite graph validation algorithm.",
    7: "Initializes color assignment table.",
    11: "Runs BFS/DFS traversal over each connected component.",
    16: "Assigns opposite color (1 - color[u]) to neighboring vertices.",
    18: "Detects color collision indicating an odd-length cycle.",
    21: "Confirms graph is 2-colorable (bipartite).",
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
    codeLine: 1,
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
        codeLine: 10,
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
          customState: { Colors: Object.entries(color).map(([k, v]) => `${k}:${v}`).join(", ") },
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
              codeLine: 16,
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
                customState: { Colors: Object.entries(color).map(([k, v]) => `${k}:${v}`).join(", ") },
              },
              variables: { node: u, neighbor: v, color: color[v] },
            });
          } else if (color[v] === color[u]) {
            isBipartite = false;

            steps.push({
              stepIndex: stepIdx++,
              codeLine: 18,
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
      codeLine: 21,
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
          Set_0: nodes.filter((n) => color[n.id] === 0).map((n) => n.id).join(", "),
          Set_1: nodes.filter((n) => color[n.id] === 1).map((n) => n.id).join(", "),
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
  difficulty: "Medium",
  description:
    "Determines whether an undirected graph is bipartite (2-colorable) in linear O(V + E) time using BFS/DFS. A graph is bipartite if its vertices can be divided into two disjoint sets such that no two vertices within the same set are adjacent (i.e. contains no odd cycles).",
  constraints: [
    "1 <= V <= 1000",
    "0 <= E <= 5000",
    "Graph is undirected",
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
      "A bipartite graph (or 2-colorable graph) can be partitioned into two independent sets U and V such that every edge joins a vertex in U to a vertex in V. Bipartite testing checks for the existence of odd-length cycles.",
    sections: [
      {
        heading: "2-Coloring Criterion",
        body: "By assigning color 0 to an arbitrary start node and propagating color 1 - c to adjacent neighbors, any edge connecting two nodes of the same color proves the presence of an odd cycle.",
      },
      {
        heading: "Applications",
        body: "Bipartite graphs model matching problems (job assignment, stable marriage, network flows) and schedule conflict detection.",
      },
    ],
    keyTerms: [
      { term: "Bipartite Graph", definition: "A graph whose vertices can be partitioned into two independent sets." },
      { term: "2-Coloring", definition: "Coloring vertices with 2 colors such that no two adjacent vertices share the same color." },
      { term: "Odd Cycle", definition: "A cycle with an odd number of edges, which destroys 2-colorability." },
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

export default bipartiteGraphCheck;
