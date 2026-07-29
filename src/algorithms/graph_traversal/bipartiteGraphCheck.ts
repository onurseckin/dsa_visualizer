import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

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

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "A Bipartite Graph is an undirected graph whose vertices can be partitioned into two disjoint sets U and W such that every edge connects a vertex in U to a vertex in W.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "A", label: "Set U (A)", state: "active" },
        { id: "B", label: "Set W (B)", state: "visited" },
        { id: "C", label: "Set U (C)", state: "active" },
        { id: "D", label: "Set W (D)", state: "visited" },
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "D" },
        { from: "D", to: "A" },
      ],
    },
  },
  {
    narrative:
      "2-Colorability Theorem: A graph is bipartite if and only if its vertices can be colored using 2 colors such that no adjacent vertices share the same color.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "A", label: "Color 0", state: "active" },
        { id: "B", label: "Color 1", state: "visited" },
        { id: "C", label: "Color 0", state: "active" },
        { id: "D", label: "Color 1", state: "visited" },
      ],
      edges: [
        { from: "A", to: "B", isTraversed: true },
        { from: "B", to: "C", isTraversed: true },
        { from: "C", to: "D", isTraversed: true },
        { from: "D", to: "A", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Odd Cycle Property: A graph is bipartite if and only if it contains no odd-length cycles. Even cycles (like 4-cycles) are 2-colorable.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "A", label: "A (Even 4-Cycle)", state: "sorted" },
        { id: "B", label: "B", state: "sorted" },
        { id: "C", label: "C", state: "sorted" },
        { id: "D", label: "D", state: "sorted" },
      ],
      edges: [
        { from: "A", to: "B", isPath: true },
        { from: "B", to: "C", isPath: true },
        { from: "C", to: "D", isPath: true },
        { from: "D", to: "A", isPath: true },
      ],
    },
  },
  {
    narrative:
      "BFS 2-Coloring Traversal: A Breadth-First Search queue is used to assign alternating colors level by level across all vertices.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "A", label: "BFS Root A", state: "active" },
        { id: "B", label: "Level 1 B", state: "compare" },
        { id: "C", label: "Level 1 C", state: "compare" },
        { id: "D", label: "Level 2 D", state: "default" },
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
      ],
    },
  },
  {
    narrative:
      "For each connected component, assign initial Color 0 to the component root node and enqueue it for exploration.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "A", label: "Color 0", state: "active" },
        { id: "B", label: "Uncolored", state: "default" },
        { id: "C", label: "Uncolored", state: "default" },
        { id: "D", label: "Uncolored", state: "default" },
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
      ],
    },
  },
  {
    narrative:
      "Alternating Color Propagation: When traversing an edge (u, v), if neighbor v is uncolored, assign it the opposite color (1 - color[u]).",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "A", label: "Color 0", state: "visited" },
        { id: "B", label: "Color 1", state: "swap" },
        { id: "C", label: "Color 1", state: "swap" },
        { id: "D", label: "Uncolored", state: "default" },
      ],
      edges: [
        { from: "A", to: "B", isPath: true },
        { from: "A", to: "C", isPath: true },
        { from: "B", to: "D" },
      ],
    },
  },
  {
    narrative:
      "Color Collision Detection: If neighbor v is already colored and shares the same color as u (color[v] == color[u]), an odd cycle conflict exists.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "A", label: "Color 0", state: "visited" },
        { id: "B", label: "Color 1 (Conflict)", state: "swap" },
        { id: "C", label: "Color 1 (Conflict)", state: "swap" },
      ],
      edges: [
        { from: "A", to: "B", isPath: true },
        { from: "A", to: "C", isPath: true },
        { from: "B", to: "C", isPath: true },
      ],
    },
  },
  {
    narrative:
      "Component Sweeping: Outer iteration ensures all disconnected components are independently tested for 2-colorability.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "Comp 1", label: "Comp 1 (Bipartite)", state: "sorted" },
        { id: "Comp 2", label: "Comp 2 (Bipartite)", state: "sorted" },
      ],
      edges: [],
    },
  },
  {
    narrative:
      "BFS 2-coloring validates bipartiteness across all vertices and edges in linear O(V + E) time and O(V) auxiliary space.",
    primarySnapshot: {
      kind: "graph",
      directed: false,
      nodes: [
        { id: "A", label: "Set 0", state: "sorted" },
        { id: "B", label: "Set 1", state: "sorted" },
        { id: "C", label: "Set 0", state: "sorted" },
        { id: "D", label: "Set 1", state: "sorted" },
      ],
      edges: [
        { from: "A", to: "B", isPath: true },
        { from: "B", to: "C", isPath: true },
        { from: "C", to: "D", isPath: true },
        { from: "D", to: "A", isPath: true },
      ],
    },
  },
];

export function generateBipartiteCheckSteps(input: BipartiteGraphCheckInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  // Intro Phase (9 snapshots)
  const intro = createIntroSnapshots();
  for (const item of intro) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "intro",
        narrative: item.narrative,
        primarySnapshot: item.primarySnapshot,
      }),
    );
  }

  // Walkthrough Phase
  const safeInput = input && typeof input === "object" ? input : DEFAULT_BIPARTITE_INPUT;
  const inputNodes =
    Array.isArray(safeInput.nodes) && safeInput.nodes.length > 0
      ? safeInput.nodes
      : DEFAULT_BIPARTITE_INPUT.nodes;
  const inputEdges = Array.isArray(safeInput.edges)
    ? safeInput.edges
    : DEFAULT_BIPARTITE_INPUT.edges;

  const nodes = inputNodes.map((n) => ({ ...n }));
  const edges = inputEdges.map((e) => ({ ...e }));

  const adj: Record<string, string[]> = {};
  for (const n of nodes) {
    adj[n.id] = [];
  }
  for (const e of edges) {
    adj[e.from].push(e.to);
    adj[e.to].push(e.from);
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Initialized Bipartite Graph Check for ${nodes.length} vertices and ${edges.length} undirected edges.`,
      primarySnapshot: {
        kind: "graph",
        directed: false,
        nodes: nodes.map((n) => ({ ...n, state: "active" })),
        edges: [...edges],
      },
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { totalNodes: nodes.length, totalEdges: edges.length },
    }),
  );

  const color: Record<string, number> = {};
  let isBipartite = true;

  for (const startNode of nodes) {
    if (color[startNode.id] === undefined) {
      color[startNode.id] = 0;
      const queue: string[] = [startNode.id];

      steps.push(
        createTutorialStep({
          stepIndex: stepIdx++,
          phase: "walkthrough",
          narrative: `Initiated 2-coloring for new connected component at root vertex '${startNode.id}' (assigned Color 0).`,
          primarySnapshot: {
            kind: "graph",
            directed: false,
            nodes: nodes.map((n) => ({
              ...n,
              group: color[n.id],
              state: n.id === startNode.id ? "compare" : "default",
            })),
            edges: [...edges],
          },
          auxiliaryState: {
            stack: [...queue],
            visited: [startNode.id],
          },
          variables: { startNode: startNode.id, initialColor: 0 },
        }),
      );

      while (queue.length > 0) {
        const u = queue.shift()!;

        steps.push(
          createTutorialStep({
            stepIndex: stepIdx++,
            phase: "walkthrough",
            narrative: `Dequeued vertex '${u}' (Color ${color[u]}): inspecting adjacent neighbors.`,
            primarySnapshot: {
              kind: "graph",
              directed: false,
              nodes: nodes.map((n) => ({
                ...n,
                group: color[n.id],
                state: n.id === u ? "active" : "default",
              })),
              edges: [...edges],
            },
            auxiliaryState: {
              stack: [...queue],
              visited: Object.keys(color),
            },
            variables: { u, colorU: color[u] },
          }),
        );

        for (const v of adj[u] || []) {
          if (color[v] === undefined) {
            color[v] = 1 - color[u];
            queue.push(v);

            steps.push(
              createTutorialStep({
                stepIndex: stepIdx++,
                phase: "walkthrough",
                narrative: `Colored neighbor vertex '${v}' with Color ${color[v]} (opposite of vertex '${u}': Color ${color[u]}). Pushed '${v}' to BFS queue.`,
                primarySnapshot: {
                  kind: "graph",
                  directed: false,
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
                  stack: [...queue],
                  visited: Object.keys(color),
                },
                variables: { node: u, neighbor: v, color: color[v] },
              }),
            );
          } else if (color[v] === color[u]) {
            isBipartite = false;

            steps.push(
              createTutorialStep({
                stepIndex: stepIdx++,
                phase: "walkthrough",
                narrative: `Same-color conflict detected on edge (${u} -- ${v})! Both vertices share Color ${color[u]}. Graph contains an odd cycle and is NOT BIPARTITE.`,
                primarySnapshot: {
                  kind: "graph",
                  directed: false,
                  nodes: nodes.map((n) => ({
                    ...n,
                    group: color[n.id],
                    state: n.id === u || n.id === v ? "swap" : "default",
                  })),
                  edges: edges.map((e) => ({
                    ...e,
                    isPath: (e.from === u && e.to === v) || (e.from === v && e.to === u),
                  })),
                },
                auxiliaryState: {
                  stack: [],
                  visited: Object.keys(color),
                },
                variables: { isBipartite: false, conflictU: u, conflictV: v },
              }),
            );
            break;
          } else {
            steps.push(
              createTutorialStep({
                stepIndex: stepIdx++,
                phase: "walkthrough",
                narrative: `Inspected edge (${u} -- ${v}): neighbor '${v}' already has opposite Color ${color[v]}. No conflict.`,
                primarySnapshot: {
                  kind: "graph",
                  directed: false,
                  nodes: nodes.map((n) => ({
                    ...n,
                    group: color[n.id],
                    state: n.id === v ? "visited" : n.id === u ? "active" : "default",
                  })),
                  edges: edges.map((e) => ({
                    ...e,
                    isTraversed: (e.from === u && e.to === v) || (e.from === v && e.to === u),
                  })),
                },
                auxiliaryState: {
                  stack: [...queue],
                  visited: Object.keys(color),
                },
                variables: { u, v, validColor: true },
              }),
            );
          }
        }

        if (!isBipartite) break;
      }
    }
    if (!isBipartite) break;
  }

  if (isBipartite) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative:
          "Graph is BIPARTITE! Successfully 2-colored all vertices with zero conflicts (no odd-length cycles).",
        primarySnapshot: {
          kind: "graph",
          directed: false,
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
          stack: [],
          visited: Object.keys(color),
        },
        variables: { isBipartite: true },
      }),
    );
  }

  return steps;
}

export const BIPARTITE_CHECK_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Imports deque for BFS queue.",
    3: "Defines 2-coloring bipartite graph validation algorithm.",
    4: "Initializes color assignment map.",
    5: "Sweeps every vertex to cover disconnected components.",
    6: "Checks if current vertex is uncolored.",
    7: "Assigns color 0 to root node of new component.",
    8: "Initializes BFS queue.",
    9: "Loops while queue is non-empty.",
    10: "Pops next vertex u.",
    11: "Scans adjacent neighbors v.",
    12: "Checks if neighbor v is uncolored.",
    13: "Assigns opposite color (1 - color[u]).",
    14: "Pushes neighbor v to queue.",
    15: "Detects color collision when adjacent nodes share same color.",
    16: "Returns False immediately when conflict is discovered.",
    17: "Returns True when graph is 2-colorable.",
  },
};

export const bipartiteGraphCheck: AlgorithmDefinition<BipartiteGraphCheckInput> = {
  id: "bipartite-graph-check",
  title: "Bipartite Graph Check (2-Coloring)",
  topicIds: ["graph_traversal"],
  difficulty: "Medium",
  description:
    "<p>Given an undirected graph <code>G = (V, E)</code>, determine whether the graph is bipartite (2-colorable).</p><h3>Problem Statement</h3><p>Assign binary colors <code>{0, 1}</code> to vertices via BFS level-by-level traversal such that no adjacent vertices share the same color. If an edge connects two vertices of the same color, an odd-length cycle exists and the graph is not bipartite. Return true if 2-colorable, false otherwise.</p><h3>Input Parameters</h3><ul><li><code>nodes</code>: List of graph vertices.</li><li><code>edges</code>: List of undirected edges.</li></ul><h3>Output</h3><p>Returns boolean true if the graph is bipartite, false otherwise.</p>",
  constraints: [
    "1 <= V <= 1000",
    "0 <= E <= 5000",
    "Graph is undirected and may contain multiple disconnected components",
    "Self-loops automatically render a graph non-bipartite",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "nodes = [A, B, C, D], edges = 4-cycle (A-B-C-D-A)",
      outputDisplay: "BIPARTITE (Set 0: [A, C], Set 1: [B, D])",
      title: "Standard Even 4-Cycle Bipartite Graph",
      input: DEFAULT_BIPARTITE_INPUT,
      output: "BIPARTITE: Set 0 = [A, C], Set 1 = [B, D]",
      explanation: "Even length cycles are 2-colorable.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "nodes = [1, 2, 3, 4, 5, 6], tree edges",
      outputDisplay: "BIPARTITE",
      title: "Adversarial Tree Structure (Always Bipartite)",
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
      scenario: "boundary",
      inputDisplay: "nodes = [A, B, C], edges = 3-cycle triangle (A-B-C-A)",
      outputDisplay: "NOT BIPARTITE (Odd Cycle Detected)",
      title: "Boundary Triangle Graph (Odd Cycle Conflict)",
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
    time: "Each vertex and edge in graph G = (V, E) is inspected once during BFS 2-coloring, taking O(V + E) total time.",
    space: "The color assignment map and BFS queue store at most V items, taking O(V) space.",
  },
  topicGuide: {
    overview:
      "<p>A graph <code>G = (V, E)</code> is bipartite if and only if it is 2-colorable. This property is equivalent to <code>G</code> containing no odd-length cycles. Bipartite verification is the foundation for Hopcroft-Karp maximum matching and network flow bipartite assignment problems.</p>",
    sections: [
      {
        heading: "Core Concept: 2-Coloring & Odd Cycle Theorem",
        body: "<p>Assigning <code>c(u) &in; {0, 1}</code> and assigning <code>c(v) = 1 - c(u)</code> across every edge <code>(u, v)</code> creates an alternating parity. If any edge discovers <code>c(u) = c(v)</code>, a cycle of odd length is proven to exist (<code>c(v) = c(u) &hArr; G contains an odd cycle</code>), proving <code>G</code> is not bipartite.</p>",
      },
      {
        heading: "Applications in Systems & Compilers",
        body: "<p>Bipartite graph testing is used in register allocation interference graph testing, task-processor bipartite scheduling, and recommendation engine user-item graphs.</p>",
      },
      {
        heading: "Component Sweeping",
        body: "<p>Graphs can contain disconnected components. We sweep all vertices in an outer loop, initiating 2-coloring whenever an uncolored vertex is found.</p>",
      },
      {
        heading: "Complexity Analysis",
        body: "<p><strong>Time Complexity:</strong> <code>O(V + E)</code><br/><strong>Space Complexity:</strong> <code>O(V)</code><br/>Each vertex and edge in graph G = (V, E) is inspected once during BFS 2-coloring, taking O(V + E) total time.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Bipartite Graph",
        definition:
          "A graph whose vertices can be partitioned into two independent sets with no intra-set edges.",
      },
      {
        term: "2-Coloring",
        definition: "Assigning binary colors {0, 1} such that c(u) != c(v) for all (u,v) in E.",
      },
      {
        term: "Odd Cycle",
        definition: "A cycle with an odd number of edges, which violates 2-colorability.",
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

export default bipartiteGraphCheck;
