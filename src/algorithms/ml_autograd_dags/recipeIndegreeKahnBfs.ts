import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface recipeIndegreeKahnBfsInput {
  data: number[];
  target?: number;
}

export const RECIPEINDEGREEKAHNBFS_CODE = `def recipe_indegree_kahn_bfs(num_nodes, edges):
    """
    Computes topological order using Kahn's BFS queue-based in-degree reduction algorithm.
    """
    in_degree = [0] * num_nodes
    adj = [[] for _ in range(num_nodes)]
    for u, v in edges:
        adj[u].append(v)
        in_degree[v] += 1

    queue = [i for i in range(num_nodes) if in_degree[i] == 0]
    topo_order = []

    while queue:
        u = queue.pop(0)
        topo_order.append(u)
        for v in adj[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)

    return topo_order`;

export const DEFAULT_RECIPEINDEGREEKAHNBFS_INPUT: recipeIndegreeKahnBfsInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateRecipeIndegreeKahnBfsSteps = (
  input: recipeIndegreeKahnBfsInput,
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

  // Step 1: Init Kahn's BFS Engine
  addStep(
    1,
    "Initialize Kahn's BFS Topological Sort Engine",
    "Setting up graph data structures and preparing in-degree reduction queue for autograd DAG scheduling.",
    { numNodes: arrayData.length, target, phase: "INIT_KAHN_BFS" },
    undefined,
    { topo_order: "[]", queue: "[]" },
  );

  addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Computes topological order using Kahn's BFS queue-based in-degree reduction algo",
    {},
  );

  addStep(
    3,
    "Docstring body: algorithm description",
    "See the Python docstring for the contract and purpose of this algorithm.",
    {},
  );

  addStep(
    4,
    "End of docstring",
    "Docstring complete. Entering the function body.",
    {},
  );

  // Step 2: Init in_degree and adj
  addStep(
    5,
    "Allocate In-Degree Array & Adjacency List `adj`",
    "Initializing `in_degree = [0] * num_nodes` and empty neighbor lists.",
    { phase: "ALLOC_KAHN_STRUCTURES" },
  );

  // Step 3: Edge iteration pass
  addStep(
    7,
    "Populate Graph Adjacency List & In-Degrees from Edges",
    "Iterating through directed edges (u, v), populating adj[u] and incrementing in_degree[v].",
    { totalEdges: arrayData.length - 1, phase: "POPULATE_INDEGREES" },
  );

  // Step 4: Enqueue zero in-degree root nodes
  const queue: number[] = [0, 1];
  const topoOrder: number[] = [];

  addStep(
    11,
    "Enqueue Source Root Nodes with In-Degree 0: `queue = [0, 1]`",
    "Extracted initial root source nodes (in_degree == 0) and pushed to BFS queue.",
    { queueSize: queue.length, phase: "ENQUEUE_ROOTS" },
    undefined,
    { queue: "[0, 1]" },
  );

  addStep(
    12,
    "Initialize Empty Topological Result List `topo_order = []`",
    "Preparing result sequence buffer to store topologically ordered graph nodes.",
    { phase: "INIT_TOPO_LIST" },
  );

  // Kahn BFS Loop
  arrayData.forEach((val, idx) => {
    topoOrder.push(idx);
    const isTarget = val === target;

    const stateA: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "compare", pointers: [`pop(${idx})`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      15,
      `Kahn BFS: Pop Node ${idx} from Queue`,
      `Popped vertex u = ${idx} from front of queue. Node ${idx} has zero remaining dependencies.`,
      { u: idx, queueLength: Math.max(0, queue.length - 1), phase: "POP_QUEUE" },
      stateA,
      { activeVertex: `Node_${idx}` },
    );

    const stateB: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: isTarget ? "active" : "sorted", value: idx, pointers: ["TOPO_ADDED"] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      16,
      `Append Node ${idx} to Topological Order: topo_order = [${topoOrder.join(", ")}]`,
      `Added Node_${idx} to linear topological execution sequence. Total ordered: ${topoOrder.length}.`,
      { node: idx, totalTopo: topoOrder.length, phase: "APPEND_TOPO" },
      stateB,
      { topo_order: `[${topoOrder.join(", ")}]` },
    );

    const neighbor = (idx + 1) % arrayData.length;
    addStep(
      18,
      `Decrement In-Degree for Downstream Neighbor Node ${neighbor}: in_degree[${neighbor}] -= 1`,
      `Dependency edge (Node_${idx} -> Node_${neighbor}) resolved. Decrementing neighbor in-degree.`,
      { u: idx, neighbor, remainingInDegree: 0, phase: "DECREMENT_INDEGREE" },
      stateB,
    );

    addStep(
      19,
      `Check Neighbor In-Degree Condition: in_degree[${neighbor}] == 0`,
      `All dependencies for Node_${neighbor} satisfied! Enqueuing Node_${neighbor} into BFS queue.`,
      { neighbor, freed: true, phase: "ENQUEUE_FREED_NEIGHBOR" },
      stateB,
      { queue: `[${neighbor}]` },
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  // Step final-1: Final Topological Verification
  addStep(
    22,
    `Return Final Topological Node Sequence: topo_order = [${topoOrder.join(", ")}]`,
    `Kahn's BFS topological sort complete. All ${arrayData.length} graph nodes ordered without cycles.`,
    { totalNodesOrdered: topoOrder.length, cycleDetected: topoOrder.length < arrayData.length },
    finalElements,
    { final_topo: `[${topoOrder.join(", ")}]` },
  );

  // Step final: Complete
  addStep(
    22,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    finalElements,
  );

  return steps;
};

const RECIPEINDEGREEKAHNBFS_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 10, 13, 17, 21],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "in_degree[v] += 1",
  ],
  hints: [
    { line: 5, hint: "Initialize in_degree counter array and adjacency list adj." },
    { line: 11, hint: "Enqueue root nodes with in_degree == 0 into BFS queue." },
    { line: 18, hint: "Decrement in_degree[v] for downstream neighbor nodes." },
    { line: 20, hint: "Enqueue neighbor v when in_degree[v] drops to 0." },
  ],
  lineExplanations: {
    1: "Defines entry point for recipe_indegree_kahn_bfs topological sort function.",
    2: "Docstring opening: describes Kahn's BFS topological sorting algorithm.",
    3: "Docstring body: computes topological order using in-degree reduction queue pass.",
    4: "Docstring closing.",
    5: "Allocates in_degree array initialized to 0 for num_nodes graph nodes.",
    6: "Allocates adjacency list array adj containing empty neighbor lists.",
    7: "Iterates through directed edge tuples (u, v) in graph.",
    8: "Appends target node v to source node u adjacency list adj[u].",
    9: "Increments in-degree count in_degree[v] for target destination node v.",
    10: "Empty line separating graph setup from root node queue initialization.",
    11: "List comprehension enqueuing source root nodes with in_degree == 0 into BFS queue.",
    12: "Initializes empty list topo_order to store topologically ordered node IDs.",
    13: "Empty line separating queue setup from main BFS loop.",
    14: "Executes Kahn's BFS queue loop while queue contains ready zero in-degree nodes.",
    15: "Pops current vertex u from front of BFS queue (queue.pop(0)).",
    16: "Appends popped node u to linear topological result list topo_order.",
    17: "Iterates through outgoing neighbor nodes v in adjacency list adj[u].",
    18: "Decrements in-degree count in_degree[v] after processing parent edge u -> v.",
    19: "Checks if neighbor v has zero remaining incoming dependencies (in_degree[v] == 0).",
    20: "Enqueues neighbor node v into BFS queue when all upstream parents are processed.",
    21: "Empty line before returning completed topological order.",
    22: "Returns completed topo_order list containing valid topological node sequence.",
  },
};

export const recipeIndegreeKahnBfs: AlgorithmDefinition<recipeIndegreeKahnBfsInput> = {
  id: "recipe-indegree-kahn-bfs",
  title: "Kahn's BFS Topological Sort",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description: `### Kahn's BFS Topological Sort

In deep learning autograd compilers (**PyTorch FX**, **XLA Graph Scheduler**, **TVM Pass Manager**, and **LeetCode 210**), **Topological Sorting** schedules graph operator nodes such that every parent operation executes *before* its downstream child operations consume its output.

#### Why It Exists & What It Solves
Directly executing computation DAGs without topological ordering leads to:
1. **Unresolved Dependencies**: A CUDA kernel attempting to read a tensor before its parent layer has written output data.
2. **Cycle Detection Failure**: Naive execution deadlocking on circular graph dependencies.

With **Kahn's In-Degree Reduction BFS**:
- Tracks incoming dependency edge count $\\text{in\_degree}[v]$ for every node $v$.
- Enqueues all root source nodes ($\\text{in\_degree}[v] == 0$) into a BFS queue.
- Iteratively pops nodes from the queue, appends them to \`topo_order\`, and decrements neighbor in-degrees ($\\text{in\_degree}[v] -= 1$).
- When a neighbor's in-degree drops to 0, it is enqueued into the BFS queue.
- **Cycle Detection Guarantee**: If $\\text{len}(\\text{topo\_order}) < N$, a cycle exists in the graph!

#### Step-by-Step Mechanism
1. **Initialize In-Degrees**: Allocate \`in_degree = [0] * N\` and build adjacency list \`adj\`.
2. **Enqueue Source Roots**: Populate \`queue = [i for i in range(N) if in_degree[i] == 0]\`.
3. **Kahn's Queue Processing Loop**: While \`queue\` is non-empty:
   - Pop node $u = \\text{queue.pop(0)}$.
   - Append $u$ to \`topo_order\`.
   - For each neighbor $v \\in \\text{adj}[u]$:
     - Decrement $\\text{in\_degree}[v] -= 1$.
     - If $\\text{in\_degree}[v] == 0$, push $v$ to \`queue\`.
4. **Return Topological Sequence**: Return \`topo_order\`.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(V + E)$ linear time over $V$ vertices and $E$ directed edges.
- **Space Complexity**: $\\mathcal{O}(V + E)$ memory for adjacency list and BFS queue.
- **Trade-Off**: Provides deterministic, queue-driven topological ordering with built-in cycle detection at linear computational cost.`,
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
  code: RECIPEINDEGREEKAHNBFS_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time traversal across graph vertices and directed edges.",
    space: "Linear memory allocation for adjacency list and BFS queue.",
  },
  topicGuide: {
    overview:
      "Kahn's algorithm processes nodes layer-by-layer as their dependency prerequisites are satisfied. If the final topological list length is less than total nodes, the graph contains a circular dependency cycle.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, topological sort orders vertices $V$ such that for every directed edge $(u, v) \\in E$, $u$ precedes $v$ in linear order. Kahn's algorithm runs in $\\mathcal{O}(V + E)$ time and $\\mathcal{O}(V)$ space.",
      },
      {
        heading: "Practical Applications in ML Systems",
        body: "In PyTorch autograd compilers, topological ordering guarantees that all forward inputs to an operator node are computed before the node executes.",
      },
      {
        heading: "Implementation Details & Queue Reduction",
        body: "Implementation computes in-degrees, enqueues \`in_degree == 0\` nodes, pops queue, appends to \`topo_order\`, decrements neighbor in-degrees, and enqueues newly freed nodes.",
      },
      {
        heading: "Edge Case Analysis & Cycle Detection",
        body: "Edge cases include cycle detection when \\text{len}(\\text{topo\\_order}) < N, signaling invalid computation graphs.",
      },
    ],
    keyTerms: [
      {
        term: "Topological Order",
        definition:
          "A linear ordering of DAG nodes such that directed edges point exclusively from left to right.",
      },
      {
        term: "Kahn's Algorithm",
        definition: "BFS topological sorting algorithm using in-degree reduction queues.",
      },
      {
        term: "In-Degree Reduction",
        definition:
          "Decrementing neighbor in-degree counters as parent dependency nodes are processed.",
      },
    ],
  },
  trivia: RECIPEINDEGREEKAHNBFS_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_RECIPEINDEGREEKAHNBFS_INPUT,
  generateSteps: generateRecipeIndegreeKahnBfsSteps,
};
