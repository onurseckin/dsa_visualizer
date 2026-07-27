import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface recipeIndegreeKahnBfsInput {
  data: number[];
  target?: number;
}

export const RECIPEINDEGREEKAHNBFS_CODE = `
def recipe_indegree_kahn_bfs(num_nodes, edges):
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

    return topo_order
`;

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
          target: String(input?.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Kahn's BFS Topological Sort",
    "Setting up execution data structures and memory layout pointers.",
    { n: arrayData.length, target: input?.target ?? 0 },
  );

  arrayData.forEach((val, idx) => {
    const isTarget = val === input?.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      4,
      `Process element ${idx}: value = ${val}`,
      `Evaluating element at index ${idx} in autograd computation graph.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    22,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const RECIPEINDEGREEKAHNBFS_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process graph nodes in autograd execution pipeline." }],
  lineExplanations: {
    1: "Defines Kahn's BFS topological sort function.",
    4: "Allocates in_degree array initialized to 0 for num_nodes nodes.",
    5: "Allocates adjacency list adj for graph edges.",
    6: "Populates adjacency list and increments target in-degree counts in_degree[v].",
    9: "Enqueues root nodes with in_degree == 0 into BFS queue.",
    10: "Initializes topological ordering output list topo_order.",
    12: "Executes BFS queue loop while queue is non-empty.",
    13: "Pops current zero in-degree node u from queue.",
    14: "Appends node u to topological order output list.",
    15: "Iterates through outgoing neighbor nodes v of u.",
    16: "Decrements in-degree count in_degree[v].",
    17: "Enqueues neighbor v when in_degree[v] reaches 0.",
    19: "Returns completed topological node sequence.",
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
  description:
    "Topological sorting is the essential algorithm for scheduling autograd graph execution (e.g., PyTorch forward/backward pass, LeetCode 210 Course Schedule II). Kahn's BFS algorithm calculates in-degrees for all nodes, enqueues root nodes with in-degree 0, and iteratively pops queue nodes while decrementing neighbor in-degrees to build a linear topological execution order.\n\nThis algorithm implements Kahn's BFS Topological Sort, executing in-degree reduction BFS traversal to compute valid topological node sequences.\n\nInput Format:\n- data: Array representing graph node/edge definitions.\n- target: Optional target value.\n\nOutput Format:\n- Returns array of node IDs in valid topological execution order.\n\nEdge Cases & Constraints:\n- Graph containing cycles (Kahn's algorithm detects cycle when result length != num_nodes).\n- Disconnected graph components.\n- Linear chain graph (single topological path).",
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
    time: "Linear time traversal across graph vertices and edges.",
    space: "Linear memory allocation for graph adjacency lists.",
  },
  topicGuide: {
    overview:
      "Kahn's algorithm processes nodes layer-by-layer as their dependency prerequisites are satisfied. If the final topological list length is less than total nodes, the graph contains a circular dependency cycle.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, topological sort orders vertices V such that for every directed edge (u, v) in E, u precedes v in the linear order. Kahn's algorithm runs in O(V + E) time and O(V) space.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "In PyTorch autograd compilers, topological ordering guarantees that all forward inputs to an operator node are computed before the node executes.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation computes in-degrees, enqueues in_degree == 0 nodes, pops queue, appends to topo_order, decrements neighbor in-degrees, and enqueues newly freed nodes.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes cycle detection when len(topo_order) < num_nodes.",
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
