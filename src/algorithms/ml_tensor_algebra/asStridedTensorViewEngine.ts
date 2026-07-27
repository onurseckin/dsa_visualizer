import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface asStridedTensorViewEngineInput {
  data: number[];
  shape?: [number, number];
  strides?: [number, number];
  storageOffset?: number;
  target?: number;
}

export const ASSTRIDEDTENSORVIEWENGINE_CODE = `def as_strided_tensor_view_engine(memory_buffer, shape, strides, storage_offset=0):
    """
    Calculates zero-copy strided tensor element access and checks contiguity.
    """
    rows, cols = shape
    r_stride, c_stride = strides
    flat_offsets = []

    is_contiguous = (c_stride == 1 and r_stride == cols)

    for r in range(rows):
        for c in range(cols):
            offset = storage_offset + r * r_stride + c * c_stride
            val = memory_buffer[offset] if offset < len(memory_buffer) else 0
            flat_offsets.append((r, c, offset, val))

    return is_contiguous, flat_offsets`;

export const DEFAULT_ASSTRIDEDTENSORVIEWENGINE_INPUT: asStridedTensorViewEngineInput = {
  data: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
  shape: [3, 3],
  strides: [4, 1],
  storageOffset: 1,
  target: 30,
};

export const generateAsStridedTensorViewEngineSteps = (
  input: asStridedTensorViewEngineInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const data =
    input.data && input.data.length > 0
      ? input.data
      : [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
  const shape = input.shape ?? [3, 3];
  const strides = input.strides ?? [4, 1];
  const storageOffset = input.storageOffset ?? 1;

  const rows = Math.max(1, shape[0]);
  const cols = Math.max(1, shape[1]);
  const rStride = strides[0];
  const cStride = strides[1];
  const isContiguous = cStride === 1 && rStride === cols;

  const buildCells = (
    activeR?: number,
    activeC?: number,
    completedCells: { r: number; c: number }[] = [],
  ): MatrixCellItem[] => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const offset = storageOffset + r * rStride + c * cStride;
        const exists = offset >= 0 && offset < data.length;
        const val = exists ? data[offset] : 0;
        const isCompleted = completedCells.some((cell) => cell.r === r && cell.c === c);
        let state: MatrixCellItem["state"] = "default";

        if (isCompleted) {
          state = "sorted";
        } else if (r === activeR && c === activeC) {
          state = "active";
        } else if (!exists) {
          state = "inactive";
        }

        cells.push({
          row: r,
          col: c,
          value: val,
          label: `(${r},${c}) @${offset}`,
          state,
        });
      }
    }
    return cells;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeR?: number,
    activeC?: number,
    completedCells: { r: number; c: number }[] = [],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows,
        cols,
        cells: buildCells(activeR, activeC, completedCells),
        rowHeaders: Array.from({ length: rows }, (_, i) => `Row ${i}`),
        colHeaders: Array.from({ length: cols }, (_, i) => `Col ${i}`),
        title: "ATen as_strided Tensor View Layout",
      },
      auxiliaryState: {
        customState: {
          shape: `[${rows}, ${cols}]`,
          strides: `[${rStride}, ${cStride}]`,
          storageOffset: String(storageOffset),
          isContiguous: String(isContiguous),
        },
      },
      variables,
    });
  };

  // Step 1: Init function
  addStep(
    1,
    "Initialize PyTorch ATen as_strided Zero-Copy View Engine",
    "Setting up view parameters: physical memory buffer, shape, stride strides, and storage offset.",
    { storage_offset: storageOffset },
  );

  // Step 2: Unpack shape
  addStep(
    5,
    "Unpack Target View Dimensions",
    `Extracted rows = ${rows}, cols = ${cols} from target shape tuple [${rows}, ${cols}].`,
    { rows, cols },
  );

  // Step 3: Unpack strides
  addStep(
    6,
    "Unpack Stride Step Sizes",
    `Extracted r_stride = ${rStride}, c_stride = ${cStride} from strides tuple [${rStride}, ${cStride}].`,
    { r_stride: rStride, c_stride: cStride },
  );

  // Step 4: Init flat_offsets
  addStep(
    7,
    "Initialize Mapped Offsets List",
    "Created empty list flat_offsets to record 2D coordinate to physical 1D offset mappings.",
    { flat_offsets_len: 0 },
  );

  // Step 5: Verify contiguity
  addStep(
    9,
    "Evaluate C-Contiguity Condition",
    isContiguous
      ? `c_stride == 1 and r_stride (${rStride}) == cols (${cols}): View IS C-contiguous.`
      : `View is NOT C-contiguous (c_stride=${cStride}, r_stride=${rStride} vs cols=${cols}).`,
    { is_contiguous: isContiguous, r_stride: rStride, c_stride: cStride, cols },
  );

  const completedCells: { r: number; c: number }[] = [];

  for (let r = 0; r < rows; r++) {
    addStep(
      11,
      `Begin Row Iteration r = ${r}`,
      `Iterating outer loop for row index r = ${r} of ${rows}.`,
      { r, total_rows: rows },
      r,
    );

    for (let c = 0; c < cols; c++) {
      const offset = storageOffset + r * rStride + c * cStride;
      const exists = offset >= 0 && offset < data.length;
      const val = exists ? data[offset] : 0;

      addStep(
        12,
        `Evaluate Column Index c = ${c} for Row ${r}`,
        `Iterating inner loop for column index c = ${c} of ${cols}.`,
        { r, c, total_cols: cols },
        r,
        c,
        completedCells,
      );

      addStep(
        13,
        `Calculate Physical Offset for (${r}, ${c})`,
        `offset = ${storageOffset} + ${r} * ${rStride} + ${c} * ${cStride} = ${offset}.`,
        { r, c, offset, storage_offset: storageOffset, r_stride: rStride, c_stride: cStride },
        r,
        c,
        completedCells,
      );

      addStep(
        14,
        `Fetch Value at Physical Offset ${offset}`,
        exists
          ? `Extracted scalar memory_buffer[${offset}] = ${val}.`
          : `Physical offset ${offset} exceeds buffer length ${data.length}; defaulted value to 0.`,
        { r, c, offset, val, exists },
        r,
        c,
        completedCells,
      );

      completedCells.push({ r, c });
      addStep(
        15,
        `Append Mapping Tuple (${r}, ${c}, ${offset}, ${val})`,
        `Recorded mapped coordinate tuple for (${r}, ${c}) to physical offset ${offset}.`,
        { r, c, offset, val, total_mapped: completedCells.length },
        r,
        c,
        completedCells,
      );
    }
  }

  // Return step
  addStep(
    17,
    "Return View Contiguity and Offset Mapping List",
    `Execution complete. Produced ${completedCells.length} mapped tensor view coordinates. is_contiguous = ${isContiguous}.`,
    { completed: true, is_contiguous: isContiguous, total_mapped: completedCells.length },
    undefined,
    undefined,
    completedCells,
  );

  return steps;
};

const ASSTRIDEDTENSORVIEWENGINE_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4],
  distractors: [
    "is_contiguous = (r_stride == 1)",
    "offset = r * cols + c",
    "return memory_buffer.reshape(shape)",
  ],
  hints: [
    {
      line: 9,
      hint: "A 2D tensor view is C-contiguous when column stride is 1 and row stride equals column count.",
    },
    {
      line: 13,
      hint: "Physical memory address calculation formula: storage_offset + r * r_stride + c * c_stride.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for ATen as_strided zero-copy view engine function.",
    2: "Starts docstring for as_strided tensor view engine.",
    3: "Explains purpose of calculating zero-copy strided element access and evaluating C-contiguity.",
    4: "Closes docstring for as_strided tensor view engine.",
    5: "Unpacks target row and column dimensions from shape tuple.",
    6: "Unpacks row and column stride step sizes from strides tuple.",
    7: "Initializes empty list flat_offsets to hold mapped coordinate-to-physical-offset tuples.",
    8: "Blank line before contiguity verification.",
    9: "Verifies row-major C-contiguity condition: c_stride == 1 and r_stride == cols.",
    10: "Blank line before row and column coordinate iteration.",
    11: "Iterates through row index r from 0 to rows - 1.",
    12: "Iterates through column index c from 0 to cols - 1.",
    13: "Calculates physical 1D memory offset = storage_offset + r * r_stride + c * c_stride.",
    14: "Fetches scalar value from memory_buffer at offset if within bounds, otherwise returns 0.",
    15: "Appends coordinate tuple (r, c, offset, val) to flat_offsets list.",
    16: "Blank line before function return statement.",
    17: "Returns tuple containing boolean C-contiguity flag and mapped physical offset tuples.",
  },
};

export const asStridedTensorViewEngine: AlgorithmDefinition<asStridedTensorViewEngineInput> = {
  id: "as-strided-tensor-view-engine",
  title: "PyTorch ATen `as_strided` Zero-Copy View Engine",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "In PyTorch's ATen C++ core and deep learning runtime engines, tensor operations such as `transpose()`, `permute()`, `slice()`, `narrow()`, and `expand()` do NOT re-allocate memory or copy underlying physical byte buffers. Instead, they invoke `torch.as_strided()`, reinterpreting raw 1D storage using custom shape dimensions, stride step vectors, and storage byte offsets.\n\nThis algorithm implements the core `as_strided` mapping formula $\\text{Offset} = \\text{StorageOffset} + \\sum_{i} \\text{coord}_i \\times \\text{stride}_i$, resolving 2D multi-dimensional tensor coordinates into 1D physical memory addresses while evaluating row-major (C-style) memory contiguity.\n\n### Problem Solved & ML Compiler Relevance\nZero-copy tensor view creation operates in $O(1)$ constant time regardless of tensor size (whether 1 KB or 100 GB). However, operating on non-contiguous strided views can drastically degrade downstream CUDA kernel performance due to non-coalesced memory reads. Understanding `as_strided` mechanics allows AI compilers (Triton, PyTorch Inductor) to detect non-contiguous views and emit stride-aware memory layout transformations before kernel launch.\n\n### Step-by-Step Execution\n1. **Parameter Resolution**: Unpack target view dimensions $[rows, cols]$ and strides $[r\\_stride, c\\_stride]$.\n2. **Contiguity Audit**: Check if $c\\_stride == 1$ and $r\\_stride == cols$.\n3. **Physical Address Mapping**: Loop through coordinates $(r, c)$ and evaluate $\\text{offset} = \\text{storage\\_offset} + r \\cdot r\\_stride + c \\cdot c\\_stride$.\n4. **Buffer Extraction**: Read $memory\\_buffer[offset]$ and record coordinate mapping.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Non-Contiguous Strided Tensor Slice",
      inputDisplay:
        "data = [10..120], shape = [3, 3], strides = [4, 1], storageOffset = 1",
      outputDisplay: "is_contiguous = false, Offsets: [(0,0)->1, (0,1)->2, ..., (2,2)->10]",
      input: {
        data: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
        shape: [3, 3],
        strides: [4, 1],
        storageOffset: 1,
      },
      output: "is_contiguous = false, 9 mapped coordinate offsets",
      explanation:
        "Creates 3x3 view with row stride 4 and offset 1. Because r_stride 4 != cols 3, it is non-contiguous.",
    },
    {
      kind: "complex",
      title: "Contiguous 2x3 Matrix View",
      inputDisplay: "data = [10, 20, 30, 40, 50, 60], shape = [2, 3], strides = [3, 1], storageOffset = 0",
      outputDisplay: "is_contiguous = true, Offsets: [(0,0)->0, ..., (1,2)->5]",
      input: {
        data: [10, 20, 30, 40, 50, 60],
        shape: [2, 3],
        strides: [3, 1],
        storageOffset: 0,
      },
      output: "is_contiguous = true, 6 mapped coordinate offsets",
      explanation: "Column stride is 1 and row stride equals column count 3, proving perfect C-contiguity.",
    },
    {
      kind: "negative",
      title: "Transposed View with Swapped Strides",
      inputDisplay: "data = [1, 2, 3, 4], shape = [2, 2], strides = [1, 2], storageOffset = 0",
      outputDisplay: "is_contiguous = false, Offsets: [(0,0)->0, (0,1)->2, (1,0)->1, (1,1)->3]",
      input: {
        data: [1, 2, 3, 4],
        shape: [2, 2],
        strides: [1, 2],
        storageOffset: 0,
      },
      output: "is_contiguous = false, transposed view",
      explanation: "Swapping strides creates a transposed 2D view without moving any underlying physical bytes.",
    },
  ],
  code: ASSTRIDEDTENSORVIEWENGINE_CODE,
  timeComplexity: { best: "O(rows * cols)", average: "O(rows * cols)", worst: "O(rows * cols)" },
  spaceComplexity: "O(rows * cols)",
  complexityAnalysis: {
    time: "O(R * C) pass mapping each logical coordinate to its physical memory address.",
    space: "O(R * C) memory allocation to store physical address tuples.",
  },
  topicGuide: {
    overview:
      "PyTorch's tensor architecture decouples logical tensor views from physical data storage (`StorageImpl`). Multiple Tensors can point to identical underlying CPU/GPU memory allocations with different shapes, strides, and storage offsets. Understanding `as_strided` mechanics is vital for analyzing PyTorch performance, avoiding unnecessary `tensor.contiguous()` copies, and optimizing Triton GPU kernels.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "Tensor operations like slicing, transposing, or reshaping would be prohibitively expensive if they copied underlying byte arrays. By maintaining a 1D physical `StorageImpl` and calculating logical coordinates on-the-fly via shape and stride metadata, PyTorch achieves instantaneous $\\mathcal{O}(1)$ view creation. The generalized physical address equation is:\n$$\\text{Offset} = \\text{StorageOffset} + \\sum_{k=0}^{D-1} i_k \\times \\text{stride}_k$$",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "`torch.as_strided` is the backbone of PyTorch's view mechanisms. It enables zero-copy tensor slicing, broadcasting (setting $\\text{stride}_k = 0$), sliding window operations (overlapping strided windows), and non-contiguous matrix transposes without allocating extra GPU VRAM.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "Suppose physical buffer `data = [10, 20, 30, 40, 50, 60, 70, 80]`, shape $= [2, 2]$, strides $= [4, 1]$, storage offset $O = 1$.\n1. ($r=0, c=0$): $\\text{offset} = 1 + 0 \\times 4 + 0 \\times 1 = 1 \\rightarrow \\text{val} = 20$.\n2. ($r=0, c=1$): $\\text{offset} = 1 + 0 \\times 4 + 1 \\times 1 = 2 \\rightarrow \\text{val} = 30$.\n3. ($r=1, c=0$): $\\text{offset} = 1 + 1 \\times 4 + 0 \\times 1 = 5 \\rightarrow \\text{val} = 60$.\n4. ($r=1, c=1$): $\\text{offset} = 1 + 1 \\times 4 + 1 \\times 1 = 6 \\rightarrow \\text{val} = 70$.\nThe logical $2 \\times 2$ view extracts `[[20, 30], [60, 70]]` instantly without copying data.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "While view creation is $\\mathcal{O}(1)$, operating on non-contiguous strided views can degrade downstream GPU kernel throughput due to non-coalesced memory access patterns during GEMM operations. Calling `tensor.contiguous()` performs an $\\mathcal{O}(N)$ copy to restore unit-stride layout when memory bandwidth is the bottleneck.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $\\mathcal{O}(R \\times C)$ where $R$ and $C$ are row and column view dimensions. Space Complexity: $\\mathcal{O}(R \\times C)$ for generating mapped view coordinate structures.",
      },
    ],
    keyTerms: [
      {
        term: "as_strided",
        definition:
          "PyTorch ATen low-level API creating arbitrary zero-copy tensor views using explicit shape and stride parameters.",
      },
      {
        term: "Memory Stride",
        definition:
          "The physical memory step size (number of scalars) required to advance one position along a logical dimension.",
      },
      {
        term: "C-Contiguity",
        definition:
          "Memory layout where adjacent logical elements along the last dimension reside in adjacent physical memory addresses.",
      },
      {
        term: "Storage Offset",
        definition:
          "The starting index offset in physical storage where the logical tensor view begins.",
      },
    ],
  },
  trivia: ASSTRIDEDTENSORVIEWENGINE_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_ASSTRIDEDTENSORVIEWENGINE_INPUT,
  generateSteps: generateAsStridedTensorViewEngineSteps,
};
