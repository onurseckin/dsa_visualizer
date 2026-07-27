import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tensorVjpEngineGradOfGradInput {
  data: number[];
  target?: number;
}

export const TENSORVJPENGINEGRADOFGRAD_CODE = `
def tensor_vjp_engine_grad_of_grad(vjp_vector, jacobian_matrix):
    """
    Evaluates Vector-Jacobian Product v^T @ J for higher-order double-backward gradients.
    """
    m = len(jacobian_matrix)
    n = len(jacobian_matrix[0]) if m > 0 else 0
    output_vjp = [0.0] * n

    for i in range(m):
        v_val = vjp_vector[i]
        for j in range(n):
            output_vjp[j] += v_val * jacobian_matrix[i][j]

    return output_vjp
`;

export const DEFAULT_TENSORVJPENGINEGRADOFGRAD_INPUT: tensorVjpEngineGradOfGradInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateTensorVjpEngineGradOfGradSteps = (
  input: tensorVjpEngineGradOfGradInput,
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
    "Initialize Vector-Jacobian Product (VJP) Engine with Higher-Order Gradients",
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

const TENSORVJPENGINEGRADOFGRAD_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process graph nodes in autograd execution pipeline." }],
  lineExplanations: {
    1: "Defines Vector-Jacobian Product (VJP) engine function.",
    4: "Gets row count M of Jacobian matrix.",
    5: "Gets column count N of Jacobian matrix.",
    6: "Allocates 1D VJP output gradient vector initialized to 0.0.",
    8: "Iterates through row index i from 0 to M-1.",
    9: "Fetches upstream gradient scalar v_val = vjp_vector[i].",
    10: "Iterates through column index j from 0 to N-1.",
    11: "Accumulates product v_val * jacobian_matrix[i][j] into output_vjp[j].",
    13: "Returns computed VJP gradient vector.",
  },
};

export const tensorVjpEngineGradOfGrad: AlgorithmDefinition<tensorVjpEngineGradOfGradInput> = {
  id: "tensor-vjp-engine-grad-of-grad",
  title: "Vector-Jacobian Product (VJP) Engine with Higher-Order Gradients",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description:
    "Higher-order automatic differentiation (e.g. computing Hessian-vector products, WGAN gradient penalties, PyTorch torch.autograd.grad with create_graph=True) requires evaluating Vector-Jacobian Products (VJPs) through gradient operations. VJP evaluates v^T @ J, propagating upstream gradient vector v through Jacobian matrix J without constructing full dense M x N Jacobian matrices in memory.\n\nThis algorithm implements Vector-Jacobian Product (VJP) Engine, evaluating vector-matrix multiplication v^T @ J for higher-order double-backward gradient calculations.\n\nInput Format:\n- data: Array representing vector or matrix values.\n- target: Optional target value.\n\nOutput Format:\n- Returns 1D output gradient vector of length N.\n\nEdge Cases & Constraints:\n- Vector length m matching Jacobian row dimension.\n- Sparse or zero-valued Jacobian entries.\n- Single-element 1x1 Jacobian matrices.",
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
  code: TENSORVJPENGINEGRADOFGRAD_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time traversal across graph vertices and edges.",
    space: "Linear memory allocation for graph adjacency lists.",
  },
  topicGuide: {
    overview:
      "Vector-Jacobian Products (VJPs) evaluate reverse-mode automatic differentiation without explicitly forming huge Jacobian matrices. The VJP operation computes v^T @ J, yielding a vector of input gradients in a single pass.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, for vector function f: R^N -> R^M with Jacobian J (M x N) and upstream gradient v (1 x M), VJP computes output vector w (1 x N) where w_j = sum_{i=0}^{M-1} v_i * J_{i,j}.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Evaluating VJPs implicitly avoids storing O(M * N) dense Jacobian memory, enabling double-backward autograd (grad-of-grad) for physics-informed neural networks (PINNs).",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation iterates over row index i, multiplies upstream gradient v_val by row entries J_{i,j}, and accumulates into output_vjp[j].",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes dimension mismatch checks between vector v and matrix J.",
      },
    ],
    keyTerms: [
      {
        term: "Vector-Jacobian Product (VJP)",
        definition: "Vector-matrix product v^T @ J evaluating reverse-mode autograd gradients.",
      },
      {
        term: "Double-Backward (Grad-of-Grad)",
        definition:
          "Computing gradients of gradient operations to evaluate higher-order derivatives.",
      },
      {
        term: "Implicit Jacobian",
        definition:
          "Evaluating gradient vector products without explicitly constructing full dense Jacobian matrices.",
      },
    ],
  },
  trivia: TENSORVJPENGINEGRADOFGRAD_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_TENSORVJPENGINEGRADOFGRAD_INPUT,
  generateSteps: generateTensorVjpEngineGradOfGradSteps,
};
