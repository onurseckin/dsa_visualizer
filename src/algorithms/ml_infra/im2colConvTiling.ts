import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
  ProblemExample,
} from "../../types/dsa";

export interface Im2colInput {
  inputHeight: number;
  inputWidth: number;
  channels: number;
  kernelSize: number;
  stride: number;
  padding: number;
  image: number[][][]; // [C][H][W]
}

export const IM2COL_CONV_TILING_CODE = `def im2col_conv_tiling(
    image: list[list[list[float]]],
    kernel_size: int,
    stride: int,
    padding: int
) -> list[list[float]]:
    C = len(image)
    H = len(image[0])
    W = len(image[0][0])
    
    out_h = (H + 2 * padding - kernel_size) // stride + 1
    out_w = (W + 2 * padding - kernel_size) // stride + 1
    
    col_matrix = []
    for r in range(out_h):
        for c in range(out_w):
            patch = []
            for ch in range(C):
                for kh in range(kernel_size):
                    for kw in range(kernel_size):
                        ih = r * stride + kh - padding
                        iw = c * stride + kw - padding
                        val = image[ch][ih][iw] if 0 <= ih < H and 0 <= iw < W else 0.0
                        patch.append(val)
            col_matrix.append(patch)
            
    return col_matrix`;

export const DEFAULT_IM2COL_INPUT: Im2colInput = {
  inputHeight: 4,
  inputWidth: 4,
  channels: 1,
  kernelSize: 2,
  stride: 1,
  padding: 0,
  image: [
    [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 16],
    ],
  ],
};

export const IM2COL_EXAMPLES: ProblemExample<Im2colInput>[] = [
  {
    id: "basic",
    kind: "basic",
    title: "Standard 3x3 1-Channel Patch Flattening",
    input: {
      inputHeight: 3,
      inputWidth: 3,
      channels: 1,
      kernelSize: 2,
      stride: 1,
      padding: 0,
      image: [
        [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
      ],
    },
    output: "4 GEMM columns of size 4",
    explanation: "A 3x3 image with a 2x2 kernel yields 4 patches of size 2x2 = 4 elements each.",
  },
  {
    id: "complex",
    kind: "complex",
    title: "Multi-Channel 2x4x4 Feature Map",
    input: {
      inputHeight: 4,
      inputWidth: 4,
      channels: 2,
      kernelSize: 2,
      stride: 1,
      padding: 0,
      image: [
        [
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
          [13, 14, 15, 16],
        ],
        [
          [16, 15, 14, 13],
          [12, 11, 10, 9],
          [8, 7, 6, 5],
          [4, 3, 2, 1],
        ],
      ],
    },
    output: "9 GEMM columns of size 8",
    explanation:
      "2 channels x 2x2 kernel = 8 flattened patch elements per receptive field location.",
  },
  {
    id: "negative",
    kind: "negative",
    title: "Minimal 1x1 Patch Extraction",
    input: {
      inputHeight: 2,
      inputWidth: 2,
      channels: 1,
      kernelSize: 2,
      stride: 1,
      padding: 0,
      image: [
        [
          [5, 10],
          [15, 20],
        ],
      ],
    },
    output: "1 GEMM column of size 4",
    explanation: "A 2x2 image with a 2x2 kernel produces exactly 1 patch.",
  },
];

function createMatrixSnapshot(
  colMatrix: number[][],
  totalPatches: number,
  patchDim: number,
  currentPatchRow?: number,
  currentPatchValues?: number[],
): MatrixVisualSnapshot {
  const rowHeaders: string[] = [];
  for (let r = 0; r < totalPatches; r++) {
    rowHeaders.push(`P#${r}`);
  }

  const colHeaders: string[] = [];
  for (let c = 0; c < patchDim; c++) {
    colHeaders.push(`v${c}`);
  }

  const cells: MatrixCellItem[] = [];

  for (let r = 0; r < totalPatches; r++) {
    const isCurrentRow = r === currentPatchRow;
    const isRowCompleted = r < colMatrix.length;
    const rowData = isRowCompleted ? colMatrix[r] : isCurrentRow ? currentPatchValues : undefined;

    for (let c = 0; c < patchDim; c++) {
      if (rowData && c < rowData.length) {
        cells.push({
          row: r,
          col: c,
          value: rowData[c],
          state: isCurrentRow ? "active" : "sorted",
        });
      } else {
        cells.push({
          row: r,
          col: c,
          value: "-",
          state: "inactive",
        });
      }
    }
  }

  return {
    kind: "matrix",
    rows: Math.max(totalPatches, 1),
    cols: Math.max(patchDim, 1),
    cells,
    rowHeaders: totalPatches > 0 ? rowHeaders : undefined,
    colHeaders: patchDim > 0 ? colHeaders : undefined,
    title: `im2col GEMM Matrix (${totalPatches} × ${patchDim})`,
  };
}

export function generateIm2colSteps(input: Im2colInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const {
    inputHeight: H,
    inputWidth: W,
    channels: C,
    kernelSize: K,
    stride: S,
    padding: P,
    image,
  } = input;

  if (H <= 0 || W <= 0 || C <= 0 || K <= 0 || S <= 0 || !image || image.length === 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 1,
      explanation: {
        what: "Invalid im2col input dimensions",
        why: "Height, width, channels, kernel size, and stride must be positive.",
      },
      primarySnapshot: {
        kind: "matrix",
        rows: 1,
        cols: 1,
        cells: [{ row: 0, col: 0, value: "Invalid", state: "inactive" }],
        title: "Invalid Dimensions",
      },
      auxiliaryState: {
        customState: { error: "Invalid dimensions" },
      },
      variables: {},
    });
    return steps;
  }

  const outH = Math.max(1, Math.floor((H + 2 * P - K) / S) + 1);
  const outW = Math.max(1, Math.floor((W + 2 * P - K) / S) + 1);
  const totalPatches = outH * outW;
  const patchDim = C * K * K;

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    colMatrix: number[][],
    currentPatchRow?: number,
    currentPatchValues?: number[],
    vars: Record<string, string | number | boolean> = {},
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: createMatrixSnapshot(
        colMatrix,
        totalPatches,
        patchDim,
        currentPatchRow,
        currentPatchValues,
      ),
      auxiliaryState: {
        customState: {
          outputDimensions: `${outH}x${outW} (${totalPatches} patches)`,
          patchSize: `${patchDim} values per unrolled row`,
          extractedPatchesCount: colMatrix.length,
        },
      },
      variables: vars,
    });
  };

  addStep(
    1,
    "Initialize im2col Patch Extraction",
    `Input tensor shape: C=${C}, H=${H}, W=${W}. Kernel size K=${K}, stride S=${S}, padding P=${P}.`,
    [],
    undefined,
    undefined,
    { C, H, W, K, S, P },
  );

  addStep(
    7,
    `Compute Input Dimensions: C=${C}, H=${H}, W=${W}`,
    "Reading spatial and channel dimensions from the input image tensor.",
    [],
    undefined,
    undefined,
    { C, H, W },
  );

  addStep(
    11,
    `Compute Output Dimensions: out_h=${outH}, out_w=${outW}`,
    `out_h = (${H} + 2×${P} - ${K}) // ${S} + 1 = ${outH}. out_w = (${W} + 2×${P} - ${K}) // ${S} + 1 = ${outW}. Total receptive field patches: ${totalPatches}.`,
    [],
    undefined,
    undefined,
    { outH, outW, totalPatches },
  );

  addStep(
    14,
    `Initialize col_matrix = [] (${totalPatches} patches expected)`,
    `Allocating container to build a ${totalPatches}×${patchDim} GEMM matrix. Each row will represent an unrolled patch.`,
    [],
    undefined,
    undefined,
    { totalPatches, patchDim },
  );

  const colMatrix: number[][] = [];

  for (let r = 0; r < outH; r++) {
    for (let c = 0; c < outW; c++) {
      const patchIndex = r * outW + c;
      const patch: number[] = [];

      addStep(
        17,
        `Start Patch Extraction #${patchIndex} at Output (${r}, ${c})`,
        `Initializing empty patch vector for receptive field window at top-left coordinate (r=${r * S}, c=${c * S}).`,
        colMatrix,
        patchIndex,
        [],
        { r, c, patchIndex },
      );

      for (let ch = 0; ch < C; ch++) {
        for (let kh = 0; kh < K; kh++) {
          for (let kw = 0; kw < K; kw++) {
            const ih = r * S + kh - P;
            const iw = c * S + kw - P;
            let val = 0;
            if (ih >= 0 && ih < H && iw >= 0 && iw < W) {
              val = image[ch]?.[ih]?.[iw] ?? 0;
            }
            patch.push(val);
          }
        }
      }

      addStep(
        24,
        `Gather Receptive Field Patch #${patchIndex} [${patch.slice(0, 4).join(", ")}${patch.length > 4 ? ", ..." : ""}]`,
        `Unrolled ${patch.length} elements across ${C} channel(s) and ${K}x${K} kernel window into a 1D vector.`,
        colMatrix,
        patchIndex,
        patch,
        { patchIndex, r, c, patchSize: patch.length },
      );

      colMatrix.push(patch);

      addStep(
        25,
        `col_matrix.append(patch) — Append Row #${patchIndex}`,
        `Appended patch #${patchIndex} to col_matrix. Matrix now has ${colMatrix.length}/${totalPatches} unrolled rows.`,
        colMatrix,
        undefined,
        undefined,
        { patchIndex, totalRows: colMatrix.length },
      );
    }
  }

  addStep(
    27,
    `return col_matrix — im2col GEMM Matrix Complete (${colMatrix.length}×${patchDim})`,
    `All ${colMatrix.length} patches extracted and flattened into dense 2D matrix of shape (${colMatrix.length}, ${patchDim}). Ready for GPU GEMM execution.`,
    colMatrix,
    undefined,
    undefined,
    { totalRows: colMatrix.length, rowWidth: patchDim },
  );

  return steps;
}

export const im2colConvTiling: AlgorithmDefinition<Im2colInput> = {
  id: "im2col-conv-tiling",
  title: "im2col Convolution Patch to GEMM Flattening",
  topicIds: ["ml_convolutions"],
  difficulty: "Medium",
  description:
    "Transforms high-dimensional 2D/3D image convolution receptive fields into flattened matrix columns, lowering convolution operations to high-performance General Matrix Multiplication (GEMM).",
  constraints: [
    "Input spatial height H > 0, width W > 0",
    "Channels C >= 1",
    "Kernel size K <= H + 2*P",
    "Stride S >= 1",
  ],
  examples: IM2COL_EXAMPLES,
  code: IM2COL_CONV_TILING_CODE,
  timeComplexity: {
    best: "O(C * K^2 * H_out * W_out)",
    average: "O(C * K^2 * H_out * W_out)",
    worst: "O(C * K^2 * H_out * W_out)",
  },
  spaceComplexity: "O(C * K^2 * H_out * W_out)",
  complexityAnalysis: {
    time: "Requires visiting each receptive field pixel once per output position. Flattening cost is linear in total output volume times kernel volume.",
    space:
      "Requires duplicating overlapping image pixels into the unrolled GEMM column matrix, increasing memory footprint by up to K^2.",
  },
  topicGuide: {
    overview:
      "im2col is a foundational transformation in deep learning frameworks (cuDNN, Caffe, PyTorch) that converts sliding 2D spatial convolution windows into a dense matrix multiplication problem executed by tuned BLAS/GEMM routines.",
    sections: [
      {
        heading: "Convolution as Matrix Multiplication",
        body: "Standard nested loops for multi-channel 2D convolutions exhibit poor cache locality. Unrolling input patches into columns enables hardware-accelerated Tensor Core GEMM kernels to achieve peak TFLOPS.",
      },
      {
        heading: "Memory Trade-off",
        body: "While im2col duplicates overlapping pixel data across neighboring patches (increasing memory consumption by up to K^2), the massive throughput gains of BLAS GEMM heavily outweigh the memory overhead.",
      },
    ],
    keyTerms: [
      {
        term: "im2col",
        definition: "Image-to-column layout transformation for lowering convolution to GEMM.",
      },
      {
        term: "Receptive Field",
        definition:
          "The spatial region of input pixels that contribute to a single output feature value.",
      },
      {
        term: "GEMM",
        definition:
          "General Matrix Multiply (C = A * B + C), the primary compute primitive in Deep Learning hardware.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 6" }],
  defaultInput: DEFAULT_IM2COL_INPUT,
  generateSteps: generateIm2colSteps,
};
