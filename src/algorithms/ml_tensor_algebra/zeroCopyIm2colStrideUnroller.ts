import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface zeroCopyIm2colStrideUnrollerInput {
  matrix: number[][];
  kernelSize?: number;
  stride?: number;
}

export const ZEROCOPYIM2COLSTRIDEUNROLLER_CODE = `def zero_copy_im2col_stride_unroller(input_matrix, kernel_size=2, stride=1):
    """
    Unrolls 2D receptive fields into column matrix vectors without copying memory.
    """
    in_rows = len(input_matrix)
    in_cols = len(input_matrix[0]) if in_rows > 0 else 0
    out_rows = (in_rows - kernel_size) // stride + 1
    out_cols = (in_cols - kernel_size) // stride + 1
    patches = []

    for r in range(out_rows):
        for c in range(out_cols):
            patch = []
            for kr in range(kernel_size):
                for kc in range(kernel_size):
                    val = input_matrix[r * stride + kr][c * stride + kc]
                    patch.append(val)
            patches.append(patch)

    return patches`;

export const DEFAULT_ZEROCOPYIM2COLSTRIDEUNROLLER_INPUT: zeroCopyIm2colStrideUnrollerInput = {
  matrix: [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
  ],
  kernelSize: 2,
  stride: 1,
};

export const generateZeroCopyIm2colStrideUnrollerSteps = (
  input: zeroCopyIm2colStrideUnrollerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const matrix = input.matrix;
  const kernelSize = input.kernelSize ?? 2;
  const stride = input.stride ?? 1;

  const inRows = matrix.length;
  const inCols = inRows > 0 ? matrix[0].length : 0;
  const outRows = Math.floor((inRows - kernelSize) / stride) + 1;
  const outCols = Math.floor((inCols - kernelSize) / stride) + 1;

  const patches: number[][] = [];

  const buildMatrixSnapshot = (
    currentPatchOrigin: [number, number] | null,
    currentKernelOffset: [number, number] | null,
    title: string,
  ) => {
    const cells: MatrixCellItem[] = [];
    const [pR, pC] = currentPatchOrigin ?? [-99, -99];
    const [kR, kC] = currentKernelOffset ?? [-99, -99];

    const isCurrentPatchCell = (row: number, col: number) => {
      return (
        row >= pR &&
        row < pR + kernelSize &&
        col >= pC &&
        col < pC + kernelSize
      );
    };

    const isCurrentActiveElem = (row: number, col: number) => {
      return row === pR + kR && col === pC + kC;
    };

    for (let r = 0; r < inRows; r++) {
      for (let c = 0; c < inCols; c++) {
        let state: MatrixCellItem["state"] = "default";
        if (isCurrentActiveElem(r, c)) {
          state = "active";
        } else if (isCurrentPatchCell(r, c)) {
          state = "compared";
        }

        cells.push({
          row: r,
          col: c,
          value: matrix[r][c],
          label: `[${r}][${c}]`,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows: inRows,
      cols: inCols,
      cells,
      rowHeaders: Array.from({ length: inRows }, (_, i) => `R${i}`),
      colHeaders: Array.from({ length: inCols }, (_, i) => `C${i}`),
      title,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    patchOrigin: [number, number] | null = null,
    kernelOffset: [number, number] | null = null,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: buildMatrixSnapshot(
        patchOrigin,
        kernelOffset,
        `Zero-Copy im2col Receptive Field Unroller (${inRows}x${inCols} Image, K=${kernelSize}, S=${stride})`,
      ),
      auxiliaryState: {
        customState: {
          imageShape: `${inRows}x${inCols}`,
          kernelSize,
          stride,
          outGrid: `${outRows}x${outCols}`,
          totalPatches: outRows * outCols,
          unrolledPatches: JSON.stringify(patches),
        },
      },
      variables,
    });
  };

  // Line 1: Function entry
  addStep(
    1,
    `Call zero_copy_im2col_stride_unroller(input_matrix [${inRows}x${inCols}], kernel_size=${kernelSize}, stride=${stride})`,
    `Unrolling receptive fields of size ${kernelSize}x${kernelSize} across image matrix with stride ${stride}.`,
    { in_rows: inRows, in_cols: inCols, kernel_size: kernelSize, stride },
  );

  // Line 5: in_rows = len(input_matrix)
  addStep(
    5,
    `in_rows = len(input_matrix) -> ${inRows}`,
    `Determined input image height = ${inRows} rows.`,
    { in_rows: inRows },
  );

  // Line 6: in_cols = len(input_matrix[0])
  addStep(
    6,
    `in_cols = len(input_matrix[0]) -> ${inCols}`,
    `Determined input image width = ${inCols} columns.`,
    { in_rows: inRows, in_cols: inCols },
  );

  // Line 7: out_rows = (in_rows - kernel_size) // stride + 1
  addStep(
    7,
    `out_rows = (${inRows} - ${kernelSize}) // ${stride} + 1 -> ${outRows}`,
    `Calculated output spatial patch grid height = ${outRows}.`,
    { out_rows: outRows },
  );

  // Line 8: out_cols = (in_cols - kernel_size) // stride + 1
  addStep(
    8,
    `out_cols = (${inCols} - ${kernelSize}) // ${stride} + 1 -> ${outCols}`,
    `Calculated output spatial patch grid width = ${outCols}. Total patches = ${outRows * outCols}.`,
    { out_rows: outRows, out_cols: outCols },
  );

  // Line 9: patches = []
  addStep(
    9,
    "patches = []",
    "Initialized array to store unrolled receptive field patch vectors.",
    { patches_len: 0 },
  );

  // Loop spatial patches
  for (let r = 0; r < outRows; r++) {
    for (let c = 0; c < outCols; c++) {
      const patchTopLeftR = r * stride;
      const patchTopLeftC = c * stride;

      // Line 11: Spatial row loop
      addStep(
        11,
        `Outer patch row loop: r = ${r} of ${outRows}`,
        `Processing receptive field patch row ${r}. Top-left row index = ${patchTopLeftR}.`,
        { r, out_rows: outRows, patchTopLeftR },
        [patchTopLeftR, patchTopLeftC],
      );

      // Line 12: Spatial col loop
      addStep(
        12,
        `Outer patch col loop: c = ${c} of ${outCols} (Patch origin at [${patchTopLeftR}][${patchTopLeftC}])`,
        `Extracting patch (${r}, ${c}) originating at input matrix position [${patchTopLeftR}][${patchTopLeftC}].`,
        { r, c, out_cols: outCols, patchTopLeftR, patchTopLeftC },
        [patchTopLeftR, patchTopLeftC],
      );

      const patch: number[] = [];
      // Line 13: patch = []
      addStep(
        13,
        `patch = [] (Patch (${r}, ${c}))`,
        `Initialized vector container for ${kernelSize}x${kernelSize} patch (${r}, ${c}).`,
        { r, c },
        [patchTopLeftR, patchTopLeftC],
      );

      for (let kr = 0; kr < kernelSize; kr++) {
        for (let kc = 0; kc < kernelSize; kc++) {
          const inR = patchTopLeftR + kr;
          const inC = patchTopLeftC + kc;

          // Line 14 & 15: Kernel relative loops
          addStep(
            15,
            `Kernel loop: kr=${kr}, kc=${kc} -> input cell [${inR}][${inC}]`,
            `Reading receptive field element at local offset (${kr}, ${kc}), physical cell [${inR}][${inC}].`,
            { kr, kc, inR, inC },
            [patchTopLeftR, patchTopLeftC],
            [kr, kc],
          );

          // Line 16: val = input_matrix[r * stride + kr][c * stride + kc]
          const val = matrix[inR][inC];
          addStep(
            16,
            `val = input_matrix[${inR}][${inC}] -> ${val}`,
            `Extracted activation value ${val} from image matrix.`,
            { inR, inC, val },
            [patchTopLeftR, patchTopLeftC],
            [kr, kc],
          );

          // Line 17: patch.append(val)
          patch.push(val);
          addStep(
            17,
            `patch.append(${val})`,
            `Appended activation ${val} to current receptive patch vector [${patch.join(", ")}].`,
            { val, patch_len: patch.length },
            [patchTopLeftR, patchTopLeftC],
            [kr, kc],
          );
        }
      }

      patches.push(patch);
      // Line 18: patches.append(patch)
      addStep(
        18,
        `patches.append([${patch.join(", ")}])`,
        `Completed receptive patch (${r}, ${c}). Appended unrolled column vector [${patch.join(", ")}] to patches list.`,
        { r, c, total_patches: patches.length },
        [patchTopLeftR, patchTopLeftC],
      );
    }
  }

  // Line 20: Return patches
  addStep(
    20,
    "Return patches",
    `Completed zero-copy im2col stride unrolling. Produced ${patches.length} unrolled patch column vectors.`,
    { total_patches: patches.length, completed: true },
  );

  return steps;
};

const ZEROCOPYIM2COLSTRIDEUNROLLER_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "val = input_matrix[kr][kc]",
    "out_rows = (in_rows + kernel_size) // stride",
    "patches.append(input_matrix[r][c])",
  ],
  hints: [{ line: 16, hint: "Compute physical row index as r * stride + kr and column as c * stride + kc." }],
  lineExplanations: {
    1: "Defines entry point for zero-copy im2col stride receptive field unroller.",
    2: "Docstring opening tag.",
    3: "Describes unrolling 2D receptive fields into matrix patch column vectors.",
    4: "Docstring closing tag.",
    5: "Gets spatial height of input activation matrix (in_rows = len(input_matrix)).",
    6: "Gets spatial width of input activation matrix (in_cols = len(input_matrix[0])).",
    7: "Calculates spatial height of unrolled output patches matrix H_out = (in_rows - kernel_size) / stride + 1.",
    8: "Calculates spatial width of unrolled output patches matrix W_out = (in_cols - kernel_size) / stride + 1.",
    9: "Initializes empty list to accumulate unrolled receptive field patch vectors.",
    10: "Blank line preceding spatial output patch row loop.",
    11: "Iterates through spatial output patch row index r from 0 to out_rows - 1.",
    12: "Iterates through spatial output patch column index c from 0 to out_cols - 1.",
    13: "Initializes empty list for current local receptive field patch.",
    14: "Iterates through local kernel relative row offset kr from 0 to kernel_size - 1.",
    15: "Iterates through local kernel relative column offset kc from 0 to kernel_size - 1.",
    16: "Reads image activation value at calculated strided input position input_matrix[r * stride + kr][c * stride + kc].",
    17: "Appends extracted activation scalar val to current patch vector.",
    18: "Appends completed receptive field patch vector to patches list.",
    19: "Blank line preceding return statement.",
    20: "Returns unrolled receptive field patches array.",
  },
};

export const zeroCopyIm2colStrideUnroller: AlgorithmDefinition<zeroCopyIm2colStrideUnrollerInput> =
  {
    id: "zero-copy-im2col-stride-unroller",
    title: "Zero-Copy im2col Stride Receptive Field Unroller",
    category: "ml_tensor_algebra",
    categories: ["ml_tensor_algebra", "arrays_and_hashing"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 1,
    mlInfraCategory: "ml_tensor_algebra",
    description:
      "In high-performance Deep Learning frameworks (PyTorch `torch.nn.functional.unfold`, cuDNN, Caffe, ONNX Runtime), 2D Convolution layers are transformed into General Matrix Multiplications (GEMM) using the `im2col` (Image to Column) transformation.\n\n`im2col` extracts every sliding $K \\times K$ receptive field window from a 2D image activation matrix and serializes it into a 1D column vector of length $K^2$. Stacking these column vectors forms a 2D matrix of shape $(K^2, H_{\\text{out}} \\times W_{\\text{out}})$, enabling optimized BLAS GEMM kernels to perform convolutions at peak GPU FLOP utilization:\n$$\\text{Output\\_Dim} = \\lfloor \\frac{N - K}{S} \\rfloor + 1$$\n\nWhile naive `im2col` expands physical DRAM usage by $K^2$ times due to overlapping patch copies, modern compiler frameworks (Triton, CUDA, TVM) compute strided patch memory addresses $[r \\times S + kr][c \\times S + kc]$ dynamically inside registers (implicit zero-copy `im2col`), avoiding physical memory copy overhead.",
    constraints: ["1 <= inRows, inCols <= 64", "1 <= kernelSize <= min(inRows, inCols)", "1 <= stride <= min(inRows, inCols)"],
    examples: [
      {
        kind: "basic",
        title: "4x4 Image with 2x2 Kernel and Stride 1",
        inputDisplay: "matrix = 4x4, kernelSize = 2, stride = 1",
        outputDisplay: "9 unrolled patch vectors of length 4",
        input: {
          matrix: [
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [9, 10, 11, 12],
            [13, 14, 15, 16],
          ],
          kernelSize: 2,
          stride: 1,
        },
        output: "[[1, 2, 5, 6], [2, 3, 6, 7], ...]",
        explanation: "Extracted 3x3 = 9 sliding 2x2 receptive fields into unrolled 4-element vectors.",
      },
      {
        kind: "complex",
        title: "4x4 Image with Stride 2 (Non-Overlapping Patches)",
        inputDisplay: "matrix = 4x4, kernelSize = 2, stride = 2",
        outputDisplay: "4 unrolled patch vectors of length 4",
        input: {
          matrix: [
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [9, 10, 11, 12],
            [13, 14, 15, 16],
          ],
          kernelSize: 2,
          stride: 2,
        },
        output: "[[1, 2, 5, 6], [3, 4, 7, 8], [9, 10, 13, 14], [11, 12, 15, 16]]",
        explanation: "Stride 2 generates 4 disjoint non-overlapping receptive field patches.",
      },
      {
        kind: "negative",
        title: "Kernel Size Equal to Input Dimension",
        inputDisplay: "matrix = [[1, 2], [3, 4]], kernelSize = 2, stride = 1",
        outputDisplay: "[[1, 2, 3, 4]]",
        input: {
          matrix: [
            [1, 2],
            [3, 4],
          ],
          kernelSize: 2,
          stride: 1,
        },
        output: "[[1, 2, 3, 4]]",
        explanation: "Image dimension equals kernel size; produces single global receptive field patch.",
      },
    ],
    code: ZEROCOPYIM2COLSTRIDEUNROLLER_CODE,
    timeComplexity: { best: "O(H_out * W_out * K^2)", average: "O(H_out * W_out * K^2)", worst: "O(H_out * W_out * K^2)" },
    spaceComplexity: "O(H_out * W_out * K^2)",
    complexityAnalysis: {
      time: "O(H_out * W_out * K^2) iterates through all elements of all unrolled receptive fields.",
      space: "O(H_out * W_out * K^2) memory allocated for the unrolled patches matrix output.",
    },
    topicGuide: {
      overview:
        "The `im2col` (image to column) algorithm is the foundational cornerstone of modern deep learning computer vision acceleration. By mapping 2D spatial convolution windows into matrix columns, convolutions are reduced to General Matrix Multiplication (GEMM), enabling deep learning frameworks to leverage highly optimized BLAS libraries (cuBLAS, Intel MKL) and hardware matrix accelerators (NVIDIA Tensor Cores, TPU MXUs).",
      sections: [
        {
          heading: "Why It Exists & Theoretical Foundations",
          body: "Standard 2D convolution applies a $K \\times K$ filter across input image $H \\times W$ with 6 nested loops, causing fragmented memory access patterns. By restructuring all $K \\times K$ input patches into columns of matrix $X_{\\text{col}}$ (shape $K^2 \\times N_{\\text{patches}}$) and reshaping weights into matrix $W_{\\text{row}}$ (shape $C_{\\text{out}} \\times K^2$), 2D convolution becomes a single matrix multiply:\n$$Y = W_{\\text{row}} \\cdot X_{\\text{col}}$$",
        },
        {
          heading: "What It Solves & Real-World Applications",
          body: "Every PyTorch Conv2D layer, Vision Transformer (ViT) patch embedding layer, and object detection feature extractor relies on `im2col` transformation. PyTorch exposes this directly via `torch.nn.functional.unfold(input, kernel_size, stride)`.",
        },
        {
          heading: "Step-by-Step Intuition & Worked Example",
          body: "For a $3 \\times 3$ image `[[1, 2, 3], [4, 5, 6], [7, 8, 9]]` and $2 \\times 2$ kernel ($K=2, S=1$):\nOutput grid size $H_{\\text{out}} = \\lfloor \\frac{3-2}{1} \\rfloor + 1 = 2$, $W_{\\text{out}} = 2$ (4 patches total):\n1. Patch (0,0) top-left $(0,0)$: `[[1,2],[4,5]]` $\\rightarrow$ unrolled vector `[1, 2, 4, 5]`.\n2. Patch (0,1) top-left $(0,1)$: `[[2,3],[5,6]]` $\\rightarrow$ unrolled vector `[2, 3, 5, 6]`.\n3. Patch (1,0) top-left $(1,0)$: `[[4,5],[7,8]]` $\\rightarrow$ unrolled vector `[4, 5, 7, 8]`.\n4. Patch (1,1) top-left $(1,1)$: `[[5,6],[8,9]]` $\\rightarrow$ unrolled vector `[5, 6, 8, 9]`.\nPhysical input cell is computed as `matrix[r * stride + kr][c * stride + kc]`.",
        },
        {
          heading: "Trade-offs & Hardware Realities",
          body: "Explicit `im2col` creates duplicate copies of overlapping image regions (up to $K^2$ memory expansion), which can exceed GPU VRAM limits for large images. Modern deep learning compilers (Triton, TVM, cuDNN v8) use 'implicit `im2col` GEMM', calculating strided patch addresses dynamically inside GPU register files during fused GEMM execution without allocating unrolled matrices in DRAM.",
        },
        {
          heading: "Time & Space Complexity Analysis",
          body: "Time Complexity: $\\mathcal{O}(H_{\\text{out}} \\times W_{\\text{out}} \\times K^2)$ to read and extract scalar values for all unrolled patches. Space Complexity: $\\mathcal{O}(H_{\\text{out}} \\times W_{\\text{out}} \\times K^2)$ for explicit unrolled output matrix storage.",
        },
      ],
      keyTerms: [
        {
          term: "im2col Transformation",
          definition: "Algorithmic transformation restructuring 2D spatial receptive fields into matrix columns to execute convolution as GEMM.",
        },
        {
          term: "Implicit im2col",
          definition: "CUDA kernel technique computing strided patch addresses on-the-fly inside GPU registers to eliminate DRAM memory expansion.",
        },
        {
          term: "Receptive Field",
          definition: "The local spatial window of input activations aggregated by a convolution filter kernel.",
        },
        {
          term: "Tensor Core Acceleration",
          definition: "Hardware matrix execution units on modern GPUs optimized specifically for high-throughput GEMM operations.",
        },
      ],
    },
    trivia: ZEROCOPYIM2COLSTRIDEUNROLLER_TRIVIA,
    sources: [{ kind: "standard", label: "ML Infra Level 1" }],
    defaultInput: DEFAULT_ZEROCOPYIM2COLSTRIDEUNROLLER_INPUT,
    generateSteps: generateZeroCopyIm2colStrideUnrollerSteps,
  };
