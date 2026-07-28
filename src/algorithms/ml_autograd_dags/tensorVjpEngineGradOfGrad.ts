import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tensorVjpEngineGradOfGradInput {
  vjpVector?: number[];
  jacobianMatrix?: number[][];
  data?: number[];
  target?: number;
}

export const TENSORVJPENGINEGRADOFGRAD_CODE = `def tensor_vjp_engine_grad_of_grad(vjp_vector, jacobian_matrix):
    m = len(jacobian_matrix)
    n = len(jacobian_matrix[0]) if m > 0 else 0
    output_vjp = [0.0] * n

    for i in range(m):
        v_val = vjp_vector[i]
        for j in range(n):
            output_vjp[j] += v_val * jacobian_matrix[i][j]

    return output_vjp`;

export const DEFAULT_TENSORVJPENGINEGRADOFGRAD_INPUT: tensorVjpEngineGradOfGradInput = {
  vjpVector: [0.5, 1.2, 0.8],
  jacobianMatrix: [
    [1.5, 0.5, 2.0],
    [0.8, 2.1, 0.4],
    [1.1, 0.9, 1.7],
  ],
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateTensorVjpEngineGradOfGradSteps = (
  input: tensorVjpEngineGradOfGradInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const vjpVector = input?.vjpVector ?? [0.5, 1.2, 0.8];
  const jacobianMatrix = input?.jacobianMatrix ?? [
    [1.5, 0.5, 2.0],
    [0.8, 2.1, 0.4],
    [1.1, 0.9, 1.7],
  ];

  const m = jacobianMatrix.length;
  const n = m > 0 ? jacobianMatrix[0].length : 0;
  const outputVjp: number[] = new Array(n).fill(0.0);

  const makeMatrixSnapshot = (activeRow?: number, activeCol?: number, isFetchV?: boolean) => {
    const rows = m + 1;
    const cols = n + 1;
    const cells: MatrixCellItem[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let cellState: MatrixCellItem["state"] = "default";
        let val: string | number = 0;
        let label = "";

        if (r < m && c < n) {
          val = jacobianMatrix[r][c];
          label = `J[${r}][${c}]`;
          if (r === activeRow && c === activeCol) {
            cellState = "active";
          } else if (r === activeRow) {
            cellState = "compared";
          } else if (activeRow !== undefined && r < activeRow) {
            cellState = "sorted";
          }
        } else if (r < m && c === n) {
          val = vjpVector[r];
          label = `v[${r}]`;
          if (r === activeRow) {
            cellState = isFetchV ? "pivot" : "compared";
          } else if (activeRow !== undefined && r < activeRow) {
            cellState = "sorted";
          }
        } else if (r === m && c < n) {
          val = Number(outputVjp[c].toFixed(4));
          label = `vjp[${c}]`;
          if (c === activeCol && activeRow !== undefined) {
            cellState = "active";
          } else if (outputVjp[c] !== 0) {
            cellState = "sorted";
          }
        } else {
          const sum = outputVjp.reduce((acc, curr) => acc + curr, 0);
          val = Number(sum.toFixed(4));
          label = "Sum(v^T J)";
          cellState = "default";
        }

        cells.push({
          row: r,
          col: c,
          value: val,
          state: cellState,
          label,
        });
      }
    }

    const rowHeaders = [...Array.from({ length: m }, (_, i) => `Row ${i}`), "Output VJP"];
    const colHeaders = [...Array.from({ length: n }, (_, j) => `Col ${j}`), "v (Upstream)"];

    return {
      kind: "matrix" as const,
      rows,
      cols,
      cells,
      rowHeaders,
      colHeaders,
      title: "Vector-Jacobian Product (v^T @ J) State Matrix",
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRow?: number,
    activeCol?: number,
    isFetchV?: boolean,
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: makeMatrixSnapshot(activeRow, activeCol, isFetchV),
      auxiliaryState: {
        customState: {
          vjpVector: `[${vjpVector.join(", ")}]`,
          outputVjp: `[${outputVjp.map((v) => v.toFixed(4)).join(", ")}]`,
          ...customState,
        },
      },
      variables,
    });
  };

  // Line 1: Function entry
  addStep(
    1,
    "Initialize Vector-Jacobian Product (VJP) Engine",
    "Setting up matrix dimensions for double-backward higher-order gradient computation v^T @ J.",
    { m, n, phase: "INIT_VJP_ENGINE" },
  );

  // Line 2: Extract m
  addStep(
    2,
    `Inspect Jacobian Row Dimension m = ${m}`,
    `Extracting output component row count m = len(jacobian_matrix) = ${m}.`,
    { m, phase: "EXTRACT_M" },
  );

  // Line 3: Extract n
  addStep(
    3,
    `Inspect Jacobian Column Dimension n = ${n}`,
    `Extracting input parameter column count n = len(jacobian_matrix[0]) = ${n}.`,
    { m, n, phase: "EXTRACT_N" },
  );

  // Line 4: Allocate output_vjp
  addStep(
    4,
    "Allocate Output VJP Vector `output_vjp = [0.0] * n`",
    `Initializing 1D gradient output vector of length n = ${n} with zeros to accumulate dot products.`,
    { n, phase: "ALLOCATE_VJP" },
  );

  // Outer loop: line 6
  for (let i = 0; i < m; i++) {
    const vVal = vjpVector[i];

    addStep(
      6,
      `Outer Loop Row ${i}: for i in range(${m})`,
      `Iterating over Jacobian output component row index i = ${i} of ${m}.`,
      { i, m, phase: "OUTER_LOOP_I" },
      i,
    );

    // Line 7: Fetch v_val
    addStep(
      7,
      `Fetch Upstream Gradient Scalar v_val = ${vVal}`,
      `Reading upstream gradient scalar vjp_vector[${i}] = ${vVal} for Jacobian row ${i}.`,
      { i, v_val: vVal, phase: "FETCH_V_VAL" },
      i,
      undefined,
      true,
      { current_v: String(vVal) },
    );

    // Inner loop: line 8
    for (let j = 0; j < n; j++) {
      const jacVal = jacobianMatrix[i][j];
      const prod = Number((vVal * jacVal).toFixed(4));
      outputVjp[j] = Number((outputVjp[j] + prod).toFixed(4));

      addStep(
        8,
        `Inner Loop Column ${j}: for j in range(${n})`,
        `Iterating over input parameter column index j = ${j} for row i = ${i}.`,
        { i, j, phase: "INNER_LOOP_J" },
        i,
        j,
      );

      // Line 9: Accumulate output_vjp[j]
      addStep(
        9,
        `VJP Accumulation [i=${i}, j=${j}]: output_vjp[${j}] += ${vVal} * ${jacVal} -> ${outputVjp[j]}`,
        `Multiplying upstream gradient v[${i}] (${vVal}) by Jacobian entry J[${i}][${j}] (${jacVal}) yielding product ${prod}. Updated output_vjp[${j}] = ${outputVjp[j]}.`,
        {
          i,
          j,
          v_val: vVal,
          jac_val: jacVal,
          prod,
          updated_vjp_j: outputVjp[j],
          phase: "ACCUMULATE_VJP_CELL",
        },
        i,
        j,
        false,
        { [`vjp[${j}]`]: String(outputVjp[j]) },
      );
    }
  }

  // Line 11: Return output_vjp
  const finalSum = outputVjp.reduce((a, b) => a + b, 0);
  addStep(
    11,
    "Return Computed 1D Vector-Jacobian Product Vector `output_vjp`",
    `VJP computation complete across all ${n} input dimensions. Returning v^T @ J = [${outputVjp.join(", ")}].`,
    {
      outputVjpLength: outputVjp.length,
      finalVjpSum: Number(finalSum.toFixed(4)),
      phase: "RETURN_VJP",
    },
  );

  // Line 11: Execution Complete
  addStep(
    11,
    "Execution Complete",
    "Successfully evaluated higher-order Vector-Jacobian Product (VJP).",
    { completed: true, totalSteps: stepIndex },
  );

  return steps;
};

const TENSORVJPENGINEGRADOFGRAD_TRIVIA: TriviaMeta = {
  skipLines: [5, 10],
  distractors: [
    "output_vjp[j] += v_val * jacobian_matrix[j][i]",
    "output_vjp.append(v_val * jacobian_matrix[i])",
    "return jacobian_matrix * vjp_vector",
    "for i in range(n): for j in range(m):",
  ],
  hints: [
    { line: 2, hint: "Extract matrix row dimension m = len(jacobian_matrix)." },
    { line: 4, hint: "Initialize output_vjp vector with size n." },
    { line: 7, hint: "Extract upstream gradient scalar v_val = vjp_vector[i]." },
    {
      line: 9,
      hint: "Accumulate dot product element v_val * jacobian_matrix[i][j] into output_vjp[j].",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for Vector-Jacobian Product (VJP) higher-order gradient engine.",
    2: "Extracts row dimension m (number of output components in Jacobian matrix).",
    3: "Extracts column dimension n (number of input parameters in Jacobian matrix).",
    4: "Allocates 1D output VJP array initialized to zeros of size n.",
    5: "Empty line before matrix-vector iteration loop.",
    6: "Iterates over each row i in range(m) corresponding to output components.",
    7: "Retrieves upstream gradient component v_val = vjp_vector[i].",
    8: "Iterates over each column j in range(n) corresponding to output components.",
    9: "Accumulates product v_val * jacobian_matrix[i][j] into output_vjp[j].",
    10: "Empty line before return statement.",
    11: "Returns computed 1D output VJP gradient vector v^T @ J.",
  },
};

export const tensorVjpEngineGradOfGrad: AlgorithmDefinition<tensorVjpEngineGradOfGradInput> = {
  id: "tensor-vjp-engine-grad-of-grad",
  title: "Vector-Jacobian Product (VJP) Engine with Higher-Order Gradients",
  topicIds: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Hard",
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
  constraints: ["1 <= m, n <= 1000", "-10^9 <= jacobian_matrix[i][j] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Autograd Pass",
      inputDisplay: "vjp_vector = [0.5, 1.2], jacobian_matrix = [[1.5, 0.5], [0.8, 2.1]]",
      outputDisplay: "[1.71, 2.77]",
      input: {
        vjpVector: [0.5, 1.2],
        jacobianMatrix: [
          [1.5, 0.5],
          [0.8, 2.1],
        ],
      },
      output: "[1.71, 2.77]",
      explanation: "Evaluates implicit vector-matrix product v^T @ J.",
    },
    {
      kind: "complex",
      title: "3x3 VJP Evaluation",
      inputDisplay:
        "vjp_vector = [0.5, 1.2, 0.8], jacobian_matrix = [[1.5, 0.5, 2.0], [0.8, 2.1, 0.4], [1.1, 0.9, 1.7]]",
      outputDisplay: "[2.59, 3.49, 2.84]",
      input: {
        vjpVector: [0.5, 1.2, 0.8],
        jacobianMatrix: [
          [1.5, 0.5, 2.0],
          [0.8, 2.1, 0.4],
          [1.1, 0.9, 1.7],
        ],
      },
      output: "[2.59, 3.49, 2.84]",
      explanation: "Evaluates 3x3 Vector-Jacobian Product for higher-order gradients.",
    },
    {
      kind: "negative",
      title: "Single Row Output (m=1)",
      inputDisplay: "vjp_vector = [1.0], jacobian_matrix = [[2.5, 4.0, 1.5]]",
      outputDisplay: "[2.5, 4.0, 1.5]",
      input: {
        vjpVector: [1.0],
        jacobianMatrix: [[2.5, 4.0, 1.5]],
      },
      output: "[2.5, 4.0, 1.5]",
      explanation: "Edge case with scalar output space where VJP matches row gradient vector.",
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
        body: "Implementation iterates over row index $i$, multiplies upstream gradient $v_{\\text{val}}$ by row entries $J_{i, j}$, and accumulates into `output_vjp[j]`.",
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
