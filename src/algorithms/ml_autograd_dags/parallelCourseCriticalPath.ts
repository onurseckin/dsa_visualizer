import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface parallelCourseCriticalPathInput {
  numNodes?: number;
  edges?: [number, number][];
  nodeDurations?: number[];
  data?: number[];
  target?: number;
}

export const PARALLELCOURSECRITICALPATH_CODE = `def parallel_course_critical_path(num_nodes, edges, node_durations):
    in_degree = [0] * num_nodes
    adj = [[] for _ in range(num_nodes)]
    for u, v in edges:
        adj[u].append(v)
        in_degree[v] += 1

    dist = [0] * num_nodes
    queue = [i for i in range(num_nodes) if in_degree[i] == 0]
    for i in queue:
        dist[i] = node_durations[i]

    while queue:
        u = queue.pop(0)
        for v in adj[u]:
            if dist[u] + node_durations[v] > dist[v]:
                dist[v] = dist[u] + node_durations[v]
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)

    return max(dist) if dist else 0`;

export const DEFAULT_PARALLELCOURSECRITICALPATH_INPUT: parallelCourseCriticalPathInput = {
  numNodes: 5,
  nodeDurations: [10, 20, 30, 40, 50],
  edges: [
    [0, 2],
    [1, 2],
    [1, 3],
    [2, 4],
    [3, 4],
  ],
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateParallelCourseCriticalPathSteps = (
  input: parallelCourseCriticalPathInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nodeDurations = input?.nodeDurations || input?.data || [10, 20, 30, 40, 50];
  const numNodes = input?.numNodes ?? nodeDurations.length;
  const rawEdges: [number, number][] =
    input?.edges ||
    (numNodes === 5
      ? [
          [0, 2],
          [1, 2],
          [1, 3],
          [2, 4],
          [3, 4],
        ]
      : Array.from({ length: Math.max(0, numNodes - 1) }, (_, i) => [i, i + 1]));

  const getNodePos = (i: number) => {
    if (numNodes === 5) {
      const coords = [
        { x: 120, y: 100 },
        { x: 120, y: 260 },
        { x: 320, y: 100 },
        { x: 320, y: 260 },
        { x: 520, y: 180 },
      ];
      return coords[i] || { x: 120 + i * 100, y: 180 };
    }
    return {
      x: 120 + (i % 3) * 200,
      y: 100 + Math.floor(i / 3) * 160,
    };
  };

  const graphNodes: GraphNodeItem[] = Array.from({ length: numNodes }, (_, i) => {
    const pos = getNodePos(i);
    return {
      id: String(i),
      label: `Node ${i} (${nodeDurations[i]}ms)`,
      x: pos.x,
      y: pos.y,
      state: "default",
      val: nodeDurations[i],
    };
  });

  const graphEdges: GraphEdgeItem[] = rawEdges.map(([u, v]) => ({
    from: String(u),
    to: String(v),
    weight: nodeDurations[v],
    isTraversed: false,
    isPath: false,
  }));

  const getSnapshot = (currentNodes: GraphNodeItem[], currentEdges: GraphEdgeItem[]) => ({
    kind: "graph" as const,
    nodes: currentNodes.map((n) => ({ ...n })),
    edges: currentEdges.map((e) => ({ ...e })),
  });

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currNodes: GraphNodeItem[],
    currEdges: GraphEdgeItem[],
    queueState: number[],
    distTable: Record<string, number>,
    inDegState: Record<string, number>,
  ) => {
    const inDegStr = Object.entries(inDegState)
      .map(([k, v]) => `Node ${k}: ${v}`)
      .join(", ");
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(currNodes, currEdges),
      auxiliaryState: {
        queue: queueState.map((q) => `Node ${q}`),
        distanceTable: { ...distTable },
        customState: {
          "In-Degrees": inDegStr,
          Queue: `[${queueState.join(", ")}]`,
        },
      },
      variables,
    });
  };

  let activeNodes = graphNodes.map((n) => ({ ...n }));
  let activeEdges = graphEdges.map((e) => ({ ...e }));

  // Line 1: Function entry
  addStep(
    1,
    "Initialize Critical Path Latency Bounds Calculator",
    `Setting up topological graph solver to compute longest critical path duration through DAG of ${numNodes} nodes and ${rawEdges.length} edges.`,
    { num_nodes: numNodes, total_edges: rawEdges.length },
    activeNodes,
    activeEdges,
    [],
    {},
    {},
  );

  // Line 2: in_degree = [0] * num_nodes
  const inDegree: number[] = new Array(numNodes).fill(0);
  const inDegRecord: Record<string, number> = {};
  for (let i = 0; i < numNodes; i++) inDegRecord[i] = 0;

  addStep(
    2,
    "Allocate In-Degree Array `in_degree = [0] * num_nodes`",
    "Track incoming dependency counts for each vertex in the computation graph.",
    { in_degree: JSON.stringify(inDegree) },
    activeNodes,
    activeEdges,
    [],
    {},
    inDegRecord,
  );

  // Line 3: adj = [[] for _ in range(num_nodes)]
  const adj: number[][] = Array.from({ length: numNodes }, () => []);
  addStep(
    3,
    "Allocate Adjacency List `adj = [[] for _ in range(num_nodes)]`",
    "Prepare empty neighbor vectors for each graph vertex.",
    { num_nodes: numNodes },
    activeNodes,
    activeEdges,
    [],
    {},
    inDegRecord,
  );

  // Line 4-6: Populate edges & in_degrees
  for (const [u, v] of rawEdges) {
    addStep(
      4,
      `Examine Directed Edge (${u} -> ${v})`,
      `Processing dependency connection from parent operation Node ${u} to downstream operation Node ${v}.`,
      { u, v },
      activeNodes,
      activeEdges,
      [],
      {},
      inDegRecord,
    );

    adj[u].push(v);
    activeEdges = activeEdges.map((e) =>
      e.from === String(u) && e.to === String(v) ? { ...e, isTraversed: true } : e,
    );

    addStep(
      5,
      `Add Directed Edge ${u} -> ${v} to Adjacency List`,
      `Appended Node ${v} to adj[${u}].`,
      { u, v, adj_u: JSON.stringify(adj[u]) },
      activeNodes,
      activeEdges,
      [],
      {},
      inDegRecord,
    );

    inDegree[v] += 1;
    inDegRecord[v] = inDegree[v];

    addStep(
      6,
      `Increment In-Degree for Node ${v}: in_degree[${v}] = ${inDegree[v]}`,
      `Node ${v} has another incoming dependency prerequisite.`,
      { v, in_degree_v: inDegree[v] },
      activeNodes,
      activeEdges,
      [],
      {},
      inDegRecord,
    );
  }

  // Line 8: dist = [0] * num_nodes
  const dist: number[] = new Array(numNodes).fill(0);
  const distRecord: Record<string, number> = {};
  for (let i = 0; i < numNodes; i++) distRecord[i] = 0;

  addStep(
    8,
    "Allocate Distance Tracking Array `dist = [0] * num_nodes`",
    "Dynamic programming array dist[i] will record the maximum accumulated runtime latency to finish operation i.",
    { dist: JSON.stringify(dist) },
    activeNodes,
    activeEdges,
    [],
    distRecord,
    inDegRecord,
  );

  // Line 9: queue = [i for i in range(num_nodes) if in_degree[i] == 0]
  const queue: number[] = [];
  for (let i = 0; i < numNodes; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  activeNodes = activeNodes.map((n) =>
    queue.includes(Number(n.id)) ? { ...n, state: "queued" } : n,
  );

  addStep(
    9,
    "Enqueue Source Root Nodes with In-Degree 0",
    `Identified root input operations with zero incoming dependencies: [${queue.join(", ")}]. These operations can start execution immediately at time 0.`,
    { queue: JSON.stringify(queue) },
    activeNodes,
    activeEdges,
    queue,
    distRecord,
    inDegRecord,
  );

  // Lines 10-11: Set initial root distances
  for (const root of queue) {
    addStep(
      10,
      `Iterate Root Node ${root} from Ready Queue`,
      `Initializing starting distance for root input node ${root}.`,
      { root },
      activeNodes,
      activeEdges,
      queue,
      distRecord,
      inDegRecord,
    );

    dist[root] = nodeDurations[root];
    distRecord[root] = dist[root];

    addStep(
      11,
      `Set Base Latency: dist[${root}] = node_durations[${root}] = ${dist[root]}`,
      `Root node ${root} has base execution duration of ${nodeDurations[root]}ms.`,
      { root, dist_root: dist[root] },
      activeNodes,
      activeEdges,
      queue,
      distRecord,
      inDegRecord,
    );
  }

  // Lines 13-20: Kahn BFS Topological Longest Path Loop
  while (queue.length > 0) {
    addStep(
      13,
      "Check BFS Queue Status",
      `Queue contains ${queue.length} ready operation(s): [${queue.join(", ")}].`,
      { queue_len: queue.length },
      activeNodes,
      activeEdges,
      queue,
      distRecord,
      inDegRecord,
    );

    const u = queue.shift()!;
    activeNodes = activeNodes.map((n) => (n.id === String(u) ? { ...n, state: "active" } : n));

    addStep(
      14,
      `Pop Node u = ${u} from Ready Queue`,
      `Processing outgoing dependencies for ready node ${u} (current cumulative latency: ${dist[u]}ms).`,
      { u, dist_u: dist[u] },
      activeNodes,
      activeEdges,
      queue,
      distRecord,
      inDegRecord,
    );

    for (const v of adj[u]) {
      addStep(
        15,
        `Iterate Outgoing Dependency Edge (${u} -> ${v})`,
        `Evaluating downstream neighbor Node ${v} from Node ${u}.`,
        { u, v },
        activeNodes,
        activeEdges,
        queue,
        distRecord,
        inDegRecord,
      );

      const candidateDist = dist[u] + nodeDurations[v];
      const isLonger = candidateDist > dist[v];

      activeNodes = activeNodes.map((n) => (n.id === String(v) ? { ...n, state: "compare" } : n));

      addStep(
        16,
        `Evaluate Latency Relaxation for Node ${v}: ${dist[u]} + ${nodeDurations[v]} > ${dist[v]}`,
        `Path through Node ${u} gives cumulative duration of ${candidateDist}ms. Current dist[${v}] is ${dist[v]}ms. ${isLonger ? "New longer path found!" : "Existing path is longer."}`,
        { candidateDist, currentDist: dist[v], isLonger },
        activeNodes,
        activeEdges,
        queue,
        distRecord,
        inDegRecord,
      );

      if (isLonger) {
        dist[v] = candidateDist;
        distRecord[v] = dist[v];

        addStep(
          17,
          `Update Latency: dist[${v}] = ${dist[v]}`,
          `Updated max latency for Node ${v} to ${dist[v]}ms based on path through Node ${u}.`,
          { v, new_dist_v: dist[v] },
          activeNodes,
          activeEdges,
          queue,
          distRecord,
          inDegRecord,
        );
      }

      inDegree[v] -= 1;
      inDegRecord[v] = inDegree[v];

      addStep(
        18,
        `Decrement In-Degree for Node ${v}: in_degree[${v}] = ${inDegree[v]}`,
        `Satisfied prerequisite edge ${u} -> ${v}. Remaining incoming dependencies: ${inDegree[v]}.`,
        { v, in_degree_v: inDegree[v] },
        activeNodes,
        activeEdges,
        queue,
        distRecord,
        inDegRecord,
      );

      if (inDegree[v] === 0) {
        queue.push(v);
        activeNodes = activeNodes.map((n) => (n.id === String(v) ? { ...n, state: "queued" } : n));

        addStep(
          20,
          `Enqueue Node ${v} into Ready Queue`,
          `All incoming prerequisites for Node ${v} are satisfied (in_degree == 0). Enqueuing Node ${v}.`,
          { v, queue: JSON.stringify(queue) },
          activeNodes,
          activeEdges,
          queue,
          distRecord,
          inDegRecord,
        );
      }
    }

    activeNodes = activeNodes.map((n) => (n.id === String(u) ? { ...n, state: "visited" } : n));
  }

  // Compute final critical path latency and reconstruct path
  const maxDist = dist.length > 0 ? Math.max(...dist) : 0;

  // Reconstruct critical path (backtracking from node with max dist)
  let maxNode = 0;
  for (let i = 0; i < numNodes; i++) {
    if (dist[i] > dist[maxNode]) maxNode = i;
  }

  const pathNodes: number[] = [maxNode];
  let curr = maxNode;
  while (dist[curr] > nodeDurations[curr]) {
    let parentFound = false;
    for (let p = 0; p < numNodes; p++) {
      if (adj[p].includes(curr) && dist[p] + nodeDurations[curr] === dist[curr]) {
        pathNodes.unshift(p);
        curr = p;
        parentFound = true;
        break;
      }
    }
    if (!parentFound) break;
  }

  const criticalNodeSet = new Set(pathNodes);
  const criticalEdgeSet = new Set<string>();
  for (let i = 0; i < pathNodes.length - 1; i++) {
    criticalEdgeSet.add(`${pathNodes[i]}->${pathNodes[i + 1]}`);
  }

  const finalNodes = activeNodes.map((n) => ({
    ...n,
    state: criticalNodeSet.has(Number(n.id)) ? ("path" as const) : ("sorted" as const),
  }));

  const finalEdges = activeEdges.map((e) => ({
    ...e,
    isPath: criticalEdgeSet.has(`${e.from}->${e.to}`),
  }));

  // Line 22: Return max(dist)
  addStep(
    22,
    `Return Maximum Critical Path Latency: max(dist) = ${maxDist}`,
    `Critical path analysis complete. The maximum execution latency bottleneck through the computational DAG is ${maxDist}ms. Critical path nodes: [${pathNodes.join(" -> ")}].`,
    { max_critical_path_latency: maxDist, critical_path: pathNodes.join(" -> ") },
    finalNodes,
    finalEdges,
    [],
    distRecord,
    inDegRecord,
  );

  // Final step
  addStep(
    22,
    "Execution Complete",
    `Successfully processed all ${numNodes} nodes in the computation graph structure. Final Critical Path Latency: ${maxDist}ms.`,
    { completed: true, totalSteps: stepIndex, max_latency: maxDist },
    finalNodes,
    finalEdges,
    [],
    distRecord,
    inDegRecord,
  );

  return steps;
};

const PARALLELCOURSECRITICALPATH_TRIVIA: TriviaMeta = {
  skipLines: [7, 12, 21],
  distractors: [
    "if dist[u] + node_durations[v] < dist[v]:",
    "queue.pop()",
    "return min(dist)",
    "in_degree[v] += 1",
  ],
  hints: [
    { line: 2, hint: "Initialize in_degree array to count incoming edges for each node." },
    { line: 9, hint: "Enqueue root nodes with in_degree == 0 into BFS queue." },
    { line: 16, hint: "Update dist[v] if path through u gives a larger cumulative latency." },
    { line: 22, hint: "Return max(dist) representing maximum critical path execution time." },
  ],
  lineExplanations: {
    1: "Defines entry point for parallel_course_critical_path latency bounds algorithm.",
    2: "Initializes in_degree array of length num_nodes to track incoming node dependencies.",
    3: "Initializes adjacency list array adj for storing directed outgoing edges.",
    4: "Iterates through directed edge tuples (u, v) in input graph.",
    5: "Appends target node v to source node u's adjacency list.",
    6: "Increments in-degree count for target node v.",
    7: "Empty line before distance array setup.",
    8: "Allocates dist array tracking maximum path latency from any root node to each node.",
    9: "Identifies source root nodes with zero in-degree and enqueues them into BFS queue.",
    10: "Iterates through initial root nodes in the queue.",
    11: "Sets initial root node distances to their base execution durations.",
    12: "Empty line before starting topological BFS loop.",
    13: "Kahn's topological BFS queue loop: processes ready nodes until queue is empty.",
    14: "Pops next ready vertex u from front of BFS queue.",
    15: "Iterates through outgoing neighbor nodes v of current vertex u.",
    16: "Checks dynamic programming relaxation: if path through u yields longer latency to v.",
    17: "Updates dist[v] with the longer cumulative execution duration.",
    18: "Decrements incoming dependency count in_degree[v].",
    19: "Checks if all incoming dependencies for node v have been satisfied (in_degree[v] == 0).",
    20: "Enqueues node v into ready queue for execution.",
    21: "Empty line before returning total critical path latency.",
    22: "Returns maximum latency max(dist) representing critical path duration bottleneck.",
  },
};

export const parallelCourseCriticalPath: AlgorithmDefinition<parallelCourseCriticalPathInput> = {
  id: "parallel-course-critical-path",
  title: "Critical Path Latency Bounds in Computational Graph",
  topicIds: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Hard",
  description: `### Critical Path Latency Bounds in Computational Graph

In parallel GPU graph execution engines (**PyTorch CUDA Graphs**, **XLA Scheduler**, **TVM Graph Optimizer**, and **LeetCode 2050**), the **Critical Path** of a computation DAG determines the theoretical minimum total execution time required to execute all model operations—even with infinite parallel GPU hardware streams.

#### Why It Exists & What It Solves
When executing complex neural network computation graphs containing multiple parallel branches (e.g., multi-head attention projections, residual connections, and feature pyramids):
1. Independent operations on separate parallel branches can execute concurrently on separate GPU streams.
2. The overall total latency is constrained by the single longest time-weighted chain of dependent operations—the **Critical Path**.
3. Operations on the critical path have **zero slack time**; delaying any operation on the critical path directly increases total end-to-end model latency.

With Kahn's Topological BFS Longest Path DP:
- We compute dynamic programming distances:
  $$\\text{dist}[v] = \\text{duration}[v] + \\max_{(u, v) \\in E} \\text{dist}[u]$$
- Vertices are processed in topological order using Kahn's queue.
- The maximum distance $\\max_{v} \\text{dist}[v]$ yields the exact critical path latency bound.

#### Step-by-Step Mechanism
1. **Graph Setup**: Build adjacency list \`adj\` and compute \`in_degree\` for all vertices.
2. **Root Initialization**: Enqueue all source root nodes with \`in_degree[i] == 0\` into \`queue\`. Set \`dist[i] = node_durations[i]\`.
3. **Kahn's BFS Longest Path Loop**: While \`queue\` is non-empty:
   - Pop node $u = \\text{queue.pop(0)}$.
   - For each neighbor $v \\in \\text{adj}[u]$:
     - Relax longest path: if $\\text{dist}[u] + \\text{node_durations}[v] > \\text{dist}[v]$, update $\\text{dist}[v] = \\text{dist}[u] + \\text{node_durations}[v]$.
     - Decrement $\\text{in_degree}[v] -= 1$.
     - If $\\text{in_degree}[v] == 0$, push $v$ to \`queue\`.
4. **Return Result**: Return $\\max(\\text{dist})$.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(V + E)$ linear time across $V$ graph vertices and $E$ directed edges.
- **Space Complexity**: $\\mathcal{O}(V + E)$ for adjacency list and distance array.
- **Trade-Off**: Provides exact bottleneck latency metrics enabling compiler schedulers to prioritize critical path GPU kernel launches.`,
  constraints: ["1 <= numNodes <= 1000", "0 <= nodeDurations[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Autograd Pass",
      inputDisplay: "numNodes = 5, nodeDurations = [10, 20, 30, 40, 50]",
      outputDisplay: "Max Latency: 110ms",
      input: {
        numNodes: 5,
        nodeDurations: [10, 20, 30, 40, 50],
        edges: [
          [0, 2],
          [1, 2],
          [1, 3],
          [2, 4],
          [3, 4],
        ],
      },
      output: "110",
      explanation: "Evaluates 5-node computation graph DAG critical path.",
    },
    {
      kind: "complex",
      title: "Parallel Branching DAG",
      inputDisplay: "numNodes = 5, nodeDurations = [15, 25, 35, 45, 55]",
      outputDisplay: "Max Latency: 125ms",
      input: {
        numNodes: 5,
        nodeDurations: [15, 25, 35, 45, 55],
        edges: [
          [0, 2],
          [1, 2],
          [1, 3],
          [2, 4],
          [3, 4],
        ],
      },
      output: "125",
      explanation: "Evaluates multi-node computation graph with distinct node latencies.",
    },
    {
      kind: "negative",
      title: "Linear Path DAG",
      inputDisplay: "numNodes = 3, nodeDurations = [5, 10, 15]",
      outputDisplay: "Max Latency: 30ms",
      input: {
        numNodes: 3,
        nodeDurations: [5, 10, 15],
        edges: [
          [0, 1],
          [1, 2],
        ],
      },
      output: "30",
      explanation: "Linear chain computation path.",
    },
  ],
  code: PARALLELCOURSECRITICALPATH_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time traversal across graph vertices and directed edges.",
    space: "Linear memory allocation for graph adjacency lists and distance array.",
  },
  topicGuide: {
    overview:
      "The Critical Path Method (CPM) finds the minimum total execution time of a parallel workload DAG. Nodes on the critical path have zero slack time; delaying any operation on the critical path directly delays overall model completion time.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, for node $v$ in DAG $G$, $\\text{Dist}(v) = \\text{Duration}(v) + \\max_{(u, v) \\in E} \\text{Dist}(u)$. Critical path length is $\\text{MaxDist} = \\max_{v \\in V} \\text{Dist}(v)$. Time complexity is $\\mathcal{O}(V + E)$.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "GPU kernel schedulers prioritize launching operations on the critical path first to minimize total model latency.",
      },
      {
        heading: "Implementation Details & Topological Queue",
        body: "Implementation uses Kahn's BFS topological queue, initializing `dist[root] = duration[root]`, updating `dist[v] = max(dist[v], dist[u] + duration[v])`, and returning `max(dist)`.",
      },
      {
        heading: "Edge Case Analysis & Disconnected Graphs",
        body: "Edge cases include disconnected parallel sub-graphs where overall latency is determined by the maximum among all independent component paths.",
      },
    ],
    keyTerms: [
      {
        term: "Critical Path",
        definition:
          "The longest time-weighted path through a DAG defining the minimum total execution time.",
      },
      {
        term: "Slack Time",
        definition:
          "The amount of time a non-critical operation can be delayed without increasing total DAG latency.",
      },
      {
        term: "Dynamic Programming on DAGs",
        definition:
          "Computing longest path metrics by propagating values along topological graph order.",
      },
    ],
  },
  trivia: PARALLELCOURSECRITICALPATH_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_PARALLELCOURSECRITICALPATH_INPUT,
  generateSteps: generateParallelCourseCriticalPathSteps,
};
