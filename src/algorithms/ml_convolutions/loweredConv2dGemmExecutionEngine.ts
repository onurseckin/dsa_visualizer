import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface loweredConv2dGemmExecutionEngineInput {
  inputTensor: number[][][][];
  weights: number[][][][];
  stride?: number;
  padding?: number;
}

export const LOWEREDCONV2DGEMMEXECUTIONENGINE_CODE = `
def lowered_conv2d_gemm(input_tensor, weights, stride=1, padding=0):
    """
    Lowered Conv2D GEMM Execution Engine.
    Executes 2D Convolution by lowering weight tensor to W_row (C_out, C_in * kH * kW)
    and input patches to X_col (C_in * kH * kW, N * H_out * W_out), computes Y_2d = W_row @ X_col,
    and reshapes output to (N, C_out, H_out, W_out).
    """
    c_out = len(weights)
    c_in = len(weights[0])
    k_h, k_w = len(weights[0][0]), len(weights[0][0][0])

    n_batch = len(input_tensor)
    h_in, w_in = len(input_tensor[0][0]), len(input_tensor[0][0][0])

    h_out = (h_in + 2 * padding - k_h) // stride + 1
    w_out = (w_in + 2 * padding - k_w) // stride + 1

    # 1. Flatten Weights: W_row (C_out, C_in * k_h * k_w)
    w_row = []
    for co in range(c_out):
        row = []
        for ci in range(c_in):
            for kr in range(k_h):
                for kc in range(k_w):
                    row.append(weights[co][ci][kr][kc])
        w_row.append(row)

    # 2. im2col Unrolling: X_col (C_in * k_h * k_w, N * h_out * w_out)
    k_len = c_in * k_h * k_w
    num_patches = n_batch * h_out * w_out
    x_col = [[0.0] * num_patches for _ in range(k_len)]

    patch_idx = 0
    for b in range(n_batch):
        for r in range(h_out):
            for c in range(w_out):
                k_idx = 0
                for ci in range(c_in):
                    for kr in range(k_h):
                        for kc in range(k_w):
                            ir = r * stride + kr - padding
                            ic = c * stride + kc - padding
                            val = input_tensor[b][ci][ir][ic] if (0 <= ir < h_in and 0 <= ic < w_in) else 0.0
                            x_col[k_idx][patch_idx] = val
                            k_idx += 1
                patch_idx += 1

    # 3. BLAS GEMM Multiply: Y_2d = W_row @ X_col
    y_2d = [[0.0] * num_patches for _ in range(c_out)]
    for i in range(c_out):
        for j in range(num_patches):
            s = 0.0
            for k in range(k_len):
                s += w_row[i][k] * x_col[k][j]
            y_2d[i][j] = s

    # 4. Reshape Y_2d -> Output Tensor (N, C_out, H_out, W_out)
    output = [[[[0.0] * w_out for _ in range(h_out)] for _ in range(c_out)] for _ in range(n_batch)]
    patch_idx = 0
    for b in range(n_batch):
        for r in range(h_out):
            for c in range(w_out):
                for co in range(c_out):
                    output[b][co][r][c] = y_2d[co][patch_idx]
                patch_idx += 1

    return output
`;

export const DEFAULT_LOWEREDCONV2DGEMMEXECUTIONENGINE_INPUT: loweredConv2dGemmExecutionEngineInput =
  {
    inputTensor: [
      [
        [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
      ],
    ],
    weights: [
      [
        [
          [1, 0],
          [0, 1],
        ],
      ],
      [
        [
          [0, 1],
          [1, 0],
        ],
      ],
    ],
    stride: 1,
    padding: 0,
  };

export const generateLoweredConv2dGemmExecutionEngineSteps = (
  input: loweredConv2dGemmExecutionEngineInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const tensor = input.inputTensor;
  const weights = input.weights;
  const stride = input.stride ?? 1;
  const padding = input.padding ?? 0;

  const cOut = weights.length;
  const cIn = weights[0].length;
  const kH = weights[0][0].length;
  const kW = weights[0][0][0].length;

  const nBatch = tensor.length;
  const hIn = tensor[0][0].length;
  const wIn = tensor[0][0][0].length;

  const hOut = Math.floor((hIn + 2 * padding - kH) / stride) + 1;
  const wOut = Math.floor((wIn + 2 * padding - kW) / stride) + 1;

  const kLen = cIn * kH * kW;
  const numPatches = nBatch * hOut * wOut;

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
          wRowShape: `(${cOut}, ${kLen})`,
          xColShape: `(${kLen}, ${numPatches})`,
          y2dShape: `(${cOut}, ${numPatches})`,
          outputTensorShape: `(${nBatch}, ${cOut}, ${hOut}, ${wOut})`,
          ...customState,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Lowered Conv2D GEMM Execution Engine",
    "Setting up matrix shapes for Weight flattening W_row and im2col patch extraction X_col.",
    { nBatch, cIn, cOut, hIn, wIn, kH, kW, hOut, wOut, kLen, numPatches },
  );

  // Flatten weights
  const wRow: number[][] = [];
  for (let co = 0; co < cOut; co++) {
    const row: number[] = [];
    for (let ci = 0; ci < cIn; ci++) {
      for (let kr = 0; kr < kH; kr++) {
        for (let kc = 0; kc < kW; kc++) {
          row.push(weights[co][ci][kr][kc]);
        }
      }
    }
    wRow.push(row);
  }

  addStep(
    15,
    "Flatten Weights into W_row Matrix",
    `Flattened ${cOut} kernels of size (${cIn}, ${kH}, ${kW}) into W_row matrix of shape (${cOut}, ${kLen}).`,
    { cOut, kLen },
    { wRow: `W_row = [${wRow.map((r) => "[" + r.join(",") + "]").join(", ")}]` },
  );

  // Unroll X_col
  const xCol: number[][] = Array.from({ length: kLen }, () => Array(numPatches).fill(0));
  let patchIdx = 0;
  for (let b = 0; b < nBatch; b++) {
    for (let r = 0; r < hOut; r++) {
      for (let c = 0; c < wOut; c++) {
        let kIdx = 0;
        for (let ci = 0; ci < cIn; ci++) {
          for (let kr = 0; kr < kH; kr++) {
            for (let kc = 0; kc < kW; kc++) {
              const ir = r * stride + kr - padding;
              const ic = c * stride + kc - padding;
              const val = ir >= 0 && ir < hIn && ic >= 0 && ic < wIn ? tensor[b][ci][ir][ic] : 0;
              xCol[kIdx][patchIdx] = val;
              kIdx++;
            }
          }
        }
        patchIdx++;
      }
    }
  }

  addStep(
    27,
    "Unroll Input to X_col Matrix via im2col",
    `Extracted ${numPatches} receptive field patches into X_col matrix of shape (${kLen}, ${numPatches}).`,
    { kLen, numPatches },
  );

  // GEMM Y_2d = W_row @ X_col
  const y2d: number[][] = Array.from({ length: cOut }, () => Array(numPatches).fill(0));
  for (let i = 0; i < cOut; i++) {
    for (let j = 0; j < numPatches; j++) {
      let sum = 0;
      for (let k = 0; k < kLen; k++) {
        sum += wRow[i][k] * xCol[k][j];
      }
      y2d[i][j] = sum;
    }
  }

  addStep(
    42,
    "Execute GEMM Matrix Multiply Y_2d = W_row @ X_col",
    `Computed 2D result matrix Y_2d of shape (${cOut}, ${numPatches}).`,
    { cOut, numPatches },
    { y2d: `Y_2d = [${y2d.map((r) => "[" + r.join(",") + "]").join(", ")}]` },
  );

  addStep(
    51,
    "Reshape Y_2d Matrix to 4D Output Tensor & Complete",
    `Reshaped Y_2d to 4D output tensor of shape (${nBatch}, ${cOut}, ${hOut}, ${wOut}).`,
    { completed: true },
  );

  return steps;
};

const LOWEREDCONV2DGEMMEXECUTIONENGINE_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "y_2d = w_row + x_col",
    "output = reshape(y_2d, (N, H_out, W_out, C_out))",
    "if k_len != num_patches: raise ValueError()",
  ],
  hints: [
    {
      line: 15,
      hint: "Weight tensors are flattened across input channel and kernel spatial dimensions.",
    },
    { line: 42, hint: "GEMM computes dot products between weight rows and im2col patch columns." },
  ],
  lineExplanations: {
    1: "Entry point for lowered Conv2D GEMM execution engine.",
    15: "Weight matrix flattening phase.",
    27: "Input patch im2col unrolling phase.",
    42: "Matrix multiplication execution phase.",
    51: "Output tensor reconstruction and return.",
  },
};

export const loweredConv2dGemmExecutionEngine: AlgorithmDefinition<loweredConv2dGemmExecutionEngineInput> =
  {
    id: "loweredConv2dGemmExecutionEngine",
    title: "Lowered Conv2D GEMM Execution Engine",
    category: "ml_convolutions",
    categories: ["ml_convolutions", "ml_gemm_roofline"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_convolutions",
    description:
      "Lowered Conv2D GEMM Execution Engine models the end-to-end transformation of a 4D convolution operation into a single matrix multiplication (GEMM). Weight filters of shape (C_out, C_in, kH, kW) are flattened into a 2D matrix W_row of shape (C_out, C_in * kH * kW). Input tensors are transformed via im2col into a matrix X_col of shape (C_in * kH * kW, N * H_out * W_out). The convolution result is obtained by performing Y_2d = W_row @ X_col, followed by reshaping Y_2d into the 4D output tensor (N, C_out, H_out, W_out). This is the exact lowering pipeline used in BLAS-backed convolution engines across PyTorch, Caffe, and ONNX Runtime.\n\nInput Format:\n- inputTensor: 4D input array of shape (N, C_in, H, W).\n- weights: 4D weight filter array of shape (C_out, C_in, kH, kW).\n- stride: Spatial stride integer (default 1).\n- padding: Zero-padding width integer (default 0).\n\nOutput Format:\n- Returns a 4D tensor of shape (N, C_out, H_out, W_out).\n\nEdge Cases & Constraints:\n- Matrix inner dimension match: Inner matrix dimension must equal C_in * kH * kW for both W_row and X_col.\n- Precision & accumulation: High arithmetic intensity makes GEMM throughput hardware-bound; FP16 / BF16 mixed-precision acceleration is commonly applied to GEMM accumulation.",
    constraints: [
      "1 <= N <= 64",
      "1 <= C_in, C_out <= 512",
      "1 <= H, W <= 512",
      "1 <= kH, kW <= 11",
    ],
    examples: [
      {
        kind: "basic",
        title: "1 Batch, 1 Input Channel, 2 Output Channels",
        inputDisplay: "inputTensor: 1x1x3x3, weights: 2x1x2x2",
        outputDisplay: "Output: 1x2x2x2",
        input: DEFAULT_LOWEREDCONV2DGEMMEXECUTIONENGINE_INPUT,
        output: "Tensor (1, 2, 2, 2)",
        explanation: "Lowers weight tensor to (2, 4) and input to (4, 4), computes 2x4 @ 4x4 GEMM.",
      },
    ],
    code: LOWEREDCONV2DGEMMEXECUTIONENGINE_CODE,
    timeComplexity: {
      best: "O(C_out * (N * H_out * W_out) * (C_in * kH * kW))",
      average: "O(C_out * (N * H_out * W_out) * (C_in * kH * kW))",
      worst: "O(C_out * (N * H_out * W_out) * (C_in * kH * kW))",
    },
    spaceComplexity: "O(C_out * C_in * kH * kW + C_in * kH * kW * N * H_out * W_out)",
    complexityAnalysis: {
      time: "Matrix multiplication performs 2 * M * N * K FLOPs, where M = C_out, K = C_in * kH * kW, N = Batch * H_out * W_out.",
      space: "Allocates 2D flattened weight matrix and 2D unrolled im2col matrix in memory.",
    },
    topicGuide: {
      overview:
        "Lowered Conv2D GEMM is the cornerstone of deep learning acceleration. By expressing convolutions as BLAS matrix multiplications, machine learning frameworks unlock decades of hardware optimization built into BLAS, MKL, and cuBLAS.",
      sections: [
        {
          heading: "Overview",
          body: "Direct convolution requires nested loop evaluation over 7 axes. Lowering converts this nested iteration into a single dense matrix multiplication Y_2d = W_row @ X_col, mapping directly to SIMD vector registers and hardware Tensor Cores.",
        },
        {
          heading: "Core Concepts",
          body: "1. Weight Flattening: Converts 4D filter tensor (C_out, C_in, kH, kW) into 2D matrix W_row (C_out, C_in * kH * kW).\n2. im2col Unrolling: Converts 4D input tensor (N, C_in, H, W) into 2D matrix X_col (C_in * kH * kW, N * H_out * W_out).\n3. GEMM Product: Computes Y_2d = W_row @ X_col.\n4. Output Reshaping: Maps 2D result Y_2d back to 4D tensor shape (N, C_out, H_out, W_out).",
        },
        {
          heading: "Systems & Performance Impact",
          body: "GEMM implementations utilize memory hierarchy cache tiling (L1, L2, L3) and vector SIMD instructions (AVX-512, NEON, CUDA MMA). Lowered Conv2D transforms a memory-latency-bound loop into a compute-bound GEMM operation.",
        },
        {
          heading: "Implementation Nuances",
          body: "Cache tile sizes are selected so that sub-tiles of W_row and X_col fit entirely inside L1/L2 data cache. Memory packing routines rearrange non-contiguous unrolled columns into contiguous cache lines before GEMM multiplication.",
        },
        {
          heading: "Edge Cases",
          body: "Padded spatial boundaries, non-unit strides, 1x1 convolutions (where im2col is a simple memory layout reshape), and odd batch sizes.",
        },
      ],
      keyTerms: [
        {
          term: "Lowered Conv2D",
          definition:
            "Convolution operator transformed into standard BLAS GEMM matrix multiplication.",
        },
        {
          term: "W_row Matrix",
          definition: "2D flattened representation of 4D filter weights (C_out x C_in * kH * kW).",
        },
        {
          term: "X_col Matrix",
          definition: "2D im2col unrolled representation of sliding input patches.",
        },
        {
          term: "Tensor Cores",
          definition:
            "Specialized hardware execution units designed for high-throughput matrix multiplication.",
        },
      ],
    },
    trivia: LOWEREDCONV2DGEMMEXECUTIONENGINE_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_LOWEREDCONV2DGEMMEXECUTIONENGINE_INPUT,
    generateSteps: generateLoweredConv2dGemmExecutionEngineSteps,
  };
