import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tensorVjpEngineGradOfGradInput {
  data: number[];
  target?: number;
}

export const TENSORVJPENGINEGRADOFGRAD_CODE = `def tensor_vjp_engine_grad_of_grad(vjp_vector, jacobian_matrix):
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

    return output_vjp`;

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
  const target = input?.target ?? 30;

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
    customState?: Record<string, string | number>,
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
          target: String(target),
          ...customState,
        },
      },
      variables,
    });
  };

  // Step 1: Init VJP Engine
  addStep(
    1,
    "Initialize Vector-Jacobian Product (VJP) Engine",
    "Setting up matrix dimensions for higher-order double-backward (grad-of-grad) gradient computation v^T @ J.",
    { numInputs: arrayData.length, target, phase: "INIT_VJP_ENGINE" },
    undefined,
    { status: "INITIALIZING", mode: "DOUBLE_BACKWARD" },
  );

  addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Evaluates Vector-Jacobian Product v^T @ J for higher-order double-backward gradi",
    {},
  );

  addStep(
    3,
    "Docstring body: algorithm description",
    "See the Python docstring for the contract and purpose of this algorithm.",
    {},
  );

  addStep(
    4,
    "End of docstring",
    "Docstring complete. Entering the function body.",
    {},
  );

  // Step 2: Dimensions M and N
  const m = arrayData.length;
  const n = arrayData.length;

  addStep(
    5,
    `Inspect Matrix Dimensions: m = ${m}, n = ${n}`,
    `Reading Jacobian matrix dimensions: ${m} output rows x ${n} input columns.`,
    { m, n, phase: "INSPECT_DIMS" },
  );

  // Step 3: Allocate output VJP vector
  const outputVjp: number[] = new Array(n).fill(0.0);
  addStep(
    7,
    "Allocate 1D Output VJP Gradient Vector `output_vjp = [0.0] * n`",
    "Initializing output gradient vector with zeros to accumulate Vector-Jacobian dot products.",
    { n, phase: "ALLOC_OUTPUT_VJP" },
  );

  // Multi-step nested loop for VJP computation
  arrayData.forEach((val, i) => {
    const vVal = Number((0.1 * (i + 1)).toFixed(2));

    const stateA: ArrayElement[] = elements.map((el, idx) => {
      if (idx === i) return { ...el, state: "compare", pointers: [`v[${i}]=${vVal}`] };
      if (idx < i) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      9,
      `Outer Loop Row ${i}: for i in range(${m})`,
      `Iterating over Jacobian row index i = ${i}.`,
      { i, phase: "OUTER_LOOP_I" },
      stateA,
    );

    addStep(
      10,
      `Fetch Upstream Gradient v_val = ${vVal}`,
      `Reading upstream gradient component vjp_vector[${i}] = ${vVal} for Jacobian row ${i}.`,
      { i, v_val: vVal, phase: "FETCH_V_VAL" },
      stateA,
      { current_v: String(vVal) },
    );

    arrayData.forEach((jVal, j) => {
      const jacVal = Number((0.05 * (i + j + 1)).toFixed(3));
      const prod = Number((vVal * jacVal).toFixed(4));
      outputVjp[j] = Number((outputVjp[j] + prod).toFixed(4));

      const isTarget = jVal === target;
      const stateB: ArrayElement[] = elements.map((el, idx) => {
        if (idx === j) return { ...el, state: isTarget ? "active" : "sorted", value: outputVjp[j], pointers: [`v*J=${prod}`] };
        if (idx < j) return { ...el, state: "visited" };
        return el;
      });

      addStep(
        11,
        `Inner Loop Column ${j}: for j in range(${n})`,
        `Iterating over Jacobian column index j = ${j}.`,
        { i, j, phase: "INNER_LOOP_J" },
        stateB,
      );

      addStep(
        12,
        `VJP Accumulation [i=${i}, j=${j}]: output_vjp[${j}] += ${vVal} * ${jacVal} -> ${outputVjp[j]}`,
        `Multiplying upstream gradient component by Jacobian entry J[${i}][${j}] = ${jacVal}. Updated output_vjp[${j}] = ${outputVjp[j]}.`,
        { i, j, vVal, jacVal, prod, updatedVjp: outputVjp[j], phase: "ACCUMULATE_VJP_CELL" },
        stateB,
        { [`vjp[${j}]`]: String(outputVjp[j]) },
      );
    });
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  // Step final-1: Return output VJP vector
  addStep(
    14,
    "Return Computed 1D Vector-Jacobian Product Vector `output_vjp`",
    `VJP computation complete. Output gradient vector v^T @ J evaluated across all ${n} input dimensions.`,
    { outputVjpLength: outputVjp.length, finalVjpSum: outputVjp.reduce((a, b) => a + b, 0) },
    finalElements,
    { final_vjp: `[${outputVjp.join(", ")}]` },
  );

  // Step final: Complete
  addStep(
    14,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    finalElements,
  );

  return steps;
};

const TENSORVJPENGINEGRADOFGRAD_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 8, 13],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "output_vjp[j] += vjp_vector[j] * jacobian_matrix[j][i]",
  ],
  hints: [
    { line: 5, hint: "Extract matrix row dimension m and column dimension n." },
    { line: 7, hint: "Allocate output_vjp list initialized to zeros for n columns." },
    { line: 10, hint: "Fetch upstream gradient scalar v_val = vjp_vector[i]." },
    { line: 12, hint: "Accumulate product v_val * jacobian_matrix[i][j] into output_vjp[j]." },
  ],
  lineExplanations: {
    1: "Defines entry point for tensor_vjp_engine_grad_of_grad Vector-Jacobian Product function.",
    2: "Docstring opening: describes Vector-Jacobian Product evaluation v^T @ J for double-backward gradients.",
    3: "Docstring body: evaluates v^T @ J vector-matrix product for higher-order automatic differentiation.",
    4: "Docstring closing.",
    5: "Extracts row dimension m (number of scalar outputs) from Jacobian matrix.",
    6: "Extracts column dimension n (number of scalar inputs) from Jacobian matrix row 0.",
    7: "Allocates 1D output VJP gradient vector initialized to 0.0 for n columns.",
    8: "Empty line separating memory allocation from outer row iteration loop.",
    9: "Iterates through row index i from 0 to m - 1.",
    10: "Fetches upstream gradient scalar v_val = vjp_vector[i] for output row i.",
    11: "Iterates through column index j from 0 to n - 1.",
    12: "Accumulates vector-matrix product entry v_val * jacobian_matrix[i][j] into output_vjp[j].",
    13: "Empty line before returning computed output VJP gradient vector.",
    14: "Returns computed 1D output VJP gradient vector containing input parameter derivatives.",
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
  description: `### Vector-Jacobian Product (VJP) Engine with Higher-Order Gradients

In higher-order automatic differentiation frameworks (**PyTorch \`create_graph=True\`**, **JAX \`vjp\` / \`jvp\`**, and **Physics-Informed Neural Networks (PINNs)**), computing second-order derivatives (such as Hessian-vector products and WGAN-GP gradient penalties) relies on **Vector-Jacobian Products (VJPs)**.

#### Why It Exists & What It Solves
Given a vector-valued function $f: \\mathbb{R}^n \\to \\mathbb{R}^m$, its Jacobian matrix $J \\in \\mathbb{R}^{m \\times n}$ contains all $m \\times n$ partial derivatives:
$$J_{i, j} = \\frac{\\partial f_i}{\\partial x_j}$$
For deep neural networks with $m, n > 10^6$, storing full dense Jacobian matrices requires terabytes of memory ($m \\times n$ space).

With **Implicit Vector-Jacobian Products ($v^T J$)**:
- Reverse-mode autograd evaluates the vector-matrix product $v^T J$ directly:
  $$w_j = \\sum_{i=0}^{m-1} v_i \\cdot J_{i, j}$$
- Evaluates input parameter gradients $w \\in \\mathbb{R}^n$ without constructing or storing dense $m \\times n$ Jacobian matrices in memory.
- Enables computing **gradients of gradients** ("grad-of-grad" / double-backward) by executing autograd passes on the backward graph itself.

#### Step-by-Step Mechanism
1. **Dimension Extraction**: Set $m = \\text{len}(\\text{jacobian\\_matrix})$ and $n = \\text{len}(\\text{jacobian\\_matrix}[0])$.
2. **Allocate Output Vector**: Initialize \`output_vjp = [0.0] * n\`.
3. **Nested Matrix Accumulation**:
   - For row $i \\in [0, m-1]$:
     - Fetch upstream gradient component $v_{\\text{val}} = v_i$.
     - For column $j \\in [0, n-1]$:
       - Accumulate: \`output_vjp[j] += v_val * jacobian_matrix[i][j]\`.
4. **Return Result**: Return \`output_vjp\`.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(m \\cdot n)$ linear time over non-zero Jacobian elements.
- **Space Complexity**: $\\mathcal{O}(n)$ memory for 1D output VJP vector.
- **Trade-Off**: Saves $\\mathcal{O}(m \\cdot n)$ memory by computing implicit vector products, enabling higher-order autograd passes on memory-constrained GPUs.`,
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
  timeComplexity: { best: "O(m * n)", average: "O(m * n)", worst: "O(m * n)" },
  spaceComplexity: "O(n)",
  complexityAnalysis: {
    time: "Matrix-vector multiplication executes in O(m * n) arithmetic steps.",
    space: "Output VJP memory scales linearly with input dimension n.",
  },
  topicGuide: {
    overview:
      "Vector-Jacobian Products (VJPs) evaluate reverse-mode automatic differentiation without explicitly forming huge Jacobian matrices. The VJP operation computes v^T @ J, yielding a vector of input gradients in a single pass.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, for vector function $f: \\mathbb{R}^n \\to \\mathbb{R}^m$ with Jacobian $J (m \\times n)$ and upstream gradient $v (1 \\times m)$, VJP computes output vector $w (1 \\times n)$ where $w_j = \\sum_{i=0}^{m-1} v_i \\cdot J_{i, j}$.",
      },
      {
        heading: "Practical Applications in ML Systems",
        body: "Evaluating VJPs implicitly avoids storing $\\mathcal{O}(m \\cdot n)$ dense Jacobian memory, enabling double-backward autograd (grad-of-grad) for physics-informed neural networks (PINNs) and WGAN gradient penalties.",
      },
      {
        heading: "Implementation Details & Vector Accumulation",
        body: "Implementation iterates over row index $i$, multiplies upstream gradient $v_{\\text{val}}$ by row entries $J_{i, j}$, and accumulates into \`output_vjp[j]\`.",
      },
      {
        heading: "Edge Case Analysis & Dimensions",
        body: "Edge cases include single-output functions ($m=1$) where VJP reduces to standard gradient vector evaluation.",
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
