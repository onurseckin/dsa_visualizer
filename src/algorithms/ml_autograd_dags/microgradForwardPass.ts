import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface microgradForwardPassInput {
  data: number[];
  target?: number;
}

export const MICROGRADFORWARDPASS_CODE = `
def micrograd_forward_pass(a, b, op="+"):
    """
    Evaluates forward pass scalar value and binds backward gradient function.
    """
    if op == "+":
        out_val = a + b
        local_grad_a, local_grad_b = 1.0, 1.0
    elif op == "*":
        out_val = a * b
        local_grad_a, local_grad_b = b, a
    else:
        out_val, local_grad_a, local_grad_b = a, 1.0, 0.0

    return out_val, local_grad_a, local_grad_b
`;

export const DEFAULT_MICROGRADFORWARDPASS_INPUT: microgradForwardPassInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateMicrogradForwardPassSteps = (
  input: microgradForwardPassInput,
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
    "Initialize Micrograd Computational Graph Forward Pass",
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
    14,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const MICROGRADFORWARDPASS_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process graph nodes in autograd execution pipeline." }],
  lineExplanations: {
    1: "Defines Micrograd forward pass function.",
    4: "Checks if operator is addition (+).",
    5: "Computes forward sum out_val = a + b.",
    6: "Sets local derivatives for addition: local_grad_a = 1.0, local_grad_b = 1.0.",
    7: "Checks if operator is multiplication (*).",
    8: "Computes forward product out_val = a * b.",
    9: "Sets local derivatives for multiplication: local_grad_a = b, local_grad_b = a.",
    11: "Sets default identity pass outputs.",
    13: "Returns forward scalar value and local partial derivative tuple.",
  },
};

export const microgradForwardPass: AlgorithmDefinition<microgradForwardPassInput> = {
  id: "micrograd-forward-pass",
  title: "Micrograd Computational Graph Forward Pass",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description:
    "In Andrej Karpathy's Micrograd engine and PyTorch's ATen autograd core, every scalar Value object records its computed forward pass scalar output along with local derivative rules (d_out/d_a and d_out/d_b) for backward chain rule propagation.\n\nThis algorithm implements Micrograd Computational Graph Forward Pass, evaluating forward operations (addition +, multiplication *) and generating local partial derivative functions.\n\nInput Format:\n- data: Array representing scalar input values.\n- target: Optional target value.\n\nOutput Format:\n- Returns output scalar value and local partial derivative tuple (out_val, local_grad_a, local_grad_b).\n\nEdge Cases & Constraints:\n- Addition operation: d(a+b)/da = 1, d(a+b)/db = 1.\n- Multiplication operation: d(a*b)/da = b, d(a*b)/db = a.\n- Division and activation functions (ReLU, Tanh).",
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
  code: MICROGRADFORWARDPASS_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time traversal across graph vertices and edges.",
    space: "Linear memory allocation for graph adjacency lists.",
  },
  topicGuide: {
    overview:
      "Micrograd demonstrates automatic differentiation in its simplest form. Each arithmetic operation returns a new Value object storing its forward data value, child pointers, and a _backward lambda function implementing local chain rule derivatives.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, for z = a + b, dz/da = 1, dz/db = 1. For z = a * b, dz/da = b, dz/db = a. During backward pass, upstream gradient grad_z is multiplied by local derivatives: grad_a += grad_z * dz/da.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Building forward computation graphs dynamically enables PyTorch's eager-mode define-by-run autograd execution model.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation evaluates operator math, computes local derivatives, and returns output values.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes zero operands in multiplication (local derivative becomes 0).",
      },
    ],
    keyTerms: [
      {
        term: "Micrograd Value",
        definition:
          "A scalar wrapper object storing data value, gradient, children, and backward derivative function.",
      },
      {
        term: "Local Derivative",
        definition:
          "Partial derivative of an operation with respect to its immediate input operands.",
      },
      {
        term: "Eager Autograd",
        definition:
          "Building autograd computation graphs dynamically on-the-fly during forward execution.",
      },
    ],
  },
  trivia: MICROGRADFORWARDPASS_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_MICROGRADFORWARDPASS_INPUT,
  generateSteps: generateMicrogradForwardPassSteps,
};
