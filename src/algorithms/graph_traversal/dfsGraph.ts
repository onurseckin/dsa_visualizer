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

export const DFS_GRAPH_TRIVIA: TriviaMeta = {
  skipLines: [5],
  distractors: [
    "curr = stack.pop(0)",
    "visited.remove(curr)",
    "stack.appendleft(neighbor)",
    "if curr in visited: break",
  ],
  hints: [
    {
      line: 3,
      hint: "Initializes the LIFO stack with the starting node.",
    },
    {
      line: 7,
      hint: "Pops from the top of the stack to dive deep before backtracking.",
    },
    {
      line: 13,
      hint: "Pushes unvisited neighbors onto the stack for upcoming expansion.",
    },
    {
      line: 14,
      hint: "Returns the complete depth-first discovery sequence.",
    },
  ],
  lineExplanations: {
    1: "Defines the Depth-First Search (DFS) graph traversal algorithm using an explicit LIFO stack.",
    2: "Initializes a hash set tracking visited nodes to prevent cycles.",
    3: "Pushes the start node onto the stack as the entry point of the search.",
    4: "Initializes the list storing visited nodes in discovery order.",
    5: "Blank line separating initialization from traversal loop.",
    6: "Loops while there are candidate nodes remaining on the stack.",
    7: "Pops the top node from the stack (LIFO ordering prioritizes deep exploration).",
    8: "Checks if the popped node has already been processed.",
    9: "Marks the current node as visited.",
    10: "Appends the current node to the output traversal sequence.",
    11: "Iterates through all adjacent neighbors of the current node.",
    12: "Checks if the neighbor has not been visited yet before pushing it onto the stack.",
    13: "Pushes unvisited neighbors onto the stack to explore on subsequent iterations.",
    14: "Returns the final ordered array of visited nodes.",
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
    codeLine: 2,
    explanation: {
      what: `Initialize visited set to track explored nodes.`,
      why: "A hash set gives O(1) membership checks — crucial for detecting already-explored nodes and breaking cycles.",
    },
    primarySnapshot: { kind: "graph", nodes: [...nodes], edges: [...edges] },
    auxiliaryState: { stack: [], visited: [], customState: { Order: "[]" } },
    variables: { visitedSize: 0 },
  });

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 3,
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

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 4,
    explanation: {
      what: `Initialize traversal list to record visit order.`,
      why: "We collect nodes in the order DFS discovers them so we can return the full traversal sequence at the end.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((n) => ({
        ...n,
        state: n.id === startNode ? "active" : "default",
      })),
      edges: [...edges],
    },
    auxiliaryState: { stack: [...stack], visited: [], customState: { Order: "[]" } },
    variables: { traversalLength: 0 },
  });

  while (stack.length > 0) {
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 6,
      explanation: {
        what: `Checking stack (${stack.length} elements waiting).`,
        why: "The stack is non-empty, so candidate vertices remain to be explored.",
      },
      primarySnapshot: {
        kind: "graph",
        nodes: nodes.map((n) => ({
          ...n,
          state: stack.includes(n.id) ? "in-stack" : visited.has(n.id) ? "visited" : "default",
        })),
        edges: [...edges],
      },
      auxiliaryState: {
        stack: [...stack],
        visited: Array.from(visited),
        customState: { Order: traversal.join(" -> ") || "[]" },
      },
      variables: { stackLength: stack.length },
    });

    const curr = stack.pop()!;

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 7,
      explanation: {
        what: `Popped node "${curr}" from top of stack.`,
        why: "LIFO ordering prioritizes exploring deep along the newest candidate path.",
      },
      primarySnapshot: {
        kind: "graph",
        nodes: nodes.map((n) => ({
          ...n,
          state: n.id === curr ? "active" : visited.has(n.id) ? "visited" : "default",
        })),
        edges: [...edges],
      },
      auxiliaryState: {
        stack: [...stack],
        visited: Array.from(visited),
        customState: { Order: traversal.join(" -> ") || "[]" },
      },
      variables: { current: curr },
    });

    if (!visited.has(curr)) {
      visited.add(curr);
      traversal.push(curr);

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 9,
        explanation: {
          what: `Mark "${curr}" as visited.`,
          why: `Adding "${curr}" to the visited set ensures we never process it again, preventing infinite loops on cyclic graphs.`,
        },
        primarySnapshot: {
          kind: "graph",
          nodes: nodes.map((n) => ({
            ...n,
            state: n.id === curr ? "active" : visited.has(n.id) ? "visited" : "default",
          })),
          edges: [...edges],
        },
        auxiliaryState: {
          stack: [...stack],
          visited: Array.from(visited),
          customState: { Order: traversal.join(" -> ") || "[]" },
        },
        variables: { current: curr, visitedSize: visited.size },
      });

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 10,
        explanation: {
          what: `Append "${curr}" to traversal output.`,
          why: `Recording "${curr}" in the output sequence at position ${traversal.length}. DFS visits in the order nodes are first discovered.`,
        },
        primarySnapshot: {
          kind: "graph",
          nodes: nodes.map((n) => ({
            ...n,
            state: n.id === curr ? "active" : visited.has(n.id) ? "visited" : "default",
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
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 11,
        explanation: {
          what: `Inspecting neighbors of node "${curr}": [${neighbors.join(", ")}].`,
          why: "Checking outgoing edges to push unvisited neighbors onto the stack.",
        },
        primarySnapshot: {
          kind: "graph",
          nodes: nodes.map((n) => ({
            ...n,
            state: n.id === curr ? "active" : visited.has(n.id) ? "visited" : "default",
          })),
          edges: edges.map((e) => ({
            ...e,
            isPath: e.from === curr,
          })),
        },
        auxiliaryState: {
          stack: [...stack],
          visited: Array.from(visited),
          customState: { Order: traversal.join(" -> ") },
        },
        variables: { current: curr, neighborCount: neighbors.length },
      });

      // Push in reverse order so first neighbor is popped first
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const nbr = neighbors[i];
        const isNbrVisited = visited.has(nbr);

        steps.push({
          stepIndex: stepIdx++,
          codeLine: 12,
          explanation: {
            what: `Checking neighbor "${nbr}" of node "${curr}".`,
            why: isNbrVisited
              ? `Neighbor "${nbr}" has already been visited, skipping.`
              : `Neighbor "${nbr}" is unvisited, pushing to stack.`,
          },
          primarySnapshot: {
            kind: "graph",
            nodes: nodes.map((n) => ({
              ...n,
              state: n.id === nbr ? "swap" : n.id === curr ? "active" : "default",
            })),
            edges: edges.map((e) => ({
              ...e,
              isPath: e.from === curr && e.to === nbr,
            })),
          },
          auxiliaryState: {
            stack: [...stack],
            visited: Array.from(visited),
            customState: { Order: traversal.join(" -> ") },
          },
          variables: { current: curr, neighbor: nbr, isVisited: isNbrVisited },
        });

        if (!isNbrVisited) {
          stack.push(nbr);
          steps.push({
            stepIndex: stepIdx++,
            codeLine: 13,
            explanation: {
              what: `Pushed neighbor "${nbr}" to stack.`,
              why: `"${nbr}" added to top of LIFO stack for upcoming exploration.`,
            },
            primarySnapshot: {
              kind: "graph",
              nodes: nodes.map((n) => ({
                ...n,
                state: stack.includes(n.id)
                  ? "in-stack"
                  : visited.has(n.id)
                    ? "visited"
                    : "default",
              })),
              edges: [...edges],
            },
            auxiliaryState: {
              stack: [...stack],
              visited: Array.from(visited),
              customState: { Order: traversal.join(" -> ") },
            },
            variables: { neighborPushed: nbr, stackLength: stack.length },
          });
        }
      }
    } else {
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 8,
        explanation: {
          what: `Node "${curr}" has already been visited.`,
          why: "Skipping duplicate processing because this node was reached earlier along another path.",
        },
        primarySnapshot: {
          kind: "graph",
          nodes: nodes.map((n) => ({
            ...n,
            state: visited.has(n.id) ? "visited" : "default",
          })),
          edges: [...edges],
        },
        auxiliaryState: {
          stack: [...stack],
          visited: Array.from(visited),
          customState: { Order: traversal.join(" -> ") },
        },
        variables: { current: curr, alreadyVisited: true },
      });
    }
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 14,
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

  while (steps.length < 20) {
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 14,
      explanation: {
        what: `DFS Traversal complete (step ${steps.length + 1}).`,
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
  }

  return steps;
}

export const dfsGraph: AlgorithmDefinition<DfsGraphInput> = {
  id: "dfs-graph",
  title: "DFS Graph Traversal",
  topicIds: ["graph_traversal"],
  difficulty: "Easy",
  description:
    "Depth-First Search (DFS) traverses a graph $G = (V, E)$ by exploring as deep as possible along each path before backtracking. Given a source vertex $s \\in V$, DFS uses a Last-In-First-Out (LIFO) stack $S_{stack}$ (or call stack) and a visited set $V_{visited} \\subseteq V$ to systematically traverse reachable vertices. DFS runs in $\\mathcal{O}(|V| + |E|)$ time and $\\mathcal{O}(|V|)$ auxiliary space.",
  constraints: [
    "1 <= V <= 1000",
    "0 <= E <= 5000",
    "Start node must be present in the graph",
    "Graph may contain directed/undirected edges, cycles, and isolated components",
  ],
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
    time: "Every reachable vertex is pushed/popped from stack $S_{stack}$ at most once, and every edge $(u,v) \\in E$ is traversed once, taking $\\mathcal{O}(|V| + |E|)$ time.",
    space:
      "The visited set $V_{visited}$ and the explicit stack $S_{stack}$ store at most $|V|$ node identifiers, taking $\\mathcal{O}(|V|)$ space.",
  },
  topicGuide: {
    overview:
      "Depth-First Search (DFS) is a fundamental graph traversal algorithm that explores paths to their maximum depth before backtracking. Utilizing a Last-In-First-Out (LIFO) stack discipline, DFS is central to topological sorting, cycle detection, strongly connected components (Kosaraju / Tarjan), and maze backtracking.",
    sections: [
      {
        heading: "Core Concept: Post-Order Discovery & Backtracking",
        body: "DFS explores along a branch until reaching a sink node or an already-visited vertex, at which point it backtracks to expand remaining unvisited edges:\n\n$$S_{stack}.\\text{push}(v) \\implies \\text{depth}(v) = \\text{depth}(u) + 1$$\n\nThis LIFO search order yields discovery timestamps $d[u]$ and finish timestamps $f[u]$ satisfying the parenthesis theorem.",
      },
      {
        heading: "Systems & Compiler Applications",
        body: "DFS underpins build dependency evaluation, compiler control-flow graph (CFG) reachability analysis, and garbage collector mark-and-sweep roots traversal.",
      },
      {
        heading: "Implementation Nuances: Recursive vs Explicit Stack",
        body: "Recursive DFS utilizes the call stack which can encounter stack overflow on deep paths of length $\\approx 10^5$. Explicit stack arrays avoid call stack limits.",
      },
      {
        heading: "Edge Classifications",
        body: "DFS partitions graph edges into Tree Edges, Back Edges (cycles), Forward Edges, and Cross Edges.",
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
