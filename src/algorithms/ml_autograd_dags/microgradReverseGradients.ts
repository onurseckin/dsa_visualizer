import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface microgradReverseGradientsInput {
  data: number[];
  target?: number;
}

export const MICROGRADREVERSEGRADIENTSS_CODE = `
def micrograd_reverse_gradients(nodes, edges):
    """
    Topologically sorts computation DAG and triggers reverse-mode gradient propagation.
    """
    topo = []
    visited = set()

    def build_topo(v):
        if v not in visited:
            visited.add(v)
            for child in edges.get(v, []):
                build_topo(child)
            topo.append(v)

    for node in nodes:
        build_topo(node)

    gradients = {v: 0.0 for v in nodes}
    if topo:
        gradients[topo[-1]] = 1.0

    for v in reversed(topo):
        g = gradients[v]
        for child in edges.get(v, []):
            gradients[child] += g

    return gradients
`;

export const DEFAULT_MICROGRADREVERSEGRADIENTS_INPUT: microgradReverseGradientsInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};
export const DEFAULT_MICROGRADREVERSEGRADIENTSS_INPUT = DEFAULT_MICROGRADREVERSEGRADIENTS_INPUT;

export const generateMicrogradReverseGradientsSteps = (
  input: microgradReverseGradientsInput,
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
    "Initialize Micrograd Reverse-Mode Automatic Differentiation",
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
    27,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const MICROGRADREVERSEGRADIENTSS_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process graph nodes in autograd execution pipeline." }],
  lineExplanations: {
    1: "Defines Micrograd reverse-mode automatic differentiation function.",
    4: "Initializes topological sort list topo.",
    5: "Initializes visited node set.",
    7: "Defines post-order DFS helper function build_topo.",
    9: "Visits unvisited child nodes recursively.",
    11: "Appends node v to topo list after visiting all children.",
    16: "Initializes gradients dictionary for all nodes to 0.0.",
    18: "Sets output loss node gradient (topo[-1]) to 1.0.",
    20: "Iterates through nodes v in reverse topological order.",
    21: "Fetches accumulated gradient g for node v.",
    23: "Propagates gradient g to child nodes: gradients[child] += g.",
    25: "Returns dictionary of computed node loss gradients.",
  },
};

export const microgradReverseGradients: AlgorithmDefinition<microgradReverseGradientsInput> = {
  id: "micrograd-reverse-gradients",
  title: "Micrograd Reverse-Mode Automatic Differentiation",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description:
    "Reverse-mode automatic differentiation (backpropagation) computes gradients of a loss output scalar with respect to all leaf input weights in O(N) time. The algorithm topologically sorts computation DAG nodes, sets loss gradient dL/dL = 1.0, and iterates through nodes in reverse topological order, calling local backward functions to accumulate gradients into child nodes.\n\nThis algorithm implements Micrograd Reverse-Mode Automatic Differentiation, building reverse topological ordering and executing backward chain rule gradient propagation.\n\nInput Format:\n- data: Array representing node/edge graph data.\n- target: Optional target value.\n\nOutput Format:\n- Returns dictionary mapping node IDs to computed loss gradients.\n\nEdge Cases & Constraints:\n- Single-node graph (gradient = 1.0).\n- Diamond-shaped DAGs (verifying multivariable chain rule sum).\n- Disconnected graph components.",
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
  code: MICROGRADREVERSEGRADIENTSS_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time traversal across graph vertices and edges.",
    space: "Linear memory allocation for graph adjacency lists.",
  },
  topicGuide: {
    overview:
      "Reverse-mode autograd (backpropagation) is the core algorithm powering PyTorch torch.autograd.backward() and Micrograd value.backward(). Topologically sorting nodes guarantees that a node's total upstream gradient is fully accumulated before propagating gradients to its children.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, reverse mode evaluates dL/dx for all nodes x in O(|V| + |E|) time regardless of input parameter count. This enables training deep neural networks with millions of parameters in a single backward pass.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Without topological sorting, propagating gradients out-of-order yields incomplete intermediate gradients, producing incorrect final weight derivatives.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation builds topological ordering via post-order DFS, initializes loss gradient to 1.0, and steps backward through topo list accumulating gradients to children.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes diamond DAG structures (where node output branches to multiple paths).",
      },
    ],
    keyTerms: [
      {
        term: "Reverse Topological Order",
        definition:
          "Ordering graph nodes such that parent nodes are evaluated before child nodes during backward pass.",
      },
      {
        term: "Backpropagation",
        definition:
          "Propagating loss gradients backwards through a computation DAG using the chain rule.",
      },
      {
        term: "Multivariable Accumulation",
        definition:
          "Summing gradients from multiple downstream paths to compute total partial derivative.",
      },
    ],
  },
  trivia: MICROGRADREVERSEGRADIENTSS_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_MICROGRADREVERSEGRADIENTSS_INPUT,
  generateSteps: generateMicrogradReverseGradientsSteps,
};
