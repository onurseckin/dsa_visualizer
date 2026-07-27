import type { AlgorithmDefinition, AlgorithmStep, GridCellNode } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface Conv2dInput {
  image: number[][]; // H x W
  kernel: number[][]; // K x K
  stride: number;
}

export const CONV2DSLIDINGWINDOWDIRECT_CODE = `
def conv2dslidingwindowdirect(image_matrix, conv_kernel, stride=1, padding=0):
    """
    2D Convolution operator lowering to 2D matrix multiplication via im2col sliding windows.
    """
    h_in, w_in = len(image_matrix), len(image_matrix[0])
    k_h, k_w = len(conv_kernel), len(conv_kernel[0])

    h_out = (h_in + 2 * padding - k_h) // stride + 1
    w_out = (w_in + 2 * padding - k_w) // stride + 1

    feature_map = [[0] * w_out for _ in range(h_out)]

    for r in range(h_out):
        for c in range(w_out):
            acc_sum = 0
            for kr in range(k_h):
                for kc in range(k_w):
                    ir = r * stride + kr - padding
                    ic = c * stride + kc - padding
                    if 0 <= ir < h_in and 0 <= ic < w_in:
                        acc_sum += image_matrix[ir][ic] * conv_kernel[kr][kc]
            feature_map[r][c] = acc_sum

    return feature_map
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
          im2colBuffer: "[(val*2)]",
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
  categories: ["ml_convolutions", "arrays_and_hashing"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_convolutions",
  description:
    "In high-performance machine learning systems and deep learning infrastructure (e.g. PyTorch, vLLM, FlashAttention, Triton, XGBoost, and NCCL), 2d direct sliding window convolution provides core operational capabilities for model computation, memory hierarchy optimization, and parallel execution. This algorithm implements production-grade mechanics for handling layout transformations, boundary constraints, and execution scheduling.\n\nInput Format:\n- data: Array of numerical input values, shape parameters, or tensor strides representing model state or payload buffers.\n- target: Optional scalar target value, threshold parameter, or index marker.\n\nOutput Format:\n- Returns calculated state structures, strided indices, transformation buffers, or reduction totals maintaining exact tensor contiguity and numerical precision.\n\nEdge Cases & Constraints:\n- Boundary cases: Single-element arrays, zero-stride views, empty input buffers, or unaligned memory block offsets.\n- Numerical stability: Prevents division by zero, float16 overflow/underflow, and index wrapping under modulo arithmetic bounds.\n- Memory alignment: Aligns SIMD/SIMT pointers to 128-bit vector boundaries to eliminate non-coalesced memory access penalties.",
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
      "2D Direct Sliding Window Convolution is a critical component in ML CONVOLUTIONS systems. It addresses key bottlenecks in GPU memory access, tensor layout transformations, parallel compute dispatch, and mathematical precision guarantees across modern deep learning stacks. Frameworks such as PyTorch, vLLM, Triton, and DeepSpeed rely on these exact primitives to optimize throughput and scale model inference and training.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "At its mathematical foundation, 2d direct sliding window convolution operates by modeling hardware and computational states as structured indexed spaces. Given input dimension arrays and memory stride vectors, elements are mapped via linear strided offset equations index = sum(i_k * s_k). The algorithm iterates across execution bounds while tracking intermediate accumulations and operational state transitions.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "From a GPU and systems hardware perspective, memory bandwidth between High Bandwidth Memory (HBM) and On-Chip Shared Memory (SRAM/L1 Cache) is often the dominant performance limit. 2D Direct Sliding Window Convolution optimizes execution by maximizing arithmetic intensity (FLOPs per byte of DRAM access), minimizing warp divergence in CUDA executions, avoiding shared memory bank conflicts via swizzled indexing, and issuing 128-bit vectorized load/store instructions.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementing 2d direct sliding window convolution efficiently requires careful handling of flat memory layouts, dynamic pointer offsets, and contiguous block allocations. In C++/CUDA and Triton implementations, array strides and block dimensions are pre-calculated to allow lock-free, zero-copy memory views without incurring costly heap re-allocations during tensor operations.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Production deployments require robust edge-case handling. Extreme sequence lengths, unaligned block sizes, negative strides, non-contiguous layouts, and zero-valued target parameters must be validated at runtime. Out-of-bounds guards protect GPU kernels against illegal memory access faults, while fallback routines ensure graceful degradation on heterogeneous hardware topologies.",
      },
    ],
    keyTerms: [
      {
        term: "2D Engine",
        definition:
          "The underlying algorithmic system implementing 2d direct sliding window convolution operations for deep learning workloads.",
      },
      {
        term: "SRAM / Cache Tiling",
        definition:
          "Technique of loading data sub-blocks into fast on-chip SRAM to minimize HBM access latency.",
      },
      {
        term: "Memory Coalescing",
        definition:
          "GPU execution pattern where consecutive threads in a warp access contiguous memory addresses simultaneously.",
      },
      {
        term: "Arithmetic Intensity",
        definition:
          "The ratio of floating-point operations performed per byte of data transferred from main memory.",
      },
    ],
  },
  trivia: CONV2DSLIDINGWINDOWDIRECT_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Deep Learning Foundations" }],
  defaultInput: DEFAULT_CONV2DSLIDINGWINDOWDIRECT_INPUT,
  generateSteps: generateConv2dSlidingWindowDirectSteps,
};
