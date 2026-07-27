import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface transposedConv2dDeconvIndexMapperInput {
  inputMap: number[][];
  kernel: number[][];
  stride?: number;
  padding?: number;
  outputPadding?: number;
}

export const TRANSPOSEDCONV2DDECONVINDEXMAPPER_CODE = `
def transposed_conv2d(input_map, kernel, stride=1, padding=0, output_padding=0):
    """
    Transposed 2D Convolution (Deconvolution) Engine via Direct Index Mapping.
    Computes output spatial shape:
      H_out = (H_in - 1) * stride - 2 * padding + K_h + output_padding
      W_out = (W_in - 1) * stride - 2 * padding + K_w + output_padding
    Maps input activations to output grid locations without creating sparse zero-filled tensors.
    """
    h_in, w_in = len(input_map), len(input_map[0])
    k_h, k_w = len(kernel), len(kernel[0])

    h_out = (h_in - 1) * stride - 2 * padding + k_h + output_padding
    w_out = (w_in - 1) * stride - 2 * padding + k_w + output_padding

    output_map = [[0.0] * w_out for _ in range(h_out)]

    for r_in in range(h_in):
        for c_in in range(w_in):
            val = input_map[r_in][c_in]
            for kr in range(k_h):
                for kc in range(k_w):
                    r_out = r_in * stride + kr - padding
                    c_out = c_in * stride + kc - padding
                    if 0 <= r_out < h_out and 0 <= c_out < w_out:
                        output_map[r_out][c_out] += val * kernel[kr][kc]

    return output_map
`;

export const DEFAULT_TRANSPOSEDCONV2DDECONVINDEXMAPPER_INPUT: transposedConv2dDeconvIndexMapperInput =
  {
    inputMap: [
      [1, 2],
      [3, 4],
    ],
    kernel: [
      [1, 0.5],
      [0.5, 1],
    ],
    stride: 2,
    padding: 0,
    outputPadding: 0,
  };

export const generateTransposedConv2dDeconvIndexMapperSteps = (
  input: transposedConv2dDeconvIndexMapperInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const inputMap = input.inputMap;
  const kernel = input.kernel;
  const stride = input.stride ?? 1;
  const padding = input.padding ?? 0;
  const outputPadding = input.outputPadding ?? 0;

  const hIn = inputMap.length;
  const wIn = inputMap[0].length;
  const kH = kernel.length;
  const kW = kernel[0].length;

  const hOut = (hIn - 1) * stride - 2 * padding + kH + outputPadding;
  const wOut = (wIn - 1) * stride - 2 * padding + kW + outputPadding;

  const flatInput = inputMap.flatMap((r) => r);
  const elements: ArrayElement[] = flatInput.map((val, idx) => ({
    id: `in-${idx}`,
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
          inputShape: `${hIn}x${wIn}`,
          outputShape: `${hOut}x${wOut}`,
          kernelShape: `${kH}x${kW}`,
          stride: String(stride),
          padding: String(padding),
          ...customState,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Transposed 2D Convolution Engine",
    "Setting up output tensor spatial dimensions for deconvolution upsampling.",
    { hIn, wIn, kH, kW, hOut, wOut, stride, padding, outputPadding },
  );

  const outputMap: number[][] = Array.from({ length: hOut }, () => Array(wOut).fill(0));

  for (let rIn = 0; rIn < hIn; rIn++) {
    for (let cIn = 0; cIn < wIn; cIn++) {
      const val = inputMap[rIn][cIn];

      for (let kr = 0; kr < kH; kr++) {
        for (let kc = 0; kc < kW; kc++) {
          const rOut = rIn * stride + kr - padding;
          const cOut = cIn * stride + kc - padding;

          if (rOut >= 0 && rOut < hOut && cOut >= 0 && cOut < wOut) {
            outputMap[rOut][cOut] += val * kernel[kr][kc];
          }
        }
      }

      addStep(
        17,
        `Distribute input (${rIn}, ${cIn}) = ${val} onto output patch starting at (${rIn * stride}, ${cIn * stride})`,
        `Multiplied scalar ${val} by kernel to accumulate into spatial positions on output grid.`,
        { rIn, cIn, val },
        { currentPos: `In[${rIn}][${cIn}] -> Out region` },
      );
    }
  }

  addStep(
    23,
    "Execution Complete",
    `Successfully generated ${hOut}x${wOut} upsampled transposed convolution feature map.`,
    { completed: true },
  );

  return steps;
};

const TRANSPOSEDCONV2DDECONVINDEXMAPPER_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "output_map[r_out][c_out] = val * kernel[kr][kc]",
    "h_out = h_in * stride",
    "if padding != 0: raise Exception()",
  ],
  hints: [
    {
      line: 17,
      hint: "Transposed convolution distributes each input pixel across a kernel patch on the output grid.",
    },
    {
      line: 23,
      hint: "Output spatial height is computed as H_out = (H_in - 1) * stride - 2 * padding + K_h + output_padding.",
    },
  ],
  lineExplanations: {
    1: "Entry point for transposed 2D convolution index mapper engine.",
    17: "Scatter accumulation loop projecting input activations onto the upsampled output map.",
    23: "Returns computed upsampled output feature map matrix.",
  },
};

export const transposedConv2dDeconvIndexMapper: AlgorithmDefinition<transposedConv2dDeconvIndexMapperInput> =
  {
    id: "transposedConv2dDeconvIndexMapper",
    title: "Transposed 2D Convolution (Deconvolution) Engine",
    category: "ml_convolutions",
    categories: ["ml_convolutions", "ml_hardware_kernels"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_convolutions",
    description:
      "Transposed 2D Convolution (also known as Deconvolution or Fractionally Strided Convolution) is used to upsample spatial feature map resolutions in deep generative models (GANs, Autoencoders, Stable Diffusion) and semantic segmentation networks (U-Net, FCN). Mathematically, transposed convolution acts as the backward pass of a standard convolution. Instead of inserting zeroes between input pixels to build an explicit sparse grid, high-performance engines map input indices directly into output spatial locations using index mapping equations r_out = r_in * stride + kr - padding, scattering input pixel values scaled by the filter kernel into overlapping output regions.\n\nInput Format:\n- inputMap: 2D array of spatial input activations.\n- kernel: 2D array representing filter weights.\n- stride: Spatial upsampling stride factor (default 1).\n- padding: Spatial padding subtracted from output borders (default 0).\n- outputPadding: Additional size added to final output edge (default 0).\n\nOutput Format:\n- Returns a 2D upsampled feature map of shape (H_out, W_out).\n\nEdge Cases & Constraints:\n- Overlapping kernels (stride < K_h): Produces checkerboard artifact patterns if kernel weights are uncalibrated.\n- Zero padding: Truncates boundary output spatial pixels.\n- Exact inverse shape matching: outputPadding resolves shape ambiguity caused by integer division in forward strided convolutions.",
    constraints: [
      "1 <= H_in, W_in <= 512",
      "1 <= K_h, K_w <= 11",
      "1 <= stride <= 8",
      "padding >= 0",
    ],
    examples: [
      {
        kind: "basic",
        title: "2x2 Input Upsampled with Stride 2",
        inputDisplay: "inputMap: 2x2, kernel: 2x2, stride: 2",
        outputDisplay: "Output: 4x4",
        input: DEFAULT_TRANSPOSEDCONV2DDECONVINDEXMAPPER_INPUT,
        output: "Upsampled Feature Map 4x4",
        explanation:
          "Upsamples 2x2 input activations to 4x4 output grid using 2x2 kernel with stride 2.",
      },
    ],
    code: TRANSPOSEDCONV2DDECONVINDEXMAPPER_CODE,
    timeComplexity: {
      best: "O(H_in * W_in * K_h * K_w)",
      average: "O(H_in * W_in * K_h * K_w)",
      worst: "O(H_in * W_in * K_h * K_w)",
    },
    spaceComplexity: "O(H_out * W_out)",
    complexityAnalysis: {
      time: "Linear in total number of kernel scatter accumulation steps (H_in * W_in * K_h * K_w).",
      space: "Allocates memory for the output upsampled feature map tensor of size H_out * W_out.",
    },
    topicGuide: {
      overview:
        "Transposed 2D Convolution performs spatial upsampling by scattering input activations into larger output feature maps.",
      sections: [
        {
          heading: "Overview",
          body: "Standard convolution downsamples spatial resolutions (e.g. 224x224 to 112x112). Transposed convolution reverses this spatial gradient, mapping lower-resolution bottleneck features back to high-resolution image space (e.g. in U-Net decoder branches).",
        },
        {
          heading: "Core Concepts",
          body: "1. Direct Index Mapping: Maps each input element at (r_in, c_in) to an output patch starting at (r_in * stride, c_in * stride).\n2. Scatter Accumulation: Overlapping output patches accumulate weight products iteratively.\n3. Output Shape Formula: H_out = (H_in - 1) * stride - 2 * padding + K_h + output_padding.",
        },
        {
          heading: "Systems & Performance Impact",
          body: "Naive implementations expand input tensors with sparse zeros (inserting stride-1 zeros), wasting memory bandwidth and FLOPs on zero multiplication. Direct index mapping eliminates zero-padding overhead completely.",
        },
        {
          heading: "Implementation Nuances",
          body: "Checkerboard artifacts occur when kernel size is not divisible by stride. Using resize-convolution (nearest-neighbor or bilinear interpolation followed by standard convolution) is often an alternative to eliminate artifacts.",
        },
        {
          heading: "Edge Cases",
          body: "Output padding > 0, asymmetric stride/padding parameters, and single-pixel 1x1 transposed convolutions.",
        },
      ],
      keyTerms: [
        {
          term: "Transposed Convolution",
          definition:
            "Convolutional spatial upsampling operator matching the backward pass of forward convolution.",
        },
        {
          term: "Scatter Accumulation",
          definition:
            "Writing scaled kernel values into overlapping destination addresses in the output tensor.",
        },
        {
          term: "Output Padding",
          definition:
            "Explicit shape parameter disambiguating output dimensions when downsampling had non-zero remainders.",
        },
        {
          term: "Checkerboard Artifacts",
          definition:
            "Spatial high-frequency noise caused by uneven overlap of transposed convolution kernels.",
        },
      ],
    },
    trivia: TRANSPOSEDCONV2DDECONVINDEXMAPPER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_TRANSPOSEDCONV2DDECONVINDEXMAPPER_INPUT,
    generateSteps: generateTransposedConv2dDeconvIndexMapperSteps,
  };
