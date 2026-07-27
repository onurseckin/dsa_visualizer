import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface winogradF23TransformMatricesInput {
  tile: number[][];
  kernel: number[][];
}

export const WINOGRADF23TRANSFORMMATRICES_CODE = `
def winograd_f23_transforms(input_tile_4x4, kernel_3x3):
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

    return Y
`;

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

  const tile = input.tile;
  const kernel = input.kernel;

  const flatTile = tile.flatMap((r) => r);
  const elements: ArrayElement[] = flatTile.map((val, idx) => ({
    id: `tile-${idx}`,
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
          tileSize: "4x4",
          kernelSize: "3x3",
          outputTileSize: "2x2",
          ...customState,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Winograd F(2x2, 3x3) Transform Matrices",
    "Setting up minimal filtering transform matrices B_T (4x4), G (4x3), and A_T (2x4).",
    { inputRows: 4, inputCols: 4, kernelRows: 3, kernelCols: 3 },
  );

  // Helper matmul
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
  const B = BT[0].map((_, colIdx) => BT.map((row) => row[colIdx]));

  const G = [
    [1.0, 0.0, 0.0],
    [0.5, 0.5, 0.5],
    [0.5, -0.5, 0.5],
    [0.0, 0.0, 1.0],
  ];
  const GT = G[0].map((_, colIdx) => G.map((row) => row[colIdx]));

  const AT = [
    [1.0, 1.0, 1.0, 0.0],
    [0.0, 1.0, -1.0, -1.0],
  ];
  const A = AT[0].map((_, colIdx) => AT.map((row) => row[colIdx]));

  // Step 1: U = G @ kernel @ GT
  const U = matmul(matmul(G, kernel), GT);
  addStep(
    40,
    "Transform 3x3 Filter into Winograd Domain U = G @ g @ G_T",
    "Transformed 3x3 filter kernel into 4x4 Winograd domain matrix U.",
    { uRows: 4, uCols: 4 },
    { UMatrix: `U = [${U.map((r) => "[" + r.join(",") + "]").join(", ")}]` },
  );

  // Step 2: V = BT @ tile @ B
  const V = matmul(matmul(BT, tile), B);
  addStep(
    43,
    "Transform 4x4 Data Tile into Winograd Domain V = B_T @ d @ B",
    "Transformed 4x4 input data tile into 4x4 Winograd domain matrix V.",
    { vRows: 4, vCols: 4 },
    { VMatrix: `V = [${V.map((r) => "[" + r.join(",") + "]").join(", ")}]` },
  );

  // Step 3: M = U * V
  const M: number[][] = Array.from({ length: 4 }, () => Array(4).fill(0));
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      M[i][j] = U[i][j] * V[i][j];
    }
  }
  addStep(
    46,
    "Elementwise Hadamard Product M = U (*) V",
    "Computed 16 point-wise scalar multiplications in Winograd domain.",
    { mElems: 16 },
    { MMatrix: `M = [${M.map((r) => "[" + r.join(",") + "]").join(", ")}]` },
  );

  // Step 4: Y = AT @ M @ A
  const Y = matmul(matmul(AT, M), A);
  addStep(
    49,
    "Inverse Spatial Transform Y = A_T @ M @ A & Complete",
    "Projected 4x4 Winograd domain matrix back to 2x2 output spatial feature tile.",
    { completed: true, yRows: 2, yCols: 2 },
    { YMatrix: `Y = [${Y.map((r) => "[" + r.join(",") + "]").join(", ")}]` },
  );

  return steps;
};

const WINOGRADF23TRANSFORMMATRICES_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: ["U = kernel @ G", "Y = M @ A", "if tile.shape != (3,3): raise Exception()"],
  hints: [
    {
      line: 40,
      hint: "Filter transform matrix G (4x3) expands the 3x3 filter into a 4x4 Winograd domain matrix.",
    },
    {
      line: 46,
      hint: "Winograd minimal filtering replaces 36 spatial multiplications with 16 elementwise products.",
    },
  ],
  lineExplanations: {
    1: "Entry point for Winograd F(2x2, 3x3) transform matrices algorithm.",
    40: "Filter transformation step U = G @ g @ G_T.",
    43: "Data tile transformation step V = B_T @ d @ B.",
    46: "Elementwise Hadamard multiplication step M = U (*) V.",
    49: "Inverse spatial transformation step Y = A_T @ M @ A and output return.",
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
      "Winograd Minimal Filtering F(2x2, 3x3) is a fast domain transformation algorithm that computes a 2x2 output tile using a 3x3 convolution kernel applied to a 4x4 input tile. Standard 2D direct convolution requires 2 * 2 * 3 * 3 = 36 floating-point multiplications per tile. Winograd minimal filtering uses pre-calculated transformation matrices B_T (data transform), G (kernel transform), and A_T (inverse output transform) to reduce the required multiplications down to 4 * 4 = 16. This yields a theoretical 2.25x reduction in multiplications (36 / 16 = 2.25), significantly increasing GEMM arithmetic throughput in modern deep learning accelerators (e.g. cuDNN, ARM Compute Library).\n\nInput Format:\n- tile: 4x4 matrix representing spatial input tile d.\n- kernel: 3x3 matrix representing filter kernel g.\n\nOutput Format:\n- Returns a 2x2 output feature matrix Y.\n\nEdge Cases & Constraints:\n- Exact matrix dimensions: Requires input tile dimension 4x4 and kernel dimension 3x3 for F(2x2, 3x3).\n- Numerical precision trade-off: Constant additions in B_T and G can accumulate floating-point rounding errors in FP16/INT8 precision.",
    constraints: ["tile shape must be exactly 4x4", "kernel shape must be exactly 3x3"],
    examples: [
      {
        kind: "basic",
        title: "Standard 4x4 Tile and 3x3 Kernel",
        inputDisplay: "tile: 4x4, kernel: 3x3",
        outputDisplay: "Output Tile: 2x2",
        input: DEFAULT_WINOGRADF23TRANSFORMMATRICES_INPUT,
        output: "Matrix 2x2",
        explanation:
          "Computes fast Winograd convolution via transform domain matrices B_T, G, and A_T.",
      },
    ],
    code: WINOGRADF23TRANSFORMMATRICES_CODE,
    timeComplexity: {
      best: "O(1)",
      average: "O(1)",
      worst: "O(1)",
    },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Performs exactly 16 elementwise multiplications and a small fixed set of additions per 2x2 tile.",
      space: "Constant workspace memory allocation for 4x4 domain transformation matrices U, V, M.",
    },
    topicGuide: {
      overview:
        "Winograd F(2x2, 3x3) minimal filtering reduces floating-point multiplications by 2.25x using algebraic transform matrices B_T, G, and A_T.",
      sections: [
        {
          heading: "Overview",
          body: "Direct convolution for 3x3 filters requires 9 multiplications per output pixel. Shmuel Winograd proved that by mapping input and filter polynomials into a transform domain, 2x2 output tiles can be computed using only 16 multiplications instead of 36.",
        },
        {
          heading: "Core Concepts",
          body: "1. Filter Transform U = G @ g @ G_T: Maps 3x3 kernel g into 4x4 domain matrix U.\n2. Data Transform V = B_T @ d @ B: Maps 4x4 input tile d into 4x4 domain matrix V.\n3. Hadamard Product M = U (*) V: 16 elementwise scalar multiplications.\n4. Inverse Transform Y = A_T @ M @ A: Maps 4x4 domain matrix M back to 2x2 spatial tile Y.",
        },
        {
          heading: "Systems & Performance Impact",
          body: "In high-throughput deep learning engines (cuDNN, TensorRT), filter transformation U is pre-computed offline prior to inference. The online latency depends only on fast addition transforms and 16 scalar products, yielding up to 2x real-world speedups on 3x3 CNN layers.",
        },
        {
          heading: "Implementation Nuances",
          body: "B_T and G matrix entries contain simple constants (1, -1, 0.5). Matrix multiplications with B_T and G are implemented as fast add/subtract/shift SIMD instructions without hardware multiplication units.",
        },
        {
          heading: "Edge Cases",
          body: "Numerical instability for larger Winograd tiles (e.g. F(6x6, 3x3)), zero-padded boundary tiles, and batch multi-channel tensor tiling.",
        },
      ],
      keyTerms: [
        {
          term: "Winograd Algorithm",
          definition:
            "Minimal filtering algorithm reducing multiplication FLOP count via polynomial transform domain math.",
        },
        {
          term: "Hadamard Product",
          definition: "Elementwise matrix multiplication M = U (*) V.",
        },
        {
          term: "Transform Matrix G",
          definition:
            "4x3 filter transformation matrix mapping 3x3 kernels into 4x4 Winograd domain.",
        },
        {
          term: "Transform Matrix B_T",
          definition:
            "4x4 data transformation matrix mapping 4x4 spatial tiles into 4x4 Winograd domain.",
        },
      ],
    },
    trivia: WINOGRADF23TRANSFORMMATRICES_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_WINOGRADF23TRANSFORMMATRICES_INPUT,
    generateSteps: generateWinogradF23TransformMatricesSteps,
  };
