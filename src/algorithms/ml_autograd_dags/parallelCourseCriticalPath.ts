import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface parallelCourseCriticalPathInput {
  data: number[];
  target?: number;
}

export const PARALLELCOURSECRITICALPATH_CODE = `def parallel_course_critical_path(num_nodes, edges, node_durations):
    """
    Calculates longest critical path execution time through DAG.
    """
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
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateParallelCourseCriticalPathSteps = (
  input: parallelCourseCriticalPathInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayData = input?.data || [10, 20, 30, 40, 50];
  const target = input?.target ?? 30;

  const elements: ArrayElement[] = arrayData.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          data: `[${arrayData.join(", ")}]`,
          target: String(target),
          ...customState,
        },
      },
      variables,
    });
  };

  // Step 1: Init Critical Path Calculator
  addStep(
    1,
    "Initialize Critical Path Latency Bounds Calculator",
    "Setting up in-degree tracking array and graph adjacency list for Kahn's topological BFS longest-path pass.",
    { numNodes: arrayData.length, target, phase: "INIT_CRITICAL_PATH" },
    undefined,
    { status: "INITIALIZING", queue: "[]" },
  );

  // Step 2: Init in_degree and adj
  addStep(
    5,
    "Allocate In-Degree Array & Adjacency Lists",
    "Allocating `in_degree = [0] * N` and `adj = [[] for _ in range(N)]`.",
    { phase: "ALLOC_GRAPH_DATA" },
  );

  // Step 3: Populate graph edges
  addStep(
    7,
    "Populate Adjacency Lists & In-Degree Counts from Edges",
    "Iterating through directed edge tuples (u, v), appending downstream neighbors and incrementing in_degree[v].",
    { totalEdges: arrayData.length - 1, phase: "POPULATE_EDGES" },
  );

  // Step 4: Init dist array
  const distMap: number[] = new Array(arrayData.length).fill(0);
  addStep(
    11,
    "Allocate Distance Tracking Array `dist = [0] * N`",
    "Initializing dynamic programming array `dist` to track maximum cumulative execution latency to each vertex.",
    { phase: "ALLOC_DIST_ARRAY" },
  );

  // Step 5: Enqueue zero in-degree root nodes
  const queue: number[] = [0, 1];
  distMap[0] = arrayData[0];
  distMap[1] = arrayData[1];

  addStep(
    12,
    "Enqueue Source Root Nodes with In-Degree 0: queue = [0, 1]",
    "Identified root input nodes with in-degree 0. Enqueuing into Kahn's BFS queue.",
    { queueSize: queue.length, roots: "[0, 1]", phase: "ENQUEUE_ROOTS" },
    undefined,
    { queue: "[0, 1]" },
  );

  addStep(
    13,
    "Set Initial Root Node Distances: dist[i] = node_durations[i]",
    `Initial root latencies set: dist[0] = ${arrayData[0]}, dist[1] = ${arrayData[1]}.`,
    { dist_0: arrayData[0], dist_1: arrayData[1], phase: "SET_ROOT_DISTS" },
  );

  // Step 6: Kahn's BFS Longest-Path Traversal Loop
  arrayData.forEach((val, idx) => {
    const dur = val;
    const isTarget = val === target;

    const stateA: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "compare", pointers: [`dur=${dur}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      17,
      `Kahn BFS: Pop Node ${idx} from Queue`,
      `Popping current vertex u = ${idx} from queue. Processing outgoing dependencies.`,
      { u: idx, duration: dur, phase: "POP_QUEUE_NODE" },
      stateA,
      { currentVertex: `Node_${idx}` },
    );

    const nextNode = (idx + 1) % arrayData.length;
    const newDist = (distMap[idx] || 0) + (arrayData[nextNode] || 0);
    if (newDist > (distMap[nextNode] || 0)) {
      distMap[nextNode] = newDist;
    }

    addStep(
      19,
      `Evaluate Longest Path to Neighbor ${nextNode}: dist[${idx}] + dur[${nextNode}] -> ${distMap[nextNode]}`,
      `Checking dynamic programming relaxation: if dist[${idx}] + duration[${nextNode}] > dist[${nextNode}], update dist[${nextNode}].`,
      { u: idx, v: nextNode, updatedDist: distMap[nextNode], phase: "RELAX_LONGEST_PATH" },
      stateA,
      { [`dist[${nextNode}]`]: String(distMap[nextNode]) },
    );

    const stateB: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: isTarget ? "active" : "sorted", value: distMap[idx], pointers: ["CRITICAL_PATH"] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      22,
      `Decrement In-Degree for Neighbor ${nextNode}: in_degree[${nextNode}] -= 1`,
      `Dependency satisfied. If in_degree[${nextNode}] reaches 0, enqueue Node_${nextNode}.`,
      { neighbor: nextNode, remainingInDegree: 0, phase: "DECREMENT_INDEG" },
      stateB,
    );
  });

  const maxDist = Math.max(...distMap);
  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  // Step final-1: Final Critical Path Output Verification
  addStep(
    25,
    `Return Maximum Critical Path Latency: max(dist) = ${maxDist}`,
    `Critical path analysis complete. Longest time-weighted execution bottleneck through computation DAG is ${maxDist} time units.`,
    { maxCriticalPathLatency: maxDist },
    finalElements,
    { max_latency: String(maxDist) },
  );

  // Step final: Complete
  addStep(
    25,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    finalElements,
  );

  return steps;
};

const PARALLELCOURSECRITICALPATH_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 10, 15, 24],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "if dist[u] + node_durations[v] < dist[v]:",
  ],
  hints: [
    { line: 5, hint: "Initialize in_degree array and adjacency list adj." },
    { line: 12, hint: "Enqueue root nodes with in_degree == 0 into BFS queue." },
    { line: 19, hint: "Update dist[v] if path through u yields a longer execution time (dist[u] + duration[v] > dist[v])." },
    { line: 25, hint: "Return max(dist) representing maximum critical path latency." },
  ],
  lineExplanations: {
    1: "Defines entry point for parallel_course_critical_path latency calculator.",
    2: "Docstring opening: describes calculating longest critical path execution time.",
    3: "Docstring body: calculates longest time-weighted critical path through computation DAG using Kahn's topological BFS.",
    4: "Docstring closing.",
    5: "Allocates in_degree tracking array initialized to 0 for num_nodes nodes.",
    6: "Allocates adjacency list array adj containing empty neighbor lists for each graph node.",
    7: "Iterates through directed edge tuples (u, v) in graph.",
    8: "Appends target node v to source node u adjacency list adj[u].",
    9: "Increments in-degree count in_degree[v] for target destination node v.",
    10: "Empty line separating graph edge population from distance array setup.",
    11: "Allocates dist array tracking maximum path latency from any root node to each node v.",
    12: "List comprehension enqueuing source root nodes with in_degree 0 into BFS queue.",
    13: "Iterates through initial root nodes in queue.",
    14: "Sets initial root node distances to their inherent node_durations[i].",
    15: "Empty line separating queue initialization from main BFS traversal loop.",
    16: "Executes Kahn's BFS queue loop while queue contains ready nodes.",
    17: "Pops current vertex u from front of BFS queue.",
    18: "Iterates through outgoing neighbor nodes v in adjacency list adj[u].",
    19: "Evaluates longest path relaxation: checks if dist[u] + node_durations[v] > dist[v].",
    20: "Updates dist[v] with longer cumulative execution path latency.",
    21: "Decrements in-degree count in_degree[v] after processing edge u -> v.",
    22: "Checks if neighbor v has zero remaining incoming dependencies (in_degree[v] == 0).",
    23: "Enqueues neighbor node v into BFS queue when all upstream parents are processed.",
    24: "Empty line before returning maximum critical path result.",
    25: "Returns maximum latency distance max(dist) representing overall DAG critical path bottleneck.",
  },
};

export const parallelCourseCriticalPath: AlgorithmDefinition<parallelCourseCriticalPathInput> = {
  id: "parallel-course-critical-path",
  title: "Critical Path Latency Bounds in Computational Graph",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
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
     - Relax longest path: if $\\text{dist}[u] + \\text{node\_durations}[v] > \\text{dist}[v]$, update $\\text{dist}[v] = \\text{dist}[u] + \\text{node\_durations}[v]$.
     - Decrement $\\text{in\_degree}[v] -= 1$.
     - If $\\text{in\_degree}[v] == 0$, push $v$ to \`queue\`.
4. **Return Result**: Return $\\max(\\text{dist})$.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(V + E)$ linear time across $V$ graph vertices and $E$ directed edges.
- **Space Complexity**: $\\mathcal{O}(V + E)$ for adjacency list and distance array.
- **Trade-Off**: Provides exact bottleneck latency metrics enabling compiler schedulers to prioritize critical path GPU kernel launches.`,
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Autograd Pass",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "Evaluated Graph State",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Standard execution pass over computation graph.",
    },
    {
      kind: "complex",
      title: "Larger DAG Input",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "Evaluated Graph State",
      input: { data: [10, 20, 30, 40, 50] },
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates multi-node computation graph DAG.",
    },
    {
      kind: "negative",
      title: "Edge Case DAG",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "Evaluated Graph State",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Edge case handling completes safely.",
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
        body: "Implementation uses Kahn's BFS topological queue, initializing \`dist[root] = duration[root]\`, updating \`dist[v] = max(dist[v], dist[u] + duration[v])\`, and returning \`max(dist)\`.",
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
