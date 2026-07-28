import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface im2col4dTo2dUnrollerInput {
  inputTensor?: number[][][][];
  kernelH?: number;
  kernelW?: number;
  stride?: number;
  padding?: number;
  data?: number[];
  target?: number;
}

export const IM2COL4DTO2DUNROLLER_CODE = `def im2col_4d_to_2d(input_tensor, kernel_h, kernel_w, stride=1, padding=0):
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

    return col_matrix`;

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

  const tensor = input.inputTensor || [
    [
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
    ],
  ];

  const kH = input.kernelH ?? 2;
  const kW = input.kernelW ?? 2;
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

  const colMatrix: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  const getSnapshot = (activeRow: number = -1, activeCol: number = -1): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let state: "default" | "active" | "compared" | "sorted" | "pivot" | "inactive" = "default";
        if (r === activeRow && c === activeCol) {
          state = "active";
        } else if (activeRow === -1 && c === activeCol) {
          state = "compared";
        } else if (activeCol === -1 && r === activeRow) {
          state = "compared";
        }
        cells.push({
          row: r,
          col: c,
          value: colMatrix[r][c],
          label: `[${r},${c}]`,
          state,
        });
      }
    }

    const rowHeaders = Array.from({ length: rows }, (_, i) => `row_${i}`);
    const colHeaders = Array.from({ length: cols }, (_, i) => `col_${i}`);

    return {
      kind: "matrix",
      rows,
      cols,
      rowHeaders,
      colHeaders,
      title: `im2col Unrolled Matrix col_matrix (${rows} x ${cols})`,
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRow: number = -1,
    activeCol: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeRow, activeCol),
      auxiliaryState: {
        customState: {
          "Input Tensor Shape": `(${N}, ${C}, ${H}, ${W})`,
          "Kernel Size": `${kH} x ${kW}`,
          "Output Spatial Shape": `${H_out} x ${W_out}`,
          "Unrolled Matrix Shape": `${rows} x ${cols}`,
          "BLAS Memory Layout": "Columns = Spatial Patches, Rows = Unrolled Kernel Taps",
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Strided im2col 4D-to-2D Matrix Unroller Entry",
    `Started 4D-to-2D im2col unrolling engine on tensor shape (${N}, ${C}, ${H}, ${W}) with kernel ${kH}x${kW}, stride=${stride}, padding=${padding}.`,
    { N, C, H, W, kH, kW, stride, padding },
  );

  // Step 2: Measure N
  addStep(2, "Extract Batch Size N", `Input batch size: N = ${N}.`, { N });

  // Step 3: Measure C
  addStep(3, "Extract Channels Count C", `Input feature map channels count: C = ${C}.`, { C });

  // Step 4: Measure H
  addStep(4, "Extract Spatial Height H", `Input spatial height: H = ${H}.`, { H });

  // Step 5: Measure W
  addStep(5, "Extract Spatial Width W", `Input spatial width: W = ${W}.`, { W });

  // Step 6: Calculate H_out
  addStep(
    7,
    "Calculate Output Spatial Height H_out",
    `Output spatial height H_out = (${H} + 2 * ${padding} - ${kH}) // ${stride} + 1 = ${H_out}.`,
    { H_out, H, kH, stride, padding },
  );

  // Step 7: Calculate W_out
  addStep(
    8,
    "Calculate Output Spatial Width W_out",
    `Output spatial width W_out = (${W} + 2 * ${padding} - ${kW}) // ${stride} + 1 = ${W_out}.`,
    { W_out, W, kW, stride, padding },
  );

  // Step 8: Calculate rows
  addStep(
    10,
    "Calculate im2col Matrix Rows Count",
    `Matrix rows (unrolled receptive field footprint): rows = C * kH * kW = ${C} * ${kH} * ${kW} = ${rows}.`,
    { rows, C, kH, kW },
  );

  // Step 9: Calculate cols
  addStep(
    11,
    "Calculate im2col Matrix Cols Count",
    `Matrix cols (total spatial patches across batch): cols = N * H_out * W_out = ${N} * ${H_out} * ${W_out} = ${cols}.`,
    { cols, N, H_out, W_out },
  );

  // Step 10: Allocate col_matrix
  addStep(
    12,
    "Allocate col_matrix Buffer (rows x cols)",
    `Allocated 2D col_matrix buffer of shape (${rows}, ${cols}) filled with zeros.`,
    { rows, cols },
  );

  // Step 11: Init col_idx
  let colIdx = 0;
  addStep(
    14,
    "Initialize Patch Column Pointer col_idx = 0",
    "Set unrolled column pointer col_idx = 0.",
    { col_idx: colIdx },
  );

  // Unrolling loops
  for (let n = 0; n < N; n++) {
    addStep(15, `Batch Sample Loop: n = ${n}`, `Processing batch sample n = ${n} of ${N - 1}.`, {
      n,
      N,
    });

    for (let r = 0; r < H_out; r++) {
      addStep(
        16,
        `Spatial Row Loop: r = ${r}`,
        `Processing spatial row r = ${r} of ${H_out - 1}.`,
        { n, r, H_out },
      );

      for (let c = 0; c < W_out; c++) {
        addStep(
          17,
          `Spatial Col Loop: c = ${c}`,
          `Processing spatial column c = ${c} of ${W_out - 1} -> Patch Column ${colIdx}.`,
          { n, r, c, W_out, colIdx },
          -1,
          colIdx,
        );

        let rowIdx = 0;
        addStep(
          18,
          `Reset Receptive Field Row Pointer row_idx = 0`,
          `Set row_idx = 0 for column col_idx = ${colIdx}.`,
          { colIdx, rowIdx },
          rowIdx,
          colIdx,
        );

        for (let ch = 0; ch < C; ch++) {
          for (let kr = 0; kr < kH; kr++) {
            for (let kc = 0; kc < kW; kc++) {
              const ir = r * stride + kr - padding;
              const ic = c * stride + kc - padding;
              const inside = ir >= 0 && ir < H && ic >= 0 && ic < W;
              const val = inside ? tensor[n][ch][ir][ic] : 0.0;

              colMatrix[rowIdx][colIdx] = val;

              addStep(
                inside ? 25 : 27,
                `Write Pixel to Matrix: col_matrix[${rowIdx}][${colIdx}] = ${val}`,
                `Unrolled pixel tensor[${n}][${ch}][${ir}][${ic}] = ${val} into col_matrix at row ${rowIdx}, column ${colIdx}.`,
                { n, ch, kr, kc, ir, ic, val, rowIdx, colIdx },
                rowIdx,
                colIdx,
              );

              rowIdx++;
              addStep(
                28,
                `Increment Row Pointer: row_idx = ${rowIdx}`,
                `Advanced row_idx to ${rowIdx}.`,
                { rowIdx },
                rowIdx,
                colIdx,
              );
            }
          }
        }

        colIdx++;
        addStep(
          29,
          `Increment Column Pointer: col_idx = ${colIdx}`,
          `Advanced patch column pointer col_idx to ${colIdx}.`,
          { colIdx },
        );
      }
    }
  }

  // Step final
  addStep(
    31,
    "Execution Complete",
    `Successfully completed 4D-to-2D im2col unrolling. Unrolled matrix shape (${rows}, ${cols}).`,
    { completed: true, rows, cols },
  );

  return steps;
};

const IM2COL4DTO2DUNROLLER_TRIVIA: TriviaMeta = {
  skipLines: [6, 9, 13, 15, 16, 17, 19, 20, 21, 26, 30],
  distractors: [
    "col_matrix[col_idx][row_idx] = input_tensor[n][ch][ir][ic]",
    "rows = H_out * W_out",
    "cols = C * kernel_h * kernel_w",
    "row_idx = r * stride + kr",
  ],
  hints: [
    {
      line: 10,
      hint: "Unrolled matrix rows count equals C * kernel_h * kernel_w.",
    },
    {
      line: 11,
      hint: "Unrolled matrix cols count equals N * H_out * W_out.",
    },
    {
      line: 25,
      hint: "Write input pixel at (n, ch, ir, ic) into col_matrix[row_idx][col_idx].",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for strided im2col 4D-to-2D matrix unroller function.",
    2: "Measures batch size N from input_tensor length.",
    3: "Measures channels count C from input_tensor channel depth.",
    4: "Measures input spatial height H.",
    5: "Measures input spatial width W.",
    6: "Blank line before output dimension calculation.",
    7: "Calculates spatial output height H_out using integer division floor.",
    8: "Calculates spatial output width W_out using integer division floor.",
    9: "Blank line before unrolled matrix shape calculation.",
    10: "Calculates matrix rows count rows = C * kernel_h * kernel_w.",
    11: "Calculates matrix cols count cols = N * H_out * W_out.",
    12: "Allocates 2D matrix col_matrix of shape rows x cols filled with zero floats.",
    13: "Blank line before unrolling loops.",
    14: "Initializes patch column pointer col_idx to zero.",
    15: "Iterates over batch sample index n from 0 to N - 1.",
    16: "Iterates over spatial output row coordinate r from 0 to H_out - 1.",
    17: "Iterates over spatial output column coordinate c from 0 to W_out - 1.",
    18: "Resets receptive field row pointer row_idx to zero for current patch column.",
    19: "Iterates over input channel index ch from 0 to C - 1.",
    20: "Iterates over filter kernel spatial row kr from 0 to kernel_h - 1.",
    21: "Iterates over filter kernel spatial column kc from 0 to kernel_w - 1.",
    22: "Calculates spatial image row index ir = r * stride + kr - padding.",
    23: "Calculates spatial image column index ic = c * stride + kc - padding.",
    24: "Checks if spatial coordinate (ir, ic) lies within valid image bounds.",
    25: "Copies image pixel input_tensor[n][ch][ir][ic] into col_matrix[row_idx][col_idx].",
    26: "Branch executed when coordinate is out of bounds.",
    27: "Sets col_matrix[row_idx][col_idx] = 0.0 for zero-padding.",
    28: "Increments receptive field row pointer row_idx by 1.",
    29: "Increments patch column pointer col_idx by 1.",
    30: "Blank line separating unrolling loops from return statement.",
    31: "Returns final unrolled 2D matrix col_matrix.",
  },
};

export const im2col4dTo2dUnroller: AlgorithmDefinition<im2col4dTo2dUnrollerInput> = {
  id: "im2col-4d-to-2d-unroller",
  title: "im2col 4D-to-2D Matrix Unroller",
  topicIds: ["ml_convolutions", "ml_gemm_roofline"],
  difficulty: "Medium",
  description:
    "The `im2col` **4D-to-2D Matrix Unroller** transforms 4D activation tensors $(N, C, H, W)$ into 2D continuous matrices where each column represents a 3D receptive field patch ($C \\cdot K_h \\cdot K_w$ elements) and each row represents a filter weight tap. This 2D unrolled representation allows deep learning compilers to execute 2D convolution via standard BLAS General Matrix Multiplication (`gemm`).\n\n### Why It Exists\nHigh-performance GPU libraries (cuBLAS, Intel MKL) possess heavily tuned GEMM routines that achieve near 100% of peak hardware TFLOPS. Unrolling 4D batches into 2D matrices converts 6D spatial nested loops into a single `gemm()` call.\n\n### Mathematical Formulation\nGiven input tensor $X \\in \\mathbb{R}^{N \\times C \\times H \\times W}$, kernel dimensions $(K_h, K_w)$, stride $S$, and padding $P$, the unrolled 2D matrix dimensions are:\n\n$$\\text{Rows} = C \\cdot K_h \\cdot K_w, \\quad \\text{Cols} = N \\cdot H_{out} \\cdot W_{out}$$\n\n$$\\text{col\\_matrix}[row\\_idx, \\, col\\_idx] = X[n, \\, ch, \\, r \\cdot S + kr - P, \\, c \\cdot S + kc - P]$$\n\n$$\\text{where } row\\_idx = ch \\cdot K_h K_w + kr \\cdot K_w + kc, \\quad col\\_idx = n \\cdot H_{out} W_{out} + r \\cdot W_{out} + c$$\n\n### Step-by-Step Intuition\n1. **Dimension Calculation**: Evaluate unrolled matrix height $\\text{Rows} = C \\cdot K_h \\cdot K_w$ and width $\\text{Cols} = N \\cdot H_{out} \\cdot W_{out}$.\n2. **Patch Extraction Loop**: Loop through each batch sample $n$ and spatial coordinate $(r, c)$.\n3. **Channel-wise Tap Unrolling**: For every channel $ch$ and filter tap $(kr, kc)$, fetch image pixel $X[n, ch, ir, ic]$ or 0.0 if padded.\n4. **Column Matrix Writing**: Write pixel scalar into `col_matrix[row_idx][col_idx]` and advance column pointer.\n\n### Key Trade-Offs & Hardware Execution\n- **Memory Inflation**: Overlapping windows ($S < K$) duplicate pixel entries in memory, expanding RAM usage by $K_h \\cdot K_w$.\n- **GEMM Lowering Alignment**: Columns are aligned for contiguous memory access during matrix multiplication $Y_{2d} = W_{row} \\cdot X_{col}$.",
  constraints: ["1 <= N <= 64", "1 <= C <= 256", "1 <= H, W <= 512", "1 <= K_h, K_w <= 11"],
  examples: [
    {
      kind: "basic",
      title: "Batch N=1, C=1 Image Unrolled to 2D Matrix",
      inputDisplay: "Tensor (1, 1, 3, 3), Kernel 2x2",
      outputDisplay: "Unrolled Matrix of shape (4, 4)",
      input: DEFAULT_IM2COL4DTO2DUNROLLER_INPUT,
      output: "4x4 unrolled im2col matrix",
      explanation: "Unrolls 4 spatial 2x2 patches into a 4x4 GEMM matrix.",
    },
  ],
  code: IM2COL4DTO2DUNROLLER_CODE,
  timeComplexity: {
    best: "O(N \\cdot C \\cdot K_h \\cdot K_w \\cdot H_{out} \\cdot W_{out})",
    average: "O(N \\cdot C \\cdot K_h \\cdot K_w \\cdot H_{out} \\cdot W_{out})",
    worst: "O(N \\cdot C \\cdot K_h \\cdot K_w \\cdot N \\cdot H_{out} \\cdot W_{out})",
  },
  spaceComplexity: "O(C \\cdot K_h \\cdot K_w \\cdot N \\cdot H_{out} \\cdot W_{out})",
  complexityAnalysis: {
    time: "Linear in total number of unrolled matrix cells $O(C \\cdot K_h \\cdot K_w \\cdot N \\cdot H_{out} \\cdot W_{out})$.",
    space:
      "Allocates memory for unrolled col_matrix of size $O(C \\cdot K_h \\cdot K_w \\cdot N \\cdot H_{out} \\cdot W_{out})$.",
  },
  topicGuide: {
    overview:
      "The **im2col 4D-to-2D Matrix Unroller** converts 4D activation tensors into 2D matrices to enable BLAS GEMM execution.",
    sections: [
      {
        heading: "1. Core Concept & 4D-to-2D Lowering",
        body: "im2col reshapes 4D activation tensors $(N, C, H, W)$ into 2D matrices where columns represent unrolled 3D spatial receptive fields ($C \\cdot K_h \\cdot K_w$ elements).",
      },
      {
        heading: "2. Systems & Memory Layout Alignment",
        body: "Unrolled column matrix `col_matrix` allows 2D convolution to execute as BLAS matrix multiplication: $Y_{2d} = W_{row} \\cdot X_{col}$.",
      },
      {
        heading: "3. Memory Trade-Offs & Duplication",
        body: "Duplicating overlapping pixels increases memory footprint by $K_h \\cdot K_w$. In modern engines, implicit GEMM or SRAM tiling is used to mitigate DRAM bandwidth overhead.",
      },
      {
        heading: "4. Edge Case Analysis & Padding Handling",
        body: "Zero-padding boundaries are handled via bounds checks ($0 \\le ir < H$ and $0 \\le ic < W$) inserting 0.0 for out-of-bounds pixels.",
      },
    ],
    keyTerms: [
      {
        term: "im2col",
        definition:
          "4D tensor to 2D matrix transformation enabling BLAS GEMM convolution execution.",
      },
      {
        term: "Receptive Field Column",
        definition:
          "A single column in unrolled col_matrix containing all C * K_h * K_w elements for a spatial window.",
      },
      {
        term: "BLAS GEMM",
        definition:
          "General Matrix Multiplication library routine used for hardware-accelerated matrix math.",
      },
      {
        term: "Spatial Patch Indexing",
        definition:
          "Decoding 4D tensor coordinates (n, ch, ir, ic) into 2D matrix indices (row_idx, col_idx).",
      },
    ],
  },
  trivia: IM2COL4DTO2DUNROLLER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_IM2COL4DTO2DUNROLLER_INPUT,
  generateSteps: generateIm2col4dTo2dUnrollerSteps,
};
