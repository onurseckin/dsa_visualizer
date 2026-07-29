import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface DagDpLongestPathInput {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export const DAG_DP_CODE = `from collections import deque

def dag_longest_path(nodes, edges):
    adj = {node: [] for node in nodes}
    in_degree = {node: 0 for node in nodes}
    for u, v, w in edges:
        adj[u].append((v, w))
        in_degree[v] += 1
        
    queue = deque([node for node in nodes if in_degree[node] == 0])
    topo_order = []
    while queue:
        u = queue.popleft()
        topo_order.append(u)
        for v, w in adj[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)
                
    dp = {node: 0 for node in nodes}
    parent = {node: None for node in nodes}
    for u in topo_order:
        for v, w in adj[u]:
            if dp[u] + w > dp[v]:
                dp[v] = dp[u] + w
                parent[v] = u
                
    max_node = max(nodes, key=lambda n: dp[n])
    path = []
    curr = max_node
    while curr is not None:
        path.append(curr)
        curr = parent[curr]
    path.reverse()
    
    return dp[max_node], path`;

export const DEFAULT_DAG_DP_INPUT: DagDpLongestPathInput = {
  nodes: [
    { id: "A", label: "A", x: 100, y: 150, state: "default" },
    { id: "B", label: "B", x: 230, y: 80, state: "default" },
    { id: "C", label: "C", x: 230, y: 220, state: "default" },
    { id: "D", label: "D", x: 360, y: 80, state: "default" },
    { id: "E", label: "E", x: 360, y: 220, state: "default" },
    { id: "F", label: "F", x: 490, y: 150, state: "default" },
  ],
  edges: [
    { from: "A", to: "B", weight: 3 },
    { from: "A", to: "C", weight: 2 },
    { from: "B", to: "D", weight: 4 },
    { from: "C", to: "D", weight: 1 },
    { from: "C", to: "E", weight: 5 },
    { from: "D", to: "F", weight: 2 },
    { from: "E", to: "F", weight: 3 },
  ],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Longest Path Problem in a Directed Acyclic Graph (DAG) finds the simple path that maximizes cumulative edge weight from any source to any reachable vertex.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A", state: "active" },
        { id: "B", label: "B", state: "default" },
        { id: "C", label: "C", state: "default" },
        { id: "D", label: "D", state: "default" },
      ],
      edges: [
        { from: "A", to: "B", weight: 3 },
        { from: "A", to: "C", weight: 2 },
        { from: "B", to: "D", weight: 4 },
        { from: "C", to: "D", weight: 5 },
      ],
    },
  },
  {
    narrative:
      "While finding longest paths in general graphs is NP-hard, the absence of directed cycles in a DAG enables exact polynomial-time Dynamic Programming.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A (No Cycles)", state: "visited" },
        { id: "B", label: "B", state: "visited" },
        { id: "C", label: "C", state: "visited" },
        { id: "D", label: "D", state: "visited" },
      ],
      edges: [
        { from: "A", to: "B", weight: 3, isTraversed: true },
        { from: "B", to: "D", weight: 4, isTraversed: true },
        { from: "A", to: "C", weight: 2, isTraversed: true },
        { from: "C", to: "D", weight: 5, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Topological Sorting orders vertices linearly so that for every directed edge u -> v, vertex u always precedes vertex v in the evaluation order.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A (1st)", state: "sorted" },
        { id: "B", label: "B (2nd)", state: "sorted" },
        { id: "C", label: "C (3rd)", state: "sorted" },
        { id: "D", label: "D (4th)", state: "sorted" },
      ],
      edges: [
        { from: "A", to: "B", weight: 3, isPath: true },
        { from: "B", to: "D", weight: 4, isPath: true },
        { from: "A", to: "C", weight: 2 },
        { from: "C", to: "D", weight: 5 },
      ],
    },
  },
  {
    narrative:
      "Kahn's Algorithm computes topological rank by maintaining a queue of in-degree 0 source nodes and peeling off edges in linear O(V + E) time.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A (in:0)", state: "active" },
        { id: "B", label: "B (in:1)", state: "default" },
        { id: "C", label: "C (in:1)", state: "default" },
        { id: "D", label: "D (in:2)", state: "default" },
      ],
      edges: [
        { from: "A", to: "B", weight: 3 },
        { from: "A", to: "C", weight: 2 },
        { from: "B", to: "D", weight: 4 },
        { from: "C", to: "D", weight: 5 },
      ],
    },
  },
  {
    narrative:
      "Optimal Substructure dictates that the longest path ending at vertex v builds upon the maximum path length among all incoming predecessor vertices u.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "B", label: "B (dp:3)", state: "visited" },
        { id: "C", label: "C (dp:2)", state: "visited" },
        { id: "D", label: "D (dp:?)", state: "swap" },
      ],
      edges: [
        { from: "B", to: "D", weight: 4, isTraversed: true },
        { from: "C", to: "D", weight: 5, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "The DP State Equation evaluates dp[v] = max(dp[v], dp[u] + weight(u, v)) initialized with dp[u] = 0 across all vertices.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "B", label: "B (dp:3)", state: "visited" },
        { id: "C", label: "C (dp:2)", state: "visited" },
        { id: "D", label: "D (dp:7)", state: "active" },
      ],
      edges: [
        { from: "B", to: "D", weight: 4 },
        { from: "C", to: "D", weight: 5, isPath: true },
      ],
    },
  },
  {
    narrative:
      "Edge Relaxation processes outgoing edges u -> v in topological order, updating target distance dp[v] whenever a longer path is found.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A (dp:0)", state: "visited" },
        { id: "C", label: "C (dp:2)", state: "active" },
        { id: "D", label: "D (dp:7)", state: "swap" },
      ],
      edges: [
        { from: "A", to: "C", weight: 2, isTraversed: true },
        { from: "C", to: "D", weight: 5, isPath: true },
      ],
    },
  },
  {
    narrative:
      "Parent Pointer Tracking records parent[v] = u during each DP update, enabling exact path reconstruction from sink back to source.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A", state: "sorted" },
        { id: "C", label: "C (parent:A)", state: "sorted" },
        { id: "D", label: "D (parent:C)", state: "sorted" },
      ],
      edges: [
        { from: "A", to: "C", weight: 2, isPath: true },
        { from: "C", to: "D", weight: 5, isPath: true },
      ],
    },
  },
  {
    narrative:
      "Extracting max(dp) and backtracking parent pointers computes the global longest path in a DAG in linear O(V + E) time and space.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A (dp:0)", state: "sorted" },
        { id: "B", label: "B (dp:3)", state: "default" },
        { id: "C", label: "C (dp:2)", state: "sorted" },
        { id: "D", label: "D (Max:7)", state: "sorted" },
      ],
      edges: [
        { from: "A", to: "B", weight: 3 },
        { from: "B", to: "D", weight: 4 },
        { from: "A", to: "C", weight: 2, isPath: true },
        { from: "C", to: "D", weight: 5, isPath: true },
      ],
    },
  },
];

export function generateDagDpSteps(input: DagDpLongestPathInput): AlgorithmStep[] {
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
  const safeInput = input && typeof input === "object" ? input : DEFAULT_DAG_DP_INPUT;
  const inputNodes =
    Array.isArray(safeInput.nodes) && safeInput.nodes.length > 0
      ? safeInput.nodes
      : DEFAULT_DAG_DP_INPUT.nodes;
  const inputEdges = Array.isArray(safeInput.edges) ? safeInput.edges : DEFAULT_DAG_DP_INPUT.edges;

  const nodes = inputNodes.map((n) => ({ ...n }));
  const edges = inputEdges.map((e) => ({ ...e }));

  const adj: Record<string, Array<{ to: string; weight: number }>> = {};
  const inDegree: Record<string, number> = {};

  for (const n of nodes) {
    adj[n.id] = [];
    inDegree[n.id] = 0;
  }

  for (const e of edges) {
    const w = e.weight ?? 1;
    adj[e.from].push({ to: e.to, weight: w });
    inDegree[e.to] = (inDegree[e.to] || 0) + 1;
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Initialized DAG Longest Path DP for ${nodes.length} vertices and ${edges.length} weighted edges.`,
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
      variables: { totalNodes: nodes.length, totalEdges: edges.length },
    }),
  );

  // Kahn's Topological Sort Queue Init
  const queue: string[] = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
  const topoOrder: string[] = [];

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Identified source nodes with in-degree 0: [${queue.join(", ")}]. Initialized Kahn's topological sort queue.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((n) => ({
          ...n,
          state: queue.includes(n.id) ? "compare" : "default",
        })),
        edges: [...edges],
      },
      auxiliaryState: {
        stack: [...queue],
        visited: [],
      },
      variables: { initialQueue: queue.join(", ") },
    }),
  );

  const inDegCopy = { ...inDegree };
  while (queue.length > 0) {
    const u = queue.shift()!;
    topoOrder.push(u);

    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Popped node '${u}' from queue and added to Topological Order: [${topoOrder.join(", ")}].`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: nodes.map((n) => ({
            ...n,
            state:
              n.id === u
                ? "swap"
                : topoOrder.includes(n.id)
                  ? "visited"
                  : queue.includes(n.id)
                    ? "compare"
                    : "default",
          })),
          edges: [...edges],
        },
        auxiliaryState: {
          stack: [...queue],
          visited: [...topoOrder],
        },
        variables: { current: u, topoOrder: topoOrder.join(" -> ") },
      }),
    );

    for (const item of adj[u]) {
      const v = item.to;
      inDegCopy[v]--;
      if (inDegCopy[v] === 0) {
        queue.push(v);
        steps.push(
          createTutorialStep({
            stepIndex: stepIdx++,
            phase: "walkthrough",
            narrative: `In-degree of node '${v}' reached 0 after removing edge '${u}' -> '${v}'. Pushed '${v}' to queue.`,
            primarySnapshot: {
              kind: "graph",
              directed: true,
              nodes: nodes.map((n) => ({
                ...n,
                state:
                  n.id === v
                    ? "compare"
                    : n.id === u
                      ? "active"
                      : topoOrder.includes(n.id)
                        ? "visited"
                        : queue.includes(n.id)
                          ? "compare"
                          : "default",
              })),
              edges: edges.map((e) => ({
                ...e,
                isPath: e.from === u && e.to === v,
              })),
            },
            auxiliaryState: {
              stack: [...queue],
              visited: [...topoOrder],
            },
            variables: { u, v, newInDegree: 0 },
          }),
        );
      }
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Completed Topological Sorting: [${topoOrder.join(", ")}]. Next, evaluate DP transitions in topological order.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((n) => ({ ...n, state: "visited" })),
        edges: [...edges],
      },
      auxiliaryState: {
        stack: [],
        visited: [...topoOrder],
      },
      variables: { topoOrder: topoOrder.join(" -> ") },
    }),
  );

  // DP for Longest Path
  const dp: Record<string, number> = {};
  const parent: Record<string, string | null> = {};
  for (const n of nodes) {
    dp[n.id] = 0;
    parent[n.id] = null;
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: "Initialized DP array dp[u] = 0 and parent[u] = null for all vertices.",
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((n) => ({ ...n, val: 0, state: "default" })),
        edges: [...edges],
      },
      auxiliaryState: {
        stack: [],
        visited: [...topoOrder],
      },
      variables: { dpInit: "0 for all" },
    }),
  );

  for (const u of topoOrder) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Processing vertex '${u}' (current dp[${u}] = ${dp[u]}): relaxing outgoing directed edges.`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: nodes.map((n) => ({
            ...n,
            val: dp[n.id],
            state: n.id === u ? "active" : "default",
          })),
          edges: edges.map((e) => ({
            ...e,
            isPath: e.from === u,
          })),
        },
        auxiliaryState: {
          stack: [],
          visited: [...topoOrder],
        },
        variables: { activeNode: u, currentDp: dp[u] },
      }),
    );

    for (const item of adj[u]) {
      const v = item.to;
      const w = item.weight;

      if (dp[u] + w > dp[v]) {
        dp[v] = dp[u] + w;
        parent[v] = u;

        steps.push(
          createTutorialStep({
            stepIndex: stepIdx++,
            phase: "walkthrough",
            narrative: `Relaxed edge '${u}' -> '${v}' (weight ${w}): updated dp[${v}] = ${dp[v]}.`,
            primarySnapshot: {
              kind: "graph",
              directed: true,
              nodes: nodes.map((n) => ({
                ...n,
                val: dp[n.id],
                state: n.id === v ? "swap" : n.id === u ? "active" : "default",
              })),
              edges: edges.map((e) => ({
                ...e,
                isPath: e.from === u && e.to === v,
              })),
            },
            auxiliaryState: {
              stack: [],
              visited: [...topoOrder],
            },
            variables: { u, v, weight: w, newDp: dp[v] },
          }),
        );
      }
    }
  }

  // Reconstruct longest path
  let maxNode = nodes[0].id;
  for (const n of nodes) {
    if (dp[n.id] > dp[maxNode]) {
      maxNode = n.id;
    }
  }

  const longestPathNodes: string[] = [];
  let curr: string | null = maxNode;
  while (curr !== null) {
    longestPathNodes.push(curr);
    curr = parent[curr];
  }
  longestPathNodes.reverse();

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `DAG Longest Path complete: [${longestPathNodes.join(" -> ")}] with total path weight ${dp[maxNode]}.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((n) => ({
          ...n,
          val: dp[n.id],
          state: longestPathNodes.includes(n.id) ? "sorted" : "default",
        })),
        edges: edges.map((e) => {
          let isPath = false;
          for (let i = 0; i < longestPathNodes.length - 1; i++) {
            if (e.from === longestPathNodes[i] && e.to === longestPathNodes[i + 1]) {
              isPath = true;
              break;
            }
          }
          return { ...e, isPath, isTraversed: isPath };
        }),
      },
      auxiliaryState: {
        stack: [],
        visited: [...longestPathNodes],
      },
      variables: { maxLength: dp[maxNode], path: longestPathNodes.join(" -> ") },
    }),
  );

  return steps;
}

export const DAG_DP_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Imports deque for Kahn's topological sort queue.",
    3: "Defines DAG longest path algorithm.",
    4: "Initializes adjacency list.",
    5: "Initializes in-degree counters.",
    6: "Populates adjacency list.",
    10: "Initializes queue with in-degree 0 nodes.",
    11: "Initializes topological order list.",
    12: "Processes queue nodes.",
    13: "Pops next vertex.",
    14: "Appends vertex to topo order.",
    15: "Iterates over outgoing edges.",
    16: "Decrements in-degree of neighbor.",
    17: "Checks if neighbor in-degree reached 0.",
    18: "Adds neighbor to queue.",
    20: "Initializes DP array dp[u] = 0.",
    21: "Initializes parent pointers.",
    22: "Iterates over vertices in topological order.",
    23: "Iterates over outgoing edges.",
    24: "Checks if path through u yields longer path.",
    25: "Updates dp[v].",
    26: "Stores parent[v] = u.",
    28: "Identifies max DP score node.",
    31: "Reconstructs longest path.",
    36: "Returns max path length and path sequence.",
  },
};

export const dagDpLongestPath: AlgorithmDefinition<DagDpLongestPathInput> = {
  id: "dag-dp-longest-path",
  title: "Longest Path in a DAG (DP)",
  topicIds: ["graph_directed_and_scc"],
  difficulty: "Medium",
  description:
    "<p>Given a Directed Acyclic Graph (DAG) <code>G = (V, E)</code> with weighted directed edges, compute the maximum total path weight from any source vertex to any reachable destination vertex.</p><h3>Problem Statement</h3><p>Use Kahn's algorithm to find a Topological Order, then evaluate Dynamic Programming state transitions <code>dp[v] = max(dp[v], dp[u] + weight(u, v))</code>. Reconstruct and return the global longest path sequence and maximum path weight.</p><h3>Input Parameters</h3><ul><li><code>nodes</code>: List of DAG vertices with coordinates and labels.</li><li><code>edges</code>: List of directed edges with numerical weights <code>(from, to, weight)</code>.</li></ul><h3>Output</h3><p>Returns the maximum cumulative path weight and ordered sequence of vertices forming the longest path.</p>",
  constraints: [
    "1 <= V <= 1000",
    "0 <= E <= 5000",
    "Graph must be acyclic (DAG)",
    "Edge weights can be positive, negative, or zero",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "nodes = [A, B, C, D, E, F], 7 weighted edges",
      outputDisplay: "A -> C -> E -> F (Length: 10)",
      title: "Standard Weighted 6-Node DAG",
      input: DEFAULT_DAG_DP_INPUT,
      output: "A -> C -> E -> F (Length: 10)",
      explanation: "Path A -> C (2) -> E (5) -> F (3) yields total weight 10.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "nodes = [1, 2, 3, 4], edges = (1->2:5), (1->3:3), (2->4:6), (3->4:10)",
      outputDisplay: "1 -> 3 -> 4 (Length: 13)",
      title: "Adversarial Parallel Branching Paths",
      input: {
        nodes: [
          { id: "1", label: "1", x: 100, y: 150, state: "default" },
          { id: "2", label: "2", x: 250, y: 80, state: "default" },
          { id: "3", label: "3", x: 250, y: 220, state: "default" },
          { id: "4", label: "4", x: 400, y: 150, state: "default" },
        ],
        edges: [
          { from: "1", to: "2", weight: 5 },
          { from: "1", to: "3", weight: 3 },
          { from: "2", to: "4", weight: 6 },
          { from: "3", to: "4", weight: 10 },
        ],
      },
      output: "1 -> 3 -> 4 (Length: 13)",
      explanation: "Branch through node 3 yields 3 + 10 = 13 vs branch 2 which yields 5 + 6 = 11.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "nodes = [1, 2, 3], edges = (1->2:1), (2->3:1)",
      outputDisplay: "1 -> 2 -> 3 (Length: 2)",
      title: "Boundary Unweighted Simple Chain",
      input: {
        nodes: [
          { id: "1", label: "1", x: 100, y: 150, state: "default" },
          { id: "2", label: "2", x: 250, y: 150, state: "default" },
          { id: "3", label: "3", x: 400, y: 150, state: "default" },
        ],
        edges: [
          { from: "1", to: "2", weight: 1 },
          { from: "2", to: "3", weight: 1 },
        ],
      },
      output: "1 -> 2 -> 3 (Length: 2)",
      explanation: "Linear chain path length equal to edge count.",
    },
  ],
  code: DAG_DP_CODE,
  timeComplexity: {
    best: "O(V + E)",
    average: "O(V + E)",
    worst: "O(V + E)",
  },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Topological sorting takes O(V + E) using Kahn's algorithm. DP edge relaxation visits each edge once, taking O(V + E). Total time is linear O(V + E).",
    space: "Adjacency lists, DP arrays, and topological sorting queues consume O(V + E) memory.",
  },
  topicGuide: {
    overview:
      "<p>While finding the longest path in general directed graphs is NP-hard (by reduction to the <strong>Hamiltonian Path</strong> problem), the structural absence of directed cycles in a <strong>DAG</strong> enables an optimal dynamic programming solution in linear <code>O(V + E)</code> time. By evaluating vertices in topological order, all predecessors of a node are fully processed before its own optimal path values are computed.</p>",
    sections: [
      {
        heading: "Core Concept: Topological Pre-Ordering & Optimal Substructure",
        body: "<p>Topological ordering ensures that for every directed edge <code>u &rarr; v</code>, <code>u</code> appears before <code>v</code> in the traversal sequence. Consequently, when calculating <code>dp[v]</code>, all potential incoming paths <code>(u, v)</code> have already had their maximal lengths <code>dp[u]</code> finalized.</p>",
      },
      {
        heading: "DP State Transitions & Path Reconstruction",
        body: "<p>Define <code>dp[v]</code> as the maximum path weight ending at vertex <code>v</code>. The state transition equation is: <code>dp[v] = max(dp[v], dp[u] + weight(u, v))</code>. Maintaining parent pointers <code>parent[v] = u</code> allows backtracking from <code>max(dp)</code> to reconstruct the exact optimal path sequence.</p>",
      },
      {
        heading: "Systems & Critical Path Method (CPM)",
        body: "<p>Longest path computation on DAGs is the core mathematical engine of Project Management <strong>Critical Path Method (CPM)</strong>, build pipeline optimization (Bazel, Ninja), chip synthesis timing analysis (<strong>Static Timing Analysis</strong> in VLSI design), and ML compute graph execution scheduling.</p>",
      },
      {
        heading: "Edge Cases & Negative Weights",
        body: "<p>Unlike Dijkstra's algorithm, DAG DP natively handles negative edge weights without looping endlessly, because cycles do not exist. Isolated vertices have a longest path length of 0. Disconnected components are handled seamlessly by initializing <code>dp[v] = 0</code> across all sources.</p>",
      },
      {
        heading: "Complexity Analysis",
        body: "<p><strong>Time Complexity:</strong> <code>O(V + E)</code><br/><strong>Space Complexity:</strong> <code>O(V + E)</code><br/>Topological sorting (Kahn's algorithm) and DP edge relaxation visit all V nodes and E edges in <code>O(V + E)</code> time.</p>",
      },
    ],
    keyTerms: [
      { term: "DAG", definition: "Directed Acyclic Graph containing no directed cycles." },
      {
        term: "Topological Sort",
        definition:
          "Linear ordering of vertices such that for every directed edge u -> v, u comes before v.",
      },
      {
        term: "Critical Path",
        definition:
          "The sequence of dependent tasks that determines the minimum total execution time for a project or pipeline.",
      },
      {
        term: "Optimal Substructure",
        definition:
          "The property that an optimal solution to a problem contains optimal solutions to its subproblems.",
      },
    ],
  },
  trivia: DAG_DP_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 16",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 16,
      section: "16.3 Dynamic programming on DAGs",
    },
  ],
  defaultInput: DEFAULT_DAG_DP_INPUT,
  generateSteps: generateDagDpSteps,
};

export default dagDpLongestPath;
