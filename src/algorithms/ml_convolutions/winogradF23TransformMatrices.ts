import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface winogradF23TransformMatricesInput {
  tile?: number[][];
  kernel?: number[][];
  data?: number[];
  target?: number;
}

export const WINOGRADF23TRANSFORMMATRICES_CODE = `def winograd_f23_transforms(input_tile_4x4, kernel_3x3):
    """
    Winograd F(2x2, 3x3) Minimal Filtering Transform Matrices.
    Computes transformed matrices for fast 2D convolution:
      1. Filter transform:   U = G @ g @ G_T     (4x4)
      2. Data transform:     V = B_T @ d @ B     (4x4)
      3. Hadamard product:   M = U (*) V         (4x4)
      4. Inverse transform:  Y = A_T @ M @ A     (2x2)
    Reduces 2x2 output multiplication count from 36 down to 16 (2.25x FLOP reduction).
    """
    # Transform matrices for F(2x2, 3x3)
    BT = [
        [1.0,  0.0, -1.0,  0.0],
        [0.0,  1.0,  1.0,  0.0],
        [0.0, -1.0,  1.0,  0.0],
        [0.0,  1.0,  0.0, -1.0]
    ]
    B = [list(col) for col in zip(*BT)]

    G = [
        [1.0,  0.0,  0.0],
        [0.5,  0.5,  0.5],
        [0.5, -0.5,  0.5],
        [0.0,  0.0,  1.0]
    ]
    GT = [list(col) for col in zip(*G)]

    AT = [
        [1.0,  1.0,  1.0,  0.0],
        [0.0,  1.0, -1.0, -1.0]
    ]
    A = [list(col) for col in zip(*AT)]

    def matmul(M1, M2):
        r1, c1 = len(M1), len(M1[0])
        c2 = len(M2[0])
        res = [[0.0] * c2 for _ in range(r1)]
        for i in range(r1):
            for j in range(c2):
                res[i][j] = sum(M1[i][k] * M2[k][j] for k in range(c1))
        return res

    # Step 1: Filter transform U = G @ g @ G_T
    U = matmul(matmul(G, kernel_3x3), GT)

    # Step 2: Data transform V = B_T @ d @ B
    V = matmul(matmul(BT, input_tile_4x4), B)

    # Step 3: Domain elementwise multiply M = U (*) V
    M = [[U[i][j] * V[i][j] for j in range(4)] for i in range(4)]

    # Step 4: Output inverse transform Y = A_T @ M @ A
    Y = matmul(matmul(AT, M), A)

    return Y`;

export const DEFAULT_WINOGRADF23TRANSFORMMATRICES_INPUT: winogradF23TransformMatricesInput = {
  tile: [
    [1, 2, 1, 0],
    [0, 1, 2, 1],
    [2, 1, 0, 1],
    [1, 0, 1, 2],
  ],
  kernel: [
    [1, 0, 1],
    [0, 1, 0],
    [1, 0, 1],
  ],
};

export const generateWinogradF23TransformMatricesSteps = (
  input: winogradF23TransformMatricesInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const tile = input.tile || [
    [1, 2, 1, 0],
    [0, 1, 2, 1],
    [2, 1, 0, 1],
    [1, 0, 1, 2],
  ];

  const kernel = input.kernel || [
    [1, 0, 1],
    [0, 1, 0],
    [1, 0, 1],
  ];

  const matmul = (M1: number[][], M2: number[][]): number[][] => {
    const r1 = M1.length;
    const c1 = M1[0].length;
    const c2 = M2[0].length;
    const res: number[][] = Array.from({ length: r1 }, () => Array(c2).fill(0));
    for (let i = 0; i < r1; i++) {
      for (let j = 0; j < c2; j++) {
        let sum = 0;
        for (let k = 0; k < c1; k++) {
          sum += M1[i][k] * M2[k][j];
        }
        res[i][j] = sum;
      }
    }
    return res;
  };

  const BT = [
    [1.0, 0.0, -1.0, 0.0],
    [0.0, 1.0, 1.0, 0.0],
    [0.0, -1.0, 1.0, 0.0],
    [0.0, 1.0, 0.0, -1.0],
  ];
  const B = BT[0].map((_, colIndex) => BT.map((row) => row[colIndex]));

  const G = [
    [1.0, 0.0, 0.0],
    [0.5, 0.5, 0.5],
    [0.5, -0.5, 0.5],
    [0.0, 0.0, 1.0],
  ];
  const GT = G[0].map((_, colIndex) => G.map((row) => row[colIndex]));

  const AT = [
    [1.0, 1.0, 1.0, 0.0],
    [0.0, 1.0, -1.0, -1.0],
  ];
  const A = AT[0].map((_, colIndex) => AT.map((row) => row[colIndex]));

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
          "Algorithm": "Winograd F(2x2, 3x3)",
          "Data Tile": "4x4 Input",
          "Filter Kernel": "3x3 Weight",
          "FLOP Reduction": "2.25x (36 mults -> 16 mults)",
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Winograd F(2x2, 3x3) Transform Matrices Entry",
    "Starting Winograd F(2x2, 3x3) fast convolution transform pipeline.",
    { tile_rows: tile.length, tile_cols: tile[0].length, k_rows: kernel.length, k_cols: kernel[0].length },
    tile,
    "Input Data Tile d (4x4)",
  );

  // Step 2: Define BT
  addStep(
    12,
    "Construct Data Transform Matrix B_T (4x4)",
    "Loaded Winograd data transform transposed matrix B_T.",
    { B_T_rows: 4, B_T_cols: 4 },
    BT,
    "Winograd Data Transform Matrix B_T (4x4)",
  );

  // Step 3: Define B
  addStep(
    18,
    "Construct Data Transform Matrix B (4x4)",
    "Transposed B_T to yield data transform matrix B.",
    { B_rows: 4, B_cols: 4 },
    B,
    "Winograd Data Transform Matrix B (4x4)",
  );

  // Step 4: Define G
  addStep(
    20,
    "Construct Filter Transform Matrix G (4x3)",
    "Loaded Winograd filter transform matrix G for 3x3 kernel mapping to 4x4 domain.",
    { G_rows: 4, G_cols: 3 },
    G,
    "Winograd Filter Transform Matrix G (4x3)",
  );

  // Step 5: Define GT
  addStep(
    26,
    "Construct Filter Transform Matrix G_T (3x4)",
    "Transposed G to yield filter transform transposed matrix G_T.",
    { G_T_rows: 3, G_T_cols: 4 },
    GT,
    "Winograd Filter Transform Matrix G_T (3x4)",
  );

  // Step 6: Define AT
  addStep(
    28,
    "Construct Inverse Transform Matrix A_T (2x4)",
    "Loaded Winograd inverse transform transposed matrix A_T for mapping 4x4 domain back to 2x2 output.",
    { A_T_rows: 2, A_T_cols: 4 },
    AT,
    "Winograd Inverse Transform Matrix A_T (2x4)",
  );

  // Step 7: Define A
  addStep(
    32,
    "Construct Inverse Transform Matrix A (4x2)",
    "Transposed A_T to yield inverse transform matrix A.",
    { A_rows: 4, A_cols: 2 },
    A,
    "Winograd Inverse Transform Matrix A (4x2)",
  );

  // Step 8: Filter transform step 1
  const G_g = matmul(G, kernel);
  addStep(
    44,
    "Filter Transform Step 1: Compute G @ g (4x3)",
    "Multiplied filter transform matrix G (4x3) by 3x3 kernel g.",
    { G_g_rows: 4, G_g_cols: 3 },
    G_g,
    "Intermediate Filter Matrix G @ g (4x3)",
  );

  // Step 9: Filter transform step 2 (U)
  const U = matmul(G_g, GT);
  addStep(
    44,
    "Filter Transform Step 2: Compute U = (G @ g) @ G_T (4x4)",
    "Completed 2D filter transform U in Winograd domain.",
    { U_rows: 4, U_cols: 4 },
    U,
    "Transformed Filter Matrix U (4x4)",
  );

  // Step 10: Data transform step 1
  const BT_d = matmul(BT, tile);
  addStep(
    47,
    "Data Transform Step 1: Compute B_T @ d (4x4)",
    "Multiplied data transform matrix B_T (4x4) by 4x4 input data tile d.",
    { BT_d_rows: 4, BT_d_cols: 4 },
    BT_d,
    "Intermediate Data Matrix B_T @ d (4x4)",
  );

  // Step 11: Data transform step 2 (V)
  const V = matmul(BT_d, B);
  addStep(
    47,
    "Data Transform Step 2: Compute V = (B_T @ d) @ B (4x4)",
    "Completed 2D data transform V in Winograd domain.",
    { V_rows: 4, V_cols: 4 },
    V,
    "Transformed Data Matrix V (4x4)",
  );

  // Step 12: Hadamard product M elementwise (16 individual steps)
  const M: number[][] = Array.from({ length: 4 }, () => Array(4).fill(0));
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      M[i][j] = U[i][j] * V[i][j];
      addStep(
        50,
        `Hadamard Elementwise Product M[${i}][${j}] = U[${i}][${j}] * V[${i}][${j}]`,
        `Multiplied transformed filter cell U[${i}][${j}] (${U[i][j].toFixed(2)}) by data cell V[${i}][${j}] (${V[i][j].toFixed(2)}) -> ${M[i][j].toFixed(2)}.`,
        { i, j, "U[i][j]": U[i][j], "V[i][j]": V[i][j], "M[i][j]": M[i][j] },
        M,
        "Domain Elementwise Multiplication Matrix M (4x4)",
        i,
        j,
      );
    }
  }

  // Step 13: Inverse transform step 1
  const AT_M = matmul(AT, M);
  addStep(
    53,
    "Inverse Transform Step 1: Compute A_T @ M (2x4)",
    "Multiplied inverse transform matrix A_T (2x4) by domain matrix M (4x4).",
    { AT_M_rows: 2, AT_M_cols: 4 },
    AT_M,
    "Intermediate Inverse Matrix A_T @ M (2x4)",
  );

  // Step 14: Inverse transform step 2 (Y)
  const Y = matmul(AT_M, A);
  addStep(
    53,
    "Output Inverse Spatial Transform: Compute Y = (A_T @ M) @ A (2x2)",
    "Completed inverse Winograd transform, generating 2x2 output convolution spatial activation patch.",
    { Y_rows: 2, Y_cols: 2, Y_00: Y[0][0], Y_01: Y[0][1], Y_10: Y[1][0], Y_11: Y[1][1] },
    Y,
    "Final Winograd Output Patch Y (2x2)",
  );

  // Final step
  addStep(
    55,
    "Execution Complete: Output Inverse Spatial Transform Verified",
    "Successfully computed Winograd F(2x2, 3x3) minimal filtering transform. Reduced multiplications from 36 down to 16.",
    { completed: true, FLOP_reduction: "2.25x" },
    Y,
    "Final Winograd Output Patch Y (2x2)",
  );

  return steps;
};

const WINOGRADF23TRANSFORMMATRICES_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 8, 9, 11, 19, 27, 33, 42],
  distractors: [
    "M = matmul(U, V)",
    "U = G @ g @ G",
    "Y = A @ M @ AT",
    "BT = [[1, 1, 1, 1], [0, 1, 1, 0]]",
  ],
  hints: [
    {
      line: 44,
      hint: "Filter transform matrix formula: U = G @ g @ G_T.",
    },
    {
      line: 47,
      hint: "Data tile transform matrix formula: V = B_T @ d @ B.",
    },
    {
      line: 50,
      hint: "Winograd domain multiplication is elementwise Hadamard product M = U (*) V.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for Winograd F(2x2, 3x3) minimal filtering transform matrices function.",
    2: "Docstring opening delimiter tag.",
    3: "Describes Winograd F(2x2, 3x3) fast 2D convolution algorithm.",
    4: "Docstring step 1 detailing filter transform U = G @ g @ G_T.",
    5: "Docstring step 2 detailing data transform V = B_T @ d @ B.",
    6: "Docstring step 3 detailing Hadamard elementwise product M = U (*) V.",
    7: "Docstring step 4 detailing inverse transform Y = A_T @ M @ A.",
    8: "Docstring note highlighting 2.25x FLOP multiplication reduction from 36 down to 16.",
    9: "Docstring closing delimiter tag.",
    10: "Comment for F(2x2, 3x3) fixed transform matrices.",
    11: "Constructs 4x4 data transform transposed matrix B_T.",
    12: "Row 0 of B_T: [1.0, 0.0, -1.0, 0.0].",
    13: "Row 1 of B_T: [0.0, 1.0, 1.0, 0.0].",
    14: "Row 2 of B_T: [0.0, -1.0, 1.0, 0.0].",
    15: "Row 3 of B_T: [0.0, 1.0, 0.0, -1.0].",
    16: "Closes B_T matrix definition.",
    17: "Transposes B_T to form 4x4 data transform matrix B.",
    18: "Blank line before filter transform matrix definition.",
    19: "Constructs 4x3 filter transform matrix G.",
    20: "Row 0 of G: [1.0, 0.0, 0.0].",
    21: "Row 1 of G: [0.5, 0.5, 0.5].",
    22: "Row 2 of G: [0.5, -0.5, 0.5].",
    23: "Row 3 of G: [0.0, 0.0, 1.0].",
    24: "Closes G matrix definition.",
    25: "Transposes G to form 3x4 filter transform transposed matrix G_T.",
    26: "Blank line before inverse transform matrix definition.",
    27: "Constructs 2x4 inverse transform transposed matrix A_T.",
    28: "Row 0 of A_T: [1.0, 1.0, 1.0, 0.0].",
    29: "Row 1 of A_T: [0.0, 1.0, -1.0, -1.0].",
    30: "Closes A_T matrix definition.",
    31: "Transposes A_T to form 4x2 inverse transform matrix A.",
    32: "Blank line before matmul helper function.",
    33: "Defines helper function matmul for 2D matrix multiplication.",
    34: "Extracts row and column counts of M1.",
    35: "Extracts column count of M2.",
    36: "Allocates result matrix of shape r1 x c2 filled with zeros.",
    37: "Iterates over row index i from 0 to r1 - 1.",
    38: "Iterates over column index j from 0 to c2 - 1.",
    39: "Computes dot product sum of row M1[i] and column M2[:, j].",
    40: "Returns computed matrix multiplication result res.",
    41: "Blank line before Step 1 Filter Transform.",
    42: "Comment for Step 1: Filter transform U = G @ g @ G_T.",
    43: "Computes 4x4 transformed filter matrix U = G @ kernel_3x3 @ G_T.",
    44: "Blank line before Step 2 Data Transform.",
    45: "Comment for Step 2: Data transform V = B_T @ d @ B.",
    46: "Computes 4x4 transformed data tile matrix V = B_T @ input_tile_4x4 @ B.",
    47: "Blank line before Step 3 Hadamard Product.",
    48: "Comment for Step 3: Domain elementwise multiplication M = U (*) V.",
    49: "Computes 4x4 Hadamard elementwise product matrix M = U (*) V.",
    50: "Blank line before Step 4 Inverse Transform.",
    51: "Comment for Step 4: Output inverse transform Y = A_T @ M @ A.",
    52: "Computes 2x2 final output spatial activation patch Y = A_T @ M @ A.",
    53: "Blank line separating transform pipeline from return statement.",
    54: "Returns final 2x2 output convolution spatial patch Y.",
    55: "Blank line at end of file.",
  },
};

export const winogradF23TransformMatrices: AlgorithmDefinition<winogradF23TransformMatricesInput> =
  {
    id: "winogradF23TransformMatrices",
    title: "Winograd F(2x2, 3x3) Transform Matrices",
    category: "ml_convolutions",
    categories: ["ml_convolutions", "ml_gemm_roofline"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_convolutions",
    description:
      "Winograd Minimal Filtering F(2x2, 3x3) is a fast algorithm for computing 2D spatial convolutions with $3 \\times 3$ kernels. By mapping spatial $4 \\times 4$ data tiles $d$ and $3 \\times 3$ filter kernels $g$ into a transformed Winograd domain via fixed matrix operators $B_T, G, A_T$, Winograd converts spatial 2D sliding window convolutions into element-wise matrix multiplications (Hadamard products), achieving a **2.25x reduction in floating-point multiplications** (from 36 down to 16 multiplications per $2 \\times 2$ output tile).\n\n### Why It Exists\nIn deep convolutional networks (such as ResNet and VGG), $3 \\times 3$ convolutions account for over 80% of total compute time. Direct spatial sliding window evaluation requires $K_h \\cdot K_w \\cdot H_{out} \\cdot W_{out} = 3 \\cdot 3 \\cdot 2 \\cdot 2 = 36$ scalar multiplications for a $2 \\times 2$ output block. Winograd F(2, 3) computes the exact same $2 \\times 2$ output block with only 16 multiplications, dramatically increasing GPU compute throughput.\n\n### Mathematical Formulation\nWinograd F(2x2, 3x3) operates on $4 \\times 4$ input tiles $d$ and $3 \\times 3$ filter kernels $g$ using fixed transform matrices:\n\n$$U = G \\, g \\, G^T \\quad (4 \\times 4 \\text{ Transformed Filter})$$\n\n$$V = B^T \\, d \\, B \\quad (4 \\times 4 \\text{ Transformed Data Tile})$$\n\n$$M = U \\odot V \\quad (4 \\times 4 \\text{ Elementwise Hadamard Product})$$\n\n$$Y = A^T \\, M \\, A \\quad (2 \\times 2 \\text{ Final Output Spatial Patch})$$\n\nwhere constant transform matrices are:\n\n$$B^T = \\begin{bmatrix} 1 & 0 & -1 & 0 \\\\ 0 & 1 & 1 & 0 \\\\ 0 & -1 & 1 & 0 \\\\ 0 & 1 & 0 & -1 \\end{bmatrix}, \\quad G = \\begin{bmatrix} 1 & 0 & 0 \\\\ 1/2 & 1/2 & 1/2 \\\\ 1/2 & -1/2 & 1/2 \\\\ 0 & 0 & 1 \\end{bmatrix}, \\quad A^T = \\begin{bmatrix} 1 & 1 & 1 & 0 \\\\ 0 & 1 & -1 & -1 \\end{bmatrix}$$\n\n### Step-by-Step Intuition\n1. **Filter Pre-Transformation**: Transform 3x3 filter $g$ into 4x4 domain $U = G g G^T$. In inference engines (TensorRT, cuDNN), filter weights are pre-transformed offline ($O(1)$ runtime cost).\n2. **Tile Extraction**: Extract overlapping 4x4 input data tiles $d$ with stride $S=2$.\n3. **Data Transformation**: Map 4x4 tile $d$ into 4x4 domain $V = B^T d B$ using fast additions/subtractions.\n4. **Hadamard Multiplication**: Perform 16 scalar multiplications $M = U \\odot V$.\n5. **Inverse Transformation**: Convert 4x4 domain matrix $M$ back to $2 \\times 2$ spatial output $Y = A^T M A$.\n\n### Key Trade-Offs & Hardware Execution\n- **Numerical Stability**: Larger Winograd orders (e.g. F(4, 3) or F(6, 3)) suffer from numerical catastrophic cancellation in FP16 precision due to large scale factors in transform matrices. F(2, 3) is widely preferred in production cuDNN for FP16/FP32 stability.\n- **Arithmetic Intensity**: Pre-transforming $U$ offline leaves only 16 multiplications per tile, transforming compute-bound convolutions into memory-bound additions.",
    constraints: [
      "Input tile size must be 4x4",
      "Kernel size must be 3x3",
      "Output patch size is 2x2",
    ],
    examples: [
      {
        kind: "basic",
        title: "Standard Winograd F(2x2, 3x3) Execution",
        inputDisplay: "Tile 4x4, Kernel 3x3",
        outputDisplay: "Output Y 2x2 matrix",
        input: DEFAULT_WINOGRADF23TRANSFORMMATRICES_INPUT,
        output: "2x2 spatial output matrix",
        explanation: "Transforms 4x4 tile and 3x3 kernel into 16 domain multiplications, producing exact 2x2 output.",
      },
    ],
    code: WINOGRADF23TRANSFORMMATRICES_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Evaluates 16 domain multiplications and matrix additions for each 2x2 output tile, achieving a 2.25x reduction in scalar multiplications.",
      space: "Requires O(1) auxiliary space for 4x4 intermediate domain matrices U, V, and M.",
    },
    topicGuide: {
      overview:
        "The **Winograd F(2x2, 3x3) Transform Matrices** algorithm reduces floating-point multiplication counts by 2.25x for 3x3 2D spatial convolutions via domain transform operators.",
      sections: [
        {
          heading: "1. Core Concept & Minimal Filtering Theory",
          body: "Based on Toom-Cook polynomial interpolation, Winograd minimal filtering proves that computing $F(m, r)$ outputs of size $m$ with kernel size $r$ requires $m + r - 1$ multiplications in 1D, or $(m + r - 1)^2$ in 2D. For $F(2, 3)$, $(2 + 3 - 1)^2 = 16$ multiplications instead of 36.",
        },
        {
          heading: "2. Systems & Memory Hierarchy Performance",
          body: "In modern GPUs (cuDNN, TensorRT), filter weights $U = G g G^T$ are pre-transformed once before inference. During runtime, data tiles $V = B^T d B$ are transformed using fast SIMD additions (without multiplications), maximizing Tensor Core execution efficiency.",
        },
        {
          heading: "3. Numerical Precision & Instability Trade-Offs",
          body: "Winograd transform matrices contain fraction constants ($1/2$). While $F(2, 3)$ maintains IEEE 754 precision, higher-order Winograd algorithms (e.g. $F(6, 3)$) incur severe numerical instability in FP16, restricting production adoption to $F(2, 3)$ and $F(4, 3)$.",
        },
        {
          heading: "4. Edge Cases & Tiling Strategies",
          body: "Tiling non-divisible spatial feature maps requires edge zero-padding. Boundary tiles overlapping image borders are padded to $4 \\times 4$ prior to Winograd domain transformation.",
        },
      ],
      keyTerms: [
        {
          term: "Winograd Minimal Filtering",
          definition:
            "Fast convolution algorithm reducing scalar multiplication counts via polynomial domain interpolation.",
        },
        {
          term: "Hadamard Product (\\odot)",
          definition: "Element-wise matrix multiplication M_{ij} = U_{ij} \\cdot V_{ij}.",
        },
        {
          term: "Filter Pre-Transformation",
          definition:
            "Offline computation of U = G g G_T removing filter transformation overhead from runtime execution.",
        },
        {
          term: "FLOP Reduction Factor",
          definition: "Multiplication count ratio 36 / 16 = 2.25x for F(2x2, 3x3).",
        },
      ],
    },
    trivia: WINOGRADF23TRANSFORMMATRICES_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_WINOGRADF23TRANSFORMMATRICES_INPUT,
    generateSteps: generateWinogradF23TransformMatricesSteps,
  };
