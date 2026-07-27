import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
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
            
    return col_matrix # Shape: (out_h * out_w) x (C * kernel_size^2)`;

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
        kind: "array",
        elements: [],
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

  const flatInput: number[] = [];
  for (let c = 0; c < C; c++) {
    for (let r = 0; r < H; r++) {
      for (let w = 0; w < W; w++) {
        flatInput.push(image[c]?.[r]?.[w] ?? 0);
      }
    }
  }

  const elements: ArrayElement[] = flatInput.map((val, idx) => ({
    id: `img-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    colMatrix: number[][],
    currentPatch: number[],
    vars: Record<string, string | number | boolean>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          outputDimensions: `${outH}x${outW} (${totalPatches} patches)`,
          patchSize: `${patchDim} values per column`,
          currentPatch: currentPatch.join(", "),
          extractedColumnsCount: colMatrix.length,
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
    [],
    { C, H, W, K, S, P },
  );

  addStep(
    7,
    `Compute Input Dimensions: C=${C}, H=${H}, W=${W}`,
    "Reading spatial dimensions from the input image tensor.",
    [],
    [],
    { C, H, W },
  );

  addStep(
    11,
    `Compute Output Dimensions: out_h=${outH}, out_w=${outW}`,
    `out_h = (${H} + 2×${P} - ${K}) // ${S} + 1 = ${outH}. out_w = (${W} + 2×${P} - ${K}) // ${S} + 1 = ${outW}. Total patches: ${totalPatches}.`,
    [],
    [],
    { outH, outW, totalPatches },
  );

  addStep(
    14,
    `Initialize col_matrix = [] (${totalPatches} patches expected)`,
    `Will build a ${totalPatches}×${patchDim} matrix where each column is one kernel receptive field.`,
    [],
    [],
    { totalPatches, patchDim },
  );

  const colMatrix: number[][] = [];

  for (let r = 0; r < outH; r++) {
    for (let c = 0; c < outW; c++) {
      const patchIndex = r * outW + c;
      const patch: number[] = [];

      elements.forEach((el) => {
        el.state = "default";
        el.pointers = undefined;
      });

      for (let ch = 0; ch < C; ch++) {
        for (let kh = 0; kh < K; kh++) {
          for (let kw = 0; kw < K; kw++) {
            const ih = r * S + kh - P;
            const iw = c * S + kw - P;
            let val = 0;
            if (ih >= 0 && ih < H && iw >= 0 && iw < W) {
              val = image[ch]?.[ih]?.[iw] ?? 0;
              const flatIdx = ch * (H * W) + ih * W + iw;
              if (elements[flatIdx]) {
                elements[flatIdx].state = "active";
                elements[flatIdx].pointers = [`P#${patchIndex}`];
              }
            }
            patch.push(val);
          }
        }
      }

      colMatrix.push(patch);

      addStep(
        20,
        `Extract Receptive Field Patch #${patchIndex} at Output (${r}, ${c})`,
        `Iterating over all C×K×K elements of kernel window. Patch has ${patch.length} values: [${patch.slice(0,5).join(", ")}${patch.length > 5 ? "..." : ""}].`,
        colMatrix,
        patch,
        { patchIndex, r, c, patchSize: patch.length },
      );
    }
  }

  elements.forEach((el) => {
    el.state = "sorted";
    el.pointers = undefined;
  });

  addStep(
    25,
    `col_matrix.append(patch) — im2col Matrix Complete (${colMatrix.length}×${patchDim})`,
    `All ${colMatrix.length} patches extracted. col_matrix shape: (${colMatrix.length}, ${patchDim}). Ready for BLAS matrix multiplication.`,
    colMatrix,
    [],
    { totalColumns: colMatrix.length, columnWidth: patchDim },
  );

  addStep(
    27,
    `return col_matrix`,
    `Returning dense 2D GEMM matrix of shape (${colMatrix.length}, ${patchDim}).`,
    colMatrix,
    [],
    { totalColumns: colMatrix.length, columnWidth: patchDim },
  );

  return steps;
}

export const im2colConvTiling: AlgorithmDefinition<Im2colInput> = {
  id: "im2col-conv-tiling",
  title: "im2col Convolution Patch to GEMM Flattening",
  category: "ml_convolutions",
  difficulty: "Medium",
  description:
    "Transforms high-dimensional 2D/3D image convolution receptive fields into flattened matrix columns, lowering convolution operations to high-performance General Matrix Multiplication (GEMM).",
  isMlInfra: true,
  mlInfraLevel: 6,
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
