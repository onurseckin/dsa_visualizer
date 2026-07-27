import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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

export const DAG_DP_TRIVIA: TriviaMeta = {
  skipLines: [1, 2],
  distractors: [
    "if dp[u] + w < dp[v]: dp[v] = dp[u] + w",
    "queue.pop()",
    "dp[u] = max(dp.values())",
    "topo_order.reverse()",
  ],
  hints: [
    {
      line: 9,
      hint: "Topological sorting processes nodes in an order where all incoming dependencies precede target nodes.",
    },
    {
      line: 18,
      hint: "Initialize DP array dp[u] = 0 for all nodes.",
    },
    {
      line: 23,
      hint: "Relax edges u -> v: if dp[u] + weight > dp[v], update dp[v] and track predecessor.",
    },
    {
      line: 26,
      hint: "The maximum value in the DP table yields the longest path length in the DAG.",
    },
  ],
  lineExplanations: {
    1: "Imports deque for Kahn's topological sort queue.",
    3: "Defines the DAG longest path dynamic programming algorithm.",
    9: "Initializes Kahn's queue with in-degree 0 source vertices.",
    11: "Builds a valid topological ordering of the DAG.",
    18: "Initializes DP distance array dp[u] = 0 and parent pointers for path reconstruction.",
    20: "Iterates over vertices in topological order to relax outgoing directed edges.",
    22: "Updates dp[v] if a longer path ending at node v is found via node u.",
    26: "Identifies the node with maximum DP score and reconstructs the longest path.",
  },
};

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

export function generateDagDpSteps(input: DagDpLongestPathInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const nodes = input.nodes.map((n) => ({ ...n }));
  const edges = input.edges.map((e) => ({ ...e }));

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

  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 1,
    explanation: {
      what: "Initialized DAG Longest Path DP algorithm.",
      why: `Graph has ${nodes.length} nodes and ${edges.length} edges.`,
    },
    primarySnapshot: { kind: "graph", nodes: [...nodes], edges: [...edges] },
    auxiliaryState: {
      visited: [],
      distanceTable: {},
      customState: {
        "In-Degrees": Object.entries(inDegree)
          .map(([k, v]) => `${k}:${v}`)
          .join(", "),
      },
    },
    variables: { totalNodes: nodes.length, totalEdges: edges.length },
  });

  // Kahn's Topological Sort
  const queue: string[] = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
  const topoOrder: string[] = [];

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 8,
    explanation: {
      what: `Sources with in-degree 0: [${queue.join(", ")}].`,
      why: "Initial nodes for Kahn's topological sorting queue.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((n) => ({
        ...n,
        state: queue.includes(n.id) ? "queued" : "default",
      })),
      edges: [...edges],
    },
    auxiliaryState: {
      queue: [...queue],
      customState: { "Topo Order": "[]" },
    },
    variables: { queueLength: queue.length },
  });

  const inDegCopy = { ...inDegree };
  while (queue.length > 0) {
    const u = queue.shift()!;
    topoOrder.push(u);

    for (const item of adj[u]) {
      const v = item.to;
      inDegCopy[v]--;
      if (inDegCopy[v] === 0) {
        queue.push(v);
      }
    }
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 10,
    explanation: {
      what: `Topological Order computed: [${topoOrder.join(", ")}].`,
      why: "Processing DAG in topological order guarantees sub-problems are solved before dependent transitions.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((n) => ({ ...n, state: "visited" })),
      edges: [...edges],
    },
    auxiliaryState: {
      customState: { "Topo Order": `[${topoOrder.join(", ")}]` },
    },
    variables: { topoOrder: topoOrder.join(" -> ") },
  });

  // DP for Longest Path
  const dp: Record<string, number> = {};
  const parent: Record<string, string | null> = {};
  for (const n of nodes) {
    dp[n.id] = 0;
    parent[n.id] = null;
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 18,
    explanation: {
      what: "Initialized DP values dp[u] = 0 for all nodes.",
      why: "Base case for longest path DAG dynamic programming.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((n) => ({ ...n, val: 0, state: "default" })),
      edges: [...edges],
    },
    auxiliaryState: {
      distanceTable: { ...dp },
    },
    variables: { dpInit: "0 for all" },
  });

  for (const u of topoOrder) {
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 21,
      explanation: {
        what: `Processing node ${u} (dp[${u}] = ${dp[u]}).`,
        why: "Relaxing outgoing edges from current topological vertex.",
      },
      primarySnapshot: {
        kind: "graph",
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
        distanceTable: { ...dp },
        customState: { "Active Node": u },
      },
      variables: { activeNode: u, currentDp: dp[u] },
    });

    for (const item of adj[u]) {
      const v = item.to;
      const w = item.weight;

      if (dp[u] + w > dp[v]) {
        dp[v] = dp[u] + w;
        parent[v] = u;

        steps.push({
          stepIndex: stepIdx++,
          codeLine: 24,
          explanation: {
            what: `Relaxed edge ${u} -> ${v} (weight ${w}): updated dp[${v}] = ${dp[v]}.`,
            why: `Found longer path to ${v} via ${u} with total length ${dp[v]}.`,
          },
          primarySnapshot: {
            kind: "graph",
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
            distanceTable: { ...dp },
          },
          variables: { u, v, weight: w, newDp: dp[v] },
        });
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

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 27,
    explanation: {
      what: `Longest Path in DAG: ${longestPathNodes.join(" -> ")} (Length = ${dp[maxNode]}).`,
      why: `Node ${maxNode} achieves maximum path weight of ${dp[maxNode]}.`,
    },
    primarySnapshot: {
      kind: "graph",
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
      distanceTable: { ...dp },
      customState: {
        "Longest Path": longestPathNodes.join(" -> "),
        "Max Length": dp[maxNode],
      },
    },
    variables: { maxLength: dp[maxNode], path: longestPathNodes.join(" -> ") },
  });

  return steps;
}

export const dagDpLongestPath: AlgorithmDefinition<DagDpLongestPathInput> = {
  id: "dag-dp-longest-path",
  title: "Longest Path in a DAG (DP)",
  category: "graph_directed_and_scc",
  categories: ["graph_directed_and_scc"],
  difficulty: "Medium",
  description:
    "Finds the longest simple path in a Directed Acyclic Graph (DAG) in linear O(V + E) time using Dynamic Programming combined with Topological Sort. Given a DAG with V vertices and E weighted edges, compute the length of the longest path along with the sequence of vertices forming that path. While finding the longest path in general graphs is NP-hard, DAG acyclicity allows evaluating DP transitions in topological order: dp[v] = max(dp[v], dp[u] + weight(u, v)). Return the maximum path length in the DAG.",
  constraints: [
    "1 <= V <= 1000",
    "0 <= E <= 5000",
    "Graph must be acyclic (DAG)",
    "Edge weights can be positive, negative, or zero",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nodes = [A, B, C, D, E, F], edges with weights",
      outputDisplay: "Longest Path: A -> B -> D -> F (Length: 9)",
      title: "Weighted 6-Node DAG",
      input: DEFAULT_DAG_DP_INPUT,
      output: "A -> C -> E -> F (Length: 10)",
      explanation: "Path A -> C (2) -> E (5) -> F (3) yields total weight 10.",
    },
    {
      kind: "complex",
      inputDisplay: "nodes = [1, 2, 3, 4], edges = (1->2:5), (1->3:3), (2->4:6), (3->4:10)",
      outputDisplay: "Longest Path: 1 -> 3 -> 4 (Length: 13)",
      title: "Parallel Branching Paths",
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
      inputDisplay: "nodes = [1, 2, 3], edges = (1->2:1), (2->3:1)",
      outputDisplay: "Longest Path: 1 -> 2 -> 3 (Length: 2)",
      title: "Unweighted Simple Chain",
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
    time: "Topological sorting takes $\\mathcal{O}(V + E)$ using Kahn's algorithm. DP edge relaxation visits each edge once, taking $\\mathcal{O}(V + E)$. Total time is linear $\\mathcal{O}(V + E)$.",
    space: "Adjacency lists, DP arrays, and topological sorting queues consume $\\mathcal{O}(V + E)$ memory.",
  },
  topicGuide: {
    overview:
      "While finding the longest path in general directed graphs is NP-hard (by reduction to the **Hamiltonian Path** problem), the structural absence of directed cycles in a **DAG** enables an optimal dynamic programming solution in linear $\\mathcal{O}(V + E)$ time. By evaluating vertices in topological order, all predecessors of a node are fully processed before its own optimal path values are computed.",
    sections: [
      {
        heading: "Core Concept: Topological Pre-Ordering & Optimal Substructure",
        body: "Topological ordering ensures that for every directed edge $u \\to v$, $u$ appears before $v$ in the traversal sequence. Consequently, when calculating $\\text{dp}[v]$, all potential incoming paths $(u, v)$ have already had their maximal lengths $\\text{dp}[u]$ finalized.",
      },
      {
        heading: "DP State Transitions & Path Reconstruction",
        body: "Define $\\text{dp}[v]$ as the maximum path weight ending at vertex $v$. The state transition equation is:\n$$\\text{dp}[v] = \\max_{(u, v) \\in E}(\\text{dp}[v], \\text{dp}[u] + \\text{weight}(u, v))$$\nMaintaining parent pointers $\\text{parent}[v] = u$ allows backtracking from $\\max(\\text{dp})$ to reconstruct the exact optimal path sequence.",
      },
      {
        heading: "Systems & Critical Path Method (CPM)",
        body: "Longest path computation on DAGs is the core mathematical engine of Project Management **Critical Path Method (CPM)**, build pipeline optimization (Bazel, Ninja), chip synthesis timing analysis (**Static Timing Analysis** in VLSI design), and ML compute graph execution scheduling.",
      },
      {
        heading: "Edge Cases & Negative Weights",
        body: "Unlike Dijkstra's algorithm, DAG DP natively handles negative edge weights without looping endlessly, because cycles do not exist. Isolated vertices have a longest path length of 0. Disconnected components are handled seamlessly by initializing $\\text{dp}[v] = 0$ across all sources.",
      },
      {
        heading: "Complexity Analysis",
        body: "$$\\text{Time Complexity}: \\mathcal{O}(V + E)$$\n$$\\text{Space Complexity}: \\mathcal{O}(V + E)$$\n- **Topological Sort**: Kahn's BFS algorithm visits all $V$ nodes and $E$ edges in $\\mathcal{O}(V + E)$ time.\n- **DP Transitions**: Edge relaxation inspects every edge once, running in $\\mathcal{O}(V + E)$ time.",
      },
    ],
    keyTerms: [
      { term: "DAG", definition: "Directed Acyclic Graph containing no directed cycles." },
      {
        term: "Topological Sort",
        definition:
          "Linear ordering of vertices such that for every directed edge $u \\to v$, $u$ comes before $v$.",
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
