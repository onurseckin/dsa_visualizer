import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface recipeIndegreeKahnBfsInput {
  numNodes?: number;
  edges?: [number, number][];
  data?: number[];
  target?: number;
}

export const RECIPEINDEGREEKAHNBFS_CODE = `def recipe_indegree_kahn_bfs(num_nodes, edges):
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
  numNodes: 6,
  edges: [
    [5, 2],
    [5, 0],
    [4, 0],
    [4, 1],
    [2, 3],
    [3, 1],
  ],
};

export const generateRecipeIndegreeKahnBfsSteps = (
  input: recipeIndegreeKahnBfsInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const numNodes = input?.numNodes ?? input?.data?.length ?? 6;
  const edges: [number, number][] =
    input?.edges ??
    (input?.data
      ? Array.from({ length: Math.max(0, input.data.length - 1) }, (_, i): [number, number] => [
          i,
          i + 1,
        ])
      : [
          [5, 2],
          [5, 0],
          [4, 0],
          [4, 1],
          [2, 3],
          [3, 1],
        ]);

  const adj: number[][] = Array.from({ length: numNodes }, () => []);
  const inDegree: number[] = Array(numNodes).fill(0);
  const currentInDegree: number[] = Array(numNodes).fill(0);

  const inQueueSet = new Set<number>();
  const processedSet = new Set<number>();
  const topoOrder: number[] = [];
  const queue: number[] = [];

  const buildGraphSnapshot = (
    activeNode: number | null,
    activeNeighbor: number | null,
  ): { nodes: GraphNodeItem[]; edges: GraphEdgeItem[] } => {
    const nodes: GraphNodeItem[] = Array.from({ length: numNodes }, (_, i) => {
      let state: ElementState = "default";
      if (i === activeNode) state = "active";
      else if (i === activeNeighbor) state = "compare";
      else if (inQueueSet.has(i)) state = "queued";
      else if (processedSet.has(i)) state = "sorted";

      return {
        id: `node-${i}`,
        label: `N${i}`,
        val: currentInDegree[i],
        state,
      };
    });

    const edgeItems: GraphEdgeItem[] = edges.map(([u, v]) => {
      const isCurrentEdge = u === activeNode && v === activeNeighbor;
      const isSourceProcessed = processedSet.has(u);
      return {
        from: `node-${u}`,
        to: `node-${v}`,
        isTraversed: isSourceProcessed,
        isPath: isCurrentEdge || u === activeNode,
      };
    });

    return { nodes, edges: edgeItems };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeNode: number | null = null,
    activeNeighbor: number | null = null,
  ) => {
    const { nodes, edges: graphEdges } = buildGraphSnapshot(activeNode, activeNeighbor);

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "graph",
        nodes,
        edges: graphEdges,
      },
      auxiliaryState: {
        queue: queue.map((n) => `N${n}`),
        visited: topoOrder.map((n) => `N${n}`),
        customState: {
          inDegrees: currentInDegree.map((deg, i) => `N${i}:${deg}`).join(", "),
          topoOrder: `[${topoOrder.map((n) => `N${n}`).join(", ")}]`,
        },
      },
      variables: {
        activeNode: activeNode !== null ? activeNode : -1,
        activeNeighbor: activeNeighbor !== null ? activeNeighbor : -1,
        queueSize: queue.length,
        processedCount: topoOrder.length,
      },
    });
  };

  addStep(
    1,
    "Initialize Kahn's BFS Topological Sort Engine",
    "Setting up graph data structures and preparing in-degree reduction queue for autograd DAG scheduling.",
  );

  addStep(
    2,
    "Allocate In-Degree Array `in_degree = [0] * num_nodes`",
    `Allocating in-degree tracker array of length ${numNodes} initialized to zero.`,
  );

  addStep(
    3,
    "Allocate Graph Adjacency List `adj = [[] for _ in range(num_nodes)]`",
    `Creating adjacency list for ${numNodes} nodes.`,
  );

  for (const [u, v] of edges) {
    if (u >= 0 && u < numNodes && v >= 0 && v < numNodes) {
      addStep(
        4,
        `Iterate Directed Edge (${u} -> ${v})`,
        `Reading input directed edge connecting source node ${u} to target node ${v}.`,
      );

      adj[u].push(v);
      addStep(
        5,
        `Add Target ${v} to Adjacency List adj[${u}]`,
        `Appending downstream neighbor node ${v} to adjacency list adj[${u}].`,
      );

      inDegree[v]++;
      currentInDegree[v]++;
      addStep(
        6,
        `Increment In-Degree for Target Node ${v}: in_degree[${v}] = ${inDegree[v]}`,
        `Target node ${v} has a new incoming dependency from source node ${u}.`,
      );
    }
  }

  for (let i = 0; i < numNodes; i++) {
    if (inDegree[i] === 0) {
      queue.push(i);
      inQueueSet.add(i);
    }
  }
  addStep(
    8,
    `Enqueue Zero In-Degree Root Source Nodes: queue = [${queue.map((n) => `N${n}`).join(", ")}]`,
    `Source nodes with in_degree == 0 have no incoming dependencies and are ready for execution.`,
  );

  addStep(
    9,
    "Initialize Topological Result Order List `topo_order = []`",
    "Preparing empty sequence buffer to record topologically ordered nodes.",
  );

  while (queue.length > 0) {
    addStep(
      11,
      `Check BFS Queue Condition (queue = [${queue.map((n) => `N${n}`).join(", ")}])`,
      `Queue contains ${queue.length} node(s) with zero remaining dependencies.`,
    );

    const u = queue.shift()!;
    inQueueSet.delete(u);
    addStep(
      12,
      `Pop Node ${u} from Queue Front`,
      `Popped vertex u = ${u} from queue. Node ${u} is ready for scheduling.`,
      u,
    );

    topoOrder.push(u);
    processedSet.add(u);
    addStep(
      13,
      `Append Node ${u} to Topological Order: topo_order = [${topoOrder.map((n) => `N${n}`).join(", ")}]`,
      `Added Node ${u} to topological order output list. Total scheduled: ${topoOrder.length}/${numNodes}.`,
      u,
    );

    for (const v of adj[u]) {
      addStep(
        14,
        `Inspect Outgoing Dependency Edge (${u} -> ${v})`,
        `Checking downstream neighbor node ${v} of parent node ${u}.`,
        u,
        v,
      );

      currentInDegree[v]--;
      addStep(
        15,
        `Decrement In-Degree for Neighbor Node ${v}: in_degree[${v}] = ${currentInDegree[v]}`,
        `Resolved dependency edge (${u} -> ${v}). Decrementing neighbor ${v} in-degree.`,
        u,
        v,
      );

      if (currentInDegree[v] === 0) {
        queue.push(v);
        inQueueSet.add(v);
        addStep(
          17,
          `Enqueue Ready Neighbor Node ${v} (in_degree[${v}] == 0)`,
          `All incoming dependencies for node ${v} are satisfied. Enqueuing node ${v} into BFS queue.`,
          u,
          v,
        );
      } else {
        addStep(
          16,
          `Check In-Degree for Neighbor Node ${v}: in_degree[${v}] = ${currentInDegree[v]} != 0`,
          `Node ${v} still has ${currentInDegree[v]} pending incoming dependencies remaining.`,
          u,
          v,
        );
      }
    }
  }

  addStep(
    11,
    "BFS Queue Is Empty",
    "No remaining nodes in BFS queue. Checking completed topological order.",
  );

  addStep(
    19,
    `Return Final Topological Order: topo_order = [${topoOrder.map((n) => `N${n}`).join(", ")}]`,
    `Kahn's BFS Topological Sort complete. Ordered ${topoOrder.length} of ${numNodes} DAG nodes.`,
  );

  addStep(
    19,
    "Execution Complete",
    `Successfully computed topological order for all ${numNodes} nodes in the computation graph.`,
  );

  return steps;
};

const RECIPEINDEGREEKAHNBFS_TRIVIA: TriviaMeta = {
  skipLines: [7, 10, 18],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "in_degree[v] += 1",
  ],
  hints: [
    { line: 2, hint: "Initialize in_degree counter array for all graph nodes." },
    { line: 8, hint: "Enqueue root nodes with in_degree == 0 into BFS queue." },
    { line: 15, hint: "Decrement in_degree[v] for downstream neighbor nodes." },
    { line: 17, hint: "Enqueue neighbor v when in_degree[v] drops to 0." },
  ],
  lineExplanations: {
    1: "Defines entry point for recipe_indegree_kahn_bfs topological sort function.",
    2: "Allocates in_degree array initialized to 0 for num_nodes graph nodes.",
    3: "Allocates adjacency list array adj containing empty neighbor lists.",
    4: "Iterates through directed edge tuples (u, v) in graph.",
    5: "Appends target node v to source node u adjacency list adj[u].",
    6: "Increments in-degree count in_degree[v] for target destination node v.",
    7: "Empty line separating graph setup from root node queue initialization.",
    8: "List comprehension enqueuing source root nodes with in_degree == 0 into BFS queue.",
    9: "Initializes empty list topo_order to store topologically ordered node IDs.",
    10: "Empty line separating queue setup from main BFS loop.",
    11: "Executes Kahn's BFS queue loop while queue contains ready zero in-degree nodes.",
    12: "Pops current vertex u from front of BFS queue (queue.pop(0)).",
    13: "Appends popped node u to linear topological result list topo_order.",
    14: "Iterates through outgoing neighbor nodes v in adjacency list adj[u].",
    15: "Decrements in-degree count in_degree[v] after processing parent edge u -> v.",
    16: "Checks if neighbor v has zero remaining incoming dependencies (in_degree[v] == 0).",
    17: "Enqueues neighbor node v into BFS queue when all upstream parents are processed.",
    18: "Empty line before returning completed topological order.",
    19: "Returns completed topo_order list containing valid topological node sequence.",
  },
};

export const recipeIndegreeKahnBfs: AlgorithmDefinition<recipeIndegreeKahnBfsInput> = {
  id: "recipe-indegree-kahn-bfs",
  title: "Kahn's BFS Topological Sort",
  topicIds: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  description: `### Kahn's BFS Topological Sort

In deep learning autograd compilers (**PyTorch FX**, **XLA Graph Scheduler**, **TVM Pass Manager**, and **LeetCode 210**), **Topological Sorting** schedules graph operator nodes such that every parent operation executes *before* its downstream child operations consume its output.

#### Why It Exists & What It Solves
Directly executing computation DAGs without topological ordering leads to:
1. **Unresolved Dependencies**: A CUDA kernel attempting to read a tensor before its parent layer has written output data.
2. **Cycle Detection Failure**: Naive execution deadlocking on circular graph dependencies.

With **Kahn's In-Degree Reduction BFS**:
- Tracks incoming dependency edge count $\\text{in_degree}[v]$ for every node $v$.
- Enqueues all root source nodes ($\\text{in_degree}[v] == 0$) into a BFS queue.
- Iteratively pops nodes from the queue, appends them to \`topo_order\`, and decrements neighbor in-degrees ($\\text{in_degree}[v] -= 1$).
- When a neighbor's in-degree drops to 0, it is enqueued into the BFS queue.
- **Cycle Detection Guarantee**: If $\\text{len}(\\text{topo_order}) < N$, a cycle exists in the graph!

#### Step-by-Step Mechanism
1. **Initialize In-Degrees**: Allocate \`in_degree = [0] * N\` and build adjacency list \`adj\`.
2. **Enqueue Source Roots**: Populate \`queue = [i for i in range(N) if in_degree[i] == 0]\`.
3. **Kahn's Queue Processing Loop**: While \`queue\` is non-empty:
   - Pop node $u = \\text{queue.pop(0)}$.
   - Append $u$ to \`topo_order\`.
   - For each neighbor $v \\in \\text{adj}[u]$:
     - Decrement $\\text{in_degree}[v] -= 1$.
     - If $\\text{in_degree}[v] == 0$, push $v$ to \`queue\`.
4. **Return Topological Sequence**: Return \`topo_order\`.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(V + E)$ linear time over $V$ vertices and $E$ directed edges.
- **Space Complexity**: $\\mathcal{O}(V + E)$ memory for adjacency list and BFS queue.
- **Trade-Off**: Provides deterministic, queue-driven topological ordering with built-in cycle detection at linear computational cost.`,
  constraints: ["1 <= numNodes <= 1000", "0 <= edges.length <= 5000"],
  examples: [
    {
      kind: "basic",
      title: "Standard Autograd Pass",
      inputDisplay: "numNodes = 6, edges = [[5,2], [5,0], [4,0], [4,1], [2,3], [3,1]]",
      outputDisplay: "topo_order = [4, 5, 0, 2, 3, 1]",
      input: {
        numNodes: 6,
        edges: [
          [5, 2],
          [5, 0],
          [4, 0],
          [4, 1],
          [2, 3],
          [3, 1],
        ],
      },
      output: "[4, 5, 0, 2, 3, 1]",
      explanation: "Standard execution pass over computation graph DAG.",
    },
    {
      kind: "complex",
      title: "Linear Chain DAG",
      inputDisplay: "numNodes = 4, edges = [[0, 1], [1, 2], [2, 3]]",
      outputDisplay: "topo_order = [0, 1, 2, 3]",
      input: {
        numNodes: 4,
        edges: [
          [0, 1],
          [1, 2],
          [2, 3],
        ],
      },
      output: "[0, 1, 2, 3]",
      explanation: "Evaluates simple linear chain DAG.",
    },
    {
      kind: "negative",
      title: "Disjoint DAG Components",
      inputDisplay: "numNodes = 4, edges = [[0, 1], [2, 3]]",
      outputDisplay: "topo_order = [0, 2, 1, 3]",
      input: {
        numNodes: 4,
        edges: [
          [0, 1],
          [2, 3],
        ],
      },
      output: "[0, 2, 1, 3]",
      explanation: "Processes disjoint independent graph components in DAG.",
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
        body: "Implementation computes in-degrees, enqueues `in_degree == 0` nodes, pops queue, appends to `topo_order`, decrements neighbor in-degrees, and enqueues newly freed nodes.",
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
