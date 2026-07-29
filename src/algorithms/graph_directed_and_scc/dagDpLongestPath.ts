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
      line: 10,
      hint: "Topological sorting processes nodes in an order where all incoming dependencies precede target nodes.",
    },
    {
      line: 20,
      hint: "Initialize DP array dp[u] = 0 for all nodes.",
    },
    {
      line: 24,
      hint: "Relax edges u -> v: if dp[u] + weight > dp[v], update dp[v] and track predecessor.",
    },
    {
      line: 28,
      hint: "The maximum value in the DP table yields the longest path length in the DAG.",
    },
  ],
  lineExplanations: {
    1: "Imports deque for Kahn's topological sort queue.",
    3: "Defines the DAG longest path dynamic programming algorithm.",
    4: "Initializes adjacency list for directed graph representation.",
    5: "Initializes in-degree counters for all vertices.",
    6: "Populates adjacency list and computes in-degrees for each vertex.",
    10: "Initializes Kahn's queue with in-degree 0 source vertices.",
    11: "Initializes list to store topological ordering.",
    12: "Processes nodes from the queue until empty.",
    13: "Pops next vertex from queue.",
    14: "Appends vertex to topological ordering.",
    15: "Iterates through outgoing edges of current vertex.",
    16: "Decrements in-degree of neighboring vertex.",
    17: "Checks if neighboring vertex has no remaining incoming edges.",
    18: "Adds neighbor to queue once in-degree reaches 0.",
    20: "Initializes DP distance array dp[u] = 0.",
    21: "Initializes parent pointers for path reconstruction.",
    22: "Iterates over vertices in topological order.",
    23: "Iterates over outgoing edges from current vertex.",
    24: "Checks if path through u yields a longer path to v.",
    25: "Updates dp[v] with new maximal path weight.",
    26: "Stores predecessor pointer parent[v] = u.",
    28: "Identifies the node with maximum DP score.",
    31: "Reconstructs longest path by backtracking parent pointers.",
    36: "Returns maximum path length and path sequence.",
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

  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 3,
    explanation: {
      what: "Initialized DAG Longest Path DP algorithm.",
      why: `Graph contains ${nodes.length} nodes and ${edges.length} directed weighted edges. Built adjacency list and in-degree table.`,
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

  // Kahn's Topological Sort Queue Init
  const queue: string[] = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
  const topoOrder: string[] = [];

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 10,
    explanation: {
      what: `Identified source nodes with in-degree 0: [${queue.join(", ")}].`,
      why: "In Kahn's algorithm, vertices with zero incoming dependencies form the initial topological sorting queue.",
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
    variables: { initialQueue: queue.join(", ") },
  });

  const inDegCopy = { ...inDegree };
  while (queue.length > 0) {
    const u = queue.shift()!;
    topoOrder.push(u);

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 13,
      explanation: {
        what: `Popped node ${u} from queue and added to Topological Order.`,
        why: `Node ${u} has no remaining unprocessed incoming edges. Current topological order: [${topoOrder.join(", ")}].`,
      },
      primarySnapshot: {
        kind: "graph",
        nodes: nodes.map((n) => ({
          ...n,
          state:
            n.id === u
              ? "active"
              : topoOrder.includes(n.id)
                ? "visited"
                : queue.includes(n.id)
                  ? "queued"
                  : "default",
        })),
        edges: [...edges],
      },
      auxiliaryState: {
        queue: [...queue],
        customState: { "Topo Order": `[${topoOrder.join(", ")}]` },
      },
      variables: { current: u, topoOrder: topoOrder.join(" -> ") },
    });

    for (const item of adj[u]) {
      const v = item.to;
      inDegCopy[v]--;
      if (inDegCopy[v] === 0) {
        queue.push(v);
        steps.push({
          stepIndex: stepIdx++,
          codeLine: 18,
          explanation: {
            what: `In-degree of node ${v} reached 0 after removing edge ${u} -> ${v}. Pushed ${v} to queue.`,
            why: `All incoming dependencies for node ${v} have been processed in the topological sorting stage.`,
          },
          primarySnapshot: {
            kind: "graph",
            nodes: nodes.map((n) => ({
              ...n,
              state:
                n.id === v
                  ? "queued"
                  : n.id === u
                    ? "active"
                    : topoOrder.includes(n.id)
                      ? "visited"
                      : queue.includes(n.id)
                        ? "queued"
                        : "default",
            })),
            edges: edges.map((e) => ({
              ...e,
              isPath: e.from === u && e.to === v,
            })),
          },
          auxiliaryState: {
            queue: [...queue],
            customState: { "Topo Order": `[${topoOrder.join(", ")}]` },
          },
          variables: { u, v, newInDegree: 0 },
        });
      }
    }
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 14,
    explanation: {
      what: `Topological Order computed: [${topoOrder.join(", ")}].`,
      why: "Evaluating DP transitions in topological order guarantees all path sub-problems ending at predecessors are solved beforehand.",
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
    codeLine: 20,
    explanation: {
      what: "Initialized DP array dp[u] = 0 and parent[u] = null for all nodes.",
      why: "Base case: a single node path has length 0. All vertices begin with initial candidate length 0.",
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
      codeLine: 22,
      explanation: {
        what: `Processing node ${u} (dp[${u}] = ${dp[u]}).`,
        why: `Relaxing outgoing directed edges from current topological vertex ${u}.`,
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
          codeLine: 25,
          explanation: {
            what: `Relaxed edge ${u} -> ${v} (weight ${w}): updated dp[${v}] = ${dp[v]}.`,
            why: `Found a longer path ending at ${v} via vertex ${u}: dp[${u}] (${dp[u]} - ${w}) = ${dp[v]} > previous dp[${v}].`,
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
    codeLine: 36,
    explanation: {
      what: `Longest Path in DAG: ${longestPathNodes.join(" -> ")} (Length = ${dp[maxNode]}).`,
      why: `Vertex ${maxNode} achieves the maximum total path weight of ${dp[maxNode]} in the DAG. Backtracked parent pointers to reconstruct the exact path.`,
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
  topicIds: ["graph_directed_and_scc"],
  difficulty: "Medium",
  description:
    "<p>Finds the longest simple path in a Directed Acyclic Graph (DAG) in linear <code>O(V + E)</code> time using Dynamic Programming combined with Topological Sort. Given a DAG with V vertices and E weighted edges, compute the length of the longest path along with the sequence of vertices forming that path. While finding the longest path in general graphs is NP-hard, DAG acyclicity allows evaluating DP transitions in topological order: <code>dp[v] = max(dp[v], dp[u] + weight(u, v))</code>. Return the maximum path length in the DAG.</p>",
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
        body: "<p><strong>Time Complexity:</strong> <code>O(V + E)</code><br/><strong>Space Complexity:</strong> <code>O(V + E)</code></p><ul><li><strong>Topological Sort:</strong> Kahn's BFS algorithm visits all V nodes and E edges in <code>O(V + E)</code> time.</li><li><strong>DP Transitions:</strong> Edge relaxation inspects every edge once, running in <code>O(V + E)</code> time.</li></ul>",
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
