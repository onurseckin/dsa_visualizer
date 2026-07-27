import type { AlgorithmDefinition, AlgorithmStep, GridCellNode } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface transposedConv2dDeconvIndexMapperInput {
  inputMap?: number[][];
  kernel?: number[][];
  stride?: number;
  padding?: number;
  outputPadding?: number;
  data?: number[];
  target?: number;
}

export const TRANSPOSEDCONV2DDECONVINDEXMAPPER_CODE = `def transposed_conv2d(input_map, kernel, stride=1, padding=0, output_padding=0):
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

  const inputMap = input.inputMap || [
    [1, 2],
    [3, 4],
  ];
  const kernel = input.kernel || [
    [1, 0.5],
    [0.5, 1],
  ];
  const stride = input.stride ?? 2;
  const padding = input.padding ?? 0;
  const outputPadding = input.outputPadding ?? 0;

  const hIn = inputMap.length;
  const wIn = inputMap[0].length;
  const kH = kernel.length;
  const kW = kernel[0].length;

  const hOut = (hIn - 1) * stride - 2 * padding + kH + outputPadding;
  const wOut = (wIn - 1) * stride - 2 * padding + kW + outputPadding;

  const outputMap: number[][] = Array.from({ length: hOut }, () => Array(wOut).fill(0));

  const createGrid = (
    activeROut: number = -1,
    activeCOut: number = -1,
  ): GridCellNode[][] => {
    return outputMap.map((row, r) =>
      row.map((val, c) => {
        let state: "default" | "active" | "compare" | "visited" = "default";
        if (r === activeROut && c === activeCOut) {
          state = "active";
        } else if (val > 0) {
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
    activeROut: number = -1,
    activeCOut: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "grid",
        grid: createGrid(activeROut, activeCOut),
      },
      auxiliaryState: {
        customState: {
          "Input Spatial Shape": `${hIn} x ${wIn}`,
          "Kernel Shape": `${kH} x ${kW}`,
          "Stride / Pad / OutPad": `S=${stride}, P=${padding}, OP=${outputPadding}`,
          "Output Spatial Shape": `${hOut} x ${wOut}`,
          "Output Grid": `[${outputMap.map((r) => `[${r.map((v) => v.toFixed(1)).join(", ")}]`).join(", ")}]`,
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Initialize Transposed 2D Convolution Engine",
    `Started transposed 2D convolution index mapper on ${hIn}x${wIn} input with ${kH}x${kW} kernel, stride S=${stride}, padding P=${padding}, output_padding OP=${outputPadding}.`,
    { hIn, wIn, kH, kW, stride, padding, outputPadding },
  );

  // Step 2: Input dimensions
  addStep(
    9,
    "Measure Input Spatial Dimensions",
    `Input activation map spatial dimensions: h_in = ${hIn}, w_in = ${wIn}.`,
    { hIn, wIn },
  );

  // Step 3: Kernel dimensions
  addStep(
    10,
    "Measure Kernel Dimensions",
    `Deconvolution kernel filter spatial dimensions: k_h = ${kH}, k_w = ${kW}.`,
    { kH, kW },
  );

  // Step 4: Calculate h_out
  addStep(
    12,
    "Calculate Output Height Dimension",
    `Computed spatial output height h_out = (${hIn} - 1) * ${stride} - 2 * ${padding} + ${kH} + ${outputPadding} = ${hOut}.`,
    { hOut, hIn, stride, padding, kH, outputPadding },
  );

  // Step 5: Calculate w_out
  addStep(
    13,
    "Calculate Output Width Dimension",
    `Computed spatial output width w_out = (${wIn} - 1) * ${stride} - 2 * ${padding} + ${kW} + ${outputPadding} = ${wOut}.`,
    { wOut, wIn, stride, padding, kW, outputPadding },
  );

  // Step 6: Allocate output buffer
  addStep(
    15,
    "Initialize Output Matrix Buffer",
    `Allocated ${hOut}x${wOut} output map initialized with 0.0 floats.`,
    { hOut, wOut },
  );

  // Scatter loop over input map
  for (let rIn = 0; rIn < hIn; rIn++) {
    addStep(
      17,
      `Outer Row Loop: r_in = ${rIn}`,
      `Iterating over input row r_in = ${rIn} of ${hIn - 1}.`,
      { rIn, hIn },
    );

    for (let cIn = 0; cIn < wIn; cIn++) {
      addStep(
        18,
        `Inner Column Loop: c_in = ${cIn}`,
        `Accessing input coordinate (${rIn}, ${cIn}).`,
        { rIn, cIn },
      );

      const val = inputMap[rIn][cIn];
      addStep(
        19,
        `Read Input Activation: val = ${val}`,
        `Loaded scalar activation val = ${val} at input position (${rIn}, ${cIn}).`,
        { rIn, cIn, val },
      );

      for (let kr = 0; kr < kH; kr++) {
        addStep(
          20,
          `Kernel Row Loop: kr = ${kr}`,
          `Scanning deconvolution kernel row kr = ${kr} of ${kH - 1}.`,
          { rIn, cIn, val, kr },
        );

        for (let kc = 0; kc < kW; kc++) {
          addStep(
            21,
            `Kernel Col Loop: kc = ${kc}`,
            `Scanning deconvolution kernel column kc = ${kc} of ${kW - 1}.`,
            { rIn, cIn, val, kr, kc },
          );

          const rOut = rIn * stride + kr - padding;
          addStep(
            22,
            `Map Output Row Index: r_out = ${rOut}`,
            `Evaluated r_out = ${rIn} * ${stride} + ${kr} - ${padding} = ${rOut}.`,
            { rIn, stride, kr, padding, rOut },
          );

          const cOut = cIn * stride + kc - padding;
          addStep(
            23,
            `Map Output Column Index: c_out = ${cOut}`,
            `Evaluated c_out = ${cIn} * ${stride} + ${kc} - ${padding} = ${cOut}.`,
            { cIn, stride, kc, padding, cOut },
          );

          const inside = rOut >= 0 && rOut < hOut && cOut >= 0 && cOut < wOut;
          addStep(
            24,
            `Check Output Boundary: (${rOut}, ${cOut}) inside grid? ${inside}`,
            `Verified spatial bounds: 0 <= ${rOut} < ${hOut} and 0 <= ${cOut} < ${wOut} -> ${inside}.`,
            { rOut, cOut, hOut, wOut, inside },
            rOut,
            cOut,
          );

          if (inside) {
            const kerWeight = kernel[kr][kc];
            const prod = val * kerWeight;
            outputMap[rOut][cOut] += prod;

            addStep(
              25,
              `Scatter Accumulate: output[${rOut}][${cOut}] += ${val} * ${kerWeight} = ${prod}`,
              `Accumulated product ${prod.toFixed(1)} into output coordinate (${rOut}, ${cOut}). New value: ${outputMap[rOut][cOut].toFixed(1)}.`,
              { rOut, cOut, val, kerWeight, prod, newOutput: outputMap[rOut][cOut] },
              rOut,
              cOut,
            );
          }
        }
      }
    }
  }

  // Step final
  addStep(
    27,
    "Execution Complete",
    `Finished transposed 2D convolution index mapping. Output spatial shape ${hOut}x${wOut}.`,
    { completed: true, hOut, wOut },
  );

  return steps;
};

const TRANSPOSEDCONV2DDECONVINDEXMAPPER_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 8, 11, 14, 16, 26],
  distractors: [
    "output_map[r_out][c_out] = val * kernel[kr][kc]",
    "h_out = h_in * stride",
    "r_out = r_in // stride + kr",
    "output_map[r_in][c_in] += val",
  ],
  hints: [
    {
      line: 12,
      hint: "Spatial output height formula: H_out = (H_in - 1) * stride - 2 * padding + K_h + output_padding.",
    },
    {
      line: 22,
      hint: "Direct scatter index equation: r_out = r_in * stride + kr - padding.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for transposed 2D convolution index mapper function.",
    2: "Docstring opening delimiter tag.",
    3: "Describes transposed 2D convolution (deconvolution) via direct index mapping.",
    4: "Docstring formula explanation section header.",
    5: "Docstring formula line for spatial output height H_out.",
    6: "Docstring formula line for spatial output width W_out.",
    7: "Docstring note explaining zero-copy index mapping advantage.",
    8: "Docstring closing delimiter tag.",
    9: "Measures height h_in and width w_in of input activation map.",
    10: "Measures height k_h and width k_w of deconvolution filter kernel.",
    11: "Blank line before output dimension calculation.",
    12: "Calculates spatial output height h_out using upsampling dimension formula.",
    13: "Calculates spatial output width w_out using upsampling dimension formula.",
    14: "Blank line before output matrix allocation.",
    15: "Allocates output feature map matrix of shape h_out x w_out filled with zero floats.",
    16: "Blank line separating allocation from scatter loops.",
    17: "Iterates over input activation map row index r_in from 0 to h_in - 1.",
    18: "Iterates over input activation map column index c_in from 0 to w_in - 1.",
    19: "Loads scalar activation value val from input_map[r_in][c_in].",
    20: "Iterates over deconvolution kernel row index kr from 0 to k_h - 1.",
    21: "Iterates over deconvolution kernel column index kc from 0 to k_w - 1.",
    22: "Calculates scatter destination row index r_out = r_in * stride + kr - padding.",
    23: "Calculates scatter destination column index c_out = c_in * stride + kc - padding.",
    24: "Checks if destination coordinate (r_out, c_out) lies inside valid output map bounds.",
    25: "Accumulates scaled filter product val * kernel[kr][kc] into output_map[r_out][c_out].",
    26: "Blank line separating scatter loops from return statement.",
    27: "Returns final upsampled 2D feature map matrix output_map.",
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
      "Transposed 2D Convolution (also known as Deconvolution or Fractionally Strided Convolution) is used to upsample spatial feature map resolutions in deep generative models (GANs, Autoencoders, Stable Diffusion) and semantic segmentation networks (U-Net, FCN). Mathematically, transposed convolution acts as the backward pass of a standard convolution. Instead of inserting zeroes between input pixels to build an explicit sparse grid, high-performance engines map input indices directly into output spatial locations using index mapping equations $r_{out} = r_{in} \\cdot S + kr - P$, scattering input pixel values scaled by the filter kernel into overlapping output regions.\n\n### Why It Exists\nStandard convolution downsamples spatial resolution. Transposed convolution reverses this spatial gradient, mapping lower-resolution bottleneck representations back into high-resolution pixel space during decoder execution.\n\n### Mathematical Formulation\nGiven spatial input dimensions $(H_{in}, W_{in})$, kernel size $(K_h, K_w)$, stride $S$, padding $P$, and output padding $OP$, spatial output dimensions $(H_{out}, W_{out})$ and scatter indices $(r_{out}, c_{out})$ are defined as:\n\n$$H_{out} = (H_{in} - 1) \\cdot S - 2P + K_h + OP$$\n\n$$W_{out} = (W_{in} - 1) \\cdot S - 2P + K_w + OP$$\n\n$$r_{out} = r_{in} \\cdot S + kr - P, \\quad c_{out} = c_{in} \\cdot S + kc - P$$\n\n$$Y[r_{out}, c_{out}] += X[r_{in}, c_{in}] \\cdot W[kr, kc]$$\n\n### Step-by-Step Intuition\n1. **Dimension Evaluation**: Compute spatial target grid dimensions $(H_{out}, W_{out})$.\n2. **Anchor Projection**: Project input coordinate $(r_{in}, c_{in})$ to top-left output anchor $(r_{in} \\cdot S - P, c_{in} \\cdot S - P)$.\n3. **Kernel Scatter**: For each filter cell $(kr, kc)$, multiply scalar input activation $X[r_{in}, c_{in}]$ by filter weight $W[kr, kc]$.\n4. **Overlapping Accumulation**: Add product terms into output position $(r_{out}, c_{out})$, handling overlapping patches when $S < K$.\n\n### Key Trade-Offs & Hardware Execution\n- **Zero-Copy Direct Scatter**: Naive implementations insert $(S - 1)$ zeroes between input elements, incurring $O(S^2)$ wasted memory bandwidth. Direct index mapping computes destination addresses on-the-fly inside GPU warp registers.\n- **Checkerboard Artifacts**: When kernel size $K$ is not divisible by stride $S$, overlapping scatter patterns produce unequal accumulation frequencies, creating visible grid artifacts. Bilinear upsampling followed by standard convolution is an alternative pattern.",
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
        outputDisplay: "Output: 4x4 upsampled feature map",
        input: DEFAULT_TRANSPOSEDCONV2DDECONVINDEXMAPPER_INPUT,
        output: "4x4 upsampled matrix",
        explanation:
          "Upsamples 2x2 input activations to 4x4 output grid using 2x2 kernel with stride 2.",
      },
    ],
    code: TRANSPOSEDCONV2DDECONVINDEXMAPPER_CODE,
    timeComplexity: {
      best: "O(H_{in} \\cdot W_{in} \\cdot K_h \\cdot K_w)",
      average: "O(H_{in} \\cdot W_{in} \\cdot K_h \\cdot K_w)",
      worst: "O(H_{in} \\cdot W_{in} \\cdot K_h \\cdot K_w)",
    },
    spaceComplexity: "O(H_{out} \\cdot W_{out})",
    complexityAnalysis: {
      time: "Linear in total number of kernel scatter accumulation steps $O(H_{in} \\cdot W_{in} \\cdot K_h \\cdot K_w)$.",
      space: "Allocates memory for the output upsampled feature map tensor of size $O(H_{out} \\cdot W_{out})$.",
    },
    topicGuide: {
      overview:
        "Transposed 2D Convolution performs spatial upsampling by scattering input activations into larger output feature maps.",
      sections: [
        {
          heading: "Overview & Mathematical Formulation",
          body: "Standard convolution downsamples spatial resolutions. Transposed convolution reverses this spatial gradient, mapping lower-resolution bottleneck features back to high-resolution image space (e.g. in U-Net decoder branches). Direct index mapping computes r_out = r_in * stride + kr - padding and c_out = c_in * stride + kc - padding.",
        },
        {
          heading: "Core Concepts & Scatter Accumulation",
          body: "1. Direct Index Mapping: Maps each input element at (r_in, c_in) to an output patch starting at (r_in * stride, c_in * stride).\n2. Scatter Accumulation: Overlapping output patches accumulate weight products iteratively.\n3. Output Shape Formula: H_out = (H_in - 1) * stride - 2 * padding + K_h + output_padding.",
        },
        {
          heading: "Systems & Performance Impact",
          body: "Naive implementations expand input tensors with sparse zeros (inserting stride-1 zeros), wasting memory bandwidth and FLOPs on zero multiplication. Direct index mapping eliminates zero-padding overhead completely.",
        },
        {
          heading: "Implementation Nuances & Production Artifacts",
          body: "Checkerboard artifacts occur when kernel size is not divisible by stride. Using resize-convolution (nearest-neighbor or bilinear interpolation followed by standard convolution) is often an alternative to eliminate artifacts.",
        },
      ],
      keyTerms: [
        {
          term: "Transposed Convolution",
          definition:
            "Spatial upsampling operation scattering input activations across filter kernel footprints on an enlarged output grid.",
        },
        {
          term: "Direct Index Mapping",
          definition:
            "Address calculation technique computing output scatter coordinates dynamically without zero-padded intermediate tensors.",
        },
        {
          term: "Checkerboard Artifact",
          definition:
            "Visual high-frequency pattern caused by uneven accumulation frequencies when kernel size is not divisible by stride.",
        },
        {
          term: "Output Padding",
          definition:
            "Extra spatial padding parameter resolving dimension ambiguity in reverse strided convolutions.",
        },
      ],
    },
    trivia: TRANSPOSEDCONV2DDECONVINDEXMAPPER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_TRANSPOSEDCONV2DDECONVINDEXMAPPER_INPUT,
    generateSteps: generateTransposedConv2dDeconvIndexMapperSteps,
  };
