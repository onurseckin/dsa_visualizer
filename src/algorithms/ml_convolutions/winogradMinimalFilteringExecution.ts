import type { AlgorithmDefinition, AlgorithmStep, GridCellNode } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface winogradMinimalFilteringExecutionInput {
  image?: number[][];
  kernel?: number[][];
  padding?: number;
  data?: number[];
  target?: number;
}

export const WINOGRADMINIMALFILTERINGEXECUTION_CODE = `def winograd_minimal_filtering_execution(image, kernel_3x3, padding=0):
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

    return output`;

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

  const rawImage = input.image || [
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
  const output: number[][] = Array.from({ length: hOut }, () => Array(wOut).fill(0));

  const matmul = (M1: number[][], M2: number[][]): number[][] => {
    const r1 = M1.length;
    const c1 = M1[0].length;
    const c2 = M2[0].length;
    return Array.from({ length: r1 }, (_, i) =>
      Array.from({ length: c2 }, (_, j) => {
        let sum = 0;
        for (let k = 0; k < c1; k++) {
          sum += M1[i][k] * M2[k][j];
        }
        return sum;
      }),
    );
  };

  const BT = [
    [1, 0, -1, 0],
    [0, 1, 1, 0],
    [0, -1, 1, 0],
    [0, 1, 0, -1],
  ];
  const B = BT[0].map((_, colIndex) => BT.map((row) => row[colIndex]));

  const G = [
    [1, 0, 0],
    [0.5, 0.5, 0.5],
    [0.5, -0.5, 0.5],
    [0, 0, 1],
  ];
  const GT = G[0].map((_, colIndex) => G.map((row) => row[colIndex]));

  const AT = [
    [1, 1, 1, 0],
    [0, 1, -1, -1],
  ];
  const A = AT[0].map((_, colIndex) => AT.map((row) => row[colIndex]));

  const createGrid = (
    rTile: number = -1,
    cTile: number = -1,
  ): GridCellNode[][] => {
    return output.map((row, r) =>
      row.map((val, c) => {
        let state: "default" | "active" | "compare" | "visited" = "default";
        if (rTile >= 0 && cTile >= 0 && r >= rTile && r < rTile + 2 && c >= cTile && c < cTile + 2) {
          state = "active";
        } else if (val !== 0) {
          state = "visited";
        }
        return {
          row: r,
          col: c,
          state,
          distance: val,
        };
      }),
    );
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    rTile: number = -1,
    cTile: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "grid",
        grid: createGrid(rTile, cTile),
      },
      auxiliaryState: {
        customState: {
          "Algorithm": "Winograd F(2x2, 3x3)",
          "Padded Input Shape": `${hIn} x ${wIn}`,
          "Output Spatial Shape": `${hOut} x ${wOut}`,
          "Tile Stride": "2 (spatial)",
          "Output Grid": `[${output.map((r) => `[${r.map((v) => v.toFixed(1)).join(", ")}]`).join(", ")}]`,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Winograd F(2x2, 3x3) Minimal Filtering Execution Engine Entry",
    `Started end-to-end Winograd F(2x2, 3x3) execution engine on ${hIn}x${wIn} image with 3x3 kernel and padding P=${padding}.`,
    { hIn, wIn, padding },
  );

  addStep(
    8,
    "Measure Input Image Spatial Dimensions",
    `Input spatial dimensions: h_in = ${hIn}, w_in = ${wIn}.`,
    { hIn, wIn },
  );

  addStep(
    19,
    "Calculate Spatial Output Height h_out",
    `Output spatial height h_out = ${hIn} - 2 = ${hOut}.`,
    { hOut, hIn },
  );

  addStep(
    20,
    "Calculate Spatial Output Width w_out",
    `Output spatial width w_out = ${wIn} - 2 = ${wOut}.`,
    { wOut, wIn },
  );

  addStep(
    21,
    "Allocate Output Feature Map Buffer",
    `Allocated ${hOut}x${wOut} output feature map matrix initialized to 0.0.`,
    { hOut, wOut },
  );

  addStep(
    23,
    "Construct Data Transform Matrix B_T (4x4)",
    `Loaded 4x4 data transform matrix B_T for Winograd F(2x2, 3x3).`,
    { B_T_rows: 4, B_T_cols: 4 },
  );

  addStep(
    25,
    "Construct Filter Transform Matrix G (4x3)",
    `Loaded 4x3 filter transform matrix G for Winograd F(2x2, 3x3).`,
    { G_rows: 4, G_cols: 3 },
  );

  addStep(
    27,
    "Construct Inverse Output Transform Matrix A_T (2x4)",
    `Loaded 2x4 output transform matrix A_T for Winograd F(2x2, 3x3).`,
    { A_T_rows: 2, A_T_cols: 4 },
  );

  const U = matmul(matmul(G, kernel), GT);
  addStep(
    36,
    "Pre-Transform Filter Kernel: Compute U = G @ g @ G_T (4x4)",
    `Completed offline 3x3 filter pre-transformation into 4x4 Winograd domain tensor U.`,
    { U_rows: 4, U_cols: 4 },
  );

  for (let rTile = 0; rTile < hOut; rTile += 2) {
    addStep(
      39,
      `Outer Tile Row Loop: r_tile = ${rTile}`,
      `Processing Winograd 4x4 spatial tile row at r_tile = ${rTile} of ${hOut - 1}.`,
      { rTile, hOut },
    );

    for (let cTile = 0; cTile < wOut; cTile += 2) {
      addStep(
        40,
        `Inner Tile Column Loop: c_tile = ${cTile}`,
        `Processing Winograd 4x4 spatial tile column at c_tile = ${cTile} of ${wOut - 1}.`,
        { rTile, cTile, wOut },
      );

      const tile: number[][] = Array.from({ length: 4 }, () => Array(4).fill(0));
      addStep(
        41,
        `Allocate 4x4 Local Tile Buffer`,
        `Allocated 4x4 local tile matrix for spatial position (${rTile}, ${cTile}).`,
        { rTile, cTile },
      );

      for (let tr = 0; tr < 4; tr++) {
        for (let tc = 0; tc < 4; tc++) {
          const ir = rTile + tr;
          const ic = cTile + tc;
          if (ir < hIn && ic < wIn) {
            tile[tr][tc] = image[ir][ic];
          }
        }
      }

      addStep(
        47,
        `Extract 4x4 Spatial Input Tile d`,
        `Extracted 4x4 image tile d anchored at spatial coordinates (${rTile}, ${cTile}).`,
        { rTile, cTile, d_00: tile[0][0], d_33: tile[3][3] },
        rTile,
        cTile,
      );

      const V = matmul(matmul(BT, tile), B);
      addStep(
        49,
        `Winograd Data Transform: Compute V = B_T @ d @ B (4x4)`,
        `Transformed 4x4 input data tile d into 4x4 Winograd domain tensor V.`,
        { rTile, cTile, V_00: V[0][0] },
        rTile,
        cTile,
      );

      const M: number[][] = Array.from({ length: 4 }, (_, i) =>
        Array.from({ length: 4 }, (_, j) => U[i][j] * V[i][j]),
      );

      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          addStep(
            50,
            `Domain Multiplication Cell M[${i}][${j}] = U[${i}][${j}] * V[${i}][${j}] = ${M[i][j].toFixed(2)}`,
            `Multiplied transformed filter cell U[${i}][${j}] by data cell V[${i}][${j}] -> ${M[i][j].toFixed(2)}.`,
            { i, j, "U[i][j]": U[i][j], "V[i][j]": V[i][j], "M[i][j]": M[i][j] },
            rTile,
            cTile,
          );
        }
      }

      const Y = matmul(matmul(AT, M), A);
      addStep(
        51,
        `Output Inverse Spatial Transform: Compute Y = A_T @ M @ A (2x2)`,
        `Transformed 4x4 domain matrix M back to 2x2 spatial output activation patch Y.`,
        { rTile, cTile, Y_00: Y[0][0], Y_01: Y[0][1], Y_10: Y[1][0], Y_11: Y[1][1] },
        rTile,
        cTile,
      );

      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          if (rTile + dy < hOut && cTile + dx < wOut) {
            output[rTile + dy][cTile + dx] = Y[dy][dx];
            addStep(
              56,
              `Stitch 2x2 Output Tile: output[${rTile + dy}][${cTile + dx}] = ${Y[dy][dx].toFixed(1)}`,
              `Wrote Winograd 2x2 output activation patch cell into output feature map at (${rTile + dy}, ${cTile + dx}).`,
              { rTile, cTile, dy, dx, "output[r+dy][c+dx]": Y[dy][dx] },
              rTile,
              cTile,
            );
          }
        }
      }
    }
  }

  addStep(
    58,
    "Execution Complete",
    `Successfully completed end-to-end Winograd F(2x2, 3x3) minimal filtering execution. Output spatial shape ${hOut}x${wOut}.`,
    { completed: true, hOut, wOut },
  );

  return steps;
};

const WINOGRADMINIMALFILTERINGEXECUTION_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 22, 24, 26, 28, 29, 30, 31, 32, 33, 34, 35, 37, 38, 42, 43, 44, 45, 46, 48, 52, 53, 54, 55, 57],
  distractors: [
    "output[r_tile][c_tile] = Y",
    "U = matmul(G, kernel_3x3)",
    "for r_tile in range(0, h_out, 1):",
    "V = matmul(B, tile)",
  ],
  hints: [
    {
      line: 36,
      hint: "Filter pre-transformation equation: U = G @ kernel_3x3 @ G_T.",
    },
    {
      line: 39,
      hint: "Winograd 4x4 spatial tiles advance by stride 2 across output coordinates.",
    },
    {
      line: 51,
      hint: "Inverse spatial transform equation: Y = A_T @ M @ A.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for end-to-end Winograd F(2x2, 3x3) minimal filtering execution engine function.",
    2: "Docstring opening delimiter tag.",
    3: "Describes end-to-end Winograd F(2x2, 3x3) minimal filtering spatial tiling execution.",
    4: "Docstring continuation detailing 4x4 spatial tiling and Winograd domain transforms.",
    5: "Docstring continuation listing transform equations U = G g G_T, V = B_T d B, M = U (*) V, Y = A_T M A.",
    6: "Docstring continuation detailing output 2x2 tile stitching.",
    7: "Docstring closing delimiter tag.",
    8: "Measures height h_in and width w_in of input image matrix.",
    9: "Blank line before zero-padding check.",
    10: "Checks if boundary zero-padding padding > 0 is requested.",
    11: "Allocates padded matrix of shape (h_in + 2*padding) x (w_in + 2*padding).",
    12: "Iterates over input image row index r from 0 to h_in - 1.",
    13: "Iterates over input image column index c from 0 to w_in - 1.",
    14: "Copies input image pixel float to padded matrix with padding offset.",
    15: "Replaces image reference with padded matrix.",
    16: "Updates h_in to include total padded height.",
    17: "Updates w_in to include total padded width.",
    18: "Blank line before output shape calculation.",
    19: "Calculates spatial output height h_out = h_in - 2.",
    20: "Calculates spatial output width w_out = w_in - 2.",
    21: "Allocates output feature map matrix of shape h_out x w_out filled with zero floats.",
    22: "Blank line before transform matrix definitions.",
    23: "Constructs 4x4 data transform transposed matrix B_T.",
    24: "Transposes B_T to form 4x4 data transform matrix B.",
    25: "Constructs 4x3 filter transform matrix G.",
    26: "Transposes G to form 3x4 filter transform transposed matrix G_T.",
    27: "Constructs 2x4 inverse transform transposed matrix A_T.",
    28: "Transposes A_T to form 4x2 inverse transform matrix A.",
    29: "Blank line before matmul helper function.",
    30: "Defines helper function matmul for 2D matrix multiplication.",
    31: "Extracts row and column dimensions for M1 and M2.",
    32: "Computes matrix multiplication dot products.",
    33: "Returns matrix multiplication result.",
    34: "Blank line before filter pre-transformation.",
    35: "Comment for pre-transforming 3x3 filter to 4x4 Winograd domain.",
    36: "Computes transformed 4x4 filter matrix U = G @ kernel_3x3 @ G_T.",
    37: "Blank line before tile processing loop.",
    38: "Comment for processing 4x4 tiles with spatial stride 2.",
    39: "Iterates over tile row coordinate r_tile from 0 to h_out - 1 with step 2.",
    40: "Iterates over tile column coordinate c_tile from 0 to w_out - 1 with step 2.",
    41: "Allocates 4x4 local tile matrix initialized to 0.0.",
    42: "Iterates over tile row index tr from 0 to 3.",
    43: "Iterates over tile column index tc from 0 to 3.",
    44: "Calculates image row index ir = r_tile + tr.",
    45: "Calculates image column index ic = c_tile + tc.",
    46: "Checks if image coordinate (ir, ic) lies within valid image bounds.",
    47: "Copies image pixel image[ir][ic] into tile[tr][tc].",
    48: "Blank line before Winograd domain transforms.",
    49: "Computes transformed 4x4 data matrix V = B_T @ tile @ B.",
    50: "Computes 4x4 Hadamard elementwise product matrix M = U (*) V.",
    51: "Computes 2x2 output spatial patch matrix Y = A_T @ M @ A.",
    52: "Blank line before tile stitching loop.",
    53: "Iterates over 2x2 output patch row index dy from 0 to 1.",
    54: "Iterates over 2x2 output patch column index dx from 0 to 1.",
    55: "Checks if output coordinate (r_tile + dy, c_tile + dx) lies within output map bounds.",
    56: "Stitches 2x2 output patch value Y[dy][dx] into output map at (r_tile + dy, c_tile + dx).",
    57: "Blank line separating tile loop from return statement.",
    58: "Returns final 2D feature map matrix output.",
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
      "End-to-End Winograd F(2x2, 3x3) Minimal Filtering Execution Engine tiles input image matrices into $4 \\times 4$ overlapping spatial patches (strided by 2), applies Winograd domain transformations $U = G g G^T, V = B^T d B, M = U \\odot V, Y = A^T M A$, and stitches the resulting $2 \\times 2$ output patches into a full spatial output feature map. This achieves a **2.25x reduction in total scalar floating-point multiplications** across entire image convolutions.\n\n### Why It Exists\nStandard 2D convolution evaluates $K_h \\cdot K_w = 9$ multiplications for every single output pixel. For a $H \\times W$ image, direct convolution performs $9 H W$ scalar multiplications. Winograd F(2, 3) tiles the image into $2 \\times 2$ output blocks, spending only 16 multiplications per $2 \\times 2$ block ($4 \\text{ mults/pixel}$ instead of 9), delivering dramatic speedups in production deep learning libraries (cuDNN, ARM Compute Library).\n\n### Mathematical Formulation\nGiven an input image $X \\in \\mathbb{R}^{H_{in} \\times W_{in}}$ and 3x3 filter $g$, the spatial output $Y \\in \\mathbb{R}^{H_{out} \\times W_{out}}$ (where $H_{out} = H_{in} - 2, W_{out} = W_{in} - 2$) is computed by tiling $X$ with stride 2:\n\n$$d^{(r, c)} = X[r:r+4, \\, c:c+4] \\quad \\text{for } r \\in [0, H_{out}-1, 2], \\, c \\in [0, W_{out}-1, 2]$$\n\n$$V^{(r, c)} = B^T \\, d^{(r, c)} \\, B \\quad (4 \\times 4 \\text{ Transformed Data Tile})$$\n\n$$M^{(r, c)} = U \\odot V^{(r, c)} \\quad (4 \\times 4 \\text{ Elementwise Product})$$\n\n$$Y^{(r, c)} = A^T \\, M^{(r, c)} \\, A \\quad (2 \\times 2 \\text{ Spatial Output Patch})$$\n\n$$Y_{out}[r + dy, \\, c + dx] = Y^{(r, c)}[dy, dx] \\quad \\text{for } dy, dx \\in \\{0, 1\\}$$\n\n### Step-by-Step Intuition\n1. **Offline Filter Pre-Transform**: Compute $U = G g G^T$ once before image inference ($4 \\times 4$ filter matrix).\n2. **Tiling Loop**: Advance spatial anchor $(r, c)$ across the image with stride $S=2$.\n3. **Patch Extraction**: Extract overlapping $4 \\times 4$ data tile $d^{(r,c)}$.\n4. **Domain Transforms**: Compute data transform $V = B^T d B$ and Hadamard multiplication $M = U \\odot V$.\n5. **Inverse Transformation**: Compute $2 \\times 2$ output patch $Y = A^T M A$.\n6. **Tile Stitching**: Copy $Y$ into spatial output feature map coordinates $Y_{out}[r:r+2, c:c+2]$.\n\n### Key Trade-Offs & Hardware Execution\n- **Spatial Stride vs Tile Overlap**: Winograd tiles overlap by $K - 1 = 2$ spatial pixels. The output stride is $m = 2$, so adjacent tiles share half their input pixels.\n- **Channel-Wise Winograd GEMM**: In multi-channel networks ($C_{in}, C_out$), Winograd transforms $U$ and $V$ are combined with GEMM across channels, achieving maximum GPU memory bandwidth and compute utilization.",
    constraints: [
      "1 <= H_in, W_in <= 512",
      "Kernel size must be 3x3",
      "Padding >= 0",
    ],
    examples: [
      {
        kind: "basic",
        title: "4x4 Image Convolved with 3x3 Kernel",
        inputDisplay: "Image 4x4, Kernel 3x3",
        outputDisplay: "Output 2x2 feature map matrix",
        input: DEFAULT_WINOGRADMINIMALFILTERINGEXECUTION_INPUT,
        output: "2x2 spatial feature map",
        explanation: "Tiles 4x4 image into single Winograd tile, producing 2x2 output.",
      },
    ],
    code: WINOGRADMINIMALFILTERINGEXECUTION_CODE,
    timeComplexity: {
      best: "O(H_{out} \\cdot W_{out})",
      average: "O(H_{out} \\cdot W_{out})",
      worst: "O(H_{out} \\cdot W_{out})",
    },
    spaceComplexity: "O(H_{out} \\cdot W_{out})",
    complexityAnalysis: {
      time: "Requires $4 \\cdot H_{out} \\cdot W_{out}$ scalar multiplications (16 per 2x2 tile), achieving a 2.25x FLOP reduction over direct $9 \\cdot H_{out} \\cdot W_{out}$ convolution.",
      space: "Requires $O(H_{out} \\cdot W_{out})$ memory for spatial output feature map storage.",
    },
    topicGuide: {
      overview:
        "The **Winograd F(2x2, 3x3) Execution Engine** processes full 2D spatial images by tiling, Winograd domain transformations, and output patch stitching.",
      sections: [
        {
          heading: "1. Core Concept & Full-Image Tiling",
          body: "Winograd F(m, r) algorithms process images by tiling them into ($m + r - 1) \\times (m + r - 1)$ overlapping patches with stride $m$. For $F(2, 3)$, $4 \\times 4$ input tiles are processed with spatial stride 2 to produce non-overlapping $2 \\times 2$ output tiles.",
        },
        {
          heading: "2. Systems & Compute Efficiency",
          body: "In cuDNN and NCNN execution graphs, image tiling and Winograd domain transforms are fused with 2D GEMM across channels. Batched Winograd transforms achieve near 100% Tensor Core utilization on NVIDIA GPUs.",
        },
        {
          heading: "3. Implementation Nuances & Boundary Padding",
          body: "When image dimensions are not multiples of 2, edge tiles are padded to $4 \\times 4$ with zeros. Inverse spatial transform $A_T \\cdot M \\cdot A$ truncates any out-of-bounds padded elements.",
        },
        {
          heading: "4. Edge Case Analysis & Production Safeguards",
          body: "Handling arbitrary spatial padding $P > 0$ requires prepending zero borders prior to tile extraction. Pre-transformed filter matrices $U$ are cached across inference iterations.",
        },
      ],
      keyTerms: [
        {
          term: "Winograd Tiling",
          definition:
            "Decomposing 2D spatial activation maps into overlapping (m+r-1) x (m+r-1) tiles with stride m.",
        },
        {
          term: "Tile Stitching",
          definition:
            "Assembling 2x2 inverse-transformed output patches into a continuous spatial feature map tensor.",
        },
        {
          term: "Overlapping Receptive Field",
          definition: "Spatial region shared between adjacent Winograd tiles (K-1 = 2 pixels).",
        },
        {
          term: "Offline Filter Caching",
          definition:
            "Reusing pre-transformed Winograd filter weights U across multiple image inference requests.",
        },
      ],
    },
    trivia: WINOGRADMINIMALFILTERINGEXECUTION_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_WINOGRADMINIMALFILTERINGEXECUTION_INPUT,
    generateSteps: generateWinogradMinimalFilteringExecutionSteps,
  };
