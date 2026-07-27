import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface computeScalarChainRuleInput {
  data: number[];
  target?: number;
}

export const COMPUTESCALARCHAINRULE_CODE = `
def compute_scalar_chain_rule(op_history, upstream_grad=1.0):
    """
    Accumulates scalar chain rule gradients backwards through operation history.
    """
    gradients = {}
    curr_grad = upstream_grad

    for op, var_name, local_deriv in reversed(op_history):
        curr_grad = curr_grad * local_deriv
        gradients[var_name] = gradients.get(var_name, 0.0) + curr_grad

    return gradients
`;

export const DEFAULT_COMPUTESCALARCHAINRULE_INPUT: computeScalarChainRuleInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateComputeScalarChainRuleSteps = (
  input: computeScalarChainRuleInput,
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
    "Initialize Scalar Chain Rule Gradient Accumulator",
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
    12,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const COMPUTESCALARCHAINRULE_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process graph nodes in autograd execution pipeline." }],
  lineExplanations: {
    1: "Defines scalar chain rule gradient accumulator function.",
    4: "Initializes gradients dictionary to store variable gradient totals.",
    5: "Initializes running gradient curr_grad to upstream_grad (default 1.0).",
    7: "Iterates through operation history tuples in reverse execution order.",
    8: "Updates running gradient: curr_grad = curr_grad * local_deriv.",
    9: "Accumulates curr_grad into variable gradient entry gradients[var_name].",
    11: "Returns dictionary of accumulated scalar variable gradients.",
  },
};

export const computeScalarChainRule: AlgorithmDefinition<computeScalarChainRuleInput> = {
  id: "compute-scalar-chain-rule",
  title: "Scalar Chain Rule Gradient Accumulator",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description:
    "Automatic differentiation in scalar engines (e.g. Micrograd, PyTorch scalar autograd) evaluates partial derivatives using the calculus chain rule dL/dx = (dL/dy) * (dy/dx). Traversing operation history in reverse order accumulates gradients into target variables.\n\nThis algorithm implements Scalar Chain Rule Gradient Accumulator, stepping backward through operation history tuples (op, var_name, local_deriv) and accumulating total partial derivative gradients.\n\nInput Format:\n- data: Array representing operation history or input values.\n- target: Optional target value.\n\nOutput Format:\n- Returns dictionary mapping variable names to accumulated partial derivative gradients.\n\nEdge Cases & Constraints:\n- Multiple occurrences of same variable name (multivariable chain rule sum).\n- Upstream gradient initialization (default = 1.0 for loss output).\n- Zero local derivative values (gradient clipping / dead activation).",
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
  code: COMPUTESCALARCHAINRULE_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time traversal across graph vertices and edges.",
    space: "Linear memory allocation for graph adjacency lists.",
  },
  topicGuide: {
    overview:
      "The multivariable calculus chain rule dictates that if a variable x influences loss L through multiple computational paths y_1, y_2, ..., then dL/dx = sum_i (dL/dy_i) * (dy_i/dx). Accumulating gradients backwards correctly sums contributions across all paths.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, dL/dx = dL/dy * dy/dx. For composite functions L = f(g(h(x))), reverse pass computes dL/dh = 1.0 * f', dL/dg = dL/dh * g', dL/dx = dL/dg * h'.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Scalar chain rule accumulation is the foundation of PyTorch tensor backward passes. Each autograd node maintains a grad accumulator register.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation initializes running gradient curr_grad = 1.0, steps backward through op_history, updates curr_grad = curr_grad * local_deriv, and adds to gradients[var_name].",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes handling zero local derivatives (e.g., ReLU zero-gradient region).",
      },
    ],
    keyTerms: [
      {
        term: "Chain Rule",
        definition:
          "Calculus rule computing derivative of composite functions via product of intermediate derivatives.",
      },
      {
        term: "Gradient Accumulation",
        definition: "Summing partial derivative contributions across multiple computational paths.",
      },
      {
        term: "Local Derivative",
        definition: "The partial derivative dy/dx of a single isolated mathematical operation.",
      },
    ],
  },
  trivia: COMPUTESCALARCHAINRULE_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_COMPUTESCALARCHAINRULE_INPUT,
  generateSteps: generateComputeScalarChainRuleSteps,
};
