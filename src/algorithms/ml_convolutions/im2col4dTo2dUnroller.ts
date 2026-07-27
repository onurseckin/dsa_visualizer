import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface im2col4dTo2dUnrollerInput {
  inputTensor: number[][][][];
  kernelH: number;
  kernelW: number;
  stride?: number;
  padding?: number;
}

export const IM2COL4DTO2DUNROLLER_CODE = `
def im2col_4d_to_2d(input_tensor, kernel_h, kernel_w, stride=1, padding=0):
    """
    Strided im2col 4D-to-2D Matrix Unroller.
    Unrolls sliding 3D receptive fields across a batch of 4D tensors (N, C, H, W)
    into a continuous 2D matrix of shape (C * kH * kW, N * H_out * W_out)
    to enable fast matrix multiplication (GEMM) via BLAS/cuBLAS libraries.
    """
    N = len(input_tensor)
    C = len(input_tensor[0])
    H = len(input_tensor[0][0])
    W = len(input_tensor[0][0][0])

    H_out = (H + 2 * padding - kernel_h) // stride + 1
    W_out = (W + 2 * padding - kernel_w) // stride + 1

    rows = C * kernel_h * kernel_w
    cols = N * H_out * W_out
    col_matrix = [[0.0] * cols for _ in range(rows)]

    col_idx = 0
    for n in range(N):
        for r in range(H_out):
            for c in range(W_out):
                row_idx = 0
                for ch in range(C):
                    for kr in range(kernel_h):
                        for kc in range(kernel_w):
                            ir = r * stride + kr - padding
                            ic = c * stride + kc - padding
                            if 0 <= ir < H and 0 <= ic < W:
                                col_matrix[row_idx][col_idx] = input_tensor[n][ch][ir][ic]
                            else:
                                col_matrix[row_idx][col_idx] = 0.0
                            row_idx += 1
                col_idx += 1

    return col_matrix
`;

export const DEFAULT_IM2COL4DTO2DUNROLLER_INPUT: im2col4dTo2dUnrollerInput = {
  inputTensor: [
    [
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
    ],
  ],
  kernelH: 2,
  kernelW: 2,
  stride: 1,
  padding: 0,
};

export const generateIm2col4dTo2dUnrollerSteps = (
  input: im2col4dTo2dUnrollerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const tensor = input.inputTensor;
  const kH = input.kernelH;
  const kW = input.kernelW;
  const stride = input.stride ?? 1;
  const padding = input.padding ?? 0;

  const N = tensor.length;
  const C = tensor[0].length;
  const H = tensor[0][0].length;
  const W = tensor[0][0][0].length;

  const H_out = Math.floor((H + 2 * padding - kH) / stride) + 1;
  const W_out = Math.floor((W + 2 * padding - kW) / stride) + 1;

  const rows = C * kH * kW;
  const cols = N * H_out * W_out;

  const flatInput = tensor.flatMap((b) => b.flatMap((ch) => ch.flatMap((r) => r)));
  const elements: ArrayElement[] = flatInput.map((val, idx) => ({
    id: `val-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customState?: Record<string, string>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el) => ({ ...el })),
      },
      auxiliaryState: {
        customState: {
          inputShape: `(${N}, ${C}, ${H}, ${W})`,
          unrolledShape: `(${rows}, ${cols})`,
          kernelShape: `(${kH}, ${kW})`,
          ...customState,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Strided im2col 4D-to-2D Matrix Unroller",
    "Setting up output matrix dimensions for unrolling 4D receptive fields into 2D BLAS GEMM format.",
    { N, C, H, W, kH, kW, H_out, W_out, rows, cols },
  );

  const colMatrix: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  let colIdx = 0;
  for (let n = 0; n < N; n++) {
    for (let r = 0; r < H_out; r++) {
      for (let c = 0; c < W_out; c++) {
        let rowIdx = 0;
        const patchValues: number[] = [];

        for (let ch = 0; ch < C; ch++) {
          for (let kr = 0; kr < kH; kr++) {
            for (let kc = 0; kc < kW; kc++) {
              const ir = r * stride + kr - padding;
              const ic = c * stride + kc - padding;
              const val = ir >= 0 && ir < H && ic >= 0 && ic < W ? tensor[n][ch][ir][ic] : 0;
              colMatrix[rowIdx][colIdx] = val;
              patchValues.push(val);
              rowIdx++;
            }
          }
        }

        addStep(
          20,
          `Unroll patch for batch ${n}, spatial location (${r}, ${c}) -> Column ${colIdx}`,
          `Extracted receptive field patch vector [${patchValues.join(", ")}] into matrix column ${colIdx}.`,
          { batch: n, r, c, colIdx, patchValues: patchValues.join(",") },
          { currentCol: `Col ${colIdx}: [${patchValues.join(", ")}]` },
        );

        colIdx++;
      }
    }
  }

  addStep(
    34,
    "Execution Complete",
    `Successfully transformed 4D tensor into ${rows}x${cols} unrolled im2col matrix.`,
    { completed: true, rows, cols },
  );

  return steps;
};

const IM2COL4DTO2DUNROLLER_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "col_matrix[col_idx][row_idx] = input_tensor[n][ch][ir][ic]",
    "cols = N * H * W",
    "if padding != 0: raise Exception('Padding not supported')",
  ],
  hints: [
    {
      line: 20,
      hint: "Each receptive field patch across (C, kH, kW) forms one column in the unrolled matrix.",
    },
    { line: 34, hint: "The unrolled matrix has C * kH * kW rows and N * H_out * W_out columns." },
  ],
  lineExplanations: {
    1: "Entry point for strided im2col 4D-to-2D matrix unroller function.",
    20: "Inner loop extracting receptive field patches into contiguous matrix column entries.",
    34: "Returns the 2D im2col matrix ready for GEMM multiplication.",
  },
};

export const im2col4dTo2dUnroller: AlgorithmDefinition<im2col4dTo2dUnrollerInput> = {
  id: "im2col4dTo2dUnroller",
  title: "Strided im2col 4D-to-2D Matrix Unroller",
  category: "ml_convolutions",
  categories: ["ml_convolutions", "ml_gemm_roofline"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_convolutions",
  description:
    "The im2col (image-to-column) transformation is a fundamental algorithmic step used by modern deep learning frameworks (PyTorch, TensorFlow, cuDNN) to lower N-dimensional spatial convolutions into standard 2D General Matrix Multiplications (GEMM). Given a 4D tensor of shape (N, C, H, W) and kernel dimensions (kH, kW), im2col extracts every sliding receptive field patch and stacks it as a column in a 2D matrix of shape (C * kH * kW, N * H_out * W_out). This enables highly optimized BLAS GEMM kernels (e.g. cuBLAS, OneDNN, GEMlowp) to achieve maximum memory bandwidth and vector unit utilization.\n\nInput Format:\n- inputTensor: 4D array of shape (N, C, H, W).\n- kernelH: Height of convolution filter.\n- kernelW: Width of convolution filter.\n- stride: Sliding window spatial stride.\n- padding: Zero-padding applied to spatial borders.\n\nOutput Format:\n- Returns a 2D unrolled matrix of shape (C * kH * kW, N * H_out * W_out).\n\nEdge Cases & Constraints:\n- Out-of-bound spatial padding: Padded positions are filled with 0.0.\n- Stride > 1: Creates non-overlapping or sparse patch samples.\n- Memory footprint trade-off: Duplicates overlapping spatial pixels, increasing memory footprint by up to (kH * kW)x.",
  constraints: [
    "1 <= N <= 128",
    "1 <= C <= 512",
    "1 <= H, W <= 1024",
    "1 <= kernelH, kernelW <= 11",
  ],
  examples: [
    {
      kind: "basic",
      title: "Single 1x3x3 Image, 2x2 Kernel",
      inputDisplay: "inputTensor: 1x1x3x3, kernel: 2x2",
      outputDisplay: "Matrix (4, 4)",
      input: DEFAULT_IM2COL4DTO2DUNROLLER_INPUT,
      output: "Unrolled Matrix 4x4",
      explanation: "Extracts four 2x2 receptive fields into 4 columns of height 4.",
    },
  ],
  code: IM2COL4DTO2DUNROLLER_CODE,
  timeComplexity: {
    best: "O(N * C * H_out * W_out * kH * kW)",
    average: "O(N * C * H_out * W_out * kH * kW)",
    worst: "O(N * C * H_out * W_out * kH * kW)",
  },
  spaceComplexity: "O(C * kH * kW * N * H_out * W_out)",
  complexityAnalysis: {
    time: "Linear in total volume of unrolled patch elements copied to column matrix.",
    space:
      "Requires allocated memory proportional to (C * kH * kW) * (N * H_out * W_out) for the unrolled matrix.",
  },
  topicGuide: {
    overview:
      "im2col converts complex 4D tensor convolutions into a simple 2D General Matrix Multiplication (GEMM). By transforming spatial sliding windows into contiguous memory columns, frameworks leverage hardware GEMM accelerators (NVIDIA Tensor Cores, Intel AMX).",
    sections: [
      {
        heading: "Overview",
        body: "Convolution algorithms involve 6 nested loops over batch, output channels, input channels, output rows, output columns, kernel rows, and kernel columns. Directly executing nested loops suffers from poor cache locality and SIMD under-utilization. im2col solves this by reshaping inputs into a 2D matrix X_col.",
      },
      {
        heading: "Core Concepts",
        body: "1. Receptive Field Extraction: Every (kH x kW) spatial window across C channels is flattened into a 1D column vector of size (C * kH * kW).\n2. Spatial Layout Transformation: Sliding windows across spatial positions (H_out, W_out) and batch elements (N) form columns 0 to (N * H_out * W_out - 1).\n3. GEMM Lowering: Weight tensor (C_out, C, kH, kW) is reshaped to W_row (C_out, C * kH * kW), making Convolution = W_row @ X_col.",
      },
      {
        heading: "Systems & Performance Impact",
        body: "Though im2col replicates overlapping pixels in DRAM, the throughput gained by using heavily optimized GEMM kernels (reaching >90% of peak FLOPS) far outweighs the memory overhead. Modern libraries use implicit im2col (on-the-fly tile unrolling in GPU SRAM) to eliminate the DRAM footprint.",
      },
      {
        heading: "Implementation Nuances",
        body: "Correct index calculation requires indexing row_idx = ch * (kH * kW) + kr * kW + kc and col_idx = n * (H_out * W_out) + r * W_out + c. Bounds checking handles zero padding without extra branch penalties.",
      },
      {
        heading: "Edge Cases",
        body: "Zero-padding boundary conditions, stride > 1 skipping, single-pixel 1x1 convolutions (where im2col is a no-op identity matrix transpose), and non-contiguous memory strides.",
      },
    ],
    keyTerms: [
      {
        term: "im2col",
        definition:
          "Image-to-column lowering transformation for matrix multiplication convolution.",
      },
      {
        term: "GEMM",
        definition: "General Matrix Multiply (C = alpha * A * B + beta * C).",
      },
      {
        term: "Receptive Field",
        definition:
          "Spatial input region processed by a filter kernel to compute one output pixel.",
      },
      {
        term: "Implicit GEMM",
        definition:
          "Performing im2col patch extraction directly inside SRAM during GEMM tile loading.",
      },
    ],
  },
  trivia: IM2COL4DTO2DUNROLLER_TRIVIA,
  defaultInput: DEFAULT_IM2COL4DTO2DUNROLLER_INPUT,
  generateSteps: generateIm2col4dTo2dUnrollerSteps,
};
