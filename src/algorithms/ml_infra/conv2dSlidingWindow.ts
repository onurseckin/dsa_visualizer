import type { AlgorithmDefinition, AlgorithmStep, GridCellNode } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface Conv2dSlidingWindowInput {
  inputMatrix: number[][];
  kernel: number[][];
  stride: number;
  padding: number;
}

export const CONV2D_SLIDING_WINDOW_CODE = `def conv2d_sliding_window(input_matrix: list[list[int]], kernel: list[list[int]], stride: int = 1, padding: int = 0) -> list[list[int]]:
    if not input_matrix or not kernel:
        return []
    H, W = len(input_matrix), len(input_matrix[0])
    kH, kW = len(kernel), len(kernel[0])
    
    # Apply zero padding
    if padding > 0:
        padded = [[0] * (W + 2 * padding) for _ in range(H + 2 * padding)]
        for r in range(H):
            for c in range(W):
                padded[r + padding][c + padding] = input_matrix[r][c]
    else:
        padded = input_matrix
        
    pH, pW = len(padded), len(padded[0])
    out_H = (pH - kH) // stride + 1
    out_W = (pW - kW) // stride + 1
    
    if out_H <= 0 or out_W <= 0:
        return []
        
    output = [[0] * out_W for _ in range(out_H)]
    for r in range(0, pH - kH + 1, stride):
        for c in range(0, pW - kW + 1, stride):
            val = 0
            for kr in range(kH):
                for kc in range(kW):
                    val += padded[r + kr][c + kc] * kernel[kr][kc]
            out_r, out_c = r // stride, c // stride
            output[out_r][out_c] = val
            
    return output`;

export const DEFAULT_CONV2D_SLIDING_WINDOW_INPUT: Conv2dSlidingWindowInput = {
  inputMatrix: [
    [1, 2, 3, 0],
    [0, 1, 2, 1],
    [3, 0, 1, 2],
    [2, 1, 0, 1],
  ],
  kernel: [
    [1, 0],
    [0, 1],
  ],
  stride: 1,
  padding: 0,
};

export const generateConv2dSlidingWindowSteps = (
  input: Conv2dSlidingWindowInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { inputMatrix, kernel, stride, padding } = input;
  const H = inputMatrix.length;
  const W = H > 0 ? inputMatrix[0].length : 0;
  const kH = kernel.length;
  const kW = kH > 0 ? kernel[0].length : 0;

  // Apply padding
  let padded: number[][] = [];
  if (padding > 0 && H > 0 && W > 0) {
    padded = Array.from({ length: H + 2 * padding }, () => Array(W + 2 * padding).fill(0));
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        padded[r + padding][c + padding] = inputMatrix[r][c];
      }
    }
  } else {
    padded = inputMatrix;
  }

  const pH = padded.length;
  const pW = pH > 0 ? padded[0].length : 0;

  const outH = stride > 0 ? Math.floor((pH - kH) / stride) + 1 : 0;
  const outW = stride > 0 ? Math.floor((pW - kW) / stride) + 1 : 0;

  const buildGridSnapshot = (
    activePaddedR: number | null,
    activePaddedC: number | null,
    outputGrid: number[][],
  ): GridCellNode[][] => {
    return outputGrid.map((rowArr, r) =>
      rowArr.map((val, c) => ({
        row: r,
        col: c,
        distance: val,
        state:
          activePaddedR !== null &&
          r === Math.floor(activePaddedR / stride) &&
          c === Math.floor(activePaddedC! / stride)
            ? "active"
            : val !== 0
              ? "visited"
              : "default",
      })),
    );
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeR: number | null,
    activeC: number | null,
    outputGrid: number[][],
    vars: Record<string, string | number | boolean>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "grid",
        grid: buildGridSnapshot(activeR, activeC, outputGrid),
      },
      auxiliaryState: {
        customState: {
          inputSize: `${H}x${W}`,
          kernelSize: `${kH}x${kW}`,
          padding: String(padding),
          stride: String(stride),
          outputSize: `${outH}x${outW}`,
        },
      },
      variables: vars,
    });
  };

  if (H === 0 || W === 0 || kH === 0 || kW === 0 || outH <= 0 || outW <= 0) {
    addStep(
      2,
      "Invalid Convolution dimensions — early return",
      "Input or kernel size is 0 or stride/padding leads to non-positive output dimensions.",
      null,
      null,
      [[0]],
      { valid: false },
    );
    return steps;
  }

  const output: number[][] = Array.from({ length: outH }, () => Array(outW).fill(0));

  addStep(
    1,
    `Initialize 2D Convolution (Input: ${H}x${W}, Kernel: ${kH}x${kW}, Stride: ${stride}, Pad: ${padding})`,
    `H=${H}, W=${W}, kH=${kH}, kW=${kW}. Reading input tensor dimensions and kernel shape.`,
    null,
    null,
    output.map((r) => [...r]),
    { H, W, kH, kW, stride, padding },
  );

  addStep(
    17,
    `Compute Output Dimensions: out_H=${outH}, out_W=${outW}`,
    `out_H = (${pH} - ${kH}) // ${stride} + 1 = ${outH}. out_W = (${pW} - ${kW}) // ${stride} + 1 = ${outW}.`,
    null,
    null,
    output.map((r) => [...r]),
    { outH, outW, stride, padding },
  );

  addStep(
    23,
    `Initialize output = [[0]*${outW} for _ in range(${outH})]`,
    `Output feature map of shape (${outH}, ${outW}) initialized to zeros.`,
    null,
    null,
    output.map((r) => [...r]),
    { outH, outW },
  );

  addStep(
    24,
    `Begin sliding window: for r in range(0, ${pH}-${kH}+1, ${stride})`,
    `Outer loop over padded input rows with stride ${stride}.`,
    null,
    null,
    output.map((r) => [...r]),
    { stride, maxR: pH - kH },
  );

  for (let r = 0; r <= pH - kH; r += stride) {
    for (let c = 0; c <= pW - kW; c += stride) {
      let dotProd = 0;

      for (let kr = 0; kr < kH; kr++) {
        for (let kc = 0; kc < kW; kc++) {
          const inVal = padded[r + kr][c + kc];
          const kVal = kernel[kr][kc];
          dotProd += inVal * kVal;
        }
      }

      const outR = Math.floor(r / stride);
      const outC = Math.floor(c / stride);
      output[outR][outC] = dotProd;

      addStep(
        29,
        `Slide kernel to padded position (${r}, ${c}) -> Out[${outR}][${outC}] = ${dotProd}`,
        `Convolved ${kH}x${kW} receptive field at top-left (${r}, ${c}) to compute output value ${dotProd}.`,
        r,
        c,
        output.map((row) => [...row]),
        { r, c, outR, outC, dotProd },
      );
    }
  }

  addStep(
    31,
    `output[out_r][out_c] = val — 2D Convolution Sliding Window Complete`,
    `Computed all ${outH * outW} elements of output feature map.`,
    null,
    null,
    output.map((row) => [...row]),
    { complete: true },
  );

  addStep(
    33,
    `return output`,
    `Returning completed ${outH}x${outW} convolution output feature map.`,
    null,
    null,
    output.map((row) => [...row]),
    { outH, outW, totalElements: outH * outW },
  );

  return steps;
};

export const CONV2D_SLIDING_WINDOW_TRIVIA: TriviaMeta = {
  skipLines: [2, 4],
  hints: [
    { line: 16, hint: "Formula for Conv2D output size: (Padded_Dim - Kernel_Dim) // Stride + 1" },
    { line: 22, hint: "Step window by Stride across height and width" },
    { line: 27, hint: "Compute dot product of receptive field patch and kernel filter" },
  ],
  distractors: [
    "out_H = (H + kH) * stride",
    "val += padded[r][c] + kernel[kr][kc]",
    "out_r = r * stride",
  ],
};

export const conv2dSlidingWindow: AlgorithmDefinition<Conv2dSlidingWindowInput> = {
  id: "conv2d-sliding-window",
  title: "2D Convolution Sliding Window",
  category: "ml_convolutions",
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 6,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" }],
  description:
    "Slide a 2D filter kernel over an input image tensor with stride and padding to compute the output feature map.",
  code: CONV2D_SLIDING_WINDOW_CODE,
  defaultInput: DEFAULT_CONV2D_SLIDING_WINDOW_INPUT,
  examples: [
    {
      kind: "basic",
      title: "4x4 Input, 2x2 Kernel, Stride 1",
      input: DEFAULT_CONV2D_SLIDING_WINDOW_INPUT,
      output: "[[2, 4, 4], [1, 2, 4], [4, 1, 2]]",
      explanation: "3x3 output feature map computed by sliding 2x2 kernel with stride 1.",
    },
    {
      kind: "complex",
      title: "Convolution with Padding and Stride 2",
      input: {
        inputMatrix: [
          [1, 2],
          [3, 4],
        ],
        kernel: [
          [1, 1],
          [1, 1],
        ],
        stride: 2,
        padding: 1,
      },
      output: "[[1, 2], [3, 4]]",
      explanation: "Padded 4x4 image with stride 2 produces 2x2 output feature map.",
    },
    {
      kind: "negative",
      title: "Kernel Larger Than Input",
      input: {
        inputMatrix: [[1, 2]],
        kernel: [
          [1, 1, 1],
          [1, 1, 1],
        ],
        stride: 1,
        padding: 0,
      },
      output: "[]",
      explanation: "Kernel dimensions exceed unpadded input image size.",
    },
  ],
  timeComplexity: {
    best: "O(out_H * out_W * kH * kW)",
    average: "O(out_H * out_W * kH * kW)",
    worst: "O(out_H * out_W * kH * kW)",
  },
  spaceComplexity: "O(out_H * out_W + padded_H * padded_W)",
  complexityAnalysis: {
    time: "O(out_H * out_W * kH * kW) operations for sliding window inner product evaluations.",
    space: "O(out_H * out_W) space for output feature map, plus optional padded input buffer.",
  },
  topicGuide: {
    overview:
      "2D Convolution is the fundamental operation in Convolutional Neural Networks (CNNs). A spatial filter (kernel) slides over the input tensor, performing element-wise multiplications and sum reductions to extract visual features (edges, textures).",
    sections: [
      {
        heading: "im2col Matrix Lowering",
        body: "High-performance CNN libraries lower 4D Conv2D tensors into 2D matrices via im2col so that sliding window convolutions can execute as fast GEMM calls on hardware accelerators.",
      },
    ],
    keyTerms: [
      {
        term: "Receptive Field",
        definition: "The region in the input image that directly affects a feature map neuron.",
      },
      {
        term: "Feature Map",
        definition:
          "The 2D output matrix resulting from applying a kernel filter across the input.",
      },
    ],
  },
  trivia: CONV2D_SLIDING_WINDOW_TRIVIA,
  generateSteps: generateConv2dSlidingWindowSteps,
};
