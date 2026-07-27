import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fusedDepthwiseSeparableConv2dEngineInput {
  image: number[][][];
  depthwiseKernel: number[][][];
  pointwiseKernel: number[][];
  stride?: number;
  padding?: number;
}

export const FUSEDDEPTHWISESEPARABLECONV2DENGINE_CODE = `
def fused_depthwise_separable_conv2d(image, depthwise_kernel, pointwise_kernel, stride=1, padding=0):
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

    return output
`;

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

  const image = input.image;
  const dwKernel = input.depthwiseKernel;
  const pwKernel = input.pointwiseKernel;
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

  const flatInput = image.flatMap((ch) => ch.flatMap((row) => row));
  const elements: ArrayElement[] = flatInput.map((val, idx) => ({
    id: `img-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
    customState?: Record<string, string>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          cIn: String(cIn),
          cOut: String(cOut),
          spatialInput: `${hIn}x${wIn}`,
          spatialOutput: `${hOut}x${wOut}`,
          kernelSize: `${kH}x${kW}`,
          ...customState,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Fused Depthwise Separable Conv2D Engine",
    "Setting up depthwise spatial filtering and 1x1 pointwise cross-channel fusion.",
    { cIn, cOut, hIn, wIn, kH, kW, stride, padding },
  );

  const output: number[][][] = Array.from({ length: cOut }, () =>
    Array.from({ length: hOut }, () => Array(wOut).fill(0)),
  );

  for (let r = 0; r < hOut; r++) {
    for (let c = 0; c < wOut; c++) {
      const dwVec: number[] = [];
      for (let ch = 0; ch < cIn; ch++) {
        let acc = 0;
        for (let kr = 0; kr < kH; kr++) {
          for (let kc = 0; kc < kW; kc++) {
            const ir = r * stride + kr - padding;
            const ic = c * stride + kc - padding;
            if (ir >= 0 && ir < hIn && ic >= 0 && ic < wIn) {
              acc += image[ch][ir][ic] * dwKernel[ch][kr][kc];
            }
          }
        }
        dwVec.push(acc);
      }

      addStep(
        15,
        `Depthwise Spatial Conv at output cell (${r}, ${c})`,
        `Calculated depthwise channel vector dw_vec = [${dwVec.join(", ")}].`,
        { r, c, dwVec: dwVec.join(",") },
      );

      for (let co = 0; co < cOut; co++) {
        let pwAcc = 0;
        for (let ci = 0; ci < cIn; ci++) {
          pwAcc += dwVec[ci] * pwKernel[co][ci];
        }
        output[co][r][c] = pwAcc;
      }

      addStep(
        23,
        `Pointwise 1x1 Projection at output cell (${r}, ${c})`,
        `Fused dw_vec with 1x1 kernel to yield output channels: [${output.map((outCh) => outCh[r][c]).join(", ")}].`,
        { r, c, fusedOutput: output.map((outCh) => outCh[r][c]).join(",") },
      );
    }
  }

  addStep(
    31,
    "Execution Complete",
    `Successfully generated ${cOut}x${hOut}x${wOut} fused depthwise separable output tensor.`,
    { completed: true },
    elements.map((el) => ({ ...el, state: "sorted" })),
  );

  return steps;
};

const FUSEDDEPTHWISESEPARABLECONV2DENGINE_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "dw_vec[ch] = sum(image[ch]) * sum(depthwise_kernel[ch])",
    "output[co][r][c] = sum(dw_vec) * pointwise_kernel[co][0]",
    "if c_in != c_out: raise ValueError()",
  ],
  hints: [
    {
      line: 15,
      hint: "Depthwise phase computes spatial filtering independently for each input channel.",
    },
    {
      line: 23,
      hint: "Pointwise phase fuses intermediate spatial activations across channels in SRAM.",
    },
  ],
  lineExplanations: {
    1: "Entry point for fused depthwise separable 2D convolution algorithm.",
    15: "Depthwise spatial convolution loop over input channels.",
    23: "Pointwise 1x1 channel projection loop over output channels.",
    31: "Returns computed fused output feature map tensor.",
  },
};

export const fusedDepthwiseSeparableConv2dEngine: AlgorithmDefinition<fusedDepthwiseSeparableConv2dEngineInput> =
  {
    id: "fusedDepthwiseSeparableConv2dEngine",
    title: "Fused Depthwise Separable Conv2D Engine",
    category: "ml_convolutions",
    categories: ["ml_convolutions", "ml_hardware_kernels"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_convolutions",
    description:
      "Depthwise Separable Convolution factorizes a standard 2D convolution into two distinct, lower-cost operations: a 2D Depthwise Spatial Convolution (which filters each input channel independently using spatial kernels) and a 1x1 Pointwise Convolution (which computes linear combinations across all input channels to create output feature maps). In modern inference engines (e.g. MobileNet, Xception, EfficientNet, and TensorRT kernels), fusing these two operators into a single unified execution loop retains intermediate depthwise feature maps inside L1 cache or GPU SRAM shared memory, eliminating external memory traffic to HBM/DRAM.\n\nInput Format:\n- image: 3D input tensor of shape (C_in, H, W).\n- depthwiseKernel: 3D kernel tensor of shape (C_in, K_h, K_w).\n- pointwiseKernel: 2D projection kernel of shape (C_out, C_in).\n- stride: Spatial stride integer (default 1).\n- padding: Zero-padding width integer (default 0).\n\nOutput Format:\n- Returns a 3D output tensor of shape (C_out, H_out, W_out).\n\nEdge Cases & Constraints:\n- Single-channel input (C_in=1): Depthwise phase degenerates to 2D conv, pointwise phase acts as scalar channel scaling.\n- Small spatial dimensions (H, W < K_h, K_w): Requires appropriate padding to produce positive output spatial dimensions.\n- Arithmetic reduction: FLOP count drops from O(C_out * C_in * H_out * W_out * K_h * K_w) to O(C_in * H_out * W_out * K_h * K_w + C_out * C_in * H_out * W_out), saving ~8-9x FLOPs for 3x3 filters.",
    constraints: [
      "1 <= C_in, C_out <= 512",
      "1 <= H, W <= 1024",
      "1 <= K_h, K_w <= 11",
      "stride >= 1",
    ],
    examples: [
      {
        kind: "basic",
        title: "2-Channel Input, 2-Channel Output",
        inputDisplay: "image: 2x3x3, depthwise: 2x2x2, pointwise: 2x2",
        outputDisplay: "output: 2x2x2",
        input: DEFAULT_FUSEDDEPTHWISESEPARABLECONV2DENGINE_INPUT,
        output: "Tensor (2, 2, 2)",
        explanation: "Fuses depthwise 2x2 spatial filtering with 2x2 pointwise projection cleanly.",
      },
    ],
    code: FUSEDDEPTHWISESEPARABLECONV2DENGINE_CODE,
    timeComplexity: {
      best: "O(H_out * W_out * C_in * (K_h * K_w + C_out))",
      average: "O(H_out * W_out * C_in * (K_h * K_w + C_out))",
      worst: "O(H_out * W_out * C_in * (K_h * K_w + C_out))",
    },
    spaceComplexity: "O(C_out * H_out * W_out)",
    complexityAnalysis: {
      time: "Significantly reduces FLOPs by factor of ~1/C_out + 1/(K_h * K_w) compared to standard 2D convolution.",
      space:
        "Allocates output tensor storage while eliminating DRAM allocations for intermediate depthwise maps via operator fusion.",
    },
    topicGuide: {
      overview:
        "Fused Depthwise Separable Convolution is a fundamental architectural building block for lightweight vision models and edge AI deployment. By decoupling spatial spatial filtering from cross-channel mixing and executing them inside a single fused memory loop, depthwise separable engines achieve near-theoretical arithmetic efficiency.",
      sections: [
        {
          heading: "Overview",
          body: "Standard convolution simultaneously applies spatial filtering and channel mixing in a dense 4D tensor product (C_out * C_in * K_h * K_w). Depthwise separable convolutions factorize this into a depthwise spatial filter (C_in * K_h * K_w) followed by a 1x1 pointwise projection (C_out * C_in * 1 * 1). Fused engines execute both phases sequentially within local register files or GPU SRAM.",
        },
        {
          heading: "Core Concepts",
          body: "1. Depthwise Convolution: Each channel is convolved independently with its own spatial filter, generating intermediate feature maps without cross-channel summation.\n2. Pointwise Convolution: Applies 1x1 convolutions across input channels to linearly combine spatial outputs into desired output channels.\n3. Operator Fusion: Combines both operations into a single kernel launch to keep intermediate depthwise values cached in registers/SRAM.",
        },
        {
          heading: "Systems & Performance Impact",
          body: "For standard 3x3 kernels, depthwise separable convolutions achieve a FLOP reduction factor of ~8 to 9x (1/C_out + 1/9). Operator fusion turns a memory-bandwidth-bound depthwise kernel into an arithmetically intense fused execution unit, preventing expensive DRAM read/write roundtrips.",
        },
        {
          heading: "Implementation Nuances",
          body: "Implementing fused depthwise separable kernels requires careful allocation of thread blocks. In CUDA/Triton, each warp processes a spatial tile across all C_in channels, keeping dw_vec in registers before feeding into GEMM register accumulators for pointwise projection.",
        },
        {
          heading: "Edge Cases",
          body: "Handles C_in=1, unit kernel sizes (K=1), asymmetric padding, strided downsampling, and non-divisible channel counts safely through out-of-bounds spatial guards.",
        },
      ],
      keyTerms: [
        {
          term: "Depthwise Convolution",
          definition: "Spatial filtering applied independently to each individual input channel.",
        },
        {
          term: "Pointwise Convolution",
          definition:
            "1x1 cross-channel linear combination projecting C_in channels to C_out channels.",
        },
        {
          term: "Operator Fusion",
          definition:
            "Merging multiple computational graphs or layers into a single hardware kernel to keep data in fast SRAM.",
        },
        {
          term: "Arithmetic Intensity",
          definition:
            "Ratio of floating point operations executed per byte of DRAM memory bandwidth transferred.",
        },
      ],
    },
    trivia: FUSEDDEPTHWISESEPARABLECONV2DENGINE_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_FUSEDDEPTHWISESEPARABLECONV2DENGINE_INPUT,
    generateSteps: generateFusedDepthwiseSeparableConv2dEngineSteps,
  };
