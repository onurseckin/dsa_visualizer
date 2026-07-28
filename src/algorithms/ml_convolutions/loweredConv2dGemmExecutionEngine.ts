import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface loweredConv2dGemmExecutionEngineInput {
  inputTensor?: number[][][][]; // (N, C_in, H, W)
  weights?: number[][][][]; // (C_out, C_in, K_h, K_w)
  stride?: number;
  padding?: number;
  data?: number[];
  target?: number;
}

export const LOWEREDCONV2DGEMMEXECUTIONENGINE_CODE = `def lowered_conv2d_gemm(input_tensor, weights, stride=1, padding=0):
    c_out = len(weights)
    c_in = len(weights[0])
    k_h, k_w = len(weights[0][0]), len(weights[0][0][0])

    n_batch = len(input_tensor)
    h_in, w_in = len(input_tensor[0][0]), len(input_tensor[0][0][0])

    h_out = (h_in + 2 * padding - k_h) // stride + 1
    w_out = (w_in + 2 * padding - k_w) // stride + 1

    w_row = []
    for co in range(c_out):
        row = []
        for ci in range(c_in):
            for kr in range(k_h):
                for kc in range(k_w):
                    row.append(weights[co][ci][kr][kc])
        w_row.append(row)

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

    y_2d = [[0.0] * num_patches for _ in range(c_out)]
    for i in range(c_out):
        for j in range(num_patches):
            s = 0.0
            for k in range(k_len):
                s += w_row[i][k] * x_col[k][j]
            y_2d[i][j] = s

    output = [[[[0.0] * w_out for _ in range(h_out)] for _ in range(c_out)] for _ in range(n_batch)]
    patch_idx = 0
    for b in range(n_batch):
        for r in range(h_out):
            for c in range(w_out):
                for co in range(c_out):
                    output[b][co][r][c] = y_2d[co][patch_idx]
                patch_idx += 1

    return output`;

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

  const inputTensor = input.inputTensor || [
    [
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
    ],
  ];

  const weights = input.weights || [
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
  ];

  const stride = input.stride ?? 1;
  const padding = input.padding ?? 0;

  const cOut = weights.length;
  const cIn = weights[0].length;
  const kH = weights[0][0].length;
  const kW = weights[0][0][0].length;

  const nBatch = inputTensor.length;
  const hIn = inputTensor[0][0].length;
  const wIn = inputTensor[0][0][0].length;

  const hOut = Math.floor((hIn + 2 * padding - kH) / stride) + 1;
  const wOut = Math.floor((wIn + 2 * padding - kW) / stride) + 1;

  const kLen = cIn * kH * kW;
  const numPatches = nBatch * hOut * wOut;

  // 1. Flatten weights
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

  // 2. im2col
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
              const val =
                ir >= 0 && ir < hIn && ic >= 0 && ic < wIn ? inputTensor[b][ci][ir][ic] : 0.0;
              xCol[kIdx][patchIdx] = val;
              kIdx++;
            }
          }
        }
        patchIdx++;
      }
    }
  }

  // 3. GEMM
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

  const getSnapshot = (
    matrix: number[][],
    titleStr: string,
    activeR: number = -1,
    activeC: number = -1,
  ): MatrixVisualSnapshot => {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const cells: MatrixCellItem[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const state = r === activeR && c === activeC ? "active" : "default";
        cells.push({
          row: r,
          col: c,
          value: matrix[r][c],
          label: `[${r},${c}]`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows,
      cols,
      title: titleStr,
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    matrix: number[][],
    titleStr: string,
    activeR: number = -1,
    activeC: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(matrix, titleStr, activeR, activeC),
      auxiliaryState: {
        customState: {
          "Execution Stage": titleStr,
          "Weight Matrix W_row": `${cOut} x ${kLen}`,
          "im2col Matrix X_col": `${kLen} x ${numPatches}`,
          "GEMM Output Y_2d": `${cOut} x ${numPatches}`,
          "4D Output Shape": `(${nBatch}, ${cOut}, ${hOut}, ${wOut})`,
        },
      },
      variables,
    });
  };

  // Step 1: Function entry
  addStep(
    1,
    "Lowered Conv2D GEMM Execution Engine Entry",
    `Started lowered 2D convolution execution engine using im2col unrolling + BLAS GEMM matrix multiplication.`,
    { nBatch, cIn, cOut, hIn, wIn, kH, kW, stride, padding },
    wRow,
    "1. Weight Matrix W_row (C_out x K_len)",
  );

  // Step 2: Extract weights dimensions
  addStep(
    2,
    "Extract Filter Kernel Dimensions c_out, c_in, k_h, k_w",
    `Extracted output channels c_out=${cOut}, input channels c_in=${cIn}, kernel spatial size ${kH}x${kW}.`,
    { cOut, cIn, kH, kW },
    wRow,
    "1. Weight Matrix W_row (C_out x K_len)",
  );

  // Step 3: Extract input dimensions
  addStep(
    6,
    "Extract Input Tensor Dimensions n_batch, h_in, w_in",
    `Extracted batch size n_batch=${nBatch}, input spatial resolution ${hIn}x${wIn}.`,
    { nBatch, hIn, wIn },
    wRow,
    "1. Weight Matrix W_row (C_out x K_len)",
  );

  // Step 4: Calculate spatial output dimensions
  addStep(
    9,
    "Calculate Output Feature Map Dimensions h_out, w_out",
    `Computed output feature map height h_out=${hOut}, width w_out=${wOut}.`,
    { hOut, wOut, kLen, numPatches },
    wRow,
    "1. Weight Matrix W_row (C_out x K_len)",
  );

  // Step 5: Flatten weights into W_row
  for (let co = 0; co < cOut; co++) {
    addStep(
      13,
      `Flatten Filter Kernel co = ${co} into W_row Row ${co}`,
      `Reshaped 3D weight volume for output channel ${co} into 1D row of length k_len = ${kLen}.`,
      { co, kLen },
      wRow,
      "1. Flattened Weight Matrix W_row",
      co,
    );
  }

  // Step 6: im2col unrolling into X_col
  addStep(
    23,
    "Allocate im2col Matrix X_col (k_len x num_patches)",
    `Allocated unrolled feature matrix X_col of shape (${kLen}, ${numPatches}).`,
    { kLen, numPatches },
    xCol,
    "2. im2col Unrolled Matrix X_col",
  );

  let pIdx = 0;
  for (let b = 0; b < nBatch; b++) {
    for (let r = 0; r < hOut; r++) {
      for (let c = 0; c < wOut; c++) {
        addStep(
          28,
          `Unroll Spatial Patch (${r}, ${c}) for Batch ${b} -> Patch Index ${pIdx}`,
          `Extracted 3D receptive field patch at spatial coordinate (${r}, ${c}) into X_col column ${pIdx}.`,
          { b, r, c, patchIdx: pIdx },
          xCol,
          "2. im2col Unrolled Matrix X_col",
          -1,
          pIdx,
        );
        pIdx++;
      }
    }
  }

  // Step 7: BLAS GEMM Multiply Y_2d = W_row @ X_col
  addStep(
    40,
    "Execute BLAS GEMM Multiplication: Y_2d = W_row @ X_col",
    `Multiplying W_row (${cOut}x${kLen}) by X_col (${kLen}x${numPatches}) to compute 2D result matrix Y_2d (${cOut}x${numPatches}).`,
    { cOut, kLen, numPatches },
    y2d,
    "3. BLAS GEMM Multiply Result Y_2d",
  );

  for (let i = 0; i < cOut; i++) {
    for (let j = 0; j < numPatches; j++) {
      addStep(
        46,
        `GEMM Output Cell Y_2d[${i}][${j}] = ${y2d[i][j].toFixed(1)}`,
        `Computed dot product of W_row row ${i} and X_col column ${j} -> ${y2d[i][j].toFixed(1)}.`,
        { i, j, "y_2d[i][j]": y2d[i][j] },
        y2d,
        "3. BLAS GEMM Multiply Result Y_2d",
        i,
        j,
      );
    }
  }

  // Step 8: Reshape Y_2d -> 4D Output Tensor
  const output: number[][][][] = Array.from({ length: nBatch }, () =>
    Array.from({ length: cOut }, () => Array.from({ length: hOut }, () => Array(wOut).fill(0))),
  );

  pIdx = 0;
  for (let b = 0; b < nBatch; b++) {
    for (let r = 0; r < hOut; r++) {
      for (let c = 0; c < wOut; c++) {
        for (let co = 0; co < cOut; co++) {
          output[b][co][r][c] = y2d[co][pIdx];
        }
        pIdx++;
      }
    }
  }

  addStep(
    57,
    "Reshape Y_2d Matrix to 4D Output Tensor & Complete",
    `Reshaped 2D matrix Y_2d (${cOut}x${numPatches}) back into 4D output tensor of shape (${nBatch}, ${cOut}, ${hOut}, ${wOut}). Lowered GEMM execution clean.`,
    { completed: true, nBatch, cOut, hOut, wOut },
    y2d,
    "4. Final Reshaped 4D Tensor Output",
  );

  return steps;
};

const LOWEREDCONV2DGEMMEXECUTIONENGINE_TRIVIA: TriviaMeta = {
  skipLines: [5, 8, 11, 15, 16, 17, 20, 24, 30, 31, 32, 37, 39, 44, 47, 51, 52, 53, 55, 56, 57],
  distractors: [
    "y_2d = matmul(x_col, w_row)",
    "w_row.append(weights[co])",
    "x_col = [[0.0] * k_len for _ in range(num_patches)]",
    "output[b][co][r][c] = y_2d[pIdx][co]",
  ],
  hints: [
    {
      line: 13,
      hint: "Flatten 4D weights into 2D matrix W_row of shape (C_out, C_in * K_h * K_w).",
    },
    {
      line: 23,
      hint: "Unroll 4D spatial patches into 2D matrix X_col of shape (C_in * K_h * K_w, N * H_out * W_out).",
    },
    {
      line: 40,
      hint: "Multiply lowered matrices via standard GEMM: Y_2d = W_row @ X_col.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for Lowered Conv2D GEMM Execution Engine function.",
    2: "Measures number of output feature channels c_out from filter weights array length.",
    3: "Measures number of input feature channels c_in from filter weights channel depth.",
    4: "Measures filter kernel spatial height k_h and width k_w.",
    5: "Blank line before input tensor dimension extraction.",
    6: "Measures batch size n_batch from input tensor array length.",
    7: "Measures input feature map spatial height h_in and width w_in.",
    8: "Blank line before output dimension calculation.",
    9: "Calculates spatial output height h_out using integer division floor.",
    10: "Calculates spatial output width w_out using integer division floor.",
    11: "Blank line before Stage 1: Flatten Weights.",
    12: "Initializes list w_row to store flattened filter weight rows.",
    13: "Iterates over output feature channel index co from 0 to c_out - 1.",
    14: "Initializes list row for current filter kernel co.",
    15: "Iterates over input feature channel index ci from 0 to c_in - 1.",
    16: "Iterates over filter kernel spatial row kr from 0 to k_h - 1.",
    17: "Iterates over filter kernel spatial column kc from 0 to k_w - 1.",
    18: "Appends filter weight scalar weights[co][ci][kr][kc] to current row list.",
    19: "Appends completed flattened filter row to W_row matrix.",
    20: "Blank line before Stage 2: im2col Unrolling.",
    21: "Calculates total flattened kernel tap length k_len = c_in * k_h * k_w.",
    22: "Calculates total spatial patch count num_patches = n_batch * h_out * w_out.",
    23: "Allocates unrolled feature matrix x_col of shape (k_len, num_patches) filled with zeros.",
    24: "Blank line before patch unrolling loop.",
    25: "Initializes patch column index pointer patch_idx to zero.",
    26: "Iterates over batch sample index b from 0 to n_batch - 1.",
    27: "Iterates over spatial output row coordinate r from 0 to h_out - 1.",
    28: "Iterates over spatial output column coordinate c from 0 to w_out - 1.",
    29: "Resets kernel tap row index k_idx to zero for current spatial patch.",
    30: "Iterates over input feature channel index ci from 0 to c_in - 1.",
    31: "Iterates over filter kernel spatial row kr from 0 to k_h - 1.",
    32: "Iterates over filter kernel spatial column kc from 0 to k_w - 1.",
    33: "Calculates spatial input image row index ir = r * stride + kr - padding.",
    34: "Calculates spatial input image column index ic = c * stride + kc - padding.",
    35: "Loads input tensor sample if spatial bounds valid, else 0.0 float.",
    36: "Writes loaded pixel value into x_col at row k_idx and column patch_idx.",
    37: "Increments kernel tap row index k_idx by 1.",
    38: "Increments spatial patch column index patch_idx by 1.",
    39: "Blank line before Stage 3: BLAS GEMM Multiply.",
    40: "Allocates 2D GEMM output result matrix y_2d of shape (c_out, num_patches) filled with zeros.",
    41: "Iterates over matrix row index i (output channel) from 0 to c_out - 1.",
    42: "Iterates over matrix column index j (spatial patch) from 0 to num_patches - 1.",
    43: "Resets dot product accumulator scalar s to 0.0.",
    44: "Iterates over inner contraction dimension k from 0 to k_len - 1.",
    45: "Multiplies w_row[i][k] by x_col[k][j] and accumulates into dot product sum s.",
    46: "Stores computed dot product sum s into y_2d[i][j].",
    47: "Blank line before Stage 4: Reshape Y_2d.",
    48: "Allocates 4D output tensor of shape (n_batch, c_out, h_out, w_out) filled with zeros.",
    49: "Initializes spatial patch reader index pointer patch_idx to zero.",
    50: "Iterates over batch sample index b from 0 to n_batch - 1.",
    51: "Iterates over spatial output row coordinate r from 0 to h_out - 1.",
    52: "Iterates over spatial output column coordinate c from 0 to w_out - 1.",
    53: "Iterates over output feature channel index co from 0 to c_out - 1.",
    54: "Copies 2D GEMM output scalar y_2d[co][patch_idx] into 4D output tensor.",
    55: "Increments spatial patch reader index patch_idx by 1.",
    56: "Blank line separating tensor reshaping from return statement.",
    57: "Returns final 4D output tensor.",
  },
};

export const loweredConv2dGemmExecutionEngine: AlgorithmDefinition<loweredConv2dGemmExecutionEngineInput> =
  {
    id: "lowered-conv2d-gemm-execution-engine",
    title: "Lowered Conv2D GEMM Execution Engine",
    topicIds: ["ml_convolutions", "ml_gemm_roofline"],
    difficulty: "Medium",
    description:
      "The **Lowered Conv2D GEMM Execution Engine** lowers 2D spatial convolution into 2D General Matrix Multiplication (GEMM) using `im2col` matrix unrolling. By reshaping 4D filter weight tensors $W \\in \\mathbb{R}^{C_{out} \\times C_{in} \\times K_h \\times K_w}$ into 2D matrix $W_{row} \\in \\mathbb{R}^{C_{out} \\times (C_{in} K_h K_w)}$ and unrolling 4D activation patches into 2D matrix $X_{col} \\in \\mathbb{R}^{(C_{in} K_h K_w) \\times (N H_{out} W_{out})}$, convolution is computed via a single BLAS GEMM call $Y_{2d} = W_{row} \\cdot X_{col}$, followed by a 4D tensor reshape.\n\n### Why It Exists\nDirect nested 6D loops perform non-contiguous memory access and exhibit poor arithmetic intensity. Modern hardware accelerators (Nvidia Tensor Cores, Google TPUs) possess dedicated Systolic Array circuits optimized specifically for dense 2D GEMM. Lowering convolutions to GEMM enables 10x-100x hardware speedups.\n\n### Mathematical Formulation\nGiven input tensor $X \\in \\mathbb{R}^{N \\times C_{in} \\times H \\times W}$, filter weights $W \\in \\mathbb{R}^{C_{out} \\times C_{in} \\times K_h \\times K_w}$, stride $S$, and padding $P$, the 4-stage lowering pipeline is:\n\n$$1. \\quad W_{row} = \\text{Reshape}(W) \\quad \\in \\mathbb{R}^{C_{out} \\times K_{len}}, \\quad \\text{where } K_{len} = C_{in} \\cdot K_h \\cdot K_w$$\n\n$$2. \\quad X_{col} = \\text{im2col}(X) \\quad \\in \\mathbb{R}^{K_{len} \\times N_{patches}}, \\quad \\text{where } N_{patches} = N \\cdot H_{out} \\cdot W_{out}$$\n\n$$3. \\quad Y_{2d} = W_{row} \\cdot X_{col} \\quad \\in \\mathbb{R}^{C_{out} \\times N_{patches}} \\quad (\\text{BLAS GEMM Matrix Multiplication})$$\n\n$$4. \\quad Y = \\text{Reshape}(Y_{2d}) \\quad \\in \\mathbb{R}^{N \\times C_{out} \\times H_{out} \\times W_{out}}$$\n\n### Step-by-Step Intuition\n1. **Weight Lowering**: Flatten each 3D filter volume ($C_{in} \\times K_h \\times K_w$) into a single row vector of length $K_{len}$.\n2. **im2col Unrolling**: Extract every $3D$ receptive field patch ($C_{in} \\times K_h \\times K_w$) across all batch images and spatial positions, stacking them into columns of $X_{col}$.\n3. **BLAS GEMM Execution**: Call highly-optimized BLAS `gemm(W_row, X_col)` to compute all spatial and cross-channel dot products in parallel.\n4. **Tensor Reshaping**: Unpack columns of $Y_{2d}$ back into 4D activation tensor layout $(N, C_{out}, H_{out}, W_{out})$.\n\n### Key Trade-Offs & Hardware Execution\n- **Memory Footprint**: `im2col` duplicates input pixels that belong to overlapping receptive fields ($S < K$), inflating memory usage by a factor of $K_h \\cdot K_w$. High-performance implicit GEMM kernels (e.g. cuDNN Implicit GEMM) compute `im2col` indexing dynamically inside GPU SRAM registers without materializing $X_{col}$ in DRAM.\n- **Systolic Array Efficiency**: Converting convolution into dense matrix multiplication allows hardware to achieve >90% of peak theoretical TFLOPS on Tensor Cores.",
    constraints: [
      "1 <= N <= 64",
      "1 <= C_in, C_out <= 256",
      "1 <= H_in, W_in <= 512",
      "1 <= K_h, K_w <= 11",
    ],
    examples: [
      {
        kind: "basic",
        title: "Standard im2col GEMM Conv Execution",
        inputDisplay: "Input N=1, C_in=1, 3x3, Weights C_out=2, C_in=1, 2x2",
        outputDisplay: "Output N=1, C_out=2, 2x2 Tensor",
        input: DEFAULT_LOWEREDCONV2DGEMMEXECUTIONENGINE_INPUT,
        output: "4D Output Activation Tensor",
        explanation:
          "Lowers 3x3 input and 2x2 weights into GEMM matrices W_row (2x4) and X_col (4x4), computing Y_2d (2x4).",
      },
    ],
    code: LOWEREDCONV2DGEMMEXECUTIONENGINE_CODE,
    timeComplexity: {
      best: "O(C_{out} \\cdot C_{in} \\cdot K_h \\cdot K_w \\cdot N \\cdot H_{out} \\cdot W_{out})",
      average:
        "O(C_{out} \\cdot C_{in} \\cdot K_h \\cdot K_w \\cdot N \\cdot H_{out} \\cdot W_{out})",
      worst:
        "O(C_{out} \\cdot C_{in} \\cdot K_h \\cdot K_w \\cdot N \\cdot H_{out} \\cdot W_{out})",
    },
    spaceComplexity: "O(C_{in} \\cdot K_h \\cdot K_w \\cdot N \\cdot H_{out} \\cdot W_{out})",
    complexityAnalysis: {
      time: "GEMM multiplication performs $2 \\cdot C_{out} \\cdot K_{len} \\cdot N_{patches}$ floating-point operations.",
      space:
        "Requires $O(K_{len} \\cdot N_{patches})$ memory overhead to materialize unrolled im2col matrix $X_{col}$ in DRAM.",
    },
    topicGuide: {
      overview:
        "The **Lowered Conv2D GEMM Execution Engine** converts 2D convolutions into General Matrix Multiplications (GEMM) via im2col unrolling, unlocking hardware Tensor Core acceleration.",
      sections: [
        {
          heading: "1. Core Concept & Lowering Architecture",
          body: "Conv2D lowering transforms 4D spatial convolutions into 2D matrix multiplication: $Y_{2d} = W_{row} \\cdot X_{col}$. $W_{row}$ contains filter weights flattened to shape ($C_{out}, K_{len}$), and $X_{col}$ contains unrolled receptive field patches of shape ($K_{len}, N_{patches}$).",
        },
        {
          heading: "2. Systems & Tensor Core Acceleration",
          body: "Hardware accelerators (Nvidia Tensor Cores, Google TPUs) feature fixed $16 \\times 16$ or $8 \\times 8$ matrix multiply units (MMA instructions). Lowering convolutions to GEMM enables compiler auto-tuners (TVM, TensorRT) to map workloads onto Systolic Arrays with maximum memory bandwidth throughput.",
        },
        {
          heading: "3. Memory Trade-Offs: Explicit vs Implicit GEMM",
          body: "Explicit `im2col` duplicates overlapping receptive fields, consuming $K_h \\cdot K_w$ times more DRAM memory. Modern deep learning libraries use Implicit GEMM kernels (cuDNN), computing im2col indexing dynamically inside SRAM registers without DRAM memory allocations.",
        },
        {
          heading: "4. Edge Case Analysis & Memory Layouts",
          body: "Handling strided convolutions, non-zero padding, and batch sizes $N > 1$ requires careful indexing during im2col column extraction to guarantee contiguous BLAS memory alignment.",
        },
      ],
      keyTerms: [
        {
          term: "Lowering (im2col)",
          definition:
            "Transformation reshaping 4D spatial tensors into 2D matrices to enable BLAS GEMM execution.",
        },
        {
          term: "W_row Matrix",
          definition: "Flattened weight matrix of shape (C_out, C_in * K_h * K_w).",
        },
        {
          term: "X_col Matrix",
          definition:
            "Unrolled receptive field patch matrix of shape (C_in * K_h * K_w, N * H_out * W_out).",
        },
        {
          term: "Implicit GEMM",
          definition:
            "High-performance CUDA kernel evaluating im2col indices on-the-fly in SRAM registers without DRAM duplication.",
        },
      ],
    },
    trivia: LOWEREDCONV2DGEMMEXECUTIONENGINE_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_LOWEREDCONV2DGEMMEXECUTIONENGINE_INPUT,
    generateSteps: generateLoweredConv2dGemmExecutionEngineSteps,
  };
