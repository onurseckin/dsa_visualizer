import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface TopologicalSortDagInput {
  numNodes: number;
  edges: [number, number][];
}

export const TOPOLOGICAL_SORT_DAG_CODE = `def topological_sort_dag(num_nodes: int, edges: list[list[int]]) -> list[int]:
    adj = {i: [] for i in range(num_nodes)}
    in_degree = [0] * num_nodes
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
    if len(topo_order) != num_nodes:
        return []
    return topo_order`;

export const DEFAULT_TOPOLOGICAL_SORT_DAG_INPUT: TopologicalSortDagInput = {
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

export const generateTopologicalSortDagSteps = (
  input: TopologicalSortDagInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { numNodes, edges } = input;

  const adj: number[][] = Array.from({ length: numNodes }, () => []);
  const inDegree: number[] = Array(numNodes).fill(0);

  for (const [u, v] of edges) {
    if (u >= 0 && u < numNodes && v >= 0 && v < numNodes) {
      adj[u].push(v);
      inDegree[v]++;
    }
  }

  const buildGraphSnapshot = (
    activeNode: number | null,
    activeNeighbor: number | null,
    inQueue: Set<number>,
    processed: Set<number>,
    currentInDegrees: number[],
  ): { nodes: GraphNodeItem[]; edges: GraphEdgeItem[] } => {
    const nodes: GraphNodeItem[] = Array.from({ length: numNodes }, (_, i) => {
      let state: GraphNodeItem["state"] = "default";
      if (i === activeNode) state = "active";
      else if (i === activeNeighbor) state = "compare";
      else if (inQueue.has(i)) state = "queued";
      else if (processed.has(i)) state = "sorted";

      return {
        id: `node-${i}`,
        label: `N${i}`,
        val: currentInDegrees[i],
        state,
      };
    });

    const edgeItems: GraphEdgeItem[] = edges.map(([u, v]) => {
      const isCurrentEdge = u === activeNode && v === activeNeighbor;
      const isSourceProcessed = processed.has(u);
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
    activeNode: number | null,
    activeNeighbor: number | null,
    inQueueSet: Set<number>,
    processedSet: Set<number>,
    topoOrder: number[],
    currentInDegrees: number[],
    queueArr: number[],
  ) => {
    const { nodes, edges: graphEdges } = buildGraphSnapshot(
      activeNode,
      activeNeighbor,
      inQueueSet,
      processedSet,
      currentInDegrees,
    );

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
        queue: queueArr.map((n) => `N${n}`),
        visited: topoOrder.map((n) => `N${n}`),
        customState: {
          inDegrees: currentInDegrees.map((deg, i) => `N${i}:${deg}`).join(", "),
          topoOrder: `[${topoOrder.map((n) => `N${n}`).join(", ")}]`,
        },
      },
      variables: {
        activeNode: activeNode !== null ? activeNode : -1,
        activeNeighbor: activeNeighbor !== null ? activeNeighbor : -1,
        queueSize: queueArr.length,
        processedCount: topoOrder.length,
      },
    });
  };

  const currentInDegree = [...inDegree];
  const queue: number[] = [];
  const inQueueSet = new Set<number>();
  const processedSet = new Set<number>();
  const topoOrder: number[] = [];

  addStep(
    3,
    `Compute graph in-degrees and build adjacency list`,
    `Calculated initial in-degrees for all ${numNodes} nodes based on graph edges. Nodes with in-degree 0 have no incoming dependencies.`,
    null,
    null,
    inQueueSet,
    processedSet,
    topoOrder,
    [...currentInDegree],
    [...queue],
  );

  for (let i = 0; i < numNodes; i++) {
    if (currentInDegree[i] === 0) {
      queue.push(i);
      inQueueSet.add(i);
    }
  }

  addStep(
    7,
    `Initialize execution queue with zero in-degree nodes`,
    `Found initial root nodes with 0 in-degree: [${queue.map((n) => `N${n}`).join(", ")}]. These nodes are ready to execute.`,
    null,
    null,
    inQueueSet,
    processedSet,
    topoOrder,
    [...currentInDegree],
    [...queue],
  );

  while (queue.length > 0) {
    const u = queue.shift()!;
    inQueueSet.delete(u);
    processedSet.add(u);
    topoOrder.push(u);

    addStep(
      11,
      `Pop node N${u} from queue and append to topological order`,
      `Node N${u} has zero remaining prerequisites. Added to topological order at index ${topoOrder.length - 1}.`,
      u,
      null,
      inQueueSet,
      processedSet,
      [...topoOrder],
      [...currentInDegree],
      [...queue],
    );

    for (const v of adj[u]) {
      currentInDegree[v]--;

      addStep(
        13,
        `Decrement in-degree of child node N${v} (new in-degree = ${currentInDegree[v]})`,
        `Dependency N${u} -> N${v} satisfied. Decremented remaining dependency count of N${v}.`,
        u,
        v,
        inQueueSet,
        processedSet,
        [...topoOrder],
        [...currentInDegree],
        [...queue],
      );

      if (currentInDegree[v] === 0) {
        queue.push(v);
        inQueueSet.add(v);

        addStep(
          15,
          `Enqueue N${v} into execution queue (In-degree reached 0)`,
          `All parent dependencies for N${v} are satisfied. Node N${v} is now unblocked and ready for scheduling.`,
          u,
          v,
          inQueueSet,
          processedSet,
          [...topoOrder],
          [...currentInDegree],
          [...queue],
        );
      }
    }
  }

  if (topoOrder.length !== numNodes) {
    addStep(
      17,
      "Cycle detected in computational graph!",
      `Processed ${topoOrder.length}/${numNodes} nodes. Directed cyclic dependency prevents valid topological ordering; returning empty list [].`,
      null,
      null,
      inQueueSet,
      processedSet,
      [...topoOrder],
      [...currentInDegree],
      [...queue],
    );
  } else {
    addStep(
      18,
      "Topological Sort Complete",
      `Valid execution order computed: [${topoOrder.map((n) => `N${n}`).join(", ")}].`,
      null,
      null,
      inQueueSet,
      processedSet,
      [...topoOrder],
      [...currentInDegree],
      [...queue],
    );
  }

  return steps;
};

export const TOPOLOGICAL_SORT_DAG_TRIVIA: TriviaMeta = {
  skipLines: [2, 4],
  hints: [
    { line: 7, hint: "Find starting nodes with 0 in-degree" },
    { line: 10, hint: "Pop front node u and append to topological order" },
    { line: 13, hint: "Decrement in-degree of children and enqueue when 0" },
  ],
  distractors: ["in_degree[u] += 1", "queue.append(u)", "if len(topo_order) == 0: return []"],
};

export const topologicalSortDag: AlgorithmDefinition<TopologicalSortDagInput> = {
  id: "topological-sort-dag",
  title: "Topological Sort DAG (Kahn's / DFS)",
  topicIds: ["ml_autograd_dags"],
  difficulty: "Medium",
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" }],
  description:
    "Order nodes in a Directed Acyclic Graph (DAG) using Kahn's algorithm (in-degree BFS), essential for autograd compute graph execution.",
  code: TOPOLOGICAL_SORT_DAG_CODE,
  defaultInput: DEFAULT_TOPOLOGICAL_SORT_DAG_INPUT,
  examples: [
    {
      kind: "basic",
      title: "6-Node Autograd DAG Sort",
      input: DEFAULT_TOPOLOGICAL_SORT_DAG_INPUT,
      output: "[4, 5, 0, 1, 2, 3]",
      explanation: "Nodes with 0 in-degree (4 and 5) execute first, followed by downstream nodes.",
    },
    {
      kind: "complex",
      title: "Linear Pipeline DAG",
      input: {
        numNodes: 4,
        edges: [
          [0, 1],
          [1, 2],
          [2, 3],
        ],
      },
      output: "[0, 1, 2, 3]",
      explanation: "Sequential chain processes strictly in topological order 0 -> 1 -> 2 -> 3.",
    },
    {
      kind: "negative",
      title: "Cyclic Graph Failure",
      input: {
        numNodes: 3,
        edges: [
          [0, 1],
          [1, 2],
          [2, 0],
        ],
      },
      output: "[]",
      explanation: "Cycle 0 -> 1 -> 2 -> 0 prevents zero-in-degree scheduling.",
    },
  ],
  timeComplexity: {
    best: "O(V + E)",
    average: "O(V + E)",
    worst: "O(V + E)",
  },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Each node and edge is visited once, achieving O(V + E) linear time complexity.",
    space: "O(V + E) for adjacency list, in-degree array, and queue storage.",
  },
  topicGuide: {
    overview:
      "Topological Sorting linearly orders vertices in a DAG such that for every directed edge u -> v, vertex u comes before v. Autograd engines like PyTorch use topological sorting to execute forward passes and reverse topological order for backward autograd passes.",
    sections: [
      {
        heading: "Forward Pass vs Backward Pass",
        body: "Forward evaluation follows topological order (inputs to loss). Backward gradient evaluation follows reverse topological order (loss back to parameters).",
      },
    ],
    keyTerms: [
      { term: "DAG", definition: "Directed Acyclic Graph containing no directed cycles." },
      {
        term: "In-Degree",
        definition: "The number of incoming directed edges pointing to a graph node.",
      },
    ],
  },
  trivia: TOPOLOGICAL_SORT_DAG_TRIVIA,
  generateSteps: generateTopologicalSortDagSteps,
};
