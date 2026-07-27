import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface strided1dDotProductInput {
  vecA?: number[];
  vecB?: number[];
  strideA?: number;
  strideB?: number;
  data?: number[];
}

export const STRIDED1DDOTPRODUCT_CODE = `def strided_1d_dot_product(vec_a, vec_b, stride_a=1, stride_b=1):
    """
    Computes dot product of two vectors with arbitrary strided memory layouts.
    """
    n = min(len(vec_a) // stride_a, len(vec_b) // stride_b)
    dot_sum = 0

    for i in range(n):
        idx_a = i * stride_a
        idx_b = i * stride_b
        product = vec_a[idx_a] * vec_b[idx_b]
        dot_sum += product

    return dot_sum`;

export const DEFAULT_STRIDED1DDOTPRODUCT_INPUT: strided1dDotProductInput = {
  vecA: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  vecB: [2, 1, 4, 3, 6, 5, 8, 7, 10, 9],
  strideA: 2,
  strideB: 2,
};

export const generateStrided1dDotProductSteps = (
  input: strided1dDotProductInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const vecA = input.vecA ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const vecB = input.vecB ?? [2, 1, 4, 3, 6, 5, 8, 7, 10, 9];
  const strideA = input.strideA ?? 2;
  const strideB = input.strideB ?? 2;

  const n = Math.min(
    Math.floor(vecA.length / strideA),
    Math.floor(vecB.length / strideB),
  );

  const cols = Math.max(vecA.length, vecB.length);
  let runningSum = 0;

  const makeMatrixSnapshot = (
    currentI: number | null,
    stepIdxA: number | null,
    stepIdxB: number | null,
    titleText?: string,
  ) => {
    const cells: MatrixCellItem[] = [];

    // Row 0: Vector A
    vecA.forEach((val, idx) => {
      let state: MatrixCellItem["state"] = "default";
      const isStrided = idx % strideA === 0 && idx / strideA < n;

      if (!isStrided) {
        state = "inactive";
      } else if (currentI !== null) {
        const itemI = idx / strideA;
        if (idx === stepIdxA) state = "active";
        else if (itemI < currentI) state = "sorted";
      }

      cells.push({
        row: 0,
        col: idx,
        value: val,
        label: `A[${idx}]`,
        state,
      });
    });

    // Fill remaining columns if vecA is shorter than max length
    for (let idx = vecA.length; idx < cols; idx++) {
      cells.push({
        row: 0,
        col: idx,
        value: "-",
        label: `A[${idx}]`,
        state: "inactive",
      });
    }

    // Row 1: Vector B
    vecB.forEach((val, idx) => {
      let state: MatrixCellItem["state"] = "default";
      const isStrided = idx % strideB === 0 && idx / strideB < n;

      if (!isStrided) {
        state = "inactive";
      } else if (currentI !== null) {
        const itemI = idx / strideB;
        if (idx === stepIdxB) state = "active";
        else if (itemI < currentI) state = "sorted";
      }

      cells.push({
        row: 1,
        col: idx,
        value: val,
        label: `B[${idx}]`,
        state,
      });
    });

    // Fill remaining columns if vecB is shorter than max length
    for (let idx = vecB.length; idx < cols; idx++) {
      cells.push({
        row: 1,
        col: idx,
        value: "-",
        label: `B[${idx}]`,
        state: "inactive",
      });
    }

    return {
      kind: "matrix" as const,
      rows: 2,
      cols,
      rowHeaders: [`Vec A (stride=${strideA})`, `Vec B (stride=${strideB})`],
      colHeaders: Array.from({ length: cols }, (_, i) => `Idx ${i}`),
      title: titleText ?? `Strided Dot Product (Accumulated Sum: ${runningSum})`,
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentI: number | null,
    stepIdxA: number | null,
    stepIdxB: number | null,
    titleText?: string,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: makeMatrixSnapshot(
        currentI,
        stepIdxA,
        stepIdxB,
        titleText,
      ),
      auxiliaryState: {
        customState: {
          strideA: String(strideA),
          strideB: String(strideB),
          nIterations: String(n),
          accumulatedSum: String(runningSum),
        },
      },
      variables,
    });
  };

  // Line 1: Function entry
  addStep(
    1,
    "Initialize Strided 1D Vector Dot Product Kernel",
    `Entry into strided_1d_dot_product with vecA (len ${vecA.length}, stride ${strideA}) and vecB (len ${vecB.length}, stride ${strideB}).`,
    { lenA: vecA.length, lenB: vecB.length, strideA, strideB },
    null,
    null,
    null,
    "Function Entry",
  );

  // Line 2: Docstring start
  addStep(
    2,
    "Parse Function Docstring & BLAS Overview",
    "Computes strided vector inner product sum(vecA[i * strideA] * vecB[i * strideB]) for non-contiguous vector slices.",
    { operation: "Strided FMA / Dot Product" },
    null,
    null,
    null,
    "Docstring",
  );

  // Line 3: Docstring body
  addStep(
    3,
    "Review Memory Layout & Non-Unit Strides",
    "Non-unit memory strides occur when extracting column vectors from row-major matrices or sub-tensor slices without copies.",
    { strideA, strideB },
    null,
    null,
    null,
    "Docstring",
  );

  // Line 4: Docstring end
  addStep(
    4,
    "Finalize Metadata Setup",
    "Preparing step counter n and dot product sum accumulator.",
    { strideA, strideB },
    null,
    null,
    null,
    "Docstring End",
  );

  // Line 5: Read n
  addStep(
    5,
    `Calculate Step Count n = min(${vecA.length} // ${strideA}, ${vecB.length} // ${strideB}) = ${n}`,
    `Determining max valid dot product step count n = ${n}.`,
    { n, lenA: vecA.length, lenB: vecB.length, strideA, strideB },
    null,
    null,
    null,
    "Compute n",
  );

  // Line 6: Init dot_sum = 0
  addStep(
    6,
    "Initialize Accumulator dot_sum = 0",
    "Setting scalar dot product accumulator dot_sum to 0.",
    { dot_sum: 0 },
    null,
    null,
    null,
    "Init Accumulator",
  );

  // Line 7: Blank line
  addStep(
    7,
    "Begin Strided Reduction Loop",
    `Starting loop for step index i from 0 to ${n - 1}.`,
    { n },
    null,
    null,
    null,
    "Start Loop",
  );

  // Iteration loop
  for (let i = 0; i < n; i++) {
    // Line 8: Loop header
    addStep(
      8,
      `Loop Iteration i = ${i} of ${n}`,
      `Evaluating element step ${i}.`,
      { i, n },
      i,
      null,
      null,
      `Iter ${i} - Loop Header`,
    );

    // Line 9: idx_a = i * stride_a
    const idxA = i * strideA;
    addStep(
      9,
      `Compute Physical Index idx_a = ${i} * ${strideA} = ${idxA}`,
      `Resolving physical element pointer in vector A: idx_a = ${idxA} (value = ${vecA[idxA]}).`,
      { i, stride_a: strideA, idx_a: idxA, valA: vecA[idxA] },
      i,
      idxA,
      null,
      `Iter ${i} - Index A (${idxA})`,
    );

    // Line 10: idx_b = i * stride_b
    const idxB = i * strideB;
    addStep(
      10,
      `Compute Physical Index idx_b = ${i} * ${strideB} = ${idxB}`,
      `Resolving physical element pointer in vector B: idx_b = ${idxB} (value = ${vecB[idxB]}).`,
      { i, stride_b: strideB, idx_b: idxB, valB: vecB[idxB] },
      i,
      idxA,
      idxB,
      `Iter ${i} - Index B (${idxB})`,
    );

    // Line 11: product = vec_a[idx_a] * vec_b[idx_b]
    const valA = vecA[idxA];
    const valB = vecB[idxB];
    const product = valA * valB;
    addStep(
      11,
      `Compute Multiply: ${valA} * ${valB} = ${product}`,
      `Multiplying scalar elements vecA[${idxA}] (${valA}) * vecB[${idxB}] (${valB}) yielding product ${product}.`,
      { i, idx_a: idxA, idx_b: idxB, valA, valB, product },
      i,
      idxA,
      idxB,
      `Iter ${i} - Product = ${product}`,
    );

    // Line 12: dot_sum += product
    runningSum += product;
    addStep(
      12,
      `Accumulate Sum: ${runningSum - product} + ${product} = ${runningSum}`,
      `Adding product ${product} to accumulator dot_sum yielding updated total ${runningSum}.`,
      { i, product, dot_sum: runningSum },
      i,
      idxA,
      idxB,
      `Iter ${i} - Sum = ${runningSum}`,
    );
  }

  // Line 13: Blank line
  addStep(
    13,
    "Strided Reduction Loop Finished",
    "All n strided element pairs multiplied and accumulated. Preparing return value.",
    { dot_sum: runningSum },
    n,
    null,
    null,
    "Loop Complete",
  );

  // Line 14: Return dot_sum
  addStep(
    14,
    `Return Final Dot Product dot_sum = ${runningSum}`,
    `Successfully computed strided 1D vector dot product: ${runningSum}.`,
    { dot_sum: runningSum },
    n,
    null,
    null,
    "Return Result",
  );

  return steps;
};

const STRIDED1DDOTPRODUCT_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "product = vec_a[i] * vec_b[i]",
    "n = len(vec_a) + len(vec_b)",
    "idx_a = i + stride_a",
  ],
  hints: [{ line: 9, hint: "Calculate physical indices idx_a = i * stride_a and idx_b = i * stride_b." }],
  lineExplanations: {
    1: "Function declaration taking vectors vec_a, vec_b and optional strides stride_a, stride_b.",
    2: "Opening docstring for strided 1D dot product calculation.",
    3: "Documentation describing BLAS inner product over non-contiguous strided memory buffers.",
    4: "Closing docstring for strided 1D dot product calculation.",
    5: "Calculates max valid dot product iteration count n based on vector lengths and strides.",
    6: "Initializes dot product sum accumulator dot_sum to 0.",
    7: "Empty line separating initialization from element accumulation loop.",
    8: "Loop iterating through element step index i from 0 to n - 1.",
    9: "Computes physical element index in vector A: idx_a = i * stride_a.",
    10: "Computes physical element index in vector B: idx_b = i * stride_b.",
    11: "Multiplies scalar vector elements: product = vec_a[idx_a] * vec_b[idx_b].",
    12: "Accumulates product into total sum: dot_sum += product.",
    13: "Empty line separating loop body from return statement.",
    14: "Returns accumulated scalar dot product sum dot_sum.",
  },
};

export const strided1dDotProduct: AlgorithmDefinition<strided1dDotProductInput> = {
  id: "strided-1d-dot-product",
  title: "Strided 1D Vector Dot Product",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "In basic linear algebra subprograms (BLAS level-1, e.g. `sdot`/`ddot` in cuBLAS, PyTorch `torch.dot`, Apple Accelerate), vector dot products frequently operate on non-contiguous slices of memory.\n\nFor instance, when computing the dot product between a row vector and a column vector extracted from a 2D matrix, elements are read with non-unit strides $s_a$ and $s_b$ instead of consecutive indices:\n$$\\text{DotProduct} = \\sum_{i=0}^{K-1} \\text{vec}_a[i \\times s_a] \\times \\text{vec}_b[i \\times s_b]$$\n\nThis algorithm implements the strided 1D vector dot product primitive step-by-step, illustrating how physical element addresses are resolved.",
  constraints: [
    "1 <= vecA.length, vecB.length <= 1000",
    "1 <= strideA, strideB <= 100",
    "-10^4 <= vecA[i], vecB[i] <= 10^4",
  ],
  examples: [
    {
      kind: "basic",
      title: "Contiguous Unit Stride Dot Product",
      inputDisplay: "vecA = [1, 2, 3], vecB = [4, 5, 6], strideA = 1, strideB = 1",
      outputDisplay: "32",
      input: { vecA: [1, 2, 3], vecB: [4, 5, 6], strideA: 1, strideB: 1 },
      output: "32",
      explanation: "Computes standard contiguous dot product 1*4 + 2*5 + 3*6 = 32.",
    },
    {
      kind: "complex",
      title: "Strided Vector Extraction",
      inputDisplay: "vecA = [1, 2, 3, 4, 5, 6], vecB = [2, 1, 4, 3, 6, 5], strideA = 2, strideB = 2",
      outputDisplay: "44",
      input: { vecA: [1, 2, 3, 4, 5, 6], vecB: [2, 1, 4, 3, 6, 5], strideA: 2, strideB: 2 },
      output: "44",
      explanation: "Extracts elements at even indices: (1*2) + (3*4) + (5*6) = 2 + 12 + 30 = 44.",
    },
    {
      kind: "negative",
      title: "Asymmetric Strides",
      inputDisplay: "vecA = [10, 20, 30], vecB = [1, 0, 2, 0, 3], strideA = 1, strideB = 2",
      outputDisplay: "160",
      input: { vecA: [10, 20, 30], vecB: [1, 0, 2, 0, 3], strideA: 1, strideB: 2 },
      output: "160",
      explanation: "Pairs unit stride vecA with stride-2 vecB: 10*1 + 20*2 + 30*3 = 10 + 40 + 90 = 140.",
    },
  ],
  code: STRIDED1DDOTPRODUCT_CODE,
  timeComplexity: { best: "O(K)", average: "O(K)", worst: "O(K)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "O(K) time where K = min(len(vecA)//strideA, len(vecB)//strideB) is the number of element pair multiplications.",
    space: "O(1) auxiliary space using scalar accumulators.",
  },
  topicGuide: {
    overview:
      "Strided vector dot products form the core execution loop of BLAS Level-1 kernels. When multiplying transposed matrix blocks, computing attention query-key inner products, or calculating norms across non-contiguous memory slices, vector elements are accessed with step sizes $s > 1$.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "The dot product of two strided 1D vectors is mathematically defined as:\n$$P = \\sum_{i=0}^{K-1} \\text{vec}_a[i \\times s_a] \\times \\text{vec}_b[i \\times s_b]$$\nIn C/C++ BLAS specifications (e.g. `cblas_ddot(N, X, incX, Y, incY)`), `incX` and `incY` denote $s_a$ and $s_b$.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "This routine avoids copying sub-vectors into intermediate contiguous buffers before computing inner products, saving DRAM memory bandwidth and reducing heap allocations in linear algebra libraries (PyTorch ATen, Eigen, LAPACK).",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "Given `vecA = [10, 20, 30, 40]` with $s_a = 2$ and `vecB = [1, 2, 3, 4]` with $s_b = 2$:\n1. $i=0$: $\\text{idx}_A = 0, \\text{idx}_B = 0 \\rightarrow 10 \\times 1 = 10$.\n2. $i=1$: $\\text{idx}_A = 2, \\text{idx}_B = 2 \\rightarrow 30 \\times 3 = 90$.\nTotal sum is $10 + 90 = 100$.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "When $s = 1$, hardware SIMD vector units (AVX-512, ARM Neon, CUDA FMA) load 8 to 16 floating-point values in a single memory clock cycle. When $s > 1$, vector SIMD loads become non-coalesced, leading to gather operations and reduced memory throughput.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Requires $K$ multiplications and $K - 1$ additions, executing in $\\mathcal{O}(K)$ time and $\\mathcal{O}(1)$ space.",
      },
    ],
    keyTerms: [
      {
        term: "BLAS Level-1",
        definition: "Basic Linear Algebra Subprograms specification for vector-vector operations.",
      },
      {
        term: "Stride (incX/incY)",
        definition: "The pointer increment distance between consecutive logical vector elements in flat memory.",
      },
      {
        term: "Fused Multiply-Add (FMA)",
        definition: "Hardware instruction evaluating a * b + c in a single clock cycle with full precision.",
      },
      {
        term: "Memory Coalescing",
        definition: "Combining adjacent memory accesses into single DRAM transactions, maximized when stride = 1.",
      },
    ],
  },
  trivia: STRIDED1DDOTPRODUCT_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_STRIDED1DDOTPRODUCT_INPUT,
  generateSteps: generateStrided1dDotProductSteps,
};
