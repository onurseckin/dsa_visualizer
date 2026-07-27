import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flattenStridedNdViewInput {
  coords?: number[];
  strides?: number[];
  shape?: number[];
  data?: number[];
}

export const FLATTENSTRIDEDNDVIEW_CODE = `def flatten_strided_nd_view(coords, strides):
    """
    Maps N-dimensional tensor coordinates to 1D flat physical offset using strides.
    """
    flat_offset = 0
    dim_contributions = []

    for dim_idx, (coord, stride) in enumerate(zip(coords, strides)):
        offset_contrib = coord * stride
        flat_offset += offset_contrib
        dim_contributions.append(offset_contrib)

    return flat_offset, dim_contributions`;

export const DEFAULT_FLATTENSTRIDEDNDVIEW_INPUT: flattenStridedNdViewInput = {
  coords: [1, 2, 3, 4, 2],
  strides: [192, 48, 12, 3, 1],
  shape: [4, 4, 4, 4, 4],
};

export const generateFlattenStridedNdViewSteps = (
  input: flattenStridedNdViewInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const coords = input.coords ?? [1, 2, 3, 4, 2];
  const strides = input.strides ?? [192, 48, 12, 3, 1];
  const numDims = Math.min(coords.length, strides.length);

  const dimContribs: number[] = [];
  let runningOffset = 0;

  const makeMatrixSnapshot = (
    activeDim: number | null,
    stepTitle: string,
  ) => {
    const cells: MatrixCellItem[] = [];

    // Row 0: Coordinates
    coords.forEach((val, idx) => {
      let state: MatrixCellItem["state"] = "default";
      if (activeDim !== null) {
        if (idx === activeDim) state = "active";
        else if (idx < activeDim) state = "sorted";
      }
      cells.push({
        row: 0,
        col: idx,
        value: val,
        label: `Coord[${idx}]`,
        state,
      });
    });

    // Row 1: Strides
    strides.forEach((val, idx) => {
      let state: MatrixCellItem["state"] = "default";
      if (activeDim !== null) {
        if (idx === activeDim) state = "active";
        else if (idx < activeDim) state = "sorted";
      }
      cells.push({
        row: 1,
        col: idx,
        value: val,
        label: `Stride[${idx}]`,
        state,
      });
    });

    // Row 2: Per-dim contribution
    coords.forEach((_, idx) => {
      let state: MatrixCellItem["state"] = "default";
      const val = idx < dimContribs.length ? dimContribs[idx] : 0;
      if (activeDim !== null) {
        if (idx === activeDim) state = "pivot";
        else if (idx < activeDim) state = "sorted";
      }
      cells.push({
        row: 2,
        col: idx,
        value: val,
        label: `Contrib[${idx}]`,
        state,
      });
    });

    return {
      kind: "matrix" as const,
      rows: 3,
      cols: numDims,
      rowHeaders: ["Coordinates", "Strides", "Contributions"],
      colHeaders: Array.from({ length: numDims }, (_, i) => `Dim ${i}`),
      title: `${stepTitle} (Flat Offset: ${runningOffset})`,
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeDim: number | null,
    stepTitle: string,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: makeMatrixSnapshot(activeDim, stepTitle),
      auxiliaryState: {
        customState: {
          coords: `[${coords.join(", ")}]`,
          strides: `[${strides.join(", ")}]`,
          flatOffset: String(runningOffset),
          contributions: `[${dimContribs.join(", ")}]`,
        },
      },
      variables,
    });
  };

  // Step 1: Function entry
  addStep(
    1,
    "Initialize N-Dimensional Strided Coordinate Mapping Engine",
    "Entry into flatten_strided_nd_view to map multi-dimensional tensor indices to flat memory offset.",
    { numDims, coords: `[${coords.join(", ")}]`, strides: `[${strides.join(", ")}]` },
    null,
    "Function Header",
  );

  // Step 2: Docstring start
  addStep(
    2,
    "Parse Function Docstring & Overview",
    "Understanding the physical address resolution equation: Offset = sum(coords[i] * strides[i]).",
    { formula: "Offset = sum(c_i * s_i)" },
    null,
    "Docstring",
  );

  // Step 3: Docstring description
  addStep(
    3,
    "Review Coordinate Mapping Purpose",
    "Strided coordinate flattening translates multidimensional subscripting (e.g. tensor[b,h,s,d]) into linear DRAM/SRAM pointers.",
    { totalDimensions: numDims },
    null,
    "Docstring",
  );

  // Step 4: Docstring end
  addStep(
    4,
    "Finalize Metadata Initialization",
    "Preparing internal accumulators for dimension-by-dimension linear address calculation.",
    { ready: true },
    null,
    "Docstring End",
  );

  // Step 5: Init flat_offset
  addStep(
    5,
    "Initialize Flat Memory Offset = 0",
    "Setting base linear memory pointer accumulator flat_offset to 0.",
    { flat_offset: 0 },
    null,
    "Init Offset",
  );

  // Step 6: Init dim_contributions
  addStep(
    6,
    "Initialize Dimension Contributions Tracking Array",
    "Allocating dim_contributions list to record individual coordinate-stride product terms.",
    { dim_contributions: "[]" },
    null,
    "Init Contributions",
  );

  // Step 7: Blank line
  addStep(
    7,
    "Prepare Dimension Processing Loop",
    "Readying loop over zipped coordinate and stride pairs across dimensions 0 to " + (numDims - 1) + ".",
    { numDims },
    null,
    "Prepare Loop",
  );

  // Per-dimension steps
  for (let dimIdx = 0; dimIdx < numDims; dimIdx++) {
    const coord = coords[dimIdx];
    const stride = strides[dimIdx];

    // Line 8: Loop header
    addStep(
      8,
      `Loop Iteration dim_idx = ${dimIdx}`,
      `Unpacking coordinate ${coord} and stride ${stride} for dimension axis ${dimIdx}.`,
      { dim_idx: dimIdx, coord, stride },
      dimIdx,
      `Dim ${dimIdx} - Loop`,
    );

    // Line 9: Compute offset_contrib
    const offsetContrib = coord * stride;
    addStep(
      9,
      `Compute Contribution: ${coord} * ${stride} = ${offsetContrib}`,
      `Calculating offset contribution for dimension ${dimIdx}: coord (${coord}) * stride (${stride}).`,
      { dim_idx: dimIdx, coord, stride, offset_contrib: offsetContrib },
      dimIdx,
      `Dim ${dimIdx} - Multiply`,
    );

    // Line 10: Accumulate flat_offset
    runningOffset += offsetContrib;
    addStep(
      10,
      `Accumulate Flat Offset: ${runningOffset - offsetContrib} + ${offsetContrib} = ${runningOffset}`,
      `Adding ${offsetContrib} to flat_offset sum yielding updated memory offset ${runningOffset}.`,
      { dim_idx: dimIdx, offset_contrib: offsetContrib, flat_offset: runningOffset },
      dimIdx,
      `Dim ${dimIdx} - Accumulate`,
    );

    // Line 11: Append contribution
    dimContribs.push(offsetContrib);
    addStep(
      11,
      `Record Contribution ${offsetContrib} for Dimension ${dimIdx}`,
      `Storing offset contribution ${offsetContrib} in dim_contributions breakdown list.`,
      { dim_idx: dimIdx, dim_contributions: `[${dimContribs.join(", ")}]` },
      dimIdx,
      `Dim ${dimIdx} - Append`,
    );
  }

  // Line 12: Blank line after loop
  addStep(
    12,
    "Complete Dimension Reduction Loop",
    "All dimensions evaluated. Preparing final physical 1D memory offset return value.",
    { total_offset: runningOffset, dim_contributions: `[${dimContribs.join(", ")}]` },
    null,
    "Loop Finished",
  );

  // Line 13: Return statement
  addStep(
    13,
    `Return Flat Memory Offset ${runningOffset} and Breakdown`,
    `Successfully mapped coordinates [${coords.join(", ")}] to physical linear memory offset ${runningOffset}.`,
    { flat_offset: runningOffset, dim_contributions: `[${dimContribs.join(", ")}]` },
    null,
    "Return Result",
  );

  return steps;
};

const FLATTENSTRIDEDNDVIEW_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "flat_offset = sum(coords) * sum(strides)",
    "dim_contributions.append(coord + stride)",
    "return sum(strides), dim_contributions",
  ],
  hints: [{ line: 8, hint: "Zip coordinate and stride vectors to compute per-dimension memory offsets." }],
  lineExplanations: {
    1: "Function declaration defining coordinates and stride vector parameters.",
    2: "Opening docstring for multi-dimensional coordinate mapping function.",
    3: "Core documentation describing physical offset resolution via strided inner product.",
    4: "Closing docstring for multi-dimensional coordinate mapping function.",
    5: "Initializes the flat linear memory offset sum to 0.",
    6: "Allocates list to record individual per-dimension memory offset contributions.",
    7: "Empty line separating initialization from dimension processing loop.",
    8: "Iterates over per-dimension coordinate and stride pairs with dimension index.",
    9: "Computes linear memory contribution for current dimension (coord * stride).",
    10: "Accumulates current dimension contribution into total flat linear offset.",
    11: "Appends current dimension offset contribution to tracking array.",
    12: "Empty line separating processing loop from return statement.",
    13: "Returns computed physical 1D memory offset and per-dimension contribution breakdown.",
  },
};

export const flattenStridedNdView: AlgorithmDefinition<flattenStridedNdViewInput> = {
  id: "flatten-strided-nd-view",
  title: "Multi-Dimensional Strided Coordinate Mapper",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "In deep learning frameworks like PyTorch, JAX, and TensorFlow, high-dimensional logical tensors (e.g. 4D $\\text{NCHW}$ image batches or 3D $\\text{BSD}$ transformer activations) are backed by 1D contiguous physical memory buffers in DRAM or HBM.\n\nWhen a developer indexes a tensor with multidimensional coordinates $(c_0, c_1, \\dots, c_{D-1})$, the underlying hardware memory controller translates these logical indices into a physical 1D buffer offset using the formula:\n$$\\text{offset} = \\sum_{i=0}^{D-1} c_i \\times s_i$$\nwhere $s_i$ is the stride step size for axis $i$.\n\nThis algorithm implements the multi-dimensional strided coordinate mapper used inside PyTorch ATen and Triton kernel codegen. It demonstrates step-by-step how multidimensional tensor coordinates are projected into physical 1D linear memory addresses while computing per-axis offset contributions.",
  constraints: [
    "1 <= coords.length == strides.length <= 8",
    "0 <= coords[i] < shape[i]",
    "1 <= strides[i] <= 10^6",
  ],
  examples: [
    {
      kind: "basic",
      title: "3D Image Tensor Offset Calculation",
      inputDisplay: "coords = [1, 2, 3], strides = [16, 4, 1]",
      outputDisplay: "flatOffset = 27",
      input: { coords: [1, 2, 3], strides: [16, 4, 1] },
      output: "27",
      explanation:
        "Computes 1*16 + 2*4 + 3*1 = 16 + 8 + 3 = 27 physical memory offset.",
    },
    {
      kind: "complex",
      title: "4D Tensor Batch Offset",
      inputDisplay: "coords = [2, 0, 1, 3], strides = [1000, 100, 10, 1]",
      outputDisplay: "flatOffset = 2013",
      input: { coords: [2, 0, 1, 3], strides: [1000, 100, 10, 1] },
      output: "2013",
      explanation:
        "Computes 2*1000 + 0*100 + 1*10 + 3*1 = 2013 linear offset.",
    },
    {
      kind: "negative",
      title: "Zero Coordinates at Origin",
      inputDisplay: "coords = [0, 0, 0], strides = [64, 8, 1]",
      outputDisplay: "flatOffset = 0",
      input: { coords: [0, 0, 0], strides: [64, 8, 1] },
      output: "0",
      explanation: "Zero coordinates map directly to origin offset 0.",
    },
  ],
  code: FLATTENSTRIDEDNDVIEW_CODE,
  timeComplexity: { best: "O(D)", average: "O(D)", worst: "O(D)" },
  spaceComplexity: "O(D)",
  complexityAnalysis: {
    time: "O(D) time linear pass over the D dimensions of the tensor rank.",
    space: "O(D) auxiliary space to store per-dimension offset contribution breakdown.",
  },
  topicGuide: {
    overview:
      "N-dimensional strided coordinate mapping is the foundation of zero-copy tensor slicing, broadcasting, and memory view transformations in PyTorch and Triton. Rather than re-arranging physical bytes in DRAM when calling `.view()`, `.transpose()`, or `.narrow()`, machine learning compilers simply update the stride vector metadata. Evaluating $\\sum_{i=0}^{D-1} c_i \\times s_i$ instantly converts any logical subscript into the exact 1D pointer address in hardware memory.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "Physical hardware memory (DRAM/HBM/SRAM) is strictly 1D flat addressable space. High-level ML models operate on N-dimensional arrays (tensors). Strided coordinate mapping bridges this abstraction gap mathematically via dot product $\\text{Offset} = \\mathbf{c} \\cdot \\mathbf{s} = \\sum_{i=0}^{D-1} c_i \\times s_i$. In row-major (C-contiguous) layout, stride $s_i$ equals the product of all downstream dimension sizes: $s_i = \\prod_{j=i+1}^{D-1} N_j$.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "This algorithm powers zero-copy slicing and tensor views in PyTorch (`TensorImpl`), JAX (XLA HLO strides), and Triton kernel codegen. For instance, transposing a tensor swaps its stride values in constant $\\mathcal{O}(1)$ time without copying gigabytes of GPU memory.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "Consider coordinates `[1, 2, 3]` with strides `[16, 4, 1]`:\n1. Dim 0: $1 \\times 16 = 16$.\n2. Dim 1: $2 \\times 4 = 8$.\n3. Dim 2: $3 \\times 1 = 3$.\nSumming these yields $16 + 8 + 3 = 27$. Thus, logical element `[1, 2, 3]` resides at physical memory offset 27.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "While strided mapping enables zero-copy views, non-contiguous strides (where $s_i$ does not match row-major order) lead to uncoalesced memory reads on GPUs, reducing memory bandwidth utilization. Tensor compilers optimize strided access by vectorizing unit-stride inner dimensions.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $\\mathcal{O}(D)$ operations where $D$ is tensor rank ($1 \\le D \\le 8$). Space Complexity: $\\mathcal{O}(D)$ auxiliary space for returning per-dimension contribution breakdown.",
      },
    ],
    keyTerms: [
      {
        term: "Tensor Stride",
        definition: "The physical memory address jump required to move by 1 element along a specific tensor axis.",
      },
      {
        term: "Row-Major (C-Contiguous)",
        definition: "Memory layout where inner-most dimension elements are stored sequentially in adjacent memory addresses.",
      },
      {
        term: "Zero-Copy View",
        definition: "A tensor transformation that modifies stride/shape metadata without copying physical byte buffers.",
      },
      {
        term: "Physical Memory Offset",
        definition: "The scalar 1D index into flat byte/element storage array.",
      },
    ],
  },
  trivia: FLATTENSTRIDEDNDVIEW_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_FLATTENSTRIDEDNDVIEW_INPUT,
  generateSteps: generateFlattenStridedNdViewSteps,
};
