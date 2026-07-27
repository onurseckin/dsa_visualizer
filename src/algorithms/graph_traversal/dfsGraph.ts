import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface DfsGraphInput {
  startNodeId?: string;
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export const DFS_GRAPH_CODE = `def dfs_graph(nodes, edges, start_node):
    adj = {u: [] for u in nodes}
    for u, v in edges:
        adj[u].append(v)

    visited = set()
    stack = [start_node]
    traversal = []

    while stack:
        curr = stack.pop()
        if curr not in visited:
            visited.add(curr)
            traversal.append(curr)
            for neighbor in reversed(adj[curr]):
                if neighbor not in visited:
                    stack.append(neighbor)

    return traversal`;

export const DFS_GRAPH_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4],
  distractors: [
    "curr = stack.pop(0)",
    "visited.remove(curr)",
    "stack.appendleft(neighbor)",
    "if curr in visited: break",
  ],
  hints: [
    {
      line: 7,
      hint: "Seeds the visited set and traversal stack with the starting vertex.",
    },
    {
      line: 11,
      hint: "Pops from the top of the LIFO stack to dive as deep as possible before backtracking.",
    },
    {
      line: 17,
      hint: "Pushes adjacent neighbors onto the stack, filtering out already visited nodes.",
    },
    {
      line: 19,
      hint: "Returns the complete depth-first search vertex order.",
    },
  ],
  lineExplanations: {
    1: "Defines the Depth-First Search (DFS) graph traversal algorithm.",
    7: "Initializes visited set and LIFO stack holding the source vertex.",
    10: "Loops while unexplored vertices remain on the stack.",
    11: "Pops top vertex, prioritizing deep exploration over broad expansion.",
    13: "Marks vertex visited and appends to output traversal sequence.",
    17: "Pushes unvisited neighbors onto the stack for upcoming recursive steps.",
  },
};

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

export function generateDfsGraphSteps(input: DfsGraphInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const nodes = input.nodes.map((n) => ({ ...n }));
  const edges = input.edges.map((e) => ({ ...e }));
  const startNode = input.startNodeId || nodes[0]?.id || "A";

  const adj: Record<string, string[]> = {};
  for (const n of nodes) {
    adj[n.id] = [];
  }
  for (const e of edges) {
    adj[e.from].push(e.to);
  }

  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 1,
    explanation: {
      what: `Initialized DFS Graph Traversal starting at node "${startNode}".`,
      why: "Depth-First Search uses a LIFO stack to dive as deep as possible along each branch before backtracking.",
    },
    primarySnapshot: { kind: "graph", nodes: [...nodes], edges: [...edges] },
    auxiliaryState: {
      stack: [],
      visited: [],
      customState: { Order: "[]" },
    },
    variables: { startNode, totalNodes: nodes.length },
  });

  const visited = new Set<string>();
  const stack: string[] = [startNode];
  const traversal: string[] = [];

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 7,
    explanation: {
      what: `Pushed start node "${startNode}" to stack.`,
      why: "Stack initialized with starting vertex.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((n) => ({
        ...n,
        state: n.id === startNode ? "active" : "default",
      })),
      edges: [...edges],
    },
    auxiliaryState: {
      stack: [...stack],
      visited: [],
      customState: { Order: "[]" },
    },
    variables: { stackSize: stack.length },
  });

  while (stack.length > 0) {
    const curr = stack.pop()!;

    if (!visited.has(curr)) {
      visited.add(curr);
      traversal.push(curr);

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 13,
        explanation: {
          what: `Popped node "${curr}" from stack and marked visited.`,
          why: "Visited set updated; node appended to DFS traversal order.",
        },
        primarySnapshot: {
          kind: "graph",
          nodes: nodes.map((n) => ({
            ...n,
            state:
              n.id === curr
                ? "active"
                : visited.has(n.id)
                  ? "visited"
                  : stack.includes(n.id)
                    ? "in-stack"
                    : "default",
          })),
          edges: edges.map((e) => ({
            ...e,
            isTraversed: visited.has(e.from) && visited.has(e.to),
          })),
        },
        auxiliaryState: {
          stack: [...stack],
          visited: Array.from(visited),
          customState: { Order: traversal.join(" -> ") },
        },
        variables: { current: curr, traversalLength: traversal.length },
      });

      const neighbors = adj[curr] || [];
      const unvisitedNeighbors = neighbors.filter((nbr) => !visited.has(nbr));

      for (let i = unvisitedNeighbors.length - 1; i >= 0; i--) {
        const nbr = unvisitedNeighbors[i];
        stack.push(nbr);
      }

      if (unvisitedNeighbors.length > 0) {
        steps.push({
          stepIndex: stepIdx++,
          codeLine: 17,
          explanation: {
            what: `Pushed unvisited neighbors of "${curr}" to stack: [${unvisitedNeighbors.join(", ")}].`,
            why: "Neighbors queued onto LIFO stack for upcoming recursive expansion.",
          },
          primarySnapshot: {
            kind: "graph",
            nodes: nodes.map((n) => ({
              ...n,
              state: stack.includes(n.id) ? "in-stack" : visited.has(n.id) ? "visited" : "default",
            })),
            edges: edges.map((e) => ({
              ...e,
              isPath: e.from === curr && unvisitedNeighbors.includes(e.to),
            })),
          },
          auxiliaryState: {
            stack: [...stack],
            visited: Array.from(visited),
            customState: { Order: traversal.join(" -> ") },
          },
          variables: { neighborsAdded: unvisitedNeighbors.length },
        });
      }
    }
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 19,
    explanation: {
      what: `DFS Traversal complete: ${traversal.join(" -> ")}.`,
      why: "All reachable vertices from start node have been fully explored.",
    },
    primarySnapshot: {
      kind: "graph",
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
      customState: { "Final Traversal": traversal.join(" -> ") },
    },
    variables: { traversal: traversal.join(" -> ") },
  });

  return steps;
}

export const dfsGraph: AlgorithmDefinition<DfsGraphInput> = {
  id: "dfs-graph",
  title: "DFS Graph Traversal",
  category: "graph_traversal",
  difficulty: "Easy",
  description:
    "Depth-First Search (DFS) traverses a graph by exploring as deep as possible along each branch before backtracking. It uses a call stack (or explicit LIFO stack) and a visited set to avoid cycles and process all reachable vertices in O(V + E) time.",
  constraints: ["1 <= V <= 1000", "0 <= E <= 5000", "Start node must be present in graph"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nodes = [A, B, C, D, E, F], start = A",
      outputDisplay: "A -> B -> D -> F -> C -> E",
      title: "6-Node Graph Traversal",
      input: DEFAULT_DFS_GRAPH_INPUT,
      output: "A -> B -> D -> F -> E -> C",
      explanation:
        "Explores deep branch A -> B -> D -> F first before backtracking to expand branch C -> E.",
    },
    {
      kind: "complex",
      inputDisplay: "nodes = [A, B, C, D], edges = (A,B), (B,C), (C,A), (C,D)",
      outputDisplay: "A -> B -> C -> D",
      title: "Graph with Cycles and Back-Edges",
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
      inputDisplay: "nodes = [A, B, C, D], edges = (A,B), (C,D), start = A",
      outputDisplay: "Visited: {A, B} (C, D unreachable)",
      title: "Disconnected Component Boundary Case",
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
    time: "Each vertex and edge in the reachable component is visited a constant number of times, yielding O(V + E) time.",
    space:
      "The visited set and recursion/call stack require memory proportional to the depth of the graph, taking O(V) space.",
  },
  topicGuide: {
    overview:
      "Depth-First Search (DFS) is a fundamental graph traversal algorithm that plunges deep along paths before backtracking. It forms the backbone of cycle detection, topological sorting, connected component analysis, and strong connectivity.",
    sections: [
      {
        heading: "LIFO Call Stack Discipline",
        body: "Unlike BFS which uses a FIFO queue to explore layer-by-layer, DFS uses a LIFO stack (or function call stack) to prioritize deep branch expansion.",
      },
      {
        heading: "Applications",
        body: "DFS is essential for detecting cycles (back-edges), finding topological orderings in DAGs, finding bridges and articulation points, and identifying connected components.",
      },
    ],
    keyTerms: [
      { term: "DFS", definition: "Depth-First Search algorithm." },
      {
        term: "Backtracking",
        definition: "Retracting along the search tree when a branch is exhausted.",
      },
      {
        term: "Call Stack",
        definition: "The stack storing pending search frames during recursive traversal.",
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
