import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface detectTerminalNodesInput {
  data: number[];
  target?: number;
}

export const DETECTTERMINALNODES_CODE = `
def detect_terminal_nodes(num_nodes, edges):
    """
    Finds leaf sink nodes with out-degree 0 in autograd computation graph.
    """
    out_degree = [0] * num_nodes
    for u, v in edges:
        out_degree[u] += 1

    terminal_nodes = [i for i in range(num_nodes) if out_degree[i] == 0]
    return terminal_nodes
`;

export const DEFAULT_DETECTTERMINALNODES_INPUT: detectTerminalNodesInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateDetectTerminalNodesSteps = (
  input: detectTerminalNodesInput,
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
    "Initialize Detect Terminal Leaf Nodes in DAG",
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
    10,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const DETECTTERMINALNODES_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process graph nodes in autograd execution pipeline." }],
  lineExplanations: {
    1: "Defines terminal node detection function.",
    4: "Allocates out_degree array initialized to 0 for num_nodes nodes.",
    5: "Iterates through directed edges (u, v).",
    6: "Increments out-degree count out_degree[u] for source node u.",
    8: "Extracts all node IDs i where out_degree[i] == 0.",
    9: "Returns list of detected terminal sink node IDs.",
  },
};

export const detectTerminalNodes: AlgorithmDefinition<detectTerminalNodesInput> = {
  id: "detect-terminal-nodes",
  title: "Detect Terminal Leaf Nodes in DAG",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description:
    "In autograd engines, loss output nodes and terminal leaf nodes have an out-degree of 0 (no outgoing dependency edges). Identifying terminal nodes determines where backward gradient propagation must begin (e.g. dL/dL = 1.0).\n\nThis algorithm implements Detect Terminal Leaf Nodes in DAG, counting outgoing node degree counts and extracting all sink nodes with out-degree 0.\n\nInput Format:\n- data: Array representing node/edge definitions.\n- target: Optional target value.\n\nOutput Format:\n- Returns array of terminal sink node IDs.\n\nEdge Cases & Constraints:\n- Graph with single node (out-degree = 0, is terminal).\n- Multiple terminal loss nodes (multi-task learning).\n- Graph with no terminal nodes (invalid, contains cycles).",
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
  code: DETECTTERMINALNODES_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time traversal across graph vertices and edges.",
    space: "Linear memory allocation for graph adjacency lists.",
  },
  topicGuide: {
    overview:
      "Terminal nodes (sinks) in a computation DAG represent final output scalar loss tensors. Autograd engines initialize backward gradient passes from terminal nodes by assigning upstream gradient 1.0.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, a node v in G = (V, E) is a terminal node iff OutDegree(v) = |{ u in V : (v, u) in E }| == 0. Time complexity is O(V + E).",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Terminal node detection is used in PyTorch autograd graph pruning to prune unused intermediate computation subtrees.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation computes out-degree counts for all nodes by iterating through directed edges, filtering nodes with out_degree[i] == 0.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes isolated nodes (in-degree=0, out-degree=0).",
      },
    ],
    keyTerms: [
      {
        term: "Terminal Node (Sink)",
        definition: "A graph node with out-degree 0 having no outgoing edges to downstream nodes.",
      },
      {
        term: "Out-Degree",
        definition: "The total number of directed edges originating from a node.",
      },
      {
        term: "Loss Output Node",
        definition:
          "The final scalar node in a neural network computation graph whose value is minimized.",
      },
    ],
  },
  trivia: DETECTTERMINALNODES_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_DETECTTERMINALNODES_INPUT,
  generateSteps: generateDetectTerminalNodesSteps,
};
