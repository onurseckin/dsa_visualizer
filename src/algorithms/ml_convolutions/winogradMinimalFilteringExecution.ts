import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface winogradMinimalFilteringExecutionInput {
  image: number[][];
  kernel: number[][];
  padding?: number;
}

export const WINOGRADMINIMALFILTERINGEXECUTION_CODE = `
def winograd_minimal_filtering_execution(image, kernel_3x3, padding=0):
    """
    End-to-End Winograd F(2x2, 3x3) Minimal Filtering Execution Engine.
    Tiles input image into 4x4 overlapping spatial tiles (stride 2), applies Winograd
    transformations U = G @ g @ G_T, V = B_T @ d @ B, M = U (*) V, Y = A_T @ M @ A,
    and stitches output 2x2 tiles into the final feature map.
    """
    h_in, w_in = len(image), len(image[0])

    if padding > 0:
        padded = [[0.0] * (w_in + 2 * padding) for _ in range(h_in + 2 * padding)]
        for r in range(h_in):
            for c in range(w_in):
                padded[r + padding][c + padding] = float(image[r][c])
        image = padded
        h_in += 2 * padding
        w_in += 2 * padding

    h_out = h_in - 2
    w_out = w_in - 2
    output = [[0.0] * w_out for _ in range(h_out)]

    BT = [[1, 0, -1, 0], [0, 1, 1, 0], [0, -1, 1, 0], [0, 1, 0, -1]]
    B = [list(x) for x in zip(*BT)]
    G = [[1, 0, 0], [0.5, 0.5, 0.5], [0.5, -0.5, 0.5], [0, 0, 1]]
    GT = [list(x) for x in zip(*G)]
    AT = [[1, 1, 1, 0], [0, 1, -1, -1]]
    A = [list(x) for x in zip(*AT)]

    def matmul(M1, M2):
        r1, c1 = len(M1), len(M1[0])
        c2 = len(M2[0])
        return [[sum(M1[i][k] * M2[k][j] for k in range(c1)) for j in range(c2)] for i in range(r1)]

    # Pre-transform 3x3 filter to 4x4 Winograd domain
    U = matmul(matmul(G, kernel_3x3), GT)

    # Process 4x4 tiles with spatial stride 2
    for r_tile in range(0, h_out, 2):
        for c_tile in range(0, w_out, 2):
            tile = [[0.0] * 4 for _ in range(4)]
            for tr in range(4):
                for tc in range(4):
                    ir = r_tile + tr
                    ic = c_tile + tc
                    if ir < h_in and ic < w_in:
                        tile[tr][tc] = image[ir][ic]

            V = matmul(matmul(BT, tile), B)
            M = [[U[i][j] * V[i][j] for j in range(4)] for i in range(4)]
            Y = matmul(matmul(AT, M), A)

            for dy in range(2):
                for dx in range(2):
                    if r_tile + dy < h_out and c_tile + dx < w_out:
                        output[r_tile + dy][c_tile + dx] = Y[dy][dx]

    return output
`;

export const DEFAULT_WINOGRADMINIMALFILTERINGEXECUTION_INPUT: winogradMinimalFilteringExecutionInput =
  {
    image: [
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
    padding: 0,
  };

export const generateWinogradMinimalFilteringExecutionSteps = (
  input: winogradMinimalFilteringExecutionInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawImage = input.image;
  const kernel = input.kernel;
  const padding = input.padding ?? 0;

  let hIn = rawImage.length;
  let wIn = rawImage[0].length;

  let image = rawImage;
  if (padding > 0) {
    const padded: number[][] = Array.from({ length: hIn + 2 * padding }, () =>
      Array(wIn + 2 * padding).fill(0),
    );
    for (let r = 0; r < hIn; r++) {
      for (let c = 0; c < wIn; c++) {
        padded[r + padding][c + padding] = rawImage[r][c];
      }
    }
    image = padded;
    hIn += 2 * padding;
    wIn += 2 * padding;
  }

  const hOut = hIn - 2;
  const wOut = wIn - 2;

  const flatInput = image.flatMap((r) => r);
  const elements: ArrayElement[] = flatInput.map((val, idx) => ({
    id: `img-${idx}`,
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
          imageShape: `${hIn}x${wIn}`,
          outputShape: `${hOut}x${wOut}`,
          kernelShape: "3x3",
          padding: String(padding),
          ...customState,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Winograd F(2x2, 3x3) Minimal Filtering Execution Engine",
    "Pre-calculating domain matrices and tiling image into overlapping 4x4 spatial patches with stride 2.",
    { hIn, wIn, hOut, wOut, padding },
  );

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
    [1, 0, -1, 0],
    [0, 1, 1, 0],
    [0, -1, 1, 0],
    [0, 1, 0, -1],
  ];
  const B = BT[0].map((_, colIdx) => BT.map((row) => row[colIdx]));
  const G = [
    [1, 0, 0],
    [0.5, 0.5, 0.5],
    [0.5, -0.5, 0.5],
    [0, 0, 1],
  ];
  const GT = G[0].map((_, colIdx) => G.map((row) => row[colIdx]));
  const AT = [
    [1, 1, 1, 0],
    [0, 1, -1, -1],
  ];
  const A = AT[0].map((_, colIdx) => AT.map((row) => row[colIdx]));

  const U = matmul(matmul(G, kernel), GT);

  addStep(
    32,
    "Pre-transform 3x3 Filter Kernel U = G @ g @ G_T",
    "Converted 3x3 filter weights into offline Winograd domain matrix U.",
    { uRows: 4, uCols: 4 },
  );

  const output: number[][] = Array.from({ length: hOut }, () => Array(wOut).fill(0));

  for (let rTile = 0; rTile < hOut; rTile += 2) {
    for (let cTile = 0; cTile < wOut; cTile += 2) {
      const tile: number[][] = Array.from({ length: 4 }, () => Array(4).fill(0));
      for (let tr = 0; tr < 4; tr++) {
        for (let tc = 0; tc < 4; tc++) {
          const ir = rTile + tr;
          const ic = cTile + tc;
          if (ir < hIn && ic < wIn) {
            tile[tr][tc] = image[ir][ic];
          }
        }
      }

      const V = matmul(matmul(BT, tile), B);
      const M: number[][] = Array.from({ length: 4 }, () => Array(4).fill(0));
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          M[i][j] = U[i][j] * V[i][j];
        }
      }
      const Y = matmul(matmul(AT, M), A);

      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          if (rTile + dy < hOut && cTile + dx < wOut) {
            output[rTile + dy][cTile + dx] = Y[dy][dx];
          }
        }
      }

      addStep(
        42,
        `Process 4x4 Winograd Tile at origin (${rTile}, ${cTile}) -> Write 2x2 Output Tile`,
        `Computed Winograd transforms V, M, Y and wrote 2x2 output tile to destination positions.`,
        { rTile, cTile },
        { currentTile: `Tile origin (${rTile}, ${cTile})` },
      );
    }
  }

  addStep(
    54,
    "Execution Complete",
    `Successfully processed full image feature map using minimal Winograd F(2x2, 3x3) filtering engine.`,
    { completed: true },
  );

  return steps;
};

const WINOGRADMINIMALFILTERINGEXECUTION_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "output[r_tile][c_tile] = sum(tile)",
    "r_tile += 1",
    "if padding != 0: raise Exception()",
  ],
  hints: [
    {
      line: 32,
      hint: "Filter pre-transformation U is computed once offline before scanning image tiles.",
    },
    {
      line: 42,
      hint: "Winograd tiles advance with stride 2 because each F(2x2, 3x3) evaluation produces a 2x2 spatial patch.",
    },
  ],
  lineExplanations: {
    1: "Entry point for Winograd F(2x2, 3x3) minimal filtering execution engine.",
    32: "Offline filter transformation step.",
    42: "Tile extraction, Winograd domain computation, and 2x2 output stitching loop.",
    54: "Returns completed output feature map matrix.",
  },
};

export const winogradMinimalFilteringExecution: AlgorithmDefinition<winogradMinimalFilteringExecutionInput> =
  {
    id: "winogradMinimalFilteringExecution",
    title: "Winograd F(2x2, 3x3) Execution Engine",
    category: "ml_convolutions",
    categories: ["ml_convolutions", "ml_gemm_roofline"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_convolutions",
    description:
      "Winograd Minimal Filtering Execution Engine provides a complete end-to-end execution pipeline for fast 2D convolution over full image feature maps. By segmenting the input image into 4x4 overlapping tiles with spatial stride 2, the engine applies Winograd F(2x2, 3x3) domain transformations (U = G @ g @ G_T, V = B_T @ d @ B, M = U (*) V, Y = A_T @ M @ A) per tile and reconstructs the output feature map. Pre-transforming filters offline and computing tile transforms online yields a 2.25x FLOP reduction for 3x3 convolutions, making it the preferred algorithm for small-kernel CNN inference in production libraries (cuDNN, TensorRT, MNN).\n\nInput Format:\n- image: 2D array of spatial image pixel activations.\n- kernel: 3x3 2D array representing filter weights.\n- padding: Zero-padding width applied to image borders.\n\nOutput Format:\n- Returns a 2D feature map matrix of shape (H_out, W_out).\n\nEdge Cases & Constraints:\n- Boundary tiling: Tiles extending beyond image boundaries are zero-padded.\n- Tile stride: Spatial tile stride is fixed to 2 for F(2x2, 3x3) to match output tile size.\n- Kernel size restriction: Designed specifically for 3x3 convolution kernels.",
    constraints: ["1 <= H_in, W_in <= 1024", "kernel shape must be 3x3", "padding >= 0"],
    examples: [
      {
        kind: "basic",
        title: "4x4 Image with 3x3 Kernel",
        inputDisplay: "image: 4x4, kernel: 3x3, padding: 0",
        outputDisplay: "Output: 2x2",
        input: DEFAULT_WINOGRADMINIMALFILTERINGEXECUTION_INPUT,
        output: "Feature Map 2x2",
        explanation:
          "Processes 4x4 image tile with 3x3 filter using Winograd F(2x2, 3x3) engine to yield 2x2 output.",
      },
    ],
    code: WINOGRADMINIMALFILTERINGEXECUTION_CODE,
    timeComplexity: {
      best: "O(H_out * W_out)",
      average: "O(H_out * W_out)",
      worst: "O(H_out * W_out)",
    },
    spaceComplexity: "O(H_out * W_out)",
    complexityAnalysis: {
      time: "Requires 16 multiplications per 2x2 output tile (4 multiplications per output pixel vs 9 for direct conv).",
      space: "Allocates output feature map matrix H_out * W_out.",
    },
    topicGuide: {
      overview:
        "Winograd Minimal Filtering Execution Engine tiles large images to execute fast F(2x2, 3x3) Winograd convolutions across full feature maps.",
      sections: [
        {
          heading: "Overview",
          body: "Executing fast convolution across large feature maps requires tiling the input into overlapping spatial sub-grids. Winograd F(2x2, 3x3) steps across the image with tile stride 2, processing each 4x4 patch into a 2x2 output tile.",
        },
        {
          heading: "Core Concepts",
          body: "1. Image Tiling: Extracts 4x4 overlapping tiles d with stride 2.\n2. Filter Pre-transform: Pre-calculates U = G @ g @ G_T once per layer.\n3. Tile Transform & Multiplication: Calculates V = B_T @ d @ B, M = U (*) V, Y = A_T @ M @ A.\n4. Feature Map Stitching: Writes 2x2 output tile Y into final feature map tensor.",
        },
        {
          heading: "Systems & Performance Impact",
          body: "Winograd execution transforms spatial convolutions into batched GEMM operations in the transform domain. In GPU implementations, multiple 4x4 tiles across batch and channel dimensions are grouped into unified cuBLAS GEMMs.",
        },
        {
          heading: "Implementation Nuances",
          body: "Memory layout order for tile extraction must align with GPU SIMD thread warps to maintain coalesced DRAM reads.",
        },
        {
          heading: "Edge Cases",
          body: "Image spatial dimensions not evenly divisible by 2, padded image boundaries, and high dynamic range precision loss in deep networks.",
        },
      ],
      keyTerms: [
        {
          term: "Winograd Execution Engine",
          definition:
            "End-to-end framework executing fast Winograd convolution across tiled image feature maps.",
        },
        {
          term: "Tile Stride",
          definition:
            "Spatial step size (stride 2 for F(2x2,3x3)) between adjacent 4x4 input tiles.",
        },
        {
          term: "Filter Pre-transformation",
          definition: "Offline pre-computation of filter matrix U before processing image tiles.",
        },
        {
          term: "Feature Map Reconstruction",
          definition: "Assembling individual 2x2 output tiles into a unified output matrix.",
        },
      ],
    },
    trivia: WINOGRADMINIMALFILTERINGEXECUTION_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_WINOGRADMINIMALFILTERINGEXECUTION_INPUT,
    generateSteps: generateWinogradMinimalFilteringExecutionSteps,
  };
