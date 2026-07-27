import type { AlgorithmDefinition, AlgorithmStep, GridCellNode } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface Conv2dInput {
  image: number[][]; // H x W
  kernel: number[][]; // K x K
  stride: number;
}

export const CONV2DSLIDINGWINDOWDIRECT_CODE = `def conv2d_sliding_window_direct(image: list[list[float]], kernel: list[list[float]], stride: int) -> list[list[float]]:
    # 2D Direct Sliding Window Convolution
    # Direct nested 4-loop spatial convolution over 2D input grids.
    img_h = len(image)
    img_w = len(image[0])
    k_h = len(kernel)
    k_w = len(kernel[0])
    
    out_h = (img_h - k_h) // stride + 1
    out_w = (img_w - k_w) // stride + 1
    
    output = [[0.0] * out_w for _ in range(out_h)]
    
    for oh in range(out_h):
        for ow in range(out_w):
            val = 0.0
            # Slide window
            for kh in range(k_h):
                for kw in range(k_w):
                    ih = oh * stride + kh
                    iw = ow * stride + kw
                    val += image[ih][iw] * kernel[kh][kw]
            
            output[oh][ow] = val
            
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
  id: "conv2d-sliding-window-direct",
  title: "2D Direct Sliding Window Convolution",
  category: "ml_convolutions",
  categories: ["ml_convolutions", "sliding_window"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_convolutions",
  description: "Direct nested 4-loop spatial convolution over 2D input grids.",
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
      "Spatial Convolution is the foundation of CNNs, extracting local features using a sliding filter.",
    sections: [
      {
        heading: "Receptive Field",
        body: "Each output pixel is influenced by a local KxK region of the input.",
      },
      {
        heading: "Stride",
        body: "Controls how much the filter moves. Stride > 1 is a common way to downsample spatial dimensions.",
      },
      {
        heading: "Inefficiency",
        body: "The direct 4-loop implementation is extremely slow on CPUs and GPUs because of poor memory cache usage. Frameworks typically use im2col or Winograd algorithms to accelerate it.",
      },
    ],
    keyTerms: [
      {
        term: "Kernel/Filter",
        definition: "A small matrix of weights that slides across the input.",
      },
      {
        term: "Padding",
        definition: "Adding borders (usually zeros) to control the spatial size of the output.",
      },
    ],
  },
  trivia: CONV2DSLIDINGWINDOWDIRECT_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Deep Learning Foundations" }],
  defaultInput: DEFAULT_CONV2DSLIDINGWINDOWDIRECT_INPUT,
  generateSteps: generateConv2dSlidingWindowDirectSteps,
};
