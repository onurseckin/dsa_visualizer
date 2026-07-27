import type { AlgorithmDefinition, AlgorithmStep, GridCellNode } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface multiChannelConv2dAccumulationInput {
  image?: number[][][];
  kernels?: number[][][][];
  stride?: number;
  padding?: number;
  data?: number[];
  target?: number;
}

export const MULTICHANNELCONV2DACCUMULATION_CODE = `def multi_channel_conv2d_accumulation(image, kernels, stride=1, padding=0):
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

    return output`;

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

  const image = input.image || [
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
  ];

  const kernels = input.kernels || [
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
  ];

  const stride = input.stride ?? 1;
  const padding = input.padding ?? 0;

  const cOut = kernels.length;
  const cIn = kernels[0].length;
  const kH = kernels[0][0].length;
  const kW = kernels[0][0][0].length;

  const hIn = image.length;
  const wIn = image[0].length;

  const hOut = Math.floor((hIn + 2 * padding - kH) / stride) + 1;
  const wOut = Math.floor((wIn + 2 * padding - kW) / stride) + 1;

  const output: number[][][] = Array.from({ length: cOut }, () =>
    Array.from({ length: hOut }, () => Array(wOut).fill(0)),
  );

  const createGrid = (
    currentCo: number = 0,
    activeR: number = -1,
    activeC: number = -1,
  ): GridCellNode[][] => {
    return output[currentCo].map((row, r) =>
      row.map((val, c) => {
        let state: "default" | "active" | "compare" | "visited" = "default";
        if (r === activeR && c === activeC) {
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
    currentCo: number = 0,
    activeR: number = -1,
    activeC: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "grid",
        grid: createGrid(currentCo, activeR, activeC),
      },
      auxiliaryState: {
        customState: {
          "Tensor Layout": `(C_out=${cOut}, C_in=${cIn}, H=${hIn}, W=${wIn})`,
          "Kernel Layout": `(C_out=${cOut}, C_in=${cIn}, K_h=${kH}, K_w=${kW})`,
          "Output Channel": `Filter ${currentCo + 1} of ${cOut}`,
          "Spatial Output": `${hOut} x ${wOut}`,
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Initialize Multi-Channel Conv2D Accumulator Engine",
    `Started multi-channel convolution with C_out=${cOut}, C_in=${cIn}, spatial input (${hIn}x${wIn}), filter (${kH}x${kW}), stride=${stride}, padding=${padding}.`,
    { cOut, cIn, kH, kW, hIn, wIn, stride, padding },
  );

  // Step 2: Extract c_out
  addStep(
    8,
    "Extract Output Channels Count c_out",
    `Number of filter kernels (output channels): c_out = ${cOut}.`,
    { cOut },
  );

  // Step 3: Extract c_in
  addStep(
    9,
    "Extract Input Channels Count c_in",
    `Number of input feature map channels: c_in = ${cIn}.`,
    { cIn },
  );

  // Step 4: Extract k_h, k_w
  addStep(
    10,
    "Extract Kernel Spatial Dimensions k_h, k_w",
    `Spatial filter dimensions: k_h = ${kH}, k_w = ${kW}.`,
    { kH, kW },
  );

  // Step 5: Extract h_in, w_in
  addStep(
    12,
    "Extract Input Spatial Dimensions h_in, w_in",
    `Input activation map spatial dimensions: h_in = ${hIn}, w_in = ${wIn}.`,
    { hIn, wIn },
  );

  // Step 6: Calculate h_out
  addStep(
    13,
    "Calculate Output Spatial Height h_out",
    `Computed output feature height h_out = (${hIn} + 2 * ${padding} - ${kH}) // ${stride} + 1 = ${hOut}.`,
    { hOut, hIn, kH, stride, padding },
  );

  // Step 7: Calculate w_out
  addStep(
    14,
    "Calculate Output Spatial Width w_out",
    `Computed output feature width w_out = (${wIn} + 2 * ${padding} - ${kW}) // ${stride} + 1 = ${wOut}.`,
    { wOut, wIn, kW, stride, padding },
  );

  // Step 8: Allocate output
  addStep(
    16,
    "Allocate Output Tensor Buffer",
    `Allocated 3D output tensor of shape (${cOut}, ${hOut}, ${wOut}) filled with 0.0.`,
    { cOut, hOut, wOut },
  );

  // 6D Nested Convolution Loop
  for (let co = 0; co < cOut; co++) {
    addStep(
      18,
      `Outer Filter Channel Loop: co = ${co}`,
      `Evaluating filter kernel co = ${co} of ${cOut - 1} producing output channel ${co}.`,
      { co, cOut },
      co,
    );

    for (let r = 0; r < hOut; r++) {
      addStep(
        19,
        `Spatial Row Loop: r = ${r}`,
        `Scanning output feature map row r = ${r} of ${hOut - 1} for filter ${co}.`,
        { co, r, hOut },
        co,
      );

      for (let c = 0; c < wOut; c++) {
        addStep(
          20,
          `Spatial Col Loop: c = ${c}`,
          `Scanning output spatial position (${r}, ${c}) for filter ${co}.`,
          { co, r, c, wOut },
          co,
          r,
          c,
        );

        let acc = 0.0;
        addStep(
          21,
          `Reset Cross-Channel Dot Product Accumulator`,
          `Initialized acc = 0.0 for output coordinate (${co}, ${r}, ${c}).`,
          { co, r, c, acc },
          co,
          r,
          c,
        );

        for (let ci = 0; ci < cIn; ci++) {
          addStep(
            22,
            `Input Channel Loop: ci = ${ci}`,
            `Scanning input channel ci = ${ci} of ${cIn - 1}.`,
            { co, r, c, ci, cIn },
            co,
            r,
            c,
          );

          for (let kr = 0; kr < kH; kr++) {
            addStep(
              23,
              `Kernel Row Loop: kr = ${kr}`,
              `Scanning kernel row kr = ${kr} of ${kH - 1}.`,
              { co, r, c, ci, kr },
              co,
              r,
              c,
            );

            for (let kc = 0; kc < kW; kc++) {
              const ir = r * stride + kr - padding;
              const ic = c * stride + kc - padding;

              addStep(
                25,
                `Map Spatial Image Index: ir = ${ir}`,
                `Evaluated ir = ${r} * ${stride} + ${kr} - ${padding} = ${ir}.`,
                { r, stride, kr, padding, ir },
                co,
                r,
                c,
              );

              addStep(
                26,
                `Map Spatial Image Index: ic = ${ic}`,
                `Evaluated ic = ${c} * ${stride} + ${kc} - ${padding} = ${ic}.`,
                { c, stride, kc, padding, ic },
                co,
                r,
                c,
              );

              const inside = ir >= 0 && ir < hIn && ic >= 0 && ic < wIn;
              addStep(
                27,
                `Check Boundary: (${ir}, ${ic}) inside image? ${inside}`,
                `Verified spatial bounds: 0 <= ${ir} < ${hIn} and 0 <= ${ic} < ${wIn} -> ${inside}.`,
                { ir, ic, hIn, wIn, inside },
                co,
                r,
                c,
              );

              if (inside) {
                const imgVal = image[ci][ir][ic];
                const kerVal = kernels[co][ci][kr][kc];
                const prod = imgVal * kerVal;
                acc += prod;

                addStep(
                  28,
                  `Accumulate Term: img[${ci}][${ir}][${ic}] * ker[${co}][${ci}][${kr}][${kc}] = ${imgVal} * ${kerVal} = ${prod}`,
                  `Updated cross-channel accumulator acc = ${acc.toFixed(1)} for output (${co}, ${r}, ${c}).`,
                  { co, r, c, ci, kr, kc, ir, ic, imgVal, kerVal, prod, acc },
                  co,
                  r,
                  c,
                );
              }
            }
          }
        }

        output[co][r][c] = acc;
        addStep(
          29,
          `Write Output Activation: output[${co}][${r}][${c}] = ${acc.toFixed(1)}`,
          `Stored completed cross-channel dot product ${acc.toFixed(1)} into feature map (${co}, ${r}, ${c}).`,
          { co, r, c, "output[co][r][c]": acc },
          co,
          r,
          c,
        );
      }
    }
  }

  // Step final
  addStep(
    31,
    "Execution Complete",
    `Finished multi-channel 2D convolution spatial & cross-channel accumulation. Output shape (${cOut}, ${hOut}, ${wOut}).`,
    { completed: true, cOut, hOut, wOut },
    0,
  );

  return steps;
};

const MULTICHANNELCONV2DACCUMULATION_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 11, 15, 17, 30],
  distractors: [
    "acc += image[co][ir][ic] * kernels[ci][kr][kc]",
    "output[co][r][c] = sum(image * kernels)",
    "h_out = (h_in - k_h) // stride",
    "acc *= image[ci][ir][ic]",
  ],
  hints: [
    {
      line: 28,
      hint: "Accumulate products across spatial and input channel dimensions: image[ci][ir][ic] * kernels[co][ci][kr][kc].",
    },
    {
      line: 13,
      hint: "Output spatial height equation: h_out = (h_in + 2*padding - k_h) // stride + 1.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for multi-channel 2D convolution spatial & cross-channel accumulation function.",
    2: "Docstring opening delimiter tag.",
    3: "Describes multi-channel 2D convolution sliding 3D kernel volumes over 3D feature maps.",
    4: "Docstring section header explaining cross-channel dot product accumulation.",
    5: "Docstring continuation tag.",
    6: "Docstring continuation tag.",
    7: "Docstring closing delimiter tag.",
    8: "Measures number of output feature channels c_out from filter kernel array length.",
    9: "Measures number of input channels c_in from first filter kernel volume.",
    10: "Measures kernel spatial filter height k_h and width k_w.",
    11: "Blank line before input dimension extraction.",
    12: "Measures input feature map spatial height h_in and width w_in.",
    13: "Calculates spatial output feature height h_out using integer division floor.",
    14: "Calculates spatial output feature width w_out using integer division floor.",
    15: "Blank line before output tensor buffer allocation.",
    16: "Allocates 3D output feature tensor of shape (c_out, h_out, w_out) filled with zero floats.",
    17: "Blank line separating tensor allocation from convolution loops.",
    18: "Iterates over output feature channel index co from 0 to c_out - 1.",
    19: "Iterates over output feature map row coordinate r from 0 to h_out - 1.",
    20: "Iterates over output feature map column coordinate c from 0 to w_out - 1.",
    21: "Resets cross-channel dot product accumulator acc to 0.0 for coordinate (co, r, c).",
    22: "Iterates over input feature map channel index ci from 0 to c_in - 1.",
    23: "Iterates over spatial kernel filter row tap kr from 0 to k_h - 1.",
    24: "Iterates over spatial kernel filter column tap kc from 0 to k_w - 1.",
    25: "Calculates spatial image row index ir = r * stride + kr - padding.",
    26: "Calculates spatial image column index ic = c * stride + kc - padding.",
    27: "Checks if spatial coordinate (ir, ic) lies within valid input image bounds.",
    28: "Multiplies input channel pixel with kernel weight and accumulates into acc.",
    29: "Stores completed cross-channel dot product acc into output tensor at (co, r, c).",
    30: "Blank line separating convolution loops from return statement.",
    31: "Returns final 3D feature map tensor output.",
  },
};

export const multiChannelConv2dAccumulation: AlgorithmDefinition<multiChannelConv2dAccumulationInput> =
  {
    id: "multiChannelConv2dAccumulation",
    title: "Multi-Channel Conv2D Accumulator Engine",
    category: "ml_convolutions",
    categories: ["ml_convolutions", "ml_hardware_kernels"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_convolutions",
    description:
      "Multi-Channel 2D Convolution is the foundation of modern Convolutional Neural Networks (ResNet, VGG, ConvNeXt). Standard deep learning layers process multi-channel input feature maps $X \\in \\mathbb{R}^{C_{in} \\times H_{in} \\times W_{in}}$ using a bank of $C_{out}$ 3D filter kernels $W \\in \\mathbb{R}^{C_{out} \\times C_{in} \\times K_h \\times K_w}$. For each output channel $co$, the layer computes a 3D inner product across both spatial dimensions $(K_h, K_w)$ and cross-channel depth $C_{in}$.\n\n### Why It Exists\nSingle-channel 2D convolution extracts only 2D spatial texture. Multi-channel convolution combines spatial context across $C_{in}$ input feature representations (such as RGB color channels or deep activation channels), allowing networks to learn rich hierarchical cross-channel patterns.\n\n### Mathematical Formulation\nGiven input tensor $X \\in \\mathbb{R}^{C_{in} \\times H \\times W}$, filter weights $W \\in \\mathbb{R}^{C_{out} \\times C_{in} \\times K_h \\times K_w}$, stride $S$, and padding $P$, spatial output dimensions $(H_{out}, W_{out})$ and feature tensor values $Y[co, r, c]$ are defined as:\n\n$$H_{out} = \\left\\lfloor \\frac{H + 2P - K_h}{S} \\right\\rfloor + 1, \\quad W_{out} = \\left\\lfloor \\frac{W + 2P - K_w}{S} \\right\\rfloor + 1$$\n\n$$Y[co, r, c] = \\sum_{ci=0}^{C_{in}-1} \\sum_{kr=0}^{K_h-1} \\sum_{kc=0}^{K_w-1} X[ci, \\, r \\cdot S + kr - P, \\, c \\cdot S + kc - P] \\cdot W[co, ci, kr, kc]$$\n\n### Step-by-Step Intuition\n1. **Filter Selection**: Loop over each output feature channel $co \\in [0, C_{out}-1]$.\n2. **Spatial Window Placement**: Position 3D kernel volume at output pixel $(r, c)$.\n3. **3D Inner Product**: For every input channel $ci$, multiply overlapping spatial pixels by filter weights across $K_h \\times K_w$.\n4. **Cross-Channel Accumulation**: Sum all $C_{in} \\cdot K_h \\cdot K_w$ terms into a single scalar $Y[co, r, c]$.\n\n### Key Trade-Offs & Hardware Execution\n- **FLOPs Complexity**: Total computation cost is $2 \\cdot C_{out} \\cdot C_{in} \\cdot K_h \\cdot K_w \\cdot H_{out} \\cdot W_{out}$ FLOPs.\n- **Depthwise Separable Optimization**: Standard multi-channel convolution couples spatial and cross-channel operations ($O(C_{out} C_{in} K^2 HW)$). Depthwise Separable Convolution decouples them into Depthwise ($O(C_{in} K^2 HW)$) + Pointwise 1x1 ($O(C_{out} C_{in} HW)$), reducing compute by 8x-9x.",
    constraints: [
      "1 <= C_in, C_out <= 256",
      "1 <= H_in, W_in <= 512",
      "1 <= K_h, K_w <= 11",
      "stride >= 1",
    ],
    examples: [
      {
        kind: "basic",
        title: "2-Channel Input with 2 Output Filters",
        inputDisplay: "C_in=2, C_out=2, Image 3x3, Kernel 2x2",
        outputDisplay: "Output shape (2, 2, 2)",
        input: DEFAULT_MULTICHANNELCONV2DACCUMULATION_INPUT,
        output: "2x2x2 output feature map tensor",
        explanation: "Computes 3D cross-channel inner products for 2 output filter channels.",
      },
    ],
    code: MULTICHANNELCONV2DACCUMULATION_CODE,
    timeComplexity: {
      best: "O(C_{out} \\cdot C_{in} \\cdot H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
      average: "O(C_{out} \\cdot C_{in} \\cdot H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
      worst: "O(C_{out} \\cdot C_{in} \\cdot H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
    },
    spaceComplexity: "O(C_{out} \\cdot H_{out} \\cdot W_{out})",
    complexityAnalysis: {
      time: "Requires $O(C_{out} \\cdot C_{in} \\cdot H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)$ floating-point operations across all spatial and channel loops.",
      space: "Allocates memory for the 3D output feature map tensor of size $O(C_{out} \\cdot H_{out} \\cdot W_{out})$.",
    },
    topicGuide: {
      overview:
        "The **Multi-Channel Conv2D Accumulator Engine** computes 3D spatial and cross-channel inner products, forming the core operation of modern Convolutional Neural Networks.",
      sections: [
        {
          heading: "1. Core Concept & 3D Cross-Channel Accumulation",
          body: "Multi-channel 2D convolution applies 3D filter kernels ($C_{in} \\times K_h \\times K_w$) over 3D activation maps. Summing across all input channels $ci$ aggregates spatial patterns across feature channels into single output scalars $Y[co, r, c]$.",
        },
        {
          heading: "2. Systems & Memory Layout Roofline",
          body: "In NCHW data layout, spatial pixels across channels are separated in memory. In NHWC layout, channels for a given pixel sit contiguously in memory, enabling vector memory loads (e.g. 128-bit SIMD reads of 4 channels at once) for high operational intensity.",
        },
        {
          heading: "3. Implementation Nuances & im2col Lowering",
          body: "Standard multi-channel convolution is lowered to GEMM via `im2col`: $W$ ($C_{out} \\times (C_{in} K_h K_w)$) multiplied by $X_{col}$ ($(C_{in} K_h K_w) \\times (H_{out} W_{out})$) yields $Y_{col}$ ($C_{out} \\times (H_{out} W_{out})$).",
        },
        {
          heading: "4. Edge Case Analysis & Production Safeguards",
          body: "Asymmetric channel counts (e.g., $C_{in}=3$ RGB input mapped to $C_{out}=64$ features) require exact tensor shape alignment checks during graph compilation.",
        },
      ],
      keyTerms: [
        {
          term: "Multi-Channel Convolution",
          definition:
            "Convolution accumulating inner products across both 2D spatial dimensions and 1D channel depth.",
        },
        {
          term: "Channel Depth (C_in / C_out)",
          definition:
            "Number of feature maps in the input tensor (C_in) and output filter bank (C_out).",
        },
        {
          term: "3D Filter Kernel",
          definition:
            "Weight volume of shape C_in x K_h x K_w applied to extract local multi-channel features.",
        },
        {
          term: "NHWC vs NCHW",
          definition:
            "Tensor memory layout formats dictating spatial vs channel contiguous memory placement.",
        },
      ],
    },
    trivia: MULTICHANNELCONV2DACCUMULATION_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_MULTICHANNELCONV2DACCUMULATION_INPUT,
    generateSteps: generateMultiChannelConv2dAccumulationSteps,
  };
