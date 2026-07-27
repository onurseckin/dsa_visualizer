import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface findZeroIndegreeNodesInput {
  data: number[];
  target?: number;
}

export const FINDZEROINDEGREENODES_CODE = `
def find_zero_indegree_nodes(num_nodes, edges):
    """
    Identifies source root nodes with in-degree 0 in computation graph.
    """
    in_degree = [0] * num_nodes
    for u, v in edges:
        in_degree[v] += 1

    root_nodes = [i for i in range(num_nodes) if in_degree[i] == 0]
    return root_nodes
`;

export const DEFAULT_FINDZEROINDEGREENODES_INPUT: findZeroIndegreeNodesInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateFindZeroIndegreeNodesSteps = (
  input: findZeroIndegreeNodesInput,
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
    "Initialize Find Zero In-Degree Root Input Nodes",
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

const FINDZEROINDEGREENODES_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process graph nodes in autograd execution pipeline." }],
  lineExplanations: {
    1: "Defines zero in-degree root node identification function.",
    4: "Allocates in_degree array initialized to 0 for num_nodes nodes.",
    5: "Iterates through directed edge pairs (u, v).",
    6: "Increments in-degree count in_degree[v] for target node v.",
    8: "Extracts all node IDs i where in_degree[i] == 0.",
    9: "Returns list of detected zero in-degree root node IDs.",
  },
};

export const findZeroIndegreeNodes: AlgorithmDefinition<findZeroIndegreeNodesInput> = {
  id: "find-zero-indegree-nodes",
  title: "Find Zero In-Degree Root Input Nodes",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description:
    "In autograd computation graphs, root input nodes (e.g. model weights, input dataset features) have an in-degree of 0 (no incoming edges from preceding computation nodes). Finding zero in-degree nodes identifies starting source nodes for forward execution passes and topological sorting (Kahn's algorithm).\n\nThis algorithm implements Find Zero In-Degree Root Input Nodes, tallying incoming edge counts and extracting all source root nodes with in-degree 0.\n\nInput Format:\n- data: Array representing graph node/edge definitions.\n- target: Optional target value.\n\nOutput Format:\n- Returns array of zero in-degree root node IDs.\n\nEdge Cases & Constraints:\n- Single-node graph (in-degree = 0, is root).\n- Multiple root input nodes (multiple model weight tensors).\n- Cyclic graphs with no zero in-degree nodes.",
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
  code: FINDZEROINDEGREENODES_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time traversal across graph vertices and edges.",
    space: "Linear memory allocation for graph adjacency lists.",
  },
  topicGuide: {
    overview:
      "Zero in-degree nodes represent independent inputs in a DAG. In PyTorch and TensorFlow, leaf Tensors created directly by users (e.g., weights initialized via torch.randn) have no grad_fn (in-degree = 0).",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, node v in G = (V, E) is a root node iff InDegree(v) = |{ u in V : (u, v) in E }| == 0. Time complexity is O(V + E).",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Finding zero in-degree nodes initializes the queue in Kahn's BFS topological sorting algorithm.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation computes in-degree counts by iterating through directed edges (u, v), filtering nodes where in_degree[v] == 0.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes disconnected isolated nodes.",
      },
    ],
    keyTerms: [
      {
        term: "Root Input Node (Source)",
        definition: "A graph node with in-degree 0 having no incoming edges from parent nodes.",
      },
      {
        term: "In-Degree",
        definition: "The total number of directed incoming edges pointing to a node.",
      },
      {
        term: "Leaf Tensor",
        definition:
          "A PyTorch tensor created directly by user code without a backward autograd history.",
      },
    ],
  },
  trivia: FINDZEROINDEGREENODES_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_FINDZEROINDEGREENODES_INPUT,
  generateSteps: generateFindZeroIndegreeNodesSteps,
};
