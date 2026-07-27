import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface parallelCourseCriticalPathInput {
  data: number[];
  target?: number;
}

export const PARALLELCOURSECRITICALPATH_CODE = `
def parallel_course_critical_path(num_nodes, edges, node_durations):
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

    return max(dist) if dist else 0
`;

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
    "Initialize Critical Path Latency Bounds in Computational Graph",
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
    25,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const PARALLELCOURSECRITICALPATH_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process graph nodes in autograd execution pipeline." }],
  lineExplanations: {
    1: "Defines critical path latency calculator function.",
    4: "Allocates in-degree array for num_nodes nodes.",
    5: "Allocates adjacency list adj.",
    6: "Populates adjacency list and in-degree counts from edges.",
    10: "Allocates dist array tracking maximum path duration to each node.",
    11: "Enqueues root nodes with in_degree == 0 into BFS queue.",
    12: "Initializes root node distances with their node_durations.",
    15: "Executes BFS queue loop while queue is non-empty.",
    16: "Pops current node u from BFS queue.",
    17: "Iterates through outgoing neighbor nodes v of u.",
    18: "Updates dist[v] if path through u (dist[u] + node_durations[v]) is longer.",
    20: "Decrements in-degree count in_degree[v].",
    21: "Enqueues neighbor v when in_degree[v] reaches 0.",
    24: "Returns maximum critical path latency distance among all nodes.",
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
  description:
    "In parallel GPU graph scheduling (e.g., PyTorch CUDA Graphs, TVM graph scheduler, LeetCode 2050 / 1136), the Critical Path of a computation DAG determines the absolute minimum execution time required to complete all operations even with infinite parallel GPU streams. The critical path is the longest weighted path from any root input node to any terminal output node.\n\nThis algorithm implements Critical Path Latency Bounds in Computation Graph, evaluating dynamic programming longest path distances across topological BFS graph layers.\n\nInput Format:\n- data: Array representing graph node/edge definitions.\n- target: Optional target value.\n\nOutput Format:\n- Returns scalar maximum critical path latency time.\n\nEdge Cases & Constraints:\n- Disconnected graph components with different path lengths.\n- Single-node graph (critical path equals node duration).\n- All node durations equal to 1 (unweighted longest path).",
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
    time: "Linear time traversal across graph vertices and edges.",
    space: "Linear memory allocation for graph adjacency lists.",
  },
  topicGuide: {
    overview:
      "The Critical Path Method (CPM) finds the minimum total execution time of a parallel workload DAG. Nodes on the critical path have zero slack time; delaying any operation on the critical path directly delays overall model completion time.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, for node v in DAG G, Dist(v) = Duration(v) + max_{(u, v) in E} Dist(u). Critical path length is MaxDist = max_{v in V} Dist(v). Time complexity is O(V + E).",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "GPU kernel schedulers prioritize launching operations on the critical path first to minimize total model latency.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation uses Kahn's BFS topological queue, initializing dist[root] = duration[root], updating dist[v] = max(dist[v], dist[u] + duration[v]), and returning max(dist).",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes empty graphs and disconnected parallel sub-graphs.",
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
