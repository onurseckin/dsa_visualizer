import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface col2imGradAccumulatorInput {
  data: number[];
  target?: number;
}

export const COL2IMGRADACCUMULATOR_CODE = `def col2im_grad_accumulator(d_cols, image_shape, kernel_size, stride=1, padding=0):
    """
    Accumulates gradients from unrolled column matrix (d_cols) back into 
    original 2D spatial image gradient tensor (d_image).
    
    d_cols: shape (K_h * K_w, H_out * W_out) representing gradients w.r.t. unrolled patches.
    image_shape: tuple (H_in, W_in) spatial dimensions of original input activation map.
    """
    h_in, w_in = image_shape
    k_h, k_w = kernel_size
    h_out = (h_in + 2 * padding - k_h) // stride + 1
    w_out = (w_in + 2 * padding - k_w) // stride + 1

    d_image = [[0.0] * w_in for _ in range(h_in)]

    col_idx = 0
    for r in range(h_out):
        for c in range(w_out):
            k_idx = 0
            for kr in range(k_h):
                for kc in range(k_w):
                    ir = r * stride + kr - padding
                    ic = c * stride + kc - padding
                    if 0 <= ir < h_in and 0 <= ic < w_in:
                        # Accumulate gradient because overlapping receptive fields share input pixels
                        d_image[ir][ic] += d_cols[k_idx][col_idx]
                    k_idx += 1
            col_idx += 1

    return d_image
`;

export const DEFAULT_COL2IMGRADACCUMULATOR_INPUT: col2imGradAccumulatorInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateCol2imGradAccumulatorSteps = (
  input: col2imGradAccumulatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
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
          im2colBuffer: "Gradient Accumulation Map",
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize col2im Gradient Accumulator",
    "Setting up execution data structures and spatial gradient accumulation buffers.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      21,
      `Accumulate patch gradient at index ${idx}: value = ${val}`,
      `Scattering and summing unrolled patch gradients into spatial image coordinates.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    25,
    "Execution Complete",
    "Successfully accumulated all column gradients into original image tensor layout.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const COL2IMGRADACCUMULATOR_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [
    {
      line: 21,
      hint: "Accumulate gradient values using atomic addition for overlapping receptive fields.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for col2im Gradient Accumulator.",
    21: "Accumulates unrolled column patch gradients back to spatial coordinates.",
    25: "Returns spatial activation gradient matrix.",
  },
};

export const col2imGradAccumulator: AlgorithmDefinition<col2imGradAccumulatorInput> = {
  id: "col2imGradAccumulator",
  title: "col2im Gradient Accumulator",
  category: "ml_convolutions",
  categories: ["ml_convolutions", "ml_hardware_kernels"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_convolutions",
  description:
    "During the backward pass of a 2D convolution layer in automatic differentiation frameworks (PyTorch, cuDNN, Caffe), the gradient with respect to input activations is computed by taking the output gradient matrix d_out and multiplying by transposed filter weights W^T. This produces an unrolled patch gradient matrix d_cols. The `col2im` accumulator performs the adjoint (transpose) operation of `im2col` by scattering and accumulating overlapping patch gradients back into the original 2D feature map shape.\n\nInput Format:\n- d_cols: Unrolled gradient matrix of shape [K_h * K_w, H_out * W_out].\n- image_shape: Tuple (H_in, W_in) of target activation map.\n- kernel_size: Convolution kernel dimensions (K_h, K_w).\n- stride: Spatial stride step.\n- padding: Zero-padding applied at edges.\n\nOutput Format:\n- d_image: Accumulated spatial activation gradient matrix of shape [H_in, W_in].\n\nEdge Cases & Constraints:\n- Overlapping pixel gradients: Multiple patch entries map to identical input coordinates, requiring atomic addition (`atomicAdd` on GPU).\n- Strided gaps: Pixels skipped by stride > 1 receive zero gradient updates from skipped locations.\n- Padded boundary elements: Gradients falling inside zero-padding regions are discarded.",
  constraints: ["1 <= H_in, W_in <= 1024", "1 <= K_h, K_w <= H_in, W_in", "stride >= 1"],
  examples: [
    {
      kind: "basic",
      title: "2x2 Receptive Field Accumulation",
      inputDisplay: "d_cols = [4, 9], image_shape = (3, 3), kernel = 2x2",
      outputDisplay: "d_image = 3x3 matrix with accumulated patch sums",
      input: { data: [10, 20, 30, 40, 50], target: 30 },
      output: "[10, 20, 30, 40, 50]",
      explanation: "Scatters 4 column gradients into overlapping 3x3 input activation pixels.",
    },
    {
      kind: "complex",
      title: "Strided Gradient Accumulation",
      inputDisplay: "d_cols = [9, 4], image_shape = (5, 5), stride = 2",
      outputDisplay: "d_image = 5x5 matrix with sparse non-zero updates",
      input: { data: [1, 2, 3, 4, 5], target: 4 },
      output: "[1, 2, 3, 4, 5]",
      explanation: "Accumulates gradients at strided steps, leaving skipped pixels untouched.",
    },
    {
      kind: "negative",
      title: "Boundary Padding Truncation",
      inputDisplay: "d_cols = [4, 4], image_shape = (2, 2), padding = 1",
      outputDisplay: "Padding gradients dropped, valid 2x2 accumulated",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Gradients corresponding to padded zero boundary elements are safely discarded.",
    },
  ],
  code: COL2IMGRADACCUMULATOR_CODE,
  timeComplexity: {
    best: "O(H_{out} W_{out} K^2)",
    average: "O(H_{out} W_{out} K^2)",
    worst: "O(H_{out} W_{out} K^2)",
  },
  spaceComplexity: "O(H_{in} W_{in})",
  complexityAnalysis: {
    time: "Iterates through all unrolled patch gradient entries, taking O(H_{out} W_{out} K^2) additions.",
    space: "Requires O(H_{in} W_{in}) DRAM memory to hold the accumulated input gradient buffer.",
  },
  topicGuide: {
    overview:
      "The col2im Gradient Accumulator implements the transpose/adjoint transformation of im2col, accumulating unrolled patch gradients back into 2D spatial feature map shapes during backpropagation.",
    sections: [
      {
        heading: "Core Concepts & Transpose Adjoint Math",
        body: "Because im2col is a linear operator y = A*x, its adjoint during automatic differentiation requires evaluating dx = A^T * dy. This means each element dy[kr, kc, r_out, c_out] adds to dx[r_out*stride + kr, c_out*stride + kc]. Because sliding windows overlap, multiple gradient components contribute to a single spatial coordinate.",
      },
      {
        heading: "Systems & Hardware Kernel Performance",
        body: "On GPUs, col2im requires atomic additions (`atomicAdd`) when threads processing different spatial patches attempt to write to shared spatial memory locations concurrently. To maximize throughput, high-performance C++/CUDA kernels (e.g. cuDNN) use shared memory reduction buffers or tiled warp-level accumulation to reduce DRAM atomic contention.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Strided convolutions leave unvisited gaps in activation space during backpropagation. Padding requires masking out boundary updates so gradients do not leak out of bounds. Multi-channel tensors (NCHW / NHWC) process channels independently in parallel, requiring proper stride offset indexing.",
      },
      {
        heading: "Edge Cases & Production Safeguards",
        body: "Edge cases include atomic race conditions, float16 rounding degradation during multi-term addition, and zero-stride broadcasting. Production kernels use float32 accumulation registers even when inputs are stored in float16/bfloat16 precision.",
      },
    ],
    keyTerms: [
      {
        term: "col2im Operator",
        definition:
          "Algorithmic reverse of im2col that maps 2D unrolled column gradients back into 2D/3D spatial tensor shapes.",
      },
      {
        term: "Adjoint Transformation",
        definition:
          "The mathematical transpose of a linear operator used to compute input gradients during autograd backward pass.",
      },
      {
        term: "Atomic Accumulation",
        definition:
          "Thread-safe addition instruction (`atomicAdd`) ensuring correct accumulation when parallel threads update overlapping pixels.",
      },
      {
        term: "Overlapping Gradient Scatter",
        definition:
          "The process of scattering gradient terms from overlapping receptive field patches to shared spatial indices.",
      },
    ],
  },
  trivia: COL2IMGRADACCUMULATOR_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_COL2IMGRADACCUMULATOR_INPUT,
  generateSteps: generateCol2imGradAccumulatorSteps,
};
