import type { AlgorithmDefinition, AlgorithmStep, GridCellNode, MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface Conv2dInput {
  image?: number[][]; // H x W
  kernel?: number[][]; // K x K
  stride?: number;
  padding?: number;
  data?: number[];
  target?: number;
}

export const CONV2DSLIDINGWINDOWDIRECT_CODE = `def conv2d_sliding_window_direct(image, kernel, stride=1, padding=0):
    """
    Executes 2D direct sliding window convolution (cross-correlation)
    on a 2D image matrix using a 2D filter kernel.
    """
    h_in, w_in = len(image), len(image[0])
    k_h, k_w = len(kernel), len(kernel[0])

    # Apply zero padding to spatial boundaries
    padded = [[0] * (w_in + 2 * padding) for _ in range(h_in + 2 * padding)]
    for r in range(h_in):
        for c in range(w_in):
            padded[r + padding][c + padding] = image[r][c]

    h_out = (len(padded) - k_h) // stride + 1
    w_out = (len(padded[0]) - k_w) // stride + 1

    output = [[0.0] * w_out for _ in range(h_out)]

    for r in range(h_out):
        for c in range(w_out):
            acc_sum = 0.0
            for kr in range(k_h):
                for kc in range(k_w):
                    acc_sum += padded[r * stride + kr][c * stride + kc] * kernel[kr][kc]
            output[r][c] = acc_sum

    return output`;

export const DEFAULT_CONV2DSLIDINGWINDOWDIRECT_INPUT: Conv2dInput = {
  image: [
    [1, 2, 3, 0],
    [0, 1, 2, 3],
    [3, 0, 1, 2],
    [2, 3, 0, 1],
  ],
  kernel: [
    [2, 0],
    [0, -1],
  ],
  stride: 1,
  padding: 0,
};

export const generateConv2dSlidingWindowDirectSteps = (input: Conv2dInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const image = input.image || [
    [1, 2, 3, 0],
    [0, 1, 2, 3],
    [3, 0, 1, 2],
    [2, 3, 0, 1],
  ];
  const kernel = input.kernel || [
    [2, 0],
    [0, -1],
  ];
  const stride = input.stride ?? 1;
  const padding = input.padding ?? 0;

  const h_in = image.length;
  const w_in = image[0].length;
  const k_h = kernel.length;
  const k_w = kernel[0].length;

  const h_pad = h_in + 2 * padding;
  const w_pad = w_in + 2 * padding;

  const padded: number[][] = Array.from({ length: h_pad }, () => Array(w_pad).fill(0));
  for (let r = 0; r < h_in; r++) {
    for (let c = 0; c < w_in; c++) {
      padded[r + padding][c + padding] = image[r][c];
    }
  }

  const h_out = Math.floor((h_pad - k_h) / stride) + 1;
  const w_out = Math.floor((w_pad - k_w) / stride) + 1;

  const output: number[][] = Array.from({ length: h_out }, () => Array(w_out).fill(0));

  const createGrid = (
    windowR: number = -1,
    windowC: number = -1,
    activeKr: number = -1,
    activeKc: number = -1,
  ): GridCellNode[][] => {
    return padded.map((row, r) =>
      row.map((val, c) => {
        let state: "default" | "active" | "compare" | "visited" = "default";
        if (windowR >= 0 && windowC >= 0) {
          if (r >= windowR && r < windowR + k_h && c >= windowC && c < windowC + k_w) {
            if (activeKr >= 0 && activeKc >= 0 && r === windowR + activeKr && c === windowC + activeKc) {
              state = "active";
            } else {
              state = "compare";
            }
          } else {
            state = "visited";
          }
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
    windowR: number = -1,
    windowC: number = -1,
    activeKr: number = -1,
    activeKc: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "grid",
        grid: createGrid(windowR, windowC, activeKr, activeKc),
      },
      auxiliaryState: {
        customState: {
          "Input Image Shape": `${h_in}x${w_in}`,
          "Kernel Shape": `${k_h}x${k_w}`,
          "Stride / Padding": `S=${stride}, P=${padding}`,
          "Output Grid": `[${output.map((r) => `[${r.join(", ")}]`).join(", ")}]`,
        },
      },
      variables,
    });
  };

  // Step 1: Function entry
  addStep(
    1,
    "Initialize dimensions and buffers",
    `Started 2D convolution on ${h_in}x${w_in} image with ${k_h}x${k_w} filter kernel.`,
    { h_in, w_in, k_h, k_w, stride, padding },
  );

  // Step 2: Measure input
  addStep(
    6,
    "Measure Input Image Dimensions",
    `Input spatial image dimensions: h_in = ${h_in}, w_in = ${w_in}.`,
    { h_in, w_in },
  );

  // Step 3: Measure kernel
  addStep(
    7,
    "Measure Kernel Dimensions",
    `Kernel filter matrix dimensions: k_h = ${k_h}, k_w = ${k_w}.`,
    { k_h, k_w },
  );

  // Step 4: Allocate padded matrix
  addStep(
    10,
    "Allocate Padded Image Buffer",
    `Created ${h_pad}x${w_pad} zero-padded image matrix.`,
    { h_pad, w_pad, padding },
  );

  // Step 5: Calculate h_out
  addStep(
    15,
    "Calculate Output Height Dimension",
    `Output feature height h_out = (${h_pad} - ${k_h}) // ${stride} + 1 = ${h_out}.`,
    { h_out, h_pad, k_h, stride },
  );

  // Step 6: Calculate w_out
  addStep(
    16,
    "Calculate Output Width Dimension",
    `Output feature width w_out = (${w_pad} - ${k_w}) // ${stride} + 1 = ${w_out}.`,
    { w_out, w_pad, k_w, stride },
  );

  // Step 7: Allocate output matrix
  addStep(
    18,
    "Initialize Output Matrix Buffer",
    `Allocated ${h_out}x${w_out} output feature map filled with zeros.`,
    { h_out, w_out },
  );

  // Nested 2D spatial loop
  for (let r = 0; r < h_out; r++) {
    addStep(
      20,
      `Outer Row Loop: r = ${r}`,
      `Processing output feature map row r = ${r} of ${h_out - 1}.`,
      { r, h_out },
    );

    for (let c = 0; c < w_out; c++) {
      const top_left_r = r * stride;
      const top_left_c = c * stride;

      addStep(
        21,
        `Inner Column Loop: c = ${c}`,
        `Processing window at output coordinate (${r}, ${c}) anchored at padded top-left (${top_left_r}, ${top_left_c}).`,
        { r, c, top_left_r, top_left_c },
        top_left_r,
        top_left_c,
      );

      let acc_sum = 0.0;
      addStep(
        22,
        `Reset Dot Product Accumulator`,
        `Initialized acc_sum = 0.0 for window (${r}, ${c}).`,
        { r, c, acc_sum },
        top_left_r,
        top_left_c,
      );

      for (let kr = 0; kr < k_h; kr++) {
        addStep(
          23,
          `Kernel Row Loop: kr = ${kr}`,
          `Scanning kernel row kr = ${kr} of ${k_h - 1}.`,
          { r, c, kr },
          top_left_r,
          top_left_c,
          kr,
          0,
        );

        for (let kc = 0; kc < k_w; kc++) {
          const pr = top_left_r + kr;
          const pc = top_left_c + kc;
          const img_val = padded[pr][pc];
          const ker_val = kernel[kr][kc];
          const prod = img_val * ker_val;

          addStep(
            24,
            `Kernel Col Loop: kc = ${kc}`,
            `Multiplying padded image cell (${pr}, ${pc}) [val = ${img_val}] with kernel cell (${kr}, ${kc}) [weight = ${ker_val}].`,
            { r, c, kr, kc, pr, pc, img_val, ker_val },
            top_left_r,
            top_left_c,
            kr,
            kc,
          );

          acc_sum += prod;
          addStep(
            25,
            `Accumulate Product: ${img_val} * ${ker_val} = ${prod}`,
            `Updated acc_sum = ${acc_sum.toFixed(1)} for coordinate (${r}, ${c}).`,
            { r, c, kr, kc, prod, acc_sum },
            top_left_r,
            top_left_c,
            kr,
            kc,
          );
        }
      }

      output[r][c] = acc_sum;
      addStep(
        26,
        `Store Feature Map Value: output[${r}][${c}] = ${acc_sum.toFixed(1)}`,
        `Wrote accumulated dot product ${acc_sum.toFixed(1)} into output grid at (${r}, ${c}).`,
        { r, c, "output[r][c]": acc_sum },
        top_left_r,
        top_left_c,
      );
    }
  }

  // Final return step
  addStep(
    28,
    "Convolution Complete",
    `Finished 2D direct sliding window convolution. Output shape ${h_out}x${w_out}.`,
    { done: true, h_out, w_out },
  );

  return steps;
};

const CONV2DSLIDINGWINDOWDIRECT_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 8, 9, 12, 13, 14, 17, 19, 27],
  distractors: [
    "output[r][c] = sum(image * kernel)",
    "padded[r][c] = image[r + padding][c + padding]",
    "h_out = (h_in - k_h) // stride",
    "acc_sum *= padded[r * stride + kr][c * stride + kc]",
  ],
  hints: [
    { line: 15, hint: "Spatial output height formula: (len(padded) - k_h) // stride + 1." },
    { line: 25, hint: "Index padded matrix at r * stride + kr and c * stride + kc." },
  ],
  lineExplanations: {
    1: "Defines entry point for 2D direct sliding window convolution function.",
    2: "Docstring opening delimiter tag.",
    3: "Describes 2D direct sliding window cross-correlation spatial image filtering.",
    4: "Docstring closing delimiter tag.",
    5: "Blank line before shape extraction.",
    6: "Measures height h_in and width w_in of input image matrix.",
    7: "Measures height k_h and width k_w of filter weight matrix.",
    8: "Blank line before zero-padding section.",
    9: "Comment explaining spatial boundary zero-padding application.",
    10: "Allocates zero-padded image matrix of shape (h_in + 2*padding) x (w_in + 2*padding).",
    11: "Iterates over each row index r of unpadded input image.",
    12: "Iterates over each column index c of unpadded input image.",
    13: "Copies input image pixel value to padded grid with offset padding.",
    14: "Blank line before output dimension calculation.",
    15: "Calculates output feature height h_out using spatial dimension formula.",
    16: "Calculates output feature width w_out using spatial dimension formula.",
    17: "Blank line before output buffer initialization.",
    18: "Allocates output feature map matrix of shape h_out x w_out filled with zero floats.",
    19: "Blank line separating buffer allocation from spatial loops.",
    20: "Iterates over output feature map row coordinate r from 0 to h_out - 1.",
    21: "Iterates over output feature map column coordinate c from 0 to w_out - 1.",
    22: "Resets dot product accumulator acc_sum to 0.0 for spatial coordinate (r, c).",
    23: "Iterates over filter kernel row tap kr from 0 to k_h - 1.",
    24: "Iterates over filter kernel column tap kc from 0 to k_w - 1.",
    25: "Multiplies padded image pixel with kernel weight and accumulates into acc_sum.",
    26: "Stores completed dot product accumulation acc_sum into output matrix at (r, c).",
    27: "Blank line separating spatial loops from return statement.",
    28: "Returns computed 2D feature map matrix output.",
  },
};

export const conv2dSlidingWindowDirect: AlgorithmDefinition<Conv2dInput> = {
  id: "conv2dSlidingWindowDirect",
  title: "2D Direct Sliding Window Convolution",
  category: "ml_convolutions",
  categories: ["ml_convolutions", "ml_gemm_roofline"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_convolutions",
  description:
    "Direct **2D sliding window convolution** computes spatial output feature maps by systematically sliding a 2D filter kernel across an activation matrix, computing local element-wise dot products, and writing sums into output coordinates. While intuitive, nested 4D loops ($N \\times C_{out} \\times H_{out} \\times W_{out}$) exhibit low operational intensity and high loop overhead, motivating `im2col` and Winograd lowering in production deep learning compilers.\n\n### Why It Exists\n2D convolution is the core spatial feature extraction primitive in Computer Vision architectures (ResNet, ConvNeXt, EfficientNet). Direct sliding window convolution serves as the reference gold-standard implementation against which optimized GEMM, FFT, and Winograd kernels are validated.\n\n### Mathematical Formulation\nGiven an input activation matrix $X \\in \\mathbb{R}^{H \\times W}$, kernel weights $W \\in \\mathbb{R}^{K_h \\times K_w}$, stride $S$, and padding $P$, spatial output dimensions $(H_{out}, W_{out})$ and feature map values $Y[r, c]$ are defined as:\n\n$$H_{out} = \\left\\lfloor \\frac{H + 2P - K_h}{S} \\right\\rfloor + 1, \\quad W_{out} = \\left\\lfloor \\frac{W + 2P - K_w}{S} \\right\\rfloor + 1$$\n\n$$Y[r, c] = \\sum_{kr=0}^{K_h-1} \\sum_{kc=0}^{K_w-1} X_{\\text{pad}}[r \\cdot S + kr, \\, c \\cdot S + kc] \\cdot W[kr, kc]$$\n\n### Step-by-Step Intuition\n1. **Zero-Padding**: Surround the input activation grid with $P$ layers of zero values.\n2. **Anchor Window**: Place the top-left of the $K_h \\times K_w$ kernel at $(r \\cdot S, c \\cdot S)$ in the padded grid.\n3. **Element-wise Multiplication**: Multiply each kernel weight by its overlapping padded image pixel.\n4. **Accumulation**: Sum all $K_h \\cdot K_w$ product terms and store into output location $Y[r, c]$.\n\n### Key Trade-Offs & Hardware Execution\n- **Memory Efficiency**: Direct sliding window requires zero extra memory buffers ($O(1)$ auxiliary space), unlike `im2col` which duplicates receptive fields and consumes $O(K_h K_w H_{out} W_{out})$ extra RAM.\n- **Compute Efficiency**: Direct 2D loops perform non-contiguous memory access patterns, resulting in poor SIMD vectorization and cache line thrashing. High-performance engines lower convolution to GEMM matrix multiplication.",
  constraints: ["1 <= K_h, K_w <= H, W <= 100", "stride >= 1", "padding >= 0"],
  examples: [
    {
      kind: "basic",
      title: "Identity Kernel",
      inputDisplay: "Image 4x4, Kernel 2x2 [[2, 0], [0, -1]], Stride 1",
      outputDisplay: "Output 3x3 matrix",
      input: DEFAULT_CONV2DSLIDINGWINDOWDIRECT_INPUT,
      output: "3x3 spatial feature map",
      explanation: "Applies 2x2 diagonal filter to 4x4 image matrix.",
    },
  ],
  code: CONV2DSLIDINGWINDOWDIRECT_CODE,
  timeComplexity: {
    best: "O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
    average: "O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
    worst: "O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
  },
  spaceComplexity: "O(H_{out} \\cdot W_{out})",
  complexityAnalysis: {
    time: "Direct nested loops evaluate $K_h \\cdot K_w$ multiplications for each of the $H_{out} \\cdot W_{out}$ spatial pixels, requiring $O(H_{out} W_{out} K_h K_w)$ operations per channel pair.",
    space: "Requires $O(H_{out} W_{out})$ memory for output feature map storage.",
  },
  topicGuide: {
    overview:
      "**Direct 2D Sliding Window Convolution** evaluates 2D spatial cross-correlation across image matrices, serving as the foundational reference algorithm for Convolutional Neural Networks (CNNs).",
    sections: [
      {
        heading: "1. Core Concept & Mathematical Formulation",
        body: "2D spatial cross-correlation slides a $K_h \\times K_w$ filter matrix across padded input image $X$, computing:\n$$Y[r,c] = \\sum_{kr=0}^{K_h-1} \\sum_{kc=0}^{K_w-1} X_{\\text{pad}}[r \\cdot S + kr, c \\cdot S + kc] \\cdot W[kr, kc]$$\nSpatial output shape is governed by $H_{out} = \\lfloor (H + 2P - K_h)/S \\rfloor + 1$.",
      },
      {
        heading: "2. Systems & Performance Roofline Impact",
        body: "Direct 2D nested loops perform unaligned memory reads across rows, causing cache line misses and low operational intensity. Deep learning frameworks lower 2D sliding windows into 2D GEMM via `im2col` to achieve high compute density on GPU Tensor Cores.",
      },
      {
        heading: "3. Implementation Nuances & Data Layouts",
        body: "Common tensor layouts include `NCHW` (Batch, Channel, Height, Width) used by PyTorch / cuDNN, and `NHWC` (Batch, Height, Width, Channel) favored by TensorFlow and mobile ARM vector engines.",
      },
      {
        heading: "4. Edge Case Analysis & Production Safeguards",
        body: "Boundary zero-padding alignment is essential to maintain spatial dimensions (e.g. $K=3, P=1, S=1$ yields $H_{out} = H$). Non-square kernels ($K_h \\neq K_w$) and non-unit strides require exact integer division floor checks.",
      },
    ],
    keyTerms: [
      {
        term: "2D Cross-Correlation",
        definition:
          "Spatial 2D filter operation computing local element-wise inner products across sliding image windows.",
      },
      {
        term: "Receptive Field",
        definition:
          "The spatial region of input pixels that contribute to a single output feature map pixel.",
      },
      {
        term: "im2col Lowering",
        definition:
          "Transformation reshaping 2D spatial sliding windows into 2D matrix rows to enable GEMM execution.",
      },
      {
        term: "Spatial Output Dimension",
        definition: "Equation $H_{out} = \\lfloor (H + 2P - K_h)/S \\rfloor + 1$.",
      },
    ],
  },
  trivia: CONV2DSLIDINGWINDOWDIRECT_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_CONV2DSLIDINGWINDOWDIRECT_INPUT,
  generateSteps: generateConv2dSlidingWindowDirectSteps,
};
