import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface DfsGraphInput {
  startNodeId?: string;
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export const DFS_GRAPH_CODE = `def dfs_graph(graph, start_node):
    visited = set()
    stack = [start_node]
    traversal = []
    
    while stack:
        curr = stack.pop()
        if curr not in visited:
            visited.add(curr)
            traversal.append(curr)
            for neighbor in graph[curr]:
                if neighbor not in visited:
                    stack.append(neighbor)
    return traversal`;

export const DEFAULT_DFS_GRAPH_INPUT: DfsGraphInput = {
  startNodeId: "A",
  nodes: [
    { id: "A", label: "A", x: 100, y: 150, state: "default" },
    { id: "B", label: "B", x: 230, y: 80, state: "default" },
    { id: "C", label: "C", x: 230, y: 220, state: "default" },
    { id: "D", label: "D", x: 360, y: 80, state: "default" },
    { id: "E", label: "E", x: 360, y: 220, state: "default" },
    { id: "F", label: "F", x: 490, y: 150, state: "default" },
  ],
  edges: [
    { from: "A", to: "B" },
    { from: "A", to: "C" },
    { from: "B", to: "D" },
    { from: "C", to: "E" },
    { from: "D", to: "F" },
    { from: "E", to: "F" },
  ],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Depth-First Search (DFS) is a graph traversal algorithm that explores as deep as possible along each path branch before backtracking.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A (Start)", state: "active" },
        { id: "B", label: "B", state: "default" },
        { id: "C", label: "C", state: "default" },
        { id: "D", label: "D", state: "default" },
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "D" },
        { from: "A", to: "C" },
      ],
    },
  },
  {
    narrative:
      "A Last-In-First-Out (LIFO) stack discipline prioritizes exploring the most recently discovered candidate vertices first.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A", state: "visited" },
        { id: "B", label: "B (Stack)", state: "visited" },
        { id: "D", label: "D (Stack Top)", state: "active" },
        { id: "C", label: "C", state: "default" },
      ],
      edges: [
        { from: "A", to: "B", isTraversed: true },
        { from: "B", to: "D", isTraversed: true },
        { from: "A", to: "C" },
      ],
    },
  },
  {
    narrative:
      "A Visited Set tracks explored vertices to prevent re-visiting nodes and break infinite loops on cyclic graphs.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A (Visited)", state: "visited" },
        { id: "B", label: "B (Visited)", state: "visited" },
        { id: "D", label: "D (Visited)", state: "visited" },
        { id: "C", label: "C", state: "default" },
      ],
      edges: [
        { from: "A", to: "B", isTraversed: true },
        { from: "B", to: "D", isTraversed: true },
        { from: "D", to: "A" },
        { from: "A", to: "C" },
      ],
    },
  },
  {
    narrative: "Traversal begins by pushing the starting vertex onto the LIFO stack.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "Start A", state: "compare" },
        { id: "B", label: "B", state: "default" },
        { id: "C", label: "C", state: "default" },
        { id: "D", label: "D", state: "default" },
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
      "Popping the top vertex from the stack explores deep into its unvisited outgoing neighbor branches.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A", state: "visited" },
        { id: "B", label: "Popped B", state: "active" },
        { id: "C", label: "C", state: "default" },
        { id: "D", label: "D", state: "default" },
      ],
      edges: [
        { from: "A", to: "B", isPath: true },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
      ],
    },
  },
  {
    narrative:
      "When a branch reaches a dead end or visited node, DFS backtracks to pop the next deepest vertex from the stack.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A", state: "visited" },
        { id: "B", label: "B", state: "visited" },
        { id: "D", label: "Dead End D", state: "swap" },
        { id: "C", label: "C (Next)", state: "compare" },
      ],
      edges: [
        { from: "A", to: "B", isTraversed: true },
        { from: "B", to: "D", isTraversed: true },
        { from: "A", to: "C" },
      ],
    },
  },
  {
    narrative:
      "DFS classifies graph edges into Tree Edges (path edges), Back Edges (cycles), Forward Edges, and Cross Edges.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A", state: "visited" },
        { id: "B", label: "B", state: "visited" },
        { id: "D", label: "D", state: "visited" },
        { id: "C", label: "C", state: "visited" },
      ],
      edges: [
        { from: "A", to: "B", isPath: true },
        { from: "B", to: "D", isPath: true },
        { from: "D", to: "A", isTraversed: true },
        { from: "A", to: "C", isPath: true },
      ],
    },
  },
  {
    narrative:
      "Recording discovery and finish timestamps for each vertex builds a well-formed DFS spanning tree structure.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A [1/8]", state: "sorted" },
        { id: "B", label: "B [2/5]", state: "sorted" },
        { id: "D", label: "D [3/4]", state: "sorted" },
        { id: "C", label: "C [6/7]", state: "sorted" },
      ],
      edges: [
        { from: "A", to: "B", isPath: true },
        { from: "B", to: "D", isPath: true },
        { from: "A", to: "C", isPath: true },
      ],
    },
  },
  {
    narrative:
      "DFS explores all reachable vertices and edges in linear O(V + E) time and O(V) auxiliary space.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A", state: "sorted" },
        { id: "B", label: "B", state: "sorted" },
        { id: "D", label: "D", state: "sorted" },
        { id: "C", label: "C", state: "sorted" },
      ],
      edges: [
        { from: "A", to: "B", isPath: true },
        { from: "B", to: "D", isPath: true },
        { from: "A", to: "C", isPath: true },
      ],
    },
  },
];

export function generateDfsGraphSteps(input: DfsGraphInput): AlgorithmStep[] {
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
  const safeInput = input && typeof input === "object" ? input : DEFAULT_DFS_GRAPH_INPUT;
  const inputNodes =
    Array.isArray(safeInput.nodes) && safeInput.nodes.length > 0
      ? safeInput.nodes
      : DEFAULT_DFS_GRAPH_INPUT.nodes;
  const inputEdges = Array.isArray(safeInput.edges)
    ? safeInput.edges
    : DEFAULT_DFS_GRAPH_INPUT.edges;

  const nodes = inputNodes.map((n) => ({ ...n }));
  const edges = inputEdges.map((e) => ({ ...e }));
  const startNode = safeInput.startNodeId || nodes[0]?.id || "A";

  const adj: Record<string, string[]> = {};
  for (const n of nodes) {
    adj[n.id] = [];
  }
  for (const e of edges) {
    adj[e.from].push(e.to);
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Initialized DFS Graph Traversal starting at vertex '${startNode}'.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((n) => ({ ...n, state: "active" })),
        edges: [...edges],
      },
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { startNode, totalNodes: nodes.length },
    }),
  );

  const visited = new Set<string>();
  const stack: string[] = [startNode];
  const traversal: string[] = [];

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Pushed starting vertex '${startNode}' onto LIFO traversal stack.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((n) => ({
          ...n,
          state: n.id === startNode ? "compare" : "default",
        })),
        edges: [...edges],
      },
      auxiliaryState: {
        stack: [...stack],
        visited: [],
      },
      variables: { stackSize: stack.length },
    }),
  );

  while (stack.length > 0) {
    const curr = stack.pop()!;

    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Popped vertex '${curr}' from top of stack.`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: nodes.map((n) => ({
            ...n,
            state: n.id === curr ? "swap" : visited.has(n.id) ? "sorted" : "default",
          })),
          edges: [...edges],
        },
        auxiliaryState: {
          stack: [...stack],
          visited: Array.from(visited),
        },
        variables: { current: curr },
      }),
    );

    if (!visited.has(curr)) {
      visited.add(curr);
      traversal.push(curr);

      steps.push(
        createTutorialStep({
          stepIndex: stepIdx++,
          phase: "walkthrough",
          narrative: `Marked vertex '${curr}' as visited and added to traversal output order: [${traversal.join(", ")}].`,
          primarySnapshot: {
            kind: "graph",
            directed: true,
            nodes: nodes.map((n) => ({
              ...n,
              state: n.id === curr ? "active" : visited.has(n.id) ? "sorted" : "default",
            })),
            edges: edges.map((e) => ({
              ...e,
              isTraversed: visited.has(e.from) && visited.has(e.to),
            })),
          },
          auxiliaryState: {
            stack: [...stack],
            visited: Array.from(visited),
          },
          variables: { current: curr, visitedSize: visited.size },
        }),
      );

      const neighbors = adj[curr] || [];
      steps.push(
        createTutorialStep({
          stepIndex: stepIdx++,
          phase: "walkthrough",
          narrative: `Inspecting outgoing neighbors of vertex '${curr}': [${neighbors.join(", ")}].`,
          primarySnapshot: {
            kind: "graph",
            directed: true,
            nodes: nodes.map((n) => ({
              ...n,
              state: n.id === curr ? "active" : visited.has(n.id) ? "sorted" : "default",
            })),
            edges: edges.map((e) => ({
              ...e,
              isPath: e.from === curr,
            })),
          },
          auxiliaryState: {
            stack: [...stack],
            visited: Array.from(visited),
          },
          variables: { current: curr, neighborCount: neighbors.length },
        }),
      );

      for (let i = neighbors.length - 1; i >= 0; i--) {
        const nbr = neighbors[i];
        const isNbrVisited = visited.has(nbr);

        steps.push(
          createTutorialStep({
            stepIndex: stepIdx++,
            phase: "walkthrough",
            narrative: isNbrVisited
              ? `Neighbor '${nbr}' of vertex '${curr}' is already visited. Skipping.`
              : `Neighbor '${nbr}' of vertex '${curr}' is unvisited. Pushing to stack.`,
            primarySnapshot: {
              kind: "graph",
              directed: true,
              nodes: nodes.map((n) => ({
                ...n,
                state: n.id === nbr ? "compare" : n.id === curr ? "active" : "default",
              })),
              edges: edges.map((e) => ({
                ...e,
                isPath: e.from === curr && e.to === nbr,
              })),
            },
            auxiliaryState: {
              stack: [...stack],
              visited: Array.from(visited),
            },
            variables: { current: curr, neighbor: nbr, isVisited: isNbrVisited },
          }),
        );

        if (!isNbrVisited) {
          stack.push(nbr);
          steps.push(
            createTutorialStep({
              stepIndex: stepIdx++,
              phase: "walkthrough",
              narrative: `Pushed neighbor '${nbr}' onto LIFO stack.`,
              primarySnapshot: {
                kind: "graph",
                directed: true,
                nodes: nodes.map((n) => ({
                  ...n,
                  state: stack.includes(n.id)
                    ? "visited"
                    : visited.has(n.id)
                      ? "sorted"
                      : "default",
                })),
                edges: [...edges],
              },
              auxiliaryState: {
                stack: [...stack],
                visited: Array.from(visited),
              },
              variables: { neighborPushed: nbr, stackLength: stack.length },
            }),
          );
        }
      }
    } else {
      steps.push(
        createTutorialStep({
          stepIndex: stepIdx++,
          phase: "walkthrough",
          narrative: `Vertex '${curr}' was already visited previously along another path. Skipping duplicate processing.`,
          primarySnapshot: {
            kind: "graph",
            directed: true,
            nodes: nodes.map((n) => ({
              ...n,
              state: visited.has(n.id) ? "sorted" : "default",
            })),
            edges: [...edges],
          },
          auxiliaryState: {
            stack: [...stack],
            visited: Array.from(visited),
          },
          variables: { current: curr, alreadyVisited: true },
        }),
      );
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `DFS Traversal complete: [${traversal.join(" -> ")}]. All reachable vertices from '${startNode}' fully explored.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((n) => ({
          ...n,
          state: visited.has(n.id) ? "sorted" : "default",
        })),
        edges: edges.map((e) => ({
          ...e,
          isPath: visited.has(e.from) && visited.has(e.to),
          isTraversed: true,
        })),
      },
      auxiliaryState: {
        stack: [],
        visited: Array.from(visited),
      },
      variables: { traversal: traversal.join(" -> ") },
    }),
  );

  return steps;
}

export const DFS_GRAPH_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines Depth-First Search (DFS) graph traversal algorithm.",
    2: "Initializes visited hash set.",
    3: "Initializes stack with start node.",
    4: "Initializes traversal list.",
    6: "Loops while stack is non-empty.",
    7: "Pops top node from stack.",
    8: "Checks if node is unvisited.",
    9: "Marks node visited.",
    10: "Appends node to traversal list.",
    11: "Iterates through adjacent neighbors.",
    12: "Checks if neighbor is unvisited.",
    13: "Pushes unvisited neighbor to stack.",
    14: "Returns traversal sequence.",
  },
};

export const dfsGraph: AlgorithmDefinition<DfsGraphInput> = {
  id: "dfs-graph",
  title: "DFS Graph Traversal",
  topicIds: ["graph_traversal"],
  difficulty: "Easy",
  description:
    "<p>Given a graph and a designated start vertex <code>s</code>, traverse all reachable vertices using Depth-First Search (DFS) by exploring as deep as possible along each branch before backtracking.</p><h3>Problem Statement</h3><p>Use an explicit LIFO stack and visited set to systematically traverse vertices. Return the ordered list of vertices in the exact order they are first discovered.</p><h3>Input Parameters</h3><ul><li><code>startNodeId</code>: Identifier for the starting vertex.</li><li><code>nodes</code>: List of graph vertices.</li><li><code>edges</code>: List of directed edges.</li></ul><h3>Output</h3><p>Returns an array of vertex IDs in the order visited by DFS.</p>",
  constraints: [
    "1 <= V <= 1000",
    "0 <= E <= 5000",
    "Start node must be present in the graph",
    "Graph may contain directed/undirected edges, cycles, and isolated components",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "nodes = [A, B, C, D, E, F], start = A",
      outputDisplay: "A -> B -> D -> F -> C -> E",
      title: "Standard 6-Node Graph Traversal",
      input: DEFAULT_DFS_GRAPH_INPUT,
      output: "A -> B -> D -> F -> E -> C",
      explanation:
        "Explores deep branch A -> B -> D -> F first before backtracking to expand branch C -> E.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "nodes = [A, B, C, D], edges = (A,B), (B,C), (C,A), (C,D)",
      outputDisplay: "A -> B -> C -> D",
      title: "Adversarial Graph with Cycles and Back-Edges",
      input: {
        startNodeId: "A",
        nodes: [
          { id: "A", label: "A", x: 150, y: 100, state: "default" },
          { id: "B", label: "B", x: 300, y: 100, state: "default" },
          { id: "C", label: "C", x: 300, y: 220, state: "default" },
          { id: "D", label: "D", x: 150, y: 220, state: "default" },
        ],
        edges: [
          { from: "A", to: "B" },
          { from: "B", to: "C" },
          { from: "C", to: "A" },
          { from: "C", to: "D" },
        ],
      },
      output: "A -> B -> C -> D",
      explanation: "The visited set prevents infinite looping on cycle A -> B -> C -> A.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "nodes = [A, B, C, D], edges = (A,B), (C,D), start = A",
      outputDisplay: "Visited: {A, B} (C, D unreachable)",
      title: "Boundary Disconnected Component Case",
      input: {
        startNodeId: "A",
        nodes: [
          { id: "A", label: "A", x: 100, y: 150, state: "default" },
          { id: "B", label: "B", x: 200, y: 150, state: "default" },
          { id: "C", label: "C", x: 350, y: 150, state: "default" },
          { id: "D", label: "D", x: 450, y: 150, state: "default" },
        ],
        edges: [
          { from: "A", to: "B" },
          { from: "C", to: "D" },
        ],
      },
      output: "Visited: [A, B]",
      explanation:
        "DFS from start node A explores only its connected component {A, B}, leaving {C, D} unvisited.",
    },
  ],
  code: DFS_GRAPH_CODE,
  timeComplexity: {
    best: "O(V + E)",
    average: "O(V + E)",
    worst: "O(V + E)",
  },
  spaceComplexity: "O(V)",
  complexityAnalysis: {
    time: "Every reachable vertex is pushed/popped from the stack at most once, and every edge (u, v) in E is traversed once, taking O(V + E) time.",
    space:
      "The visited set and the explicit stack store at most V node identifiers, taking O(V) space.",
  },
  topicGuide: {
    overview:
      "<p>Depth-First Search (DFS) is a fundamental graph traversal algorithm that explores paths to their maximum depth before backtracking. Utilizing a Last-In-First-Out (LIFO) stack discipline, DFS is central to topological sorting, cycle detection, strongly connected components (Kosaraju / Tarjan), and maze backtracking.</p>",
    sections: [
      {
        heading: "Core Concept: Post-Order Discovery & Backtracking",
        body: "<p>DFS explores along a branch until reaching a sink node or an already-visited vertex, at which point it backtracks to expand remaining unvisited edges: <code>stack.push(v) &rArr; depth(v) = depth(u) + 1</code>. This LIFO search order yields discovery and finish timestamps satisfying the parenthesis theorem.</p>",
      },
      {
        heading: "Systems & Compiler Applications",
        body: "<p>DFS underpins build dependency evaluation, compiler control-flow graph (CFG) reachability analysis, and garbage collector mark-and-sweep roots traversal.</p>",
      },
      {
        heading: "Implementation Nuances: Recursive vs Explicit Stack",
        body: "<p>Recursive DFS utilizes the call stack which can encounter stack overflow on deep paths of length <code>~10<sup>5</sup></code>. Explicit stack arrays avoid call stack limits.</p>",
      },
      {
        heading: "Edge Classifications",
        body: "<p>DFS partitions graph edges into Tree Edges, Back Edges (cycles), Forward Edges, and Cross Edges.</p>",
      },
      {
        heading: "Complexity Analysis",
        body: "<p><strong>Time Complexity:</strong> <code>O(V + E)</code><br/><strong>Space Complexity:</strong> <code>O(V)</code><br/>Every reachable vertex is pushed/popped from the stack at most once, and every edge (u, v) in E is traversed once, taking O(V + E) time.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Depth-First Search (DFS)",
        definition:
          "An algorithm for searching tree or graph data structures by exploring as deep as possible along each branch before backtracking.",
      },
      {
        term: "Backtracking",
        definition:
          "Retreating along the current search path upon hitting a dead end or fully visited vertex.",
      },
      {
        term: "Back Edge",
        definition:
          "An edge connecting a vertex to an ancestor in the DFS tree, revealing a cycle.",
      },
    ],
  },
  trivia: DFS_GRAPH_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 12",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 12,
      section: "12.1 Depth-first search",
    },
  ],
  defaultInput: DEFAULT_DFS_GRAPH_INPUT,
  generateSteps: generateDfsGraphSteps,
};

export default dfsGraph;
