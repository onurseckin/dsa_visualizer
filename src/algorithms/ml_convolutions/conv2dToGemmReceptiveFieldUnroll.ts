import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface conv2dToGemmReceptiveFieldUnrollInput {
  image?: number[][];
  kernel_size?: [number, number];
  stride?: number;
  padding?: number;
  data?: number[];
  target?: number;
}

export const CONV2DTOGEMMRECEPTIVEFIELDUNROLL_CODE = `def conv2d_to_gemm_receptive_field_unroll(image, kernel_size, stride=1, padding=0):
    """
    Unrolls spatial KxK receptive field patches from a 2D image into 
    a 2D matrix (im2col matrix) where each row represents an unrolled patch.
    
    Returns:
      im2col_matrix: 2D array of shape (H_out * W_out, K_h * K_w)
      shape_info: dict with output dimensions
    """
    h_in, w_in = len(image), len(image[0])
    k_h, k_w = kernel_size

    # Apply padding
    padded = [[0] * (w_in + 2 * padding) for _ in range(h_in + 2 * padding)]
    for r in range(h_in):
        for c in range(w_in):
            padded[r + padding][c + padding] = image[r][c]

    h_out = (len(padded) - k_h) // stride + 1
    w_out = (len(padded[0]) - k_w) // stride + 1

    im2col_matrix = []
    for r in range(h_out):
        for c in range(w_out):
            patch = []
            for kr in range(k_h):
                for kc in range(k_w):
                    patch.append(padded[r * stride + kr][c * stride + kc])
            im2col_matrix.append(patch)

    return im2col_matrix, {"h_out": h_out, "w_out": w_out, "patch_dim": k_h * k_w}`;

export const DEFAULT_CONV2DTOGEMMRECEPTIVEFIELDUNROLL_INPUT: conv2dToGemmReceptiveFieldUnrollInput = {
  image: [
    [1, 2, 3, 0],
    [0, 1, 2, 3],
    [3, 0, 1, 2],
    [2, 3, 0, 1],
  ],
  kernel_size: [2, 2],
  stride: 1,
  padding: 0,
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateConv2dToGemmReceptiveFieldUnrollSteps = (
  input: conv2dToGemmReceptiveFieldUnrollInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const image = input.image || [
    [1, 2, 3, 0],
    [0, 1, 2, 3],
    [3, 0, 1, 2],
    [2, 3, 0, 1],
  ];

  const kernel_size = input.kernel_size || [2, 2];
  const stride = input.stride ?? 1;
  const padding = input.padding ?? 0;

  const hIn = image.length;
  const wIn = image[0].length;
  const [kH, kW] = kernel_size;

  const hPad = hIn + 2 * padding;
  const wPad = wIn + 2 * padding;

  const padded: number[][] = Array.from({ length: hPad }, () => Array(wPad).fill(0));
  for (let r = 0; r < hIn; r++) {
    for (let c = 0; c < wIn; c++) {
      padded[r + padding][c + padding] = image[r][c];
    }
  }

  const hOut = Math.floor((hPad - kH) / stride) + 1;
  const wOut = Math.floor((wPad - kW) / stride) + 1;
  const patchDim = kH * kW;

  const im2colMatrix: number[][] = [];

  const getSnapshot = (
    currentPatchIdx: number = -1,
  ): MatrixVisualSnapshot => {
    const rows = Math.max(im2colMatrix.length, 1);
    const cols = patchDim;
    const cells: MatrixCellItem[] = [];

    if (im2colMatrix.length === 0) {
      for (let c = 0; c < cols; c++) {
        cells.push({
          row: 0,
          col: c,
          value: 0,
          label: `Tap ${c}`,
          state: "default",
        });
      }
    } else {
      for (let r = 0; r < im2colMatrix.length; r++) {
        for (let c = 0; c < cols; c++) {
          const state = r === currentPatchIdx ? "active" : "visited";
          cells.push({
            row: r,
            col: c,
            value: im2colMatrix[r][c],
            label: `Patch ${r}`,
            state,
          });
        }
      }
    }

    return {
      kind: "matrix",
      rows,
      cols,
      title: `im2col Unrolled Patch Matrix (Shape: ${im2colMatrix.length} x ${patchDim})`,
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentPatchIdx: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(currentPatchIdx),
      auxiliaryState: {
        customState: {
          "Algorithm": "Conv2D Receptive Field Patch Unroller",
          "Input Spatial": `${hIn} x ${wIn}`,
          "Kernel Size": `${kH} x ${kW}`,
          "Unrolled Patches Count": String(im2colMatrix.length),
          "Patch Vector Dimension": String(patchDim),
        },
      },
      variables,
    });
  };

  // Step 1: Function entry
  addStep(
    1,
    "Conv2D Receptive Field Patch Unroller Entry",
    `Started spatial receptive field patch unrolling on ${hIn}x${wIn} image with ${kH}x${kW} kernel, stride=${stride}, padding=${padding}.`,
    { hIn, wIn, kH, kW, stride, padding },
  );

  // Step 2: Measure hIn, wIn
  addStep(
    10,
    "Measure Input Image Spatial Dimensions h_in, w_in",
    `Input spatial dimensions: h_in = ${hIn}, w_in = ${wIn}.`,
    { hIn, wIn },
  );

  // Step 3: Measure kH, kW
  addStep(
    11,
    "Extract Filter Kernel Dimensions k_h, k_w",
    `Convolution filter kernel dimensions: k_h = ${kH}, k_w = ${kW}.`,
    { kH, kW },
  );

  // Step 4: Apply zero padding
  addStep(
    14,
    "Allocate Padded Image Buffer",
    `Created ${hPad}x${wPad} zero-padded image matrix buffer.`,
    { hPad, wPad, padding },
  );

  // Step 5: Calculate h_out
  addStep(
    19,
    "Calculate Spatial Output Height h_out",
    `Computed spatial output height h_out = (${hPad} - ${kH}) // ${stride} + 1 = ${hOut}.`,
    { hOut, hPad, kH, stride },
  );

  // Step 6: Calculate w_out
  addStep(
    20,
    "Calculate Spatial Output Width w_out",
    `Computed spatial output width w_out = (${wPad} - ${kW}) // ${stride} + 1 = ${wOut}.`,
    { wOut, wPad, kW, stride },
  );

  // Step 7: Initialize im2col_matrix
  addStep(
    22,
    "Initialize Empty im2col Matrix List",
    `Created empty im2col matrix list to hold ${hOut * wOut} unrolled patch vectors of length ${patchDim}.`,
    { num_patches: hOut * wOut, patchDim },
  );

  // Spatial unrolling loops
  for (let r = 0; r < hOut; r++) {
    addStep(
      23,
      `Outer Spatial Row Loop: r = ${r}`,
      `Scanning spatial row r = ${r} of ${hOut - 1}.`,
      { r, hOut },
    );

    for (let c = 0; c < wOut; c++) {
      addStep(
        24,
        `Inner Spatial Col Loop: c = ${c}`,
        `Scanning spatial column c = ${c} of ${wOut - 1}.`,
        { r, c, wOut },
      );

      const patch: number[] = [];
      addStep(
        25,
        `Initialize Local Patch Vector Buffer`,
        `Created empty patch array for spatial anchor (${r}, ${c}).`,
        { r, c },
      );

      for (let kr = 0; kr < kH; kr++) {
        addStep(
          26,
          `Kernel Row Loop: kr = ${kr}`,
          `Scanning kernel row kr = ${kr} of ${kH - 1}.`,
          { r, c, kr },
        );

        for (let kc = 0; kc < kW; kc++) {
          const pr = r * stride + kr;
          const pc = c * stride + kc;
          const val = padded[pr][pc];
          patch.push(val);

          addStep(
            28,
            `Append Padded Pixel padded[${pr}][${pc}] = ${val} to Patch Vector`,
            `Loaded pixel ${val} from padded position (${pr}, ${pc}) into patch vector [${patch.join(", ")}].`,
            { r, c, kr, kc, pr, pc, val },
          );
        }
      }

      im2colMatrix.push(patch);
      addStep(
        29,
        `Append Complete Patch Vector ${im2colMatrix.length - 1} to im2col Matrix`,
        `Stored 1D patch vector [${patch.join(", ")}] into im2col matrix row ${im2colMatrix.length - 1}.`,
        { patchIdx: im2colMatrix.length - 1, patch: `[${patch.join(", ")}]` },
        im2colMatrix.length - 1,
      );
    }
  }

  // Final return step
  addStep(
    31,
    "Execution Complete",
    `Successfully unrolled spatial image into im2col matrix of shape (${im2colMatrix.length}, ${patchDim}).`,
    { completed: true, num_patches: im2colMatrix.length, patchDim, hOut, wOut },
    im2colMatrix.length - 1,
  );

  return steps;
};

const CONV2DTOGEMMRECEPTIVEFIELDUNROLL_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 8, 12, 13, 18, 21, 30],
  distractors: [
    "im2col_matrix.append(image[r][c])",
    "patch.append(padded[r + kr][c + kc])",
    "h_out = (h_in - k_h) // stride",
    "im2col_matrix = padded.reshape(-1)",
  ],
  hints: [
    {
      line: 28,
      hint: "Append padded pixel value at r * stride + kr and c * stride + kc to 1D patch vector.",
    },
    {
      line: 29,
      hint: "Append completed KxK 1D patch vector as a row in im2col matrix.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for Conv2D receptive field patch unroller function.",
    2: "Docstring opening delimiter tag.",
    3: "Describes unrolling spatial KxK receptive field patches from a 2D image into a 2D im2col matrix.",
    4: "Docstring continuation tag.",
    5: "Docstring return format header.",
    6: "Docstring return format detail for im2col_matrix of shape (H_out * W_out, K_h * K_w).",
    7: "Docstring return format detail for shape_info dict.",
    8: "Docstring closing delimiter tag.",
    9: "Blank line before shape extraction.",
    10: "Measures height h_in and width w_in of input image matrix.",
    11: "Unpacks kernel height k_h and width k_w from kernel_size tuple.",
    12: "Blank line before zero-padding section.",
    13: "Comment for zero-padding application.",
    14: "Allocates zero-padded image matrix of shape (h_in + 2*padding) x (w_in + 2*padding).",
    15: "Iterates over input image row index r from 0 to h_in - 1.",
    16: "Iterates over input image column index c from 0 to w_in - 1.",
    17: "Copies pixel image[r][c] into padded matrix with padding offset.",
    18: "Blank line before spatial output dimension calculation.",
    19: "Calculates spatial output height h_out using integer division floor.",
    20: "Calculates spatial output width w_out using integer division floor.",
    21: "Blank line before im2col matrix initialization.",
    22: "Initializes empty list im2col_matrix to accumulate unrolled 1D patch vectors.",
    23: "Iterates over output spatial row coordinate r from 0 to h_out - 1.",
    24: "Iterates over output spatial column coordinate c from 0 to w_out - 1.",
    25: "Initializes empty list patch for current spatial receptive field window.",
    26: "Iterates over filter kernel spatial row tap kr from 0 to k_h - 1.",
    27: "Iterates over filter kernel spatial column tap kc from 0 to k_w - 1.",
    28: "Appends padded pixel padded[r * stride + kr][c * stride + kc] to patch vector.",
    29: "Appends completed 1D patch vector to im2col_matrix list.",
    30: "Blank line separating unrolling loops from return statement.",
    31: "Returns unrolled im2col_matrix and shape metadata dictionary.",
  },
};

export const conv2dToGemmReceptiveFieldUnroll: AlgorithmDefinition<conv2dToGemmReceptiveFieldUnrollInput> =
  {
    id: "conv2dToGemmReceptiveFieldUnroll",
    title: "Conv2D Receptive Field Patch Unroller",
    category: "ml_convolutions",
    categories: ["ml_convolutions", "ml_gemm_roofline"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_convolutions",
    description:
      "The **Conv2D Receptive Field Patch Unroller** implements the core `im2col` (image-to-column) transformation. It unrolls every $K_h \\times K_w$ receptive field patch across a 2D spatial image activation matrix into a 2D matrix where each row (or column) represents a flattened 1D receptive field vector of length $K_h \\cdot K_w$.\n\n### Why It Exists\nConvolutions require sliding 2D filter windows across spatial activations. By unrolling every $K \\times K$ receptive field into a matrix row, convolution is transformed into matrix multiplication $Y_{col} = X_{col} \\cdot W_{col}^T$, allowing ML frameworks to execute convolutions using BLAS GEMM calls.\n\n### Mathematical Formulation\nGiven an input image $X \\in \\mathbb{R}^{H \\times W}$, kernel size $(K_h, K_w)$, stride $S$, and padding $P$:\n\n$$H_{out} = \\left\\lfloor \\frac{H + 2P - K_h}{S} \\right\\rfloor + 1, \\quad W_{out} = \\left\\lfloor \\frac{W + 2P - K_w}{S} \\right\\rfloor + 1$$\n\n$$N_{patches} = H_{out} \\cdot W_{out}, \\quad K_{dim} = K_h \\cdot K_w$$\n\n$$\\text{im2col\\_matrix}[i, \\, kr \\cdot K_w + kc] = X_{\\text{pad}}[r \\cdot S + kr, \\, c \\cdot S + kc] \\quad \\text{for } i = r \\cdot W_{out} + c$$\n\n$$\\text{im2col\\_matrix} \\in \\mathbb{R}^{(H_{out} W_{out}) \\times (K_h K_w)}$$\n\n### Step-by-Step Intuition\n1. **Zero-Padding**: Surround the input spatial grid with $P$ layers of zero-padding.\n2. **Patch Extraction**: Slide the $K_h \\times K_w$ window across output spatial coordinates $(r, c)$.\n3. **Vector Flattening**: Flatten all $K_h \\cdot K_w$ overlapping padded pixels into a single 1D row vector.\n4. **Matrix Stacking**: Stack all $H_{out} \\cdot W_{out}$ patch vectors into a 2D `im2col` matrix.\n\n### Key Trade-Offs & Hardware Execution\n- **Memory Multiplication**: Overlapping windows ($S < K$) duplicate pixel data in memory. `im2col` increases memory footprint by a factor of $K_h \\cdot K_w$.\n- **GEMM Lowering**: Enables BLAS library calls (`gemm`) on hardware accelerators (NVIDIA Tensor Cores, ARM NEON).",
    constraints: [
      "1 <= H_in, W_in <= 512",
      "1 <= K_h, K_w <= 11",
      "stride >= 1",
      "padding >= 0",
    ],
    examples: [
      {
        kind: "basic",
        title: "4x4 Image Unrolled with 2x2 Kernel",
        inputDisplay: "Image 4x4, Kernel 2x2, Stride 1",
        outputDisplay: "im2col matrix of shape 9x4",
        input: DEFAULT_CONV2DTOGEMMRECEPTIVEFIELDUNROLL_INPUT,
        output: "9x4 im2col matrix",
        explanation: "Extracts 9 spatial 2x2 patches, unrolling each patch into a 4-element row vector.",
      },
    ],
    code: CONV2DTOGEMMRECEPTIVEFIELDUNROLL_CODE,
    timeComplexity: {
      best: "O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
      average: "O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
      worst: "O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
    },
    spaceComplexity: "O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
    complexityAnalysis: {
      time: "Linear in the total number of unrolled patch elements $O(H_{out} W_{out} K_h K_w)$.",
      space: "Allocates memory for unrolled im2col matrix of size $O(H_{out} W_{out} K_h K_w)$.",
    },
    topicGuide: {
      overview:
        "The **Conv2D Receptive Field Patch Unroller** converts 2D spatial receptive fields into 2D `im2col` matrices for GEMM acceleration.",
      sections: [
        {
          heading: "1. Core Concept & im2col Matrix Unrolling",
          body: "`im2col` maps spatial sliding windows into 2D matrix rows: each 2D receptive field patch ($K_h \\times K_w$) is flattened into a 1D vector of length $K_h \\cdot K_w$, allowing 2D convolution to execute as BLAS matrix multiplication.",
        },
        {
          heading: "2. Systems & Memory Duplication",
          body: "When stride $S < K$, adjacent receptive fields share pixels. Unrolling duplicates shared pixels in DRAM memory, inflating memory usage by $K_h \\cdot K_w$ times. High-performance compilers (cuDNN) use implicit GEMM to compute `im2col` indices on-the-fly in SRAM registers.",
        },
        {
          heading: "3. Implementation Nuances & Data Alignment",
          body: "Memory layout alignment (row-major vs column-major) is critical to ensure contiguous SIMD vector loads during GEMM matrix multiplication.",
        },
        {
          heading: "4. Edge Case Analysis & Padding Handling",
          body: "Zero-padding boundaries are inserted prior to patch extraction to guarantee uniform vector length across edge tiles.",
        },
      ],
      keyTerms: [
        {
          term: "im2col",
          definition:
            "Image-to-column transformation converting spatial 2D sliding windows into matrix rows for GEMM lowering.",
        },
        {
          term: "Patch Vector",
          definition: "Flattened 1D representation of a K_h x K_w spatial receptive field.",
        },
        {
          term: "Memory Duplication Factor",
          definition: "Memory inflation ratio K_h * K_w resulting from unrolling overlapping spatial windows.",
        },
        {
          term: "GEMM Lowering",
          definition: "Executing convolution as matrix multiplication using high-performance BLAS libraries.",
        },
      ],
    },
    trivia: CONV2DTOGEMMRECEPTIVEFIELDUNROLL_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_CONV2DTOGEMMRECEPTIVEFIELDUNROLL_INPUT,
    generateSteps: generateConv2dToGemmReceptiveFieldUnrollSteps,
  };
