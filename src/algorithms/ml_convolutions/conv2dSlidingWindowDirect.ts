import type { AlgorithmDefinition, AlgorithmStep, GridCellNode } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface Conv2dInput {
  image: number[][]; // H x W
  kernel: number[][]; // K x K
  stride: number;
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

    return output
`;

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
};

export const generateConv2dSlidingWindowDirectSteps = (input: Conv2dInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const img_h = input.image.length;
  const img_w = input.image[0].length;
  const k_h = input.kernel.length;
  const k_w = input.kernel[0].length;
  const stride = input.stride;

  const out_h = Math.floor((img_h - k_h) / stride) + 1;
  const out_w = Math.floor((img_w - k_w) / stride) + 1;

  const output: number[][] = Array(out_h)
    .fill(0)
    .map(() => Array(out_w).fill(0));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    grid: GridCellNode[][],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "grid",
        grid: grid.map((row) => row.map((cell) => ({ ...cell }))),
      },
      auxiliaryState: {
        customState: {
          im2colBuffer: "Sliding Window Active State",
          out_h,
          out_w,
        },
      },
      variables,
    });
  };

  const createGrid = (
    matrix: number[][],
    windowR: number = -1,
    windowC: number = -1,
  ): GridCellNode[][] => {
    return matrix.map((row, r) =>
      row.map((val, c) => {
        let state: "default" | "active" | "compare" | "visited" = "default";

        // highlight kernel window in active state
        if (windowR >= 0 && windowC >= 0) {
          if (r >= windowR && r < windowR + k_h && c >= windowC && c < windowC + k_w) {
            state = "active";
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

  addStep(
    11,
    "Initialize dimensions and output buffer",
    "Determine output height and width based on formula (W - K) / S + 1.",
    { out_h, out_w },
    createGrid(input.image),
  );

  for (let oh = 0; oh < out_h; oh++) {
    for (let ow = 0; ow < out_w; ow++) {
      let val = 0;
      let ih_start = oh * stride;
      let iw_start = ow * stride;

      addStep(
        15,
        `Start window at output (${oh}, ${ow})`,
        "Position the convolution kernel over the input image.",
        { oh, ow, ih_start, iw_start },
        createGrid(input.image, ih_start, iw_start),
      );

      for (let kh = 0; kh < k_h; kh++) {
        for (let kw = 0; kw < k_w; kw++) {
          let ih = ih_start + kh;
          let iw = iw_start + kw;
          val += input.image[ih][iw] * input.kernel[kh][kw];
        }
      }
      output[oh][ow] = val;

      addStep(
        24,
        `Compute dot product`,
        "Sum of element-wise products between window and kernel.",
        { oh, ow, val },
        createGrid(output, oh, ow),
      );
    }
  }

  addStep(
    26,
    "Convolution Complete",
    "All sliding windows have been processed.",
    { done: true },
    createGrid(output),
  );

  return steps;
};

const CONV2DSLIDINGWINDOWDIRECT_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3],
  distractors: ["ih = oh + kh", "output[oh][ow] += val"],
  hints: [{ line: 20, hint: "Remember to multiply by the stride when positioning the window" }],
  lineExplanations: {
    8: "Calculate output height using (H - K) / S + 1.",
    20: "Calculate input row index by shifting window by stride.",
    22: "Element-wise multiplication and accumulation.",
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
    "Direct 2D sliding window convolution computes spatial output feature maps by systematically sliding a 2D kernel filter across an input activation matrix, computing local element-wise products, and summing them for each spatial coordinate. While conceptually straightforward and memory-efficient for small inputs, nested loops suffer from high instruction overhead and poor hardware arithmetic intensity compared to GEMM lowering (im2col).\n\nInput Format:\n- image: 2D array of shape [H, W] representing input activations or pixel values.\n- kernel: 2D matrix of shape [K_h, K_w] containing filter weights.\n- stride: Integer spatial step size between window positions.\n- padding: Zero-padding added to spatial boundaries.\n\nOutput Format:\n- Returns a 2D feature map matrix of shape [H_out, W_out].\n\nEdge Cases & Constraints:\n- Non-square activations (H != W) and non-square filters (K_h != K_w).\n- Boundary zero-padding preserving spatial dimensions when K=3, P=1, S=1.\n- Stride S > 1 downsampling reducing spatial dimensions.",
  constraints: ["1 <= K <= H, W <= 100", "stride >= 1"],
  examples: [
    {
      kind: "basic",
      title: "Identity Kernel",
      inputDisplay: "Image 3x3, Kernel [[1]], Stride 1",
      outputDisplay: "Matches input exactly",
      input: {
        image: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
        kernel: [[1]],
        stride: 1,
      },
      output: "[[1,2,3],[4,5,6],[7,8,9]]",
      explanation: "A 1x1 kernel of 1 just copies the image.",
    },
    {
      kind: "complex",
      title: "Edge Detection",
      inputDisplay: "Image 4x4, Kernel 2x2 [-1,1], Stride 1",
      outputDisplay: "Diff array",
      input: {
        image: [
          [1, 1, 1, 1],
          [1, 5, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
        kernel: [
          [-1, 1],
          [0, 0],
        ],
        stride: 1,
      },
      output: "Shows positive and negative edges around 5.",
      explanation: "Horizontal gradient filter detects changes in pixel intensity.",
    },
    {
      kind: "negative",
      title: "Stride > 1",
      inputDisplay: "Image 4x4, Kernel 2x2, Stride 2",
      outputDisplay: "Downsampled 2x2",
      input: {
        image: [
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
          [13, 14, 15, 16],
        ],
        kernel: [
          [1, 1],
          [1, 1],
        ],
        stride: 2,
      },
      output: "Summing 2x2 blocks without overlap.",
      explanation:
        "Stride of 2 skips every other pixel, shrinking the spatial dimension significantly.",
    },
  ],
  code: CONV2DSLIDINGWINDOWDIRECT_CODE,
  timeComplexity: {
    best: "O(H_{out} W_{out} K^2)",
    average: "O(H_{out} W_{out} K^2)",
    worst: "O(H_{out} W_{out} K^2)",
  },
  spaceComplexity: "O(H_{out} W_{out})",
  complexityAnalysis: {
    time: "4-loop convolution evaluates K^2 multiplications for each of the H_{out} * W_{out} output pixels.",
    space: "Requires O(H_{out} W_{out}) memory to store the output feature map.",
  },
  topicGuide: {
    overview:
      "Direct 2D Sliding Window Convolution provides the baseline reference mechanics for spatial feature map generation in convolutional neural networks.",
    sections: [
      {
        heading: "Core Concepts & 4-Loop Convolution Math",
        body: "Discrete 2D cross-correlation evaluates Y[r, c] = sum_{kr=0}^{K_h-1} sum_{kc=0}^{K_w-1} X[r*S + kr, c*S + kc] * W[kr, kc]. The nested 4-loop structure iterates over spatial output dimensions (r, c) and internal kernel coordinates (kr, kc).",
      },
      {
        heading: "Systems & Performance Roofline Impact",
        body: "Direct 2D convolution suffers from low arithmetic intensity and non-coalesced memory access patterns on modern GPUs. Threads in a warp encounter unaligned memory loads at window boundaries, causing DRAM bandwidth saturation.",
      },
      {
        heading: "Implementation Nuances & Data Layouts",
        body: "Memory layout formats such as NCHW (channels-first) and NHWC (channels-last) dictate index strides. NHWC allows SIMD vector loads across channels at each spatial pixel location.",
      },
      {
        heading: "Edge Cases & Production Safeguards",
        body: "Edge cases include asymmetric zero-padding, kernel size matching image dimensions (K=H, W), and avoiding out-of-bounds array reads near image borders.",
      },
    ],
    keyTerms: [
      {
        term: "Direct Convolution",
        definition:
          "Evaluating convolution sliding windows directly in nested loops without matrix lowering.",
      },
      {
        term: "Sliding Window Filter",
        definition: "2D weight matrix shifted step-by-step across input spatial coordinates.",
      },
      {
        term: "Feature Map Activation",
        definition:
          "Output spatial matrix representing response intensity of filter kernel across input domain.",
      },
      {
        term: "Spatial Stride",
        definition:
          "Pixel step distance S shifting the window position horizontally and vertically.",
      },
    ],
  },
  trivia: CONV2DSLIDINGWINDOWDIRECT_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Deep Learning Foundations" }],
  defaultInput: DEFAULT_CONV2DSLIDINGWINDOWDIRECT_INPUT,
  generateSteps: generateConv2dSlidingWindowDirectSteps,
};
