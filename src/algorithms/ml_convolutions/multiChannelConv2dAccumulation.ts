import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface multiChannelConv2dAccumulationInput {
  image: number[][][];
  kernels: number[][][][];
  stride?: number;
  padding?: number;
}

export const MULTICHANNELCONV2DACCUMULATION_CODE = `
def multi_channel_conv2d_accumulation(image, kernels, stride=1, padding=0):
    """
    Multi-Channel 2D Convolution Spatial & Cross-Channel Accumulation.
    Performs standard multi-channel 2D convolution by sliding 3D kernel volumes (C_in, K_h, K_w)
    over 3D input feature maps (C_in, H, W) and accumulating spatial cross-channel dot products
    for each output feature channel (C_out).
    """
    c_out = len(kernels)
    c_in = len(kernels[0])
    k_h, k_w = len(kernels[0][0]), len(kernels[0][0][0])

    h_in, w_in = len(image[0]), len(image[0][0])
    h_out = (h_in + 2 * padding - k_h) // stride + 1
    w_out = (w_in + 2 * padding - k_w) // stride + 1

    output = [[[0.0] * w_out for _ in range(h_out)] for _ in range(c_out)]

    for co in range(c_out):
        for r in range(h_out):
            for c in range(w_out):
                acc = 0.0
                for ci in range(c_in):
                    for kr in range(k_h):
                        for kc in range(k_w):
                            ir = r * stride + kr - padding
                            ic = c * stride + kc - padding
                            if 0 <= ir < h_in and 0 <= ic < w_in:
                                acc += image[ci][ir][ic] * kernels[co][ci][kr][kc]
                output[co][r][c] = acc

    return output
`;

export const DEFAULT_MULTICHANNELCONV2DACCUMULATION_INPUT: multiChannelConv2dAccumulationInput = {
  image: [
    [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ],
    [
      [2, 1, 0],
      [1, 2, 1],
      [0, 1, 2],
    ],
  ],
  kernels: [
    [
      [
        [1, 0],
        [0, 1],
      ],
      [
        [0, 1],
        [1, 0],
      ],
    ],
    [
      [
        [0, 1],
        [1, 0],
      ],
      [
        [1, 0],
        [0, 1],
      ],
    ],
  ],
  stride: 1,
  padding: 0,
};

export const generateMultiChannelConv2dAccumulationSteps = (
  input: multiChannelConv2dAccumulationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const image = input.image;
  const kernels = input.kernels;
  const stride = input.stride ?? 1;
  const padding = input.padding ?? 0;

  const cOut = kernels.length;
  const cIn = kernels[0].length;
  const kH = kernels[0][0].length;
  const kW = kernels[0][0][0].length;

  const hIn = image[0].length;
  const wIn = image[0][0].length;

  const hOut = Math.floor((hIn + 2 * padding - kH) / stride) + 1;
  const wOut = Math.floor((wIn + 2 * padding - kW) / stride) + 1;

  const flatInput = image.flatMap((ch) => ch.flatMap((row) => row));
  const elements: ArrayElement[] = flatInput.map((val, idx) => ({
    id: `val-${idx}`,
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
          inputChannels: String(cIn),
          outputChannels: String(cOut),
          inputSize: `${hIn}x${wIn}`,
          outputSize: `${hOut}x${wOut}`,
          kernelSize: `${kH}x${kW}`,
          ...customState,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Multi-Channel Conv2D Accumulator",
    "Setting up cross-channel convolution loops over 3D kernel filters.",
    { cIn, cOut, hIn, wIn, kH, kW, hOut, wOut, stride, padding },
  );

  const output: number[][][] = Array.from({ length: cOut }, () =>
    Array.from({ length: hOut }, () => Array(wOut).fill(0)),
  );

  for (let co = 0; co < cOut; co++) {
    for (let r = 0; r < hOut; r++) {
      for (let c = 0; c < wOut; c++) {
        let acc = 0;
        const channelAccs: number[] = [];

        for (let ci = 0; ci < cIn; ci++) {
          let chSum = 0;
          for (let kr = 0; kr < kH; kr++) {
            for (let kc = 0; kc < kW; kc++) {
              const ir = r * stride + kr - padding;
              const ic = c * stride + kc - padding;
              if (ir >= 0 && ir < hIn && ic >= 0 && ic < wIn) {
                chSum += image[ci][ir][ic] * kernels[co][ci][kr][kc];
              }
            }
          }
          acc += chSum;
          channelAccs.push(chSum);
        }

        output[co][r][c] = acc;

        addStep(
          20,
          `Accumulate spatial dot products for Output Channel ${co}, position (${r}, ${c})`,
          `Summed per-channel contributions [${channelAccs.join(", ")}] into output activation ${acc}.`,
          { co, r, c, acc, channelAccs: channelAccs.join(",") },
          { currentOutput: `Out[${co}][${r}][${c}] = ${acc}` },
        );
      }
    }
  }

  addStep(
    29,
    "Execution Complete",
    `Successfully accumulated cross-channel convolutions into ${cOut}x${hOut}x${wOut} feature map tensor.`,
    { completed: true },
  );

  return steps;
};

const MULTICHANNELCONV2DACCUMULATION_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "acc += image[ci][ir][ic] + kernels[co][ci][kr][kc]",
    "output[co][r][c] = max(channelAccs)",
    "if c_in != kernels.length: raise Exception()",
  ],
  hints: [
    {
      line: 20,
      hint: "Cross-channel accumulation aggregates 2D spatial dot products across all input channels.",
    },
    { line: 29, hint: "Each output channel is computed by its own dedicated 3D kernel filter." },
  ],
  lineExplanations: {
    1: "Entry point for multi-channel Conv2D accumulation algorithm.",
    20: "Inner spatial and cross-channel accumulation loop.",
    29: "Returns computed multi-channel feature map tensor.",
  },
};

export const multiChannelConv2dAccumulation: AlgorithmDefinition<multiChannelConv2dAccumulationInput> =
  {
    id: "multiChannelConv2dAccumulation",
    title: "Multi-Channel Conv2D Accumulator",
    category: "ml_convolutions",
    categories: ["ml_convolutions", "ml_hardware_kernels"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_convolutions",
    description:
      "Multi-Channel 2D Convolution Accumulation performs the foundational tensor operation behind Convolutional Neural Networks (CNNs). Given a 3D input feature map of shape (C_in, H, W) and a 4D filter weight tensor of shape (C_out, C_in, K_h, K_w), the algorithm computes spatial dot products across all input channels for every output filter. For a given spatial pixel (r, c) and output channel c_out, the accumulated result is the sum over c_in, k_h, and k_w of image[c_in][r*stride + k_h][c*stride + k_w] * weight[c_out][c_in][k_h][k_w]. This accumulation forms the basis of feature extraction in VGG, ResNet, and ConvNeXt.\n\nInput Format:\n- image: 3D tensor of shape (C_in, H, W).\n- kernels: 4D filter tensor of shape (C_out, C_in, K_h, K_w).\n- stride: Spatial stride integer (default 1).\n- padding: Zero-padding width integer (default 0).\n\nOutput Format:\n- Returns a 3D output tensor of shape (C_out, H_out, W_out).\n\nEdge Cases & Constraints:\n- Boundary padding: Zero-padding fills out-of-bound image positions.\n- Spatial stride > 1: Reduces spatial output dimensions (H_out, W_out).\n- Linear scale: Computation scales linearly with C_out * C_in * H_out * W_out * K_h * K_w.",
    constraints: [
      "1 <= C_in, C_out <= 512",
      "1 <= H, W <= 512",
      "1 <= K_h, K_w <= 11",
      "stride >= 1",
    ],
    examples: [
      {
        kind: "basic",
        title: "2 Input Channels, 2 Output Channels",
        inputDisplay: "image: 2x3x3, kernels: 2x2x2x2",
        outputDisplay: "output: 2x2x2",
        input: DEFAULT_MULTICHANNELCONV2DACCUMULATION_INPUT,
        output: "Tensor (2, 2, 2)",
        explanation:
          "Accumulates 2D spatial dot products across 2 input channels for 2 output feature maps.",
      },
    ],
    code: MULTICHANNELCONV2DACCUMULATION_CODE,
    timeComplexity: {
      best: "O(C_out * C_in * H_out * W_out * K_h * K_w)",
      average: "O(C_out * C_in * H_out * W_out * K_h * K_w)",
      worst: "O(C_out * C_in * H_out * W_out * K_h * K_w)",
    },
    spaceComplexity: "O(C_out * H_out * W_out)",
    complexityAnalysis: {
      time: "Performs exactly 2 * C_out * C_in * H_out * W_out * K_h * K_w floating point operations (FLOPs).",
      space: "Allocates storage for the output feature map tensor of size C_out * H_out * W_out.",
    },
    topicGuide: {
      overview:
        "Multi-Channel 2D Convolution Accumulation aggregates spatial signals across input channels to synthesize high-level representations in deep neural networks.",
      sections: [
        {
          heading: "Overview",
          body: "Unlike 2D grayscale convolutions, deep neural networks process multi-channel feature maps (e.g. RGB channels or internal hidden channels). Each output channel aggregates spatial features across all input channels.",
        },
        {
          heading: "Core Concepts",
          body: "1. 3D Kernel Filters: Each output channel has a 3D filter volume of shape (C_in, K_h, K_w).\n2. Cross-Channel Dot Product: For each spatial patch, 2D convolution is performed on each input channel, and outputs are summed across C_in.\n3. Bias Addition & Activation: In full layers, a scalar bias b[c_out] is added followed by non-linear activation (ReLU, GELU).",
        },
        {
          heading: "Systems & Performance Impact",
          body: "Multi-channel convolutions require high memory bandwidth when loaded directly. Hardware architectures (NVIDIA GPUs, Google TPUs) use loop tiling and SIMD accumulation registers to keep partial channel sums in hardware accumulators.",
        },
        {
          heading: "Implementation Nuances",
          body: "Memory layout order (NCHW vs NHWC) significantly alters cache contiguity. NHWC layout stores channels adjacent in memory, benefiting GEMM accumulation along inner vector loops.",
        },
        {
          heading: "Edge Cases",
          body: "Asymmetric kernel dimensions, padded spatial boundaries, single-channel inputs (C_in=1), and 1x1 convolutions.",
        },
      ],
      keyTerms: [
        {
          term: "Cross-Channel Accumulation",
          definition: "Summing 2D spatial convolution outputs across all input channels C_in.",
        },
        {
          term: "Feature Map",
          definition:
            "3D tensor representing spatial activation channels at a specific layer depth.",
        },
        {
          term: "NCHW / NHWC Layout",
          definition: "Tensor memory storage ordering (Channels-First vs Channels-Last).",
        },
        {
          term: "Partial Sum Register",
          definition:
            "Hardware accumulator register used to store intermediate channel sums during loop execution.",
        },
      ],
    },
    trivia: MULTICHANNELCONV2DACCUMULATION_TRIVIA,
    defaultInput: DEFAULT_MULTICHANNELCONV2DACCUMULATION_INPUT,
    generateSteps: generateMultiChannelConv2dAccumulationSteps,
  };
