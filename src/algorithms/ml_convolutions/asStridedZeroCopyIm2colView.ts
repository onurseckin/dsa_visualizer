import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface asStridedZeroCopyIm2colViewInput {
  image?: number[][];
  kernel_size?: [number, number];
  stride?: number;
  padding?: number;
  data?: number[];
  target?: number;
}

export const ASSTRIDEDZEROCOPYIM2COLVIEW_CODE = `def as_strided_zero_copy_im2col_view(image, kernel_size, stride=1, padding=0):
    """
    Simulates PyTorch/NumPy tensor.as_strided() zero-copy view for im2col sliding windows.
    Instead of physically allocating an (H_out * W_out, K_h * K_w) memory buffer,
    this constructs a strided index view map where patch[r, c, kr, kc] maps directly
    to input offset r * stride_r + c * stride_c + kr * row_stride + kc * col_stride.
    """
    h_in, w_in = len(image), len(image[0])
    k_h, k_w = kernel_size

    # Virtual padding calculation
    h_pad, w_pad = h_in + 2 * padding, w_in + 2 * padding
    h_out = (h_pad - k_h) // stride + 1
    w_out = (w_pad - k_w) // stride + 1

    # Linear memory strides (row-major order)
    row_stride = w_in
    col_stride = 1

    # Construct virtual 4D view stride tuple: (out_r, out_c, k_r, k_c)
    view_strides = (
        stride * row_stride,
        stride * col_stride,
        row_stride,
        col_stride,
    )

    # Build non-copying virtual view matrix mapping (r_out, c_out) to input element offsets
    view_offsets = []
    for r in range(h_out):
        row_views = []
        for c in range(w_out):
            patch_offsets = []
            base_offset = r * view_strides[0] + c * view_strides[1]
            for kr in range(k_h):
                for kc in range(k_w):
                    offset = base_offset + kr * view_strides[2] + kc * view_strides[3]
                    patch_offsets.append(offset)
            row_views.append(patch_offsets)
        view_offsets.append(row_views)

    return view_offsets, (h_out, w_out)`;

export const DEFAULT_ASSTRIDEDZEROCOPYIM2COLVIEW_INPUT: asStridedZeroCopyIm2colViewInput = {
  image: [
    [1, 2, 3, 0],
    [0, 1, 2, 3],
    [3, 0, 1, 2],
    [2, 3, 0, 1],
  ],
  kernel_size: [2, 2],
  stride: 1,
  padding: 0,
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateAsStridedZeroCopyIm2colViewSteps = (
  input: asStridedZeroCopyIm2colViewInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const image = input.image || [
    [1, 2, 3, 0],
    [0, 1, 2, 3],
    [3, 0, 1, 2],
    [2, 3, 0, 1],
  ];

  const kernel_size = input.kernel_size || [2, 2];
  const stride = input.stride ?? 1;
  const padding = input.padding ?? 0;

  const hIn = image.length;
  const wIn = image[0].length;
  const [kH, kW] = kernel_size;

  const hPad = hIn + 2 * padding;
  const wPad = wIn + 2 * padding;

  const hOut = Math.floor((hPad - kH) / stride) + 1;
  const wOut = Math.floor((wPad - kW) / stride) + 1;

  const rowStride = wIn;
  const colStride = 1;

  const viewStrides = [
    stride * rowStride,
    stride * colStride,
    rowStride,
    colStride,
  ];

  const viewOffsets: number[][][] = [];

  const getSnapshot = (
    currentR: number = -1,
    currentC: number = -1,
  ): MatrixVisualSnapshot => {
    const rows = hOut;
    const cols = wOut;
    const cells: MatrixCellItem[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isCurrent = r === currentR && c === currentC;
        const offsets = viewOffsets[r]?.[c];
        const label = offsets ? `Offs:[${offsets.join(",")}]` : `Patch (${r},${c})`;
        const val = offsets ? offsets[0] : 0;
        const state = isCurrent ? "active" : offsets ? "visited" : "default";

        cells.push({
          row: r,
          col: c,
          value: val,
          label,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows,
      cols,
      title: `Zero-Copy Virtual View Offset Map (${rows}x${cols} Patches)`,
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentR: number = -1,
    currentC: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(currentR, currentC),
      auxiliaryState: {
        customState: {
          "Algorithm": "Zero-Copy as_strided im2col Engine",
          "Linear Memory Strides": `row_stride=${rowStride}, col_stride=${colStride}`,
          "Virtual 4D View Strides": `(${viewStrides.join(", ")})`,
          "DRAM Memory Overhead": "0 Bytes (Shared memory pointer view)",
          "Spatial Output Shape": `${hOut} x ${wOut}`,
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Initialize Zero-Copy `as_strided` im2col View Engine",
    `Started zero-copy as_strided view engine on ${hIn}x${wIn} image with ${kH}x${kW} kernel, stride=${stride}, padding=${padding}.`,
    { hIn, wIn, kH, kW, stride, padding },
  );

  // Step 2: Measure hIn, wIn
  addStep(
    8,
    "Measure Input Image Spatial Dimensions h_in, w_in",
    `Input spatial dimensions: h_in = ${hIn}, w_in = ${wIn}.`,
    { hIn, wIn },
  );

  // Step 3: Measure kH, kW
  addStep(
    9,
    "Extract Filter Kernel Dimensions k_h, k_w",
    `Filter kernel dimensions: k_h = ${kH}, k_w = ${kW}.`,
    { kH, kW },
  );

  // Step 4: Virtual padding calculation
  addStep(
    12,
    "Calculate Virtual Padded Dimensions h_pad, w_pad",
    `Virtual padded dimensions: h_pad = ${hPad}, w_pad = ${wPad}.`,
    { hPad, wPad, padding },
  );

  // Step 5: Calculate h_out
  addStep(
    13,
    "Calculate Spatial Output Height h_out",
    `Output feature height h_out = (${hPad} - ${kH}) // ${stride} + 1 = ${hOut}.`,
    { hOut, hPad, kH, stride },
  );

  // Step 6: Calculate w_out
  addStep(
    14,
    "Calculate Spatial Output Width w_out",
    `Output feature width w_out = (${wPad} - ${kW}) // ${stride} + 1 = ${wOut}.`,
    { wOut, wPad, kW, stride },
  );

  // Step 7: Linear strides
  addStep(
    17,
    "Calculate Linear Row Memory Stride",
    `Row-major contiguous memory stride along height axis: row_stride = w_in = ${rowStride}.`,
    { rowStride, wIn },
  );

  addStep(
    18,
    "Calculate Linear Column Memory Stride",
    `Column memory stride along width axis: col_stride = ${colStride}.`,
    { colStride },
  );

  // Step 8: View strides tuple
  addStep(
    21,
    "Construct Virtual 4D View Strides Tuple",
    `Created virtual 4D view stride tuple: (${viewStrides.join(", ")}).`,
    {
      "stride_0 (out_r)": viewStrides[0],
      "stride_1 (out_c)": viewStrides[1],
      "stride_2 (k_r)": viewStrides[2],
      "stride_3 (k_c)": viewStrides[3],
    },
  );

  // Step 9: Init view_offsets
  addStep(
    29,
    "Initialize Empty View Offsets Matrix List",
    `Created empty view_offsets list to store non-copying virtual memory address offset maps.`,
    { num_patches: hOut * wOut },
  );

  // Outer spatial loops
  for (let r = 0; r < hOut; r++) {
    const rowViews: number[][] = [];

    addStep(
      30,
      `Outer Spatial Row Loop: r = ${r}`,
      `Processing spatial output row r = ${r} of ${hOut - 1}.`,
      { r, hOut },
    );

    addStep(
      31,
      `Initialize Row Views Buffer for Row r = ${r}`,
      `Created empty row_views list for output row ${r}.`,
      { r },
    );

    for (let c = 0; c < wOut; c++) {
      addStep(
        32,
        `Inner Spatial Col Loop: c = ${c}`,
        `Processing spatial output column c = ${c} of ${wOut - 1}.`,
        { r, c, wOut },
      );

      const patchOffsets: number[] = [];
      addStep(
        33,
        `Initialize Patch Offsets Buffer`,
        `Created empty patch_offsets list for spatial anchor (${r}, ${c}).`,
        { r, c },
      );

      const baseOffset = r * viewStrides[0] + c * viewStrides[1];
      addStep(
        34,
        `Calculate Base Memory Offset: base_offset = ${baseOffset}`,
        `Evaluated base_offset = ${r} * ${viewStrides[0]} + ${c} * ${viewStrides[1]} = ${baseOffset}.`,
        { r, c, baseOffset },
      );

      for (let kr = 0; kr < kH; kr++) {
        addStep(
          35,
          `Kernel Row Loop: kr = ${kr}`,
          `Scanning kernel row kr = ${kr} of ${kH - 1}.`,
          { r, c, kr },
        );

        for (let kc = 0; kc < kW; kc++) {
          const offset = baseOffset + kr * viewStrides[2] + kc * viewStrides[3];
          patchOffsets.push(offset);

          addStep(
            37,
            `Calculate Element Memory Offset: offset = ${offset}`,
            `Evaluated offset = ${baseOffset} + ${kr} * ${viewStrides[2]} + ${kc} * ${viewStrides[3]} = ${offset}.`,
            { r, c, kr, kc, baseOffset, offset },
          );

          addStep(
            38,
            `Append Memory Offset ${offset} to Patch Offsets Vector`,
            `Recorded memory offset ${offset} in patch_offsets vector: [${patchOffsets.join(", ")}].`,
            { r, c, kr, kc, offset },
          );
        }
      }

      rowViews.push(patchOffsets);
      addStep(
        39,
        `Append Patch Offsets Vector to Row Views`,
        `Stored patch_offsets vector [${patchOffsets.join(", ")}] into row_views at column ${c}.`,
        { r, c, patchOffsets: `[${patchOffsets.join(", ")}]` },
        r,
        c,
      );
    }

    viewOffsets.push(rowViews);
    addStep(
      40,
      `Append Row Views to View Offsets Matrix`,
      `Stored row_views for spatial row ${r} into view_offsets matrix.`,
      { r },
      r,
    );
  }

  // Final step
  addStep(
    42,
    "Execution Complete",
    `Successfully constructed zero-copy as_strided view offsets matrix of shape (${hOut}, ${wOut}). Zero bytes of physical DRAM image data copied.`,
    { completed: true, hOut, wOut, DRAM_bytes_copied: 0 },
    hOut - 1,
    wOut - 1,
  );

  return steps;
};

const ASSTRIDEDZEROCOPYIM2COLVIEW_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 10, 11, 15, 16, 19, 20, 27, 28, 41],
  distractors: [
    "view_offsets.append(image[r][c])",
    "base_offset = r * w_in + c",
    "row_stride = h_in",
    "offset = kr * kc",
  ],
  hints: [
    {
      line: 21,
      hint: "Virtual 4D view stride tuple formula: (stride * row_stride, stride * col_stride, row_stride, col_stride).",
    },
    {
      line: 37,
      hint: "Direct linear memory offset formula: base_offset + kr * view_strides[2] + kc * view_strides[3].",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for as_strided zero-copy im2col view function.",
    2: "Docstring opening delimiter tag.",
    3: "Describes simulation of PyTorch/NumPy tensor.as_strided() zero-copy view for im2col sliding windows.",
    4: "Docstring note explaining elimination of physical DRAM buffer allocations.",
    5: "Docstring continuation tag.",
    6: "Docstring linear memory offset mapping formula.",
    7: "Docstring closing delimiter tag.",
    8: "Measures height h_in and width w_in of input image matrix.",
    9: "Unpacks kernel height k_h and width k_w from kernel_size tuple.",
    10: "Blank line before virtual padding calculation.",
    11: "Comment for virtual padding calculation.",
    12: "Calculates virtual padded height h_pad and width w_pad.",
    13: "Calculates spatial output height h_out using integer division floor.",
    14: "Calculates spatial output width w_out using integer division floor.",
    15: "Blank line before memory stride calculation.",
    16: "Comment for linear memory strides in row-major order.",
    17: "Calculates contiguous row memory stride row_stride = w_in.",
    18: "Calculates contiguous column memory stride col_stride = 1.",
    19: "Blank line before 4D view strides tuple construction.",
    20: "Comment for virtual 4D view stride tuple.",
    21: "Constructs virtual 4D view strides tuple (stride*row_stride, stride*col_stride, row_stride, col_stride).",
    22: "View stride 0: spatial output row stride.",
    23: "View stride 1: spatial output column stride.",
    24: "View stride 2: kernel row stride.",
    25: "View stride 3: kernel column stride.",
    26: "Closes view_strides tuple definition.",
    27: "Blank line before view offsets matrix construction.",
    28: "Comment for non-copying virtual view matrix mapping.",
    29: "Initializes list view_offsets to store virtual memory address offset maps.",
    30: "Iterates over spatial output row coordinate r from 0 to h_out - 1.",
    31: "Initializes list row_views for current output row r.",
    32: "Iterates over spatial output column coordinate c from 0 to w_out - 1.",
    33: "Initializes list patch_offsets for spatial anchor (r, c).",
    34: "Calculates base memory offset for spatial window anchor (r, c).",
    35: "Iterates over filter kernel spatial row tap kr from 0 to k_h - 1.",
    36: "Iterates over filter kernel spatial column tap kc from 0 to k_w - 1.",
    37: "Calculates direct linear memory offset for kernel element (kr, kc).",
    38: "Appends calculated element offset to patch_offsets vector.",
    39: "Appends patch_offsets vector to row_views list.",
    40: "Appends row_views list to view_offsets matrix.",
    41: "Blank line separating view construction loops from return statement.",
    42: "Returns non-copying virtual view_offsets matrix and (h_out, w_out) shape tuple.",
  },
};

export const asStridedZeroCopyIm2colView: AlgorithmDefinition<asStridedZeroCopyIm2colViewInput> =
  {
    id: "asStridedZeroCopyIm2colView",
    title: "Zero-Copy `as_strided` im2col View Engine",
    category: "ml_convolutions",
    categories: ["ml_convolutions", "ml_tensor_algebra"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_convolutions",
    description:
      "The **Zero-Copy `as_strided` im2col View Engine** simulates PyTorch's `torch.as_strided()` and NumPy's `np.lib.stride_tricks.as_strided()` primitives for 2D sliding window convolutions. Instead of physically allocating $O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)$ DRAM memory to unroll receptive field patches, `as_strided` creates a **virtual 4D tensor view** backed by the original continuous 2D image memory storage, manipulating stride metadata tuples to map multi-dimensional tensor indices directly into linear DRAM byte offsets.\n\n### Why It Exists\nStandard `im2col` creates duplicate copies of overlapping receptive field pixels, consuming massive GPU memory bandwidth. `as_strided` achieves **0 Bytes of DRAM memory allocation** by constructing virtual stride tuples $(S_0, S_1, S_2, S_3)$, allowing GPU/CPU execution engines to iterate over sliding windows without memory copies.\n\n### Mathematical Formulation\nGiven an image tensor $X \\in \\mathbb{R}^{H \\times W}$ stored in row-major memory order ($stride_{row} = W, stride_{col} = 1$), spatial stride $S$, and kernel size $(K_h, K_w)$:\n\n$$1. \\quad \\text{View Shape} = (H_{out}, \\, W_{out}, \\, K_h, \\, K_w)$$\n\n$$2. \\quad \\text{View Strides} = (S \\cdot W, \\, S \\cdot 1, \\, W, \\, 1)$$\n\n$$3. \\quad \\text{Linear DRAM Offset}(r_{out}, c_{out}, kr, kc) = r_{out} \\cdot (S \\cdot W) + c_{out} \\cdot (S \\cdot 1) + kr \\cdot W + kc \\cdot 1$$\n\n### Step-by-Step Intuition\n1. **Continuous Memory Storage**: Linear image elements are laid out sequentially in RAM as $X_{flat}[r \\cdot W + c]$.\n2. **4D Stride Tuple Construction**: Define 4D stride steps: advancing 1 spatial row jumps $S \\cdot W$ elements; advancing 1 kernel row jumps $W$ elements.\n3. **Virtual Memory Pointer Mapping**: When reading cell $(r_{out}, c_{out}, kr, kc)$, compute the linear offset dynamically without copying pixels.\n4. **BLAS GEMM Execution**: Pass the strided view directly into BLAS routines or custom CUDA kernels.\n\n### Key Trade-Offs & Hardware Execution\n- **Zero Memory Allocation**: $O(1)$ extra memory space. Extremely fast tensor view creation ($O(1)$ time).\n- **Non-Contiguous BLAS Limitation**: Standard GEMM routines (e.g. cuBLAS `cublasSgemm`) require contiguous memory columns/rows. Because `as_strided` creates non-unit, overlapping strides, standard BLAS libraries cannot execute GEMM directly on `as_strided` views without unrolling or using custom CUTLASS strided kernels.",
    constraints: [
      "1 <= H_in, W_in <= 1024",
      "1 <= K_h, K_w <= 11",
      "stride >= 1",
      "padding >= 0",
    ],
    examples: [
      {
        kind: "basic",
        title: "Standard 4x4 Image as_strided View Construction",
        inputDisplay: "Image 4x4, Kernel 2x2, Stride 1",
        outputDisplay: "Virtual 4D view offset map (3x3 patches)",
        input: DEFAULT_ASSTRIDEDZEROCOPYIM2COLVIEW_INPUT,
        output: "Virtual offset map matrix",
        explanation: "Constructs 4D stride tuple (4, 1, 4, 1) mapping 3x3 sliding windows directly to linear DRAM offsets.",
      },
    ],
    code: ASSTRIDEDZEROCOPYIM2COLVIEW_CODE,
    timeComplexity: {
      best: "O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
      average: "O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
      worst: "O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
    },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Constructing virtual 4D index offset map takes $O(H_{out} W_{out} K_h K_w)$ operations.",
      space: "Requires $O(1)$ auxiliary DRAM memory space because tensor data is shared zero-copy via stride metadata.",
    },
    topicGuide: {
      overview:
        "The **Zero-Copy as_strided im2col View Engine** constructs virtual 4D tensor views backed by original 2D image memory storage by manipulating stride metadata tuples $(S_0, S_1, S_2, S_3)$ without copying underlying DRAM bytes ($O(1)$ memory).",
      sections: [
        {
          heading: "1. Core Concept & Strided Tensor Views",
          body: "A tensor view consists of a pointer to underlying continuous data, a shape tuple, and a stride tuple. `torch.as_strided()` creates virtual multi-dimensional views by modifying stride tuples without copying underlying DRAM bytes.",
        },
        {
          heading: "2. Linear Byte Offset Calculation",
          body: "For 4D view $(r_{out}, c_{out}, kr, kc)$, the linear memory offset is computed via dot product with `view_strides`:\n$$\\text{offset} = r_{out} \\cdot (S \\cdot W) + c_{out} \\cdot (S \\cdot 1) + kr \\cdot W + kc \\cdot 1$$",
        },
        {
          heading: "3. Systems & Memory Bandwidth Advantages",
          body: "Standard `im2col` allocates gigabytes of DRAM for large image batches. Zero-copy strided views consume zero extra DRAM memory, eliminating DRAM bandwidth bottlenecks in PyTorch and NumPy runtime engines.",
        },
        {
          heading: "4. Edge Case Analysis & Non-Contiguous Memory Restrictions",
          body: "Because overlapping windows create non-contiguous strided views (where elements repeat at different offset coordinates), passing strided views to BLAS GEMM requires specialized CUDA kernels (such as CUTLASS strided kernels).",
        },
      ],
      keyTerms: [
        {
          term: "as_strided",
          definition: "PyTorch/NumPy tensor operation creating multi-dimensional views via custom stride tuples without memory allocation.",
        },
        {
          term: "Stride Tuple",
          definition: "Vector specifying the memory offset step size required to advance along each tensor dimension.",
        },
        {
          term: "Zero-Copy View",
          definition: "Virtual tensor representation sharing underlying DRAM storage with original parent tensor.",
        },
        {
          term: "Linear Offset",
          definition: "Scalar memory address offset calculated from multi-dimensional index dot product with stride tuple.",
        },
      ],
    },
    trivia: ASSTRIDEDZEROCOPYIM2COLVIEW_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_ASSTRIDEDZEROCOPYIM2COLVIEW_INPUT,
    generateSteps: generateAsStridedZeroCopyIm2colViewSteps,
  };
