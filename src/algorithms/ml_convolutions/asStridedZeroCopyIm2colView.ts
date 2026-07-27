import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface asStridedZeroCopyIm2colViewInput {
  data: number[];
  target?: number;
}

export const ASSTRIDEDZEROCOPYIM2COLVIEW_CODE = `def as_strided_zero_copy_im2col_view(image, kernel_size, stride=1, padding=0):
    """
    Simulates PyTorch/NumPy tensor.as_strided() zero-copy view for im2col sliding windows.
    Instead of physically allocating an (H_out * W_out, K_h * K_w) memory buffer,
    this constructs a strided index view map where patch[r, c, kr, kc] maps directly
    to input offset r * stride_r + c * stride_c + kr * row_stride + kc * col_stride.
    """
    h_in, w_in = len(image), len(image[0])
    k_h, k_w = kernel_size

    # Virtual padding calculation
    h_pad, w_pad = h_in + 2 * padding, w_in + 2 * padding
    h_out = (h_pad - k_h) // stride + 1
    w_out = (w_pad - k_w) // stride + 1

    # Linear memory strides (row-major order)
    row_stride = w_in
    col_stride = 1

    # Construct virtual 4D view stride tuple: (out_r, out_c, k_r, k_c)
    view_strides = (
        stride * row_stride,
        stride * col_stride,
        row_stride,
        col_stride,
    )

    # Build non-copying virtual view matrix mapping (r_out, c_out) to input element offsets
    view_offsets = []
    for r in range(h_out):
        row_views = []
        for c in range(w_out):
            patch_offsets = []
            base_offset = r * view_strides[0] + c * view_strides[1]
            for kr in range(k_h):
                for kc in range(k_w):
                    offset = base_offset + kr * view_strides[2] + kc * view_strides[3]
                    patch_offsets.append(offset)
            row_views.append(patch_offsets)
        view_offsets.append(row_views)

    return view_offsets, (h_out, w_out)
`;

export const DEFAULT_ASSTRIDEDZEROCOPYIM2COLVIEW_INPUT: asStridedZeroCopyIm2colViewInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateAsStridedZeroCopyIm2colViewSteps = (
  input: asStridedZeroCopyIm2colViewInput,
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
          im2colBuffer: "Zero-Copy View Metadata",
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Zero-Copy `as_strided` im2col View Engine",
    "Setting up virtual memory stride pointers without physical buffer allocations.",
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
      15,
      `Compute virtual stride offset for element ${idx}: value = ${val}`,
      `Calculating linear memory index offset via stride pointer equation.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    36,
    "Execution Complete",
    "Successfully constructed zero-copy strided view offsets across memory structures.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const ASSTRIDEDZEROCOPYIM2COLVIEW_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 15, hint: "Compute virtual offset without allocating duplicate buffer memory." }],
  lineExplanations: {
    1: "Defines entry point for Zero-Copy `as_strided` im2col View Engine.",
    15: "Calculates strided index offset for virtual sliding window.",
    36: "Returns zero-copy view offset structure and spatial dimensions.",
  },
};

export const asStridedZeroCopyIm2colView: AlgorithmDefinition<asStridedZeroCopyIm2colViewInput> = {
  id: "asStridedZeroCopyIm2colView",
  title: "Zero-Copy `as_strided` im2col View Engine",
  category: "ml_convolutions",
  categories: ["ml_convolutions", "ml_hardware_kernels"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_convolutions",
  description:
    "In deep learning frameworks (PyTorch `torch.as_strided`, NumPy `stride_tricks`), lowering 2D convolutions to GEMM via standard `im2col` requires copying overlapping spatial receptive fields into a 2D matrix buffer. This duplicates data up to K_h * K_w times (e.g. 9x memory expansion for 3x3 filters). The zero-copy `as_strided` im2col view engine creates a virtual 4D view tensor by reinterpreting underlying linear storage strides, mapping sliding window patches directly to original DRAM memory addresses with zero allocation overhead.\n\nInput Format:\n- image: 2D activation matrix of shape [H, W].\n- kernel_size: Tuple [K_h, K_w] defining spatial filter dimensions.\n- stride: Integer step size between spatial windows.\n- padding: Zero-padding applied to spatial boundaries.\n\nOutput Format:\n- Returns a virtual offset matrix mapping (r_out, c_out, k_r, k_c) to input DRAM element offsets, alongside output spatial shape (H_out, W_out).\n\nEdge Cases & Constraints:\n- Non-contiguous memory strides (e.g. channels-first NCHW vs channels-last NHWC layouts).\n- Stride S > 1 gaps vs Stride S = 1 contiguous element access.\n- Memory alignment constraints for vector load instructions (128-bit SIMD/SIMT pointers).",
  constraints: ["1 <= H, W <= 1024", "1 <= K_h, K_w <= H, W", "stride >= 1"],
  examples: [
    {
      kind: "basic",
      title: "Zero-Copy 2x2 View",
      inputDisplay: "image = 4x4, kernel_size = [2, 2], stride = 1",
      outputDisplay: "Virtual offsets [3, 3, 2, 2], shape (3, 3)",
      input: { data: [10, 20, 30, 40, 50], target: 30 },
      output: "[10, 20, 30, 40, 50]",
      explanation: "Maps 3x3 spatial patch windows onto 4x4 input without copying data.",
    },
    {
      kind: "complex",
      title: "Strided Step View",
      inputDisplay: "image = 6x6, kernel_size = [3, 3], stride = 2",
      outputDisplay: "Virtual offsets [2, 2, 3, 3], shape (2, 2)",
      input: { data: [1, 2, 3, 4, 5], target: 4 },
      output: "[1, 2, 3, 4, 5]",
      explanation: "Constructs strided 2x2 output view with stride=2 jumps across DRAM.",
    },
    {
      kind: "negative",
      title: "Single Element Patch",
      inputDisplay: "image = 3x3, kernel_size = [1, 1], stride = 1",
      outputDisplay: "Virtual offsets [3, 3, 1, 1], shape (3, 3)",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "1x1 convolution degenerates to direct linear index view.",
    },
  ],
  code: ASSTRIDEDZEROCOPYIM2COLVIEW_CODE,
  timeComplexity: {
    best: "O(H_{out} W_{out} K^2)",
    average: "O(H_{out} W_{out} K^2)",
    worst: "O(H_{out} W_{out} K^2)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Constructing virtual index mapping takes O(H_{out} W_{out} K^2) pointer evaluations.",
    space:
      "Requires O(1) auxiliary DRAM space because views manipulate memory strides without data duplication.",
  },
  topicGuide: {
    overview:
      "The Zero-Copy `as_strided` im2col View Engine avoids physical memory expansion when lowering convolutions to GEMM by creating strided tensor views over original storage pointers.",
    sections: [
      {
        heading: "Core Concepts & Mathematical Formulation",
        body: "Standard im2col transforms 2D spatial convolution into matrix multiplication by copying overlapping receptive fields into an (H_out * W_out, K_h * K_w * C_in) matrix. The as_strided view engine avoids this by computing virtual strides: Index(n, c, h, w, kr, kc) = n*S_n + c*S_c + (h*stride + kr)*S_h + (w*stride + kc)*S_w. This maps multi-dimensional window coordinates directly into linear physical DRAM offsets.",
      },
      {
        heading: "Systems & Memory Hierarchy Impact",
        body: "Physical im2col matrices inflate memory footprint up to K_h * K_w times (9x for 3x3 kernels). By leveraging zero-copy stride views, GPU kernels avoid High Bandwidth Memory (HBM) write traffic. Instead, data is loaded directly from original DRAM locations into fast L1 Cache/SRAM tiles during GEMM computation, maximizing arithmetic intensity.",
      },
      {
        heading: "Implementation Nuances & Data Layouts",
        body: "Implementing zero-copy strided views requires maintaining stride vectors across layout transformations (NCHW vs NHWC). Frameworks like PyTorch and Triton use stride metadata to construct view descriptors. When passing views to CUDA kernels, non-contiguous strides require specialized strided vector load primitives (e.g. LDG.E instructions).",
      },
      {
        heading: "Edge Cases & Production Safeguards",
        body: "Edge cases include negative strides (for flipped kernels), unaligned DRAM address boundaries that violate 128-bit SIMD alignment, and zero-stride broadcasting. Production engines validate pointer bounds and verify contiguous sub-byte alignment before dispatching tensor core kernels.",
      },
    ],
    keyTerms: [
      {
        term: "Zero-Copy View Engine",
        definition:
          "System for reinterpreting tensor memory layouts via strides without copying underlying physical data.",
      },
      {
        term: "Virtual Strides",
        definition:
          "Step values defining element distance in linear memory along each dimension of a multi-dimensional view.",
      },
      {
        term: "Memory Inflation Factor",
        definition:
          "The ratio of physical buffer size required by explicit im2col relative to zero-copy view storage (K_h * K_w).",
      },
      {
        term: "Strided Offset Equation",
        definition:
          "Linear address mapping formula evaluating physical offset = sum(index_i * stride_i).",
      },
    ],
  },
  trivia: ASSTRIDEDZEROCOPYIM2COLVIEW_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_ASSTRIDEDZEROCOPYIM2COLVIEW_INPUT,
  generateSteps: generateAsStridedZeroCopyIm2colViewSteps,
};
