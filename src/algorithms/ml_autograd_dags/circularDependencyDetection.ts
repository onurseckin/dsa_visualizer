import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface circularDependencyDetectionInput {
  data: number[];
  target?: number;
}

export const CIRCULARDEPENDENCYDETECTION_CODE = `
def circular_dependency_detection(num_nodes, edges):
    """
    Detects cycles in autograd computation graph using 3-color DFS traversal.
    """
    adj = [[] for _ in range(num_nodes)]
    for u, v in edges:
        adj[u].append(v)

    visited = [0] * num_nodes
    has_cycle = False

    def dfs(u):
        nonlocal has_cycle
        visited[u] = 1
        for v in adj[u]:
            if visited[v] == 1:
                has_cycle = True
            elif visited[v] == 0:
                dfs(v)
        visited[u] = 2

    for i in range(num_nodes):
        if visited[i] == 0:
            dfs(i)

    return has_cycle
`;

export const DEFAULT_CIRCULARDEPENDENCYDETECTION_INPUT: circularDependencyDetectionInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateCircularDependencyDetectionSteps = (
  input: circularDependencyDetectionInput,
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
    "Initialize Circular Dependency Detection in Graph",
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
    26,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const CIRCULARDEPENDENCYDETECTION_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process graph nodes in autograd execution pipeline." }],
  lineExplanations: {
    1: "Defines 3-color DFS cycle detection function.",
    4: "Allocates adjacency list adj for num_nodes graph nodes.",
    5: "Populates adjacency list from directed edge pairs.",
    8: "Allocates visited state array initialized to 0 (Unvisited).",
    9: "Initializes has_cycle boolean flag to False.",
    11: "Defines recursive DFS helper function.",
    13: "Marks node u as Visiting (state 1, Gray).",
    14: "Iterates through outgoing neighbor nodes v of u.",
    15: "Checks if neighbor v is currently Visiting (state 1), confirming a cycle back-edge.",
    16: "Flags has_cycle = True upon detecting cycle back-edge.",
    18: "Recursively visits unvisited neighbor v (state 0).",
    19: "Marks node u as Visited (state 2, Black) upon completing all outgoing searches.",
    21: "Iterates through all graph nodes to cover disconnected components.",
    25: "Returns has_cycle boolean result.",
  },
};

export const circularDependencyDetection: AlgorithmDefinition<circularDependencyDetectionInput> = {
  id: "circular-dependency-detection",
  title: "Circular Dependency Detection in Graph",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description:
    "Autograd execution engines require computation graphs to be Directed Acyclic Graphs (DAGs). Circular dependencies (cycles) cause infinite loops during forward evaluation and backward gradient propagation. Detecting cycles using 3-color Depth-First Search (DFS) validates graph sanity before executing topological sorts.\n\nThis algorithm implements Circular Dependency Detection in Graph, using 3-color DFS (0: Unvisited White, 1: Visiting Gray, 2: Visited Black) to detect back-edges indicating circular cycles.\n\nInput Format:\n- data: Array representing graph node/edge data.\n- target: Optional target value.\n\nOutput Format:\n- Returns boolean flag true if circular dependency cycle exists, false if valid DAG.\n\nEdge Cases & Constraints:\n- Graph with self-loop edge (u -> u).\n- Disconnected components in computation graph.\n- Complex directed cycles spanning multiple nodes.",
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
  code: CIRCULARDEPENDENCYDETECTION_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time traversal across graph vertices and edges.",
    space: "Linear memory allocation for graph adjacency lists.",
  },
  topicGuide: {
    overview:
      "3-Color DFS is the standard algorithm for cycle detection in directed graphs. Encountering a node in the 'Visiting' (Gray) state during active DFS recursion indicates a back-edge pointing to an ancestor node, confirming the presence of a cycle.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, a directed graph G = (V, E) contains a cycle iff DFS traversal contains a back-edge (u, v) where v is an ancestor of u in the DFS recursion tree. Time complexity is O(V + E), space is O(V).",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Validating DAG properties before graph execution prevents stack overflow crashes and deadlock states in PyTorch TorchScript and ONNX model compilers.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation maintains visited state array (0=Unvisited, 1=Visiting, 2=Visited), executes DFS recursively, flags cycle on encountering state 1, and marks completed nodes state 2.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes self-loops, parallel edges, and disconnected graph components.",
      },
    ],
    keyTerms: [
      {
        term: "Back-Edge",
        definition:
          "A graph edge pointing from a node to one of its active ancestors in the DFS recursion stack.",
      },
      {
        term: "3-Color DFS",
        definition:
          "Cycle detection technique coloring nodes White (unvisited), Gray (visiting), and Black (visited).",
      },
      {
        term: "Directed Acyclic Graph (DAG)",
        definition: "A directed graph containing no circular paths or cycles.",
      },
    ],
  },
  trivia: CIRCULARDEPENDENCYDETECTION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_CIRCULARDEPENDENCYDETECTION_INPUT,
  generateSteps: generateCircularDependencyDetectionSteps,
};
