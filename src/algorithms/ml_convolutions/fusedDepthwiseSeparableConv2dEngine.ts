import type { AlgorithmDefinition, AlgorithmStep, GridCellNode } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fusedDepthwiseSeparableConv2dEngineInput {
  image?: number[][][];
  depthwiseKernel?: number[][][];
  pointwiseKernel?: number[][];
  stride?: number;
  padding?: number;
  data?: number[];
  target?: number;
}

export const FUSEDDEPTHWISESEPARABLECONV2DENGINE_CODE = `def fused_depthwise_separable_conv2d(image, depthwise_kernel, pointwise_kernel, stride=1, padding=0):
    """
    Fused Depthwise Separable 2D Convolution Engine.
    Phase 1: Depthwise spatial convolution per input channel (1 filter per channel).
    Phase 2: Pointwise 1x1 linear projection across channels (C_in -> C_out).
    Fuses both phases in memory/SRAM to eliminate intermediate memory traffic.
    """
    c_in = len(image)
    h_in, w_in = len(image[0]), len(image[0][0])
    k_h, k_w = len(depthwise_kernel[0]), len(depthwise_kernel[0][0])
    c_out = len(pointwise_kernel)

    h_out = (h_in + 2 * padding - k_h) // stride + 1
    w_out = (w_in + 2 * padding - k_w) // stride + 1

    output = [[[0.0] * w_out for _ in range(h_out)] for _ in range(c_out)]

    for r in range(h_out):
        for c in range(w_out):
            # Compute spatial depthwise convolution vector for pixel (r, c)
            dw_vec = [0.0] * c_in
            for ch in range(c_in):
                acc = 0.0
                for kr in range(k_h):
                    for kc in range(k_w):
                        ir = r * stride + kr - padding
                        ic = c * stride + kc - padding
                        if 0 <= ir < h_in and 0 <= ic < w_in:
                            acc += image[ch][ir][ic] * depthwise_kernel[ch][kr][kc]
                dw_vec[ch] = acc

            # Immediately fuse with pointwise 1x1 channel projection
            for co in range(c_out):
                pw_acc = 0.0
                for ci in range(c_in):
                    pw_acc += dw_vec[ci] * pointwise_kernel[co][ci]
                output[co][r][c] = pw_acc

    return output`;

export const DEFAULT_FUSEDDEPTHWISESEPARABLECONV2DENGINE_INPUT: fusedDepthwiseSeparableConv2dEngineInput =
  {
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
    depthwiseKernel: [
      [
        [1, 0],
        [0, 1],
      ],
      [
        [0, 1],
        [1, 0],
      ],
    ],
    pointwiseKernel: [
      [1, 0.5],
      [0.5, 1],
    ],
    stride: 1,
    padding: 0,
  };

export const generateFusedDepthwiseSeparableConv2dEngineSteps = (
  input: fusedDepthwiseSeparableConv2dEngineInput,
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

  const dwKernel = input.depthwiseKernel || [
    [
      [1, 0],
      [0, 1],
    ],
    [
      [0, 1],
      [1, 0],
    ],
  ];

  const pwKernel = input.pointwiseKernel || [
    [1, 0.5],
    [0.5, 1],
  ];

  const stride = input.stride ?? 1;
  const padding = input.padding ?? 0;

  const cIn = image.length;
  const hIn = image[0].length;
  const wIn = image[0][0].length;

  const kH = dwKernel[0].length;
  const kW = dwKernel[0][0].length;
  const cOut = pwKernel.length;

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
          "Input Tensor": `(C_in=${cIn}, H=${hIn}, W=${wIn})`,
          "Depthwise Kernel": `(C_in=${cIn}, K_h=${kH}, K_w=${kW})`,
          "Pointwise Kernel": `(C_out=${cOut}, C_in=${cIn})`,
          "SRAM Fusion": "Depthwise + Pointwise fused in register file",
          "Output Spatial": `${hOut} x ${wOut}`,
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Fused Depthwise Separable Conv2D Engine Entry",
    `Started fused depthwise separable 2D convolution engine on ${hIn}x${wIn} image with C_in=${cIn}, C_out=${cOut}, DW kernel ${kH}x${kW}, PW kernel 1x1.`,
    { cIn, hIn, wIn, kH, kW, cOut, stride, padding },
  );

  // Step 2: Measure cIn
  addStep(
    8,
    "Extract Input Channels Count c_in",
    `Input feature map channels count c_in = ${cIn}.`,
    { cIn },
  );

  // Step 3: Measure hIn, wIn
  addStep(
    9,
    "Extract Input Spatial Dimensions h_in, w_in",
    `Input spatial dimensions: h_in = ${hIn}, w_in = ${wIn}.`,
    { hIn, wIn },
  );

  // Step 4: Measure kH, kW
  addStep(
    10,
    "Extract Depthwise Spatial Kernel Dimensions k_h, k_w",
    `Depthwise filter kernel spatial dimensions: k_h = ${kH}, k_w = ${kW}.`,
    { kH, kW },
  );

  // Step 5: Measure cOut
  addStep(
    11,
    "Extract Pointwise Output Channels Count c_out",
    `Pointwise 1x1 filter output channels count c_out = ${cOut}.`,
    { cOut },
  );

  // Step 6: Calculate hOut
  addStep(
    13,
    "Calculate Spatial Output Height h_out",
    `Output feature height h_out = (${hIn} + 2 * ${padding} - ${kH}) // ${stride} + 1 = ${hOut}.`,
    { hOut, hIn, kH, stride, padding },
  );

  // Step 7: Calculate wOut
  addStep(
    14,
    "Calculate Spatial Output Width w_out",
    `Output feature width w_out = (${wIn} + 2 * ${padding} - ${kW}) // ${stride} + 1 = ${wOut}.`,
    { wOut, wIn, kW, stride, padding },
  );

  // Step 8: Allocate output
  addStep(
    16,
    "Allocate 3D Output Tensor Buffer",
    `Allocated output tensor buffer of shape (${cOut}, ${hOut}, ${wOut}) filled with 0.0.`,
    { cOut, hOut, wOut },
  );

  // Fused Spatial Loop
  for (let r = 0; r < hOut; r++) {
    addStep(
      18,
      `Outer Spatial Row Loop: r = ${r}`,
      `Processing spatial feature row r = ${r} of ${hOut - 1}.`,
      { r, hOut },
    );

    for (let c = 0; c < wOut; c++) {
      addStep(
        19,
        `Inner Spatial Column Loop: c = ${c}`,
        `Processing spatial pixel location (${r}, ${c}).`,
        { r, c, wOut },
      );

      // Phase 1: Depthwise convolution
      const dwVec: number[] = Array(cIn).fill(0);
      addStep(
        21,
        `Allocate Local SRAM Depthwise Vector dw_vec (c_in = ${cIn})`,
        `Created SRAM register vector dw_vec of size ${cIn} for spatial coordinate (${r}, ${c}).`,
        { r, c, cIn },
      );

      for (let ch = 0; ch < cIn; ch++) {
        let acc = 0.0;
        addStep(
          23,
          `Phase 1 Depthwise: Reset Accumulator for Input Channel ch = ${ch}`,
          `Initialized depthwise spatial accumulator acc = 0.0 for channel ${ch}.`,
          { r, c, ch, acc },
        );

        for (let kr = 0; kr < kH; kr++) {
          for (let kc = 0; kc < kW; kc++) {
            const ir = r * stride + kr - padding;
            const ic = c * stride + kc - padding;
            const inside = ir >= 0 && ir < hIn && ic >= 0 && ic < wIn;

            if (inside) {
              const imgVal = image[ch][ir][ic];
              const kerVal = dwKernel[ch][kr][kc];
              const prod = imgVal * kerVal;
              acc += prod;

              addStep(
                28,
                `Phase 1 DW: image[${ch}][${ir}][${ic}] * dw_kernel[${ch}][${kr}][${kc}] = ${imgVal} * ${kerVal} = ${prod}`,
                `Accumulated depthwise spatial product ${prod.toFixed(1)} for channel ${ch}. Updated acc = ${acc.toFixed(1)}.`,
                { r, c, ch, kr, kc, ir, ic, imgVal, kerVal, prod, acc },
              );
            }
          }
        }

        dwVec[ch] = acc;
        addStep(
          30,
          `Phase 1 DW Complete: Store dw_vec[${ch}] = ${acc.toFixed(1)}`,
          `Stored completed spatial depthwise convolution scalar ${acc.toFixed(1)} into dw_vec[${ch}].`,
          { r, c, ch, "dw_vec[ch]": acc },
        );
      }

      // Phase 2: Pointwise 1x1 projection fusion
      for (let co = 0; co < cOut; co++) {
        let pwAcc = 0.0;
        addStep(
          34,
          `Phase 2 Pointwise Fusion: Reset Accumulator for Output Channel co = ${co}`,
          `Initialized pointwise linear projection accumulator pw_acc = 0.0 for output channel ${co}.`,
          { r, c, co, pwAcc },
          co,
          r,
          c,
        );

        for (let ci = 0; ci < cIn; ci++) {
          const dwVal = dwVec[ci];
          const pwWeight = pwKernel[co][ci];
          const prod = dwVal * pwWeight;
          pwAcc += prod;

          addStep(
            36,
            `Phase 2 PW: dw_vec[${ci}] * pw_kernel[${co}][${ci}] = ${dwVal.toFixed(1)} * ${pwWeight} = ${prod.toFixed(1)}`,
            `Accumulated cross-channel pointwise product ${prod.toFixed(1)}. Updated pw_acc = ${pwAcc.toFixed(1)}.`,
            { r, c, co, ci, dwVal, pwWeight, prod, pwAcc },
            co,
            r,
            c,
          );
        }

        output[co][r][c] = pwAcc;
        addStep(
          37,
          `Fused Output Write: output[${co}][${r}][${c}] = ${pwAcc.toFixed(1)}`,
          `Wrote fused depthwise-separable output activation ${pwAcc.toFixed(1)} into feature map (${co}, ${r}, ${c}).`,
          { co, r, c, "output[co][r][c]": pwAcc },
          co,
          r,
          c,
        );
      }
    }
  }

  // Final step
  addStep(
    39,
    "Execution Complete",
    `Finished fused depthwise separable 2D convolution execution. Output shape (${cOut}, ${hOut}, ${wOut}).`,
    { completed: true, cOut, hOut, wOut },
    0,
  );

  return steps;
};

const FUSEDDEPTHWISESEPARABLECONV2DENGINE_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 12, 15, 17, 20, 24, 25, 26, 27, 29, 31, 32, 35, 38],
  distractors: [
    "dw_vec[ch] = sum(image * pointwise_kernel)",
    "output[co][r][c] = dw_vec[co] * pointwise_kernel[co][co]",
    "h_out = (h_in - k_h) // stride",
    "pw_acc *= dw_vec[ci]",
  ],
  hints: [
    {
      line: 28,
      hint: "Phase 1 Depthwise applies separate spatial 2D filters per input channel.",
    },
    {
      line: 36,
      hint: "Phase 2 Pointwise applies 1x1 cross-channel linear combination: dw_vec[ci] * pointwise_kernel[co][ci].",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for fused depthwise separable 2D convolution engine function.",
    2: "Docstring opening delimiter tag.",
    3: "Describes fused depthwise separable 2D convolution architecture.",
    4: "Docstring Phase 1 detailing depthwise spatial convolution per input channel.",
    5: "Docstring Phase 2 detailing pointwise 1x1 linear projection across channels.",
    6: "Docstring note explaining SRAM fusion eliminating intermediate DRAM memory traffic.",
    7: "Docstring closing delimiter tag.",
    8: "Measures number of input channels c_in from image array length.",
    9: "Measures input feature map spatial height h_in and width w_in.",
    10: "Measures depthwise spatial kernel height k_h and width k_w.",
    11: "Measures number of output channels c_out from pointwise kernel length.",
    12: "Blank line before output shape calculation.",
    13: "Calculates spatial output height h_out using integer division floor.",
    14: "Calculates spatial output width w_out using integer division floor.",
    15: "Blank line before output buffer allocation.",
    16: "Allocates 3D output feature tensor of shape (c_out, h_out, w_out) filled with zero floats.",
    17: "Blank line separating tensor allocation from fused spatial loop.",
    18: "Iterates over output spatial row coordinate r from 0 to h_out - 1.",
    19: "Iterates over output spatial column coordinate c from 0 to w_out - 1.",
    20: "Comment for computing spatial depthwise convolution vector for pixel (r, c).",
    21: "Allocates local SRAM depthwise vector dw_vec of size c_in filled with zero floats.",
    22: "Iterates over input feature channel ch from 0 to c_in - 1.",
    23: "Resets depthwise spatial accumulator acc to 0.0 for channel ch.",
    24: "Iterates over depthwise kernel spatial row kr from 0 to k_h - 1.",
    25: "Iterates over depthwise kernel spatial column kc from 0 to k_w - 1.",
    26: "Calculates spatial image row index ir = r * stride + kr - padding.",
    27: "Calculates spatial image column index ic = c * stride + kc - padding.",
    28: "Checks if spatial coordinate (ir, ic) lies within valid image bounds.",
    29: "Multiplies channel pixel image[ch][ir][ic] by depthwise weight and accumulates into acc.",
    30: "Stores completed depthwise spatial scalar acc into dw_vec[ch].",
    31: "Blank line before Phase 2 Pointwise fusion.",
    32: "Comment for immediate fusion with pointwise 1x1 channel projection.",
    33: "Iterates over output feature channel index co from 0 to c_out - 1.",
    34: "Resets pointwise accumulator pw_acc to 0.0 for output channel co.",
    35: "Iterates over input feature channel index ci from 0 to c_in - 1.",
    36: "Multiplies depthwise scalar dw_vec[ci] by pointwise weight and accumulates into pw_acc.",
    37: "Stores completed fused activation pw_acc into output tensor at (co, r, c).",
    38: "Blank line separating fused loops from return statement.",
    39: "Returns final 3D feature map tensor output.",
  },
};

export const fusedDepthwiseSeparableConv2dEngine: AlgorithmDefinition<fusedDepthwiseSeparableConv2dEngineInput> =
  {
    id: "fusedDepthwiseSeparableConv2dEngine",
    title: "Fused Depthwise Separable Conv2D Engine",
    category: "ml_convolutions",
    categories: ["ml_convolutions", "ml_hardware_kernels"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_convolutions",
    description:
      "Fused Depthwise Separable 2D Convolution (pioneered in MobileNet V1-V3, Xception, and EfficientNet) factorizes standard multi-channel convolution into two decoupled operations: **Depthwise Convolution** (applying a spatial $K_h \\times K_w$ filter independently to each input channel $C_{in}$) followed by **Pointwise Convolution** (computing a $1 \\times 1$ linear projection across channels from $C_{in} \\to C_{out}$). Hardware kernel fusion executes both phases inside GPU/NPU SRAM register files for each spatial pixel $(r, c)$, eliminating intermediate DRAM memory roundtrips.\n\n### Why It Exists\nStandard convolution requires $C_{out} \\cdot C_{in} \\cdot K_h \\cdot K_w \\cdot H_{out} \\cdot W_{out}$ FLOPs. Depthwise Separable Convolution requires only $(C_{in} \\cdot K_h \\cdot K_w + C_{out} \\cdot C_{in}) \\cdot H_{out} \\cdot W_{out}$ FLOPs, achieving an **8x-9x reduction in total computational complexity** with negligible accuracy degradation.\n\n### Mathematical Formulation\nGiven input tensor $X \\in \\mathbb{R}^{C_{in} \\times H \\times W}$, depthwise kernel $W_{dw} \\in \\mathbb{R}^{C_{in} \\times K_h \\times K_w}$, and pointwise kernel $W_{pw} \\in \\mathbb{R}^{C_{out} \\times C_{in}}$:\n\n$$1. \\quad \\text{dw\\_vec}[ch] = \\sum_{kr=0}^{K_h-1} \\sum_{kc=0}^{K_w-1} X[ch, \\, r \\cdot S + kr - P, \\, c \\cdot S + kc - P] \\cdot W_{dw}[ch, kr, kc]$$\n\n$$2. \\quad Y[co, r, c] = \\sum_{ci=0}^{C_{in}-1} \\text{dw\\_vec}[ci] \\cdot W_{pw}[co, ci]$$\n\n$$\\frac{\\text{Depthwise Separable FLOPs}}{\\text{Standard Conv FLOPs}} = \\frac{1}{C_{out}} + \\frac{1}{K_h K_w} \\quad \\approx \\frac{1}{9} \\quad (\\text{for } 3 \\times 3 \\text{ filters})$$\n\n### Step-by-Step Intuition\n1. **Spatial Pixel Focus**: Anchor execution at spatial target coordinate $(r, c)$.\n2. **Phase 1 (Depthwise Spatial Filtering)**: For each input channel $ch \\in [0, C_{in}-1]$, slide $K_h \\times K_w$ filter across spatial neighborhood in channel $ch$ only, storing scalar into local register `dw_vec[ch]`.\n3. **Phase 2 (Pointwise 1x1 Projection)**: Immediately multiply register vector `dw_vec` by $1 \\times 1$ weight matrix $W_{pw} \\in \\mathbb{R}^{C_{out} \\times C_{in}}$ without writing `dw_vec` to DRAM memory.\n4. **Fused Feature Write**: Write $C_{out}$ output activations into $Y[co, r, c]$.\n\n### Key Trade-Offs & Hardware Execution\n- **Memory Bandwidth Bottleneck**: Depthwise 2D convolution has low arithmetic intensity (low FLOPs per memory byte loaded). Fusing Depthwise + Pointwise inside GPU L1/SRAM memory buffers hides latency by converting memory-bound depthwise reads into compute-bound 1x1 matrix multiplies.\n- **Mobile Engine Optimization**: Essential for edge AI accelerators (Apple Neural Engine, Qualcomm Hexagon, ARM Ethos).",
    constraints: [
      "1 <= C_in, C_out <= 512",
      "1 <= H_in, W_in <= 512",
      "1 <= K_h, K_w <= 11",
      "stride >= 1",
    ],
    examples: [
      {
        kind: "basic",
        title: "2-Channel Fused Depthwise Separable Conv",
        inputDisplay: "C_in=2, C_out=2, Image 3x3, DW Kernel 2x2, PW Kernel 2x2",
        outputDisplay: "Output shape (2, 2, 2)",
        input: DEFAULT_FUSEDDEPTHWISESEPARABLECONV2DENGINE_INPUT,
        output: "2x2x2 output feature map tensor",
        explanation: "Fuses depthwise spatial filtering and 1x1 pointwise projection in SRAM registers.",
      },
    ],
    code: FUSEDDEPTHWISESEPARABLECONV2DENGINE_CODE,
    timeComplexity: {
      best: "O((C_{in} \\cdot K_h \\cdot K_w + C_{out} \\cdot C_{in}) \\cdot H_{out} \\cdot W_{out})",
      average: "O((C_{in} \\cdot K_h \\cdot K_w + C_{out} \\cdot C_{in}) \\cdot H_{out} \\cdot W_{out})",
      worst: "O((C_{in} \\cdot K_h \\cdot K_w + C_{out} \\cdot C_{in}) \\cdot H_{out} \\cdot W_{out})",
    },
    spaceComplexity: "O(C_{out} \\cdot H_{out} \\cdot W_{out})",
    complexityAnalysis: {
      time: "Requires $O((C_{in} K_h K_w + C_{out} C_{in}) H_{out} W_{out})$ operations, delivering an 8x-9x FLOP reduction over standard dense convolution.",
      space: "Requires $O(C_{out} H_{out} W_{out})$ memory for output feature map storage; intermediate depthwise vectors are held in $O(C_{in})$ SRAM register space.",
    },
    topicGuide: {
      overview:
        "The **Fused Depthwise Separable Conv2D Engine** factorizes multi-channel convolution into Depthwise spatial filtering and Pointwise 1x1 channel projection, fusing execution in SRAM.",
      sections: [
        {
          heading: "1. Core Concept & Factorization Mathematics",
          body: "Depthwise separable convolution decouples spatial feature extraction (Depthwise: $K_h \\times K_w$ filter per channel) from channel cross-talk (Pointwise: $1 \\times 1$ matrix multiply across channels $C_{in} \\to C_{out}$). Total FLOP reduction ratio is $\\frac{1}{C_{out}} + \\frac{1}{K_h K_w} \\approx \\frac{1}{9}$.",
        },
        {
          heading: "2. Systems & SRAM Register Fusion",
          body: "Unfused implementations write intermediate $C_{in} \\times H_{out} \\times W_{out}$ depthwise feature maps to DRAM memory before reading them back for $1 \\times 1$ pointwise convolution. Hardware kernel fusion holds `dw_vec` in GPU SRAM register files, eliminating 50%+ of memory bandwidth consumption.",
        },
        {
          heading: "3. Implementation Nuances & Mobile Architectures",
          body: "MobileNet V1 used DW $3 \\times 3$ + PW $1 \\times 1$. MobileNet V2 introduced Inverted Residual Blocks (expanding channels before depthwise filtering). MobileNet V3 / ConvNeXt use $5 \\times 5$ or $7 \\times 7$ depthwise kernels for enlarged receptive fields at zero computational penalty.",
        },
        {
          heading: "4. Edge Case Analysis & Production Safeguards",
          body: "Depthwise convolution requires group count equal to channel count (`groups = C_in` in PyTorch Conv2d). Pointwise convolution is implemented via $1 \\times 1$ convolution with `groups = 1`.",
        },
      ],
      keyTerms: [
        {
          term: "Depthwise Convolution",
          definition:
            "Spatial 2D convolution applied independently to each input channel without cross-channel mixing.",
        },
        {
          term: "Pointwise Convolution",
          definition: "1x1 convolution computing linear combinations across channels (C_in -> C_out).",
        },
        {
          term: "SRAM Register Fusion",
          definition:
            "Compiler optimization executing depthwise and pointwise phases sequentially in fast register files without DRAM roundtrips.",
        },
        {
          term: "FLOP Reduction",
          definition: "Complexity reduction ratio ~1/9 achieved by depthwise separable factorization.",
        },
      ],
    },
    trivia: FUSEDDEPTHWISESEPARABLECONV2DENGINE_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_FUSEDDEPTHWISESEPARABLECONV2DENGINE_INPUT,
    generateSteps: generateFusedDepthwiseSeparableConv2dEngineSteps,
  };
