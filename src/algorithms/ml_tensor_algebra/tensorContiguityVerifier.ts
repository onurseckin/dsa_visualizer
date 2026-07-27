import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tensorContiguityVerifierInput {
  shape: number[];
  strides: number[];
}

export const TENSORCONTIGUITYVERIFIER_CODE = `def tensor_contiguity_verifier(shape, strides):
    """
    Verifies C-style row-major tensor contiguity and calculates expected strides.
    """
    dims = len(shape)
    is_contiguous = True
    expected_stride = 1
    expected_strides = [0] * dims

    for i in range(dims - 1, -1, -1):
        expected_strides[i] = expected_stride
        if strides[i] != expected_stride:
            is_contiguous = False
        expected_stride *= shape[i]

    return is_contiguous, expected_strides`;

export const DEFAULT_TENSORCONTIGUITYVERIFIER_INPUT: tensorContiguityVerifierInput = {
  shape: [2, 3, 4, 2],
  strides: [24, 8, 2, 1],
};

export const generateTensorContiguityVerifierSteps = (
  input: tensorContiguityVerifierInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const shape = input.shape;
  const strides = input.strides;
  const dims = shape.length;

  const currentExpectedStrides: number[] = new Array(dims).fill(0);
  let expectedStride = 1;
  let isContiguous = true;

  const buildMatrixSnapshot = (
    activeDim: number | null,
    title: string,
  ) => {
    const cells: MatrixCellItem[] = [];
    // Row 0: Shape
    for (let c = 0; c < dims; c++) {
      cells.push({
        row: 0,
        col: c,
        value: shape[c],
        label: `d${c}`,
        state: c === activeDim ? "active" : activeDim !== null && c > activeDim ? "sorted" : "default",
      });
    }
    // Row 1: Actual Strides
    for (let c = 0; c < dims; c++) {
      cells.push({
        row: 1,
        col: c,
        value: strides[c],
        label: `act${c}`,
        state: c === activeDim ? "compared" : activeDim !== null && c > activeDim ? "sorted" : "default",
      });
    }
    // Row 2: Expected Strides
    for (let c = 0; c < dims; c++) {
      cells.push({
        row: 2,
        col: c,
        value: currentExpectedStrides[c],
        label: `exp${c}`,
        state: c === activeDim ? "pivot" : activeDim !== null && c > activeDim ? "sorted" : "default",
      });
    }

    const colHeaders = Array.from({ length: dims }, (_, i) => `Dim ${i}`);
    return {
      kind: "matrix" as const,
      rows: 3,
      cols: dims,
      cells,
      rowHeaders: ["Shape", "Actual Stride", "Expected Stride"],
      colHeaders,
      title,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeDim: number | null = null,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: buildMatrixSnapshot(activeDim, `Tensor Contiguity Verification (Rank ${dims})`),
      auxiliaryState: {
        customState: {
          shape: `[${shape.join(", ")}]`,
          strides: `[${strides.join(", ")}]`,
          expectedStrides: `[${currentExpectedStrides.join(", ")}]`,
          isContiguous: String(isContiguous),
          expectedStrideMultiplier: expectedStride,
        },
      },
      variables,
    });
  };

  // Line 1: Call function
  addStep(
    1,
    "Call tensor_contiguity_verifier(shape, strides)",
    `Inspecting ${dims}-dimensional tensor with shape [${shape.join(", ")}] and actual strides [${strides.join(", ")}].`,
    { dims, is_contiguous: true, expected_stride: 1 },
  );

  // Line 5: Read dims
  addStep(
    5,
    `dims = len(shape) -> ${dims}`,
    "Determined tensor rank (number of dimensions). Verification will proceed right-to-left.",
    { dims },
  );

  // Line 6: is_contiguous = True
  addStep(
    6,
    "is_contiguous = True",
    "Initialized contiguity state flag to True.",
    { dims, is_contiguous: true },
  );

  // Line 7: expected_stride = 1
  addStep(
    7,
    "expected_stride = 1",
    "Innermost dimension (dim D-1) in row-major layout must always have unit stride 1.",
    { dims, is_contiguous: true, expected_stride: 1 },
  );

  // Line 8: expected_strides = [0] * dims
  addStep(
    8,
    `expected_strides = [${currentExpectedStrides.join(", ")}]`,
    "Allocated zero-initialized expected stride array.",
    { dims, is_contiguous: true, expected_stride: 1 },
  );

  // Loop backward across dimensions
  for (let i = dims - 1; i >= 0; i--) {
    // Line 10: Loop header
    addStep(
      10,
      `Loop iteration: dim i = ${i} (shape[${i}] = ${shape[i]}, stride[${i}] = ${strides[i]})`,
      `Evaluating dimension ${i} from right to left to verify row-major memory stride.`,
      { i, dims, "shape[i]": shape[i], "strides[i]": strides[i], expected_stride: expectedStride },
      i,
    );

    // Line 11: Assign expected stride
    currentExpectedStrides[i] = expectedStride;
    addStep(
      11,
      `expected_strides[${i}] = expected_stride -> ${expectedStride}`,
      `Recorded expected stride ${expectedStride} for dimension ${i}.`,
      { i, "expected_strides[i]": expectedStride, expected_stride: expectedStride },
      i,
    );

    // Line 12: Check stride match
    const match = strides[i] === expectedStride;
    addStep(
      12,
      `Check strides[${i}] (${strides[i]}) == expected_stride (${expectedStride}) -> ${match}`,
      match
        ? `Actual stride for dim ${i} matches expected C-contiguous stride ${expectedStride}.`
        : `Mismatch! Actual stride ${strides[i]} != expected ${expectedStride}. Tensor is non-contiguous.`,
      { i, actual_stride: strides[i], expected_stride: expectedStride, match },
      i,
    );

    if (!match) {
      isContiguous = false;
      // Line 13: is_contiguous = False
      addStep(
        13,
        "is_contiguous = False",
        `Flagged tensor as non-contiguous due to stride mismatch at dimension ${i}.`,
        { i, is_contiguous: false },
        i,
      );
    }

    // Line 14: Update expected stride multiplier
    const prevStride = expectedStride;
    expectedStride *= shape[i];
    addStep(
      14,
      `expected_stride *= shape[${i}] -> ${prevStride} * ${shape[i]} = ${expectedStride}`,
      `Accumulated stride multiplier for outer dimension ${i - 1}.`,
      { i, "shape[i]": shape[i], new_expected_stride: expectedStride },
      i,
    );
  }

  // Line 16: Return step
  addStep(
    16,
    `Return (is_contiguous=${isContiguous}, expected_strides=[${currentExpectedStrides.join(", ")}])`,
    `Completed contiguity verification across all ${dims} dimensions. Tensor is ${isContiguous ? "C-contiguous" : "NON-contiguous"}.`,
    { is_contiguous: isContiguous, completed: true },
  );

  return steps;
};

const TENSORCONTIGUITYVERIFIER_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "expected_strides[i] = strides[i] * shape[i]",
    "return is_contiguous, strides",
    "is_contiguous = strides == expected_strides",
  ],
  hints: [{ line: 12, hint: "Compare actual stride with expected unit row-major stride." }],
  lineExplanations: {
    1: "Defines entry point for verifying C-style row-major tensor memory contiguity.",
    2: "Docstring opening for tensor contiguity algorithm.",
    3: "Describes verification of row-major contiguity and stride vector calculation.",
    4: "Docstring closing tag.",
    5: "Calculates tensor rank (number of dimensions) from shape length.",
    6: "Initializes contiguity status boolean flag to True.",
    7: "Sets baseline innermost dimension expected stride to 1 element offset.",
    8: "Allocates array initialized to zero for holding expected strides per dimension.",
    9: "Blank line preceding reverse dimension traversal loop.",
    10: "Iterates backward through dimensions from innermost (dims - 1) to outermost (0).",
    11: "Assigns accumulated expected stride to expected_strides[i].",
    12: "Checks if actual tensor stride[i] matches computed row-major expected_stride.",
    13: "Flags tensor as non-contiguous when actual stride deviates from expected stride.",
    14: "Multiplies accumulated expected stride by current dimension size shape[i].",
    15: "Blank line preceding return statement.",
    16: "Returns contiguity boolean flag and array of expected contiguous strides.",
  },
};

export const tensorContiguityVerifier: AlgorithmDefinition<tensorContiguityVerifierInput> = {
  id: "tensor-contiguity-verifier",
  title: "PyTorch-Style Tensor Contiguity Verifier",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    `In deep learning frameworks like PyTorch (ATen C++ runtime) and ML compilers (Triton, CUDA, TVM), tensors are logical multi-dimensional views over contiguous 1D physical memory allocations. A tensor is C-contiguous (row-major) if consecutive elements along the innermost dimension sit adjacently in physical DRAM addresses.

Operations such as \`tensor.transpose()\`, \`tensor.permute()\`, or slicing create virtual non-contiguous views by altering metadata strides without physically reordering DRAM buffers. High-performance GPU kernels require C-contiguous inputs for coalesced 128-bit SIMD vector reads. For a rank-$D$ tensor with shape $(N_0, N_1, \\dots, N_{D-1})$, theoretical row-major strides satisfy:
$$s_{D-1} = 1, \\quad s_{k} = s_{k+1} \\times N_{k+1}$$
When non-contiguous tensors are passed to kernels expecting contiguous memory, calling \`.contiguous()\` executes an $\\mathcal{O}(N)$ strided memory copy.

This algorithm implements PyTorch's \`is_contiguous()\` verifier, calculating expected row-major strides right-to-left and checking whether actual tensor metadata strides match physical contiguity bounds.`,
  constraints: ["1 <= shape.length <= 8", "1 <= shape[i] <= 4096", "0 <= strides[i] <= 10^8"],
  examples: [
    {
      kind: "basic",
      title: "Contiguous 4D Tensor",
      inputDisplay: "shape = [2, 3, 4, 2], strides = [24, 8, 2, 1]",
      outputDisplay: "(True, [24, 8, 2, 1])",
      input: { shape: [2, 3, 4, 2], strides: [24, 8, 2, 1] },
      output: "(True, [24, 8, 2, 1])",
      explanation: "Actual strides match computed row-major expected strides perfectly.",
    },
    {
      kind: "complex",
      title: "Transposed Non-Contiguous 2D Matrix View",
      inputDisplay: "shape = [3, 4], strides = [1, 3]",
      outputDisplay: "(False, [4, 1])",
      input: { shape: [3, 4], strides: [1, 3] },
      output: "(False, [4, 1])",
      explanation: "Matrix transpose swapped strides from [4, 1] to [1, 3], violating C-contiguity.",
    },
    {
      kind: "negative",
      title: "Sliced Tensor with Custom Memory Stride",
      inputDisplay: "shape = [2, 2], strides = [8, 2]",
      outputDisplay: "(False, [2, 1])",
      input: { shape: [2, 2], strides: [8, 2] },
      output: "(False, [2, 1])",
      explanation: "Strides indicate non-unit element gaps along innermost dimension.",
    },
  ],
  code: TENSORCONTIGUITYVERIFIER_CODE,
  timeComplexity: { best: "O(D)", average: "O(D)", worst: "O(D)" },
  spaceComplexity: "O(D)",
  complexityAnalysis: {
    time: "O(D) single-pass backward scan across tensor rank D.",
    space: "O(D) memory allocation for calculated expected strides vector.",
  },
  topicGuide: {
    overview:
      "Tensor contiguity verification is an indispensable runtime check performed in PyTorch ATen C++ and Triton prior to launching hardware-accelerated GPU kernels. Kernels expecting contiguous memory buffers compute physical offsets using fixed row-major stride math; passing non-contiguous views without validation leads to silent memory corruption or invalid memory access panics.\n\nUnderstanding how stride metadata maps logical multidimensional indices $(i_0, i_1, \\dots, i_{D-1})$ to 1D DRAM offsets $\\sum i_k \\times s_k$ is central to zero-copy tensor views, slicing, and memory layout optimization in ML infrastructure.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "For a $D$-dimensional tensor with shape $(N_0, N_1, \\dots, N_{D-1})$, any element at logical index $(i_0, i_1, \\dots, i_{D-1})$ is mapped to 1D physical offset:\n$$\\text{Offset} = \\sum_{k=0}^{D-1} i_k \\times s_k$$\nIn standard C-style row-major layout (C-contiguity), the innermost dimension $D-1$ moves continuously in memory with stride $s_{D-1} = 1$. Outer strides are defined recursively as $s_{k} = s_{k+1} \\times N_{k+1}$. Verifying contiguity ensures actual tensor strides match these theoretical expectations.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "PyTorch's `tensor.is_contiguous()` enables high-level Python code to manipulate tensor shapes via zero-copy views (`reshape`, `transpose`, `permute`, `narrow`) without copying heavy DRAM payloads. When an operation requires contiguous DRAM (e.g. cuBLAS GEMM, PyTorch `view()`, or CUDA vector loads), PyTorch checks contiguity and conditionally invokes `tensor.contiguous()` to perform a strided memory copy only when necessary.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "Consider shape `[2, 3, 4]` ($D=3$):\n1. Dim 2 ($N_2=4$): base stride $s_2 = 1$.\n2. Dim 1 ($N_1=3$): expected stride $s_1 = 1 \\times 4 = 4$.\n3. Dim 0 ($N_0=2$): expected stride $s_0 = 4 \\times 3 = 12$.\nThe computed expected strides vector is `[12, 4, 1]`. If the tensor's metadata holds strides `[12, 4, 1]`, it is contiguous. If it holds `[1, 4, 12]` (due to `transpose(0, 2)`), the mismatch flags non-contiguity.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "Non-contiguous views save GPU DRAM allocation overhead and memory bandwidth by eliminating eager copying. However, executing computations on non-contiguous memory breaks GPU memory coalescing, leading to multiple 32-byte DRAM transaction requests per warp instead of single 128-byte SIMD vector loads.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $\\mathcal{O}(D)$ where $D$ is the tensor rank (typically $D \\le 8$). Verification executes in nanoseconds. Space Complexity: $\\mathcal{O}(D)$ memory to store the computed expected stride vector.",
      },
    ],
    keyTerms: [
      {
        term: "C-Contiguity",
        definition: "Row-major memory layout where adjacent elements along the last dimension sit continuously in physical memory.",
      },
      {
        term: "Stride Metadata",
        definition: "Array of integers defining how many physical DRAM scalar elements to skip when advancing along each dimension.",
      },
      {
        term: "Zero-Copy View",
        definition: "A new tensor header sharing existing underlying DRAM buffer while modifying shape/stride metadata.",
      },
      {
        term: "Coalesced Memory Access",
        definition: "Hardware GPU execution pattern where threads in a warp access consecutive contiguous DRAM addresses in one bus transaction.",
      },
    ],
  },
  trivia: TENSORCONTIGUITYVERIFIER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_TENSORCONTIGUITYVERIFIER_INPUT,
  generateSteps: generateTensorContiguityVerifierSteps,
};
