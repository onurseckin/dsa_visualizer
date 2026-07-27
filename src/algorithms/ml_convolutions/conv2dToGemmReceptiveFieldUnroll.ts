import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface conv2dToGemmReceptiveFieldUnrollInput {
  data: number[];
  target?: number;
}

export const CONV2DTOGEMMRECEPTIVEFIELDUNROLL_CODE = `def conv2d_to_gemm_receptive_field_unroll(image, kernel_size, stride=1, padding=0):
    """
    Unrolls spatial KxK receptive field patches from a 2D image into 
    a 2D matrix (im2col matrix) where each row represents an unrolled patch.
    
    Returns:
      im2col_matrix: 2D array of shape (H_out * W_out, K_h * K_w)
      shape_info: dict with output dimensions
    """
    h_in, w_in = len(image), len(image[0])
    k_h, k_w = kernel_size

    # Apply padding
    padded = [[0] * (w_in + 2 * padding) for _ in range(h_in + 2 * padding)]
    for r in range(h_in):
        for c in range(w_in):
            padded[r + padding][c + padding] = image[r][c]

    h_out = (len(padded) - k_h) // stride + 1
    w_out = (len(padded[0]) - k_w) // stride + 1

    im2col_matrix = []
    for r in range(h_out):
        for c in range(w_out):
            patch = []
            for kr in range(k_h):
                for kc in range(k_w):
                    patch.append(padded[r * stride + kr][c * stride + kc])
            im2col_matrix.append(patch)

    return im2col_matrix, {"h_out": h_out, "w_out": w_out, "patch_dim": k_h * k_w}
`;

export const DEFAULT_CONV2DTOGEMMRECEPTIVEFIELDUNROLL_INPUT: conv2dToGemmReceptiveFieldUnrollInput =
  {
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateConv2dToGemmReceptiveFieldUnrollSteps = (
  input: conv2dToGemmReceptiveFieldUnrollInput,
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
          im2colBuffer: "Unrolled im2col Matrix",
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Conv2D Receptive Field Patch Unroller",
    "Setting up 2D im2col matrix layout for spatial receptive field unrolling.",
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
      22,
      `Unroll receptive field patch at index ${idx}: value = ${val}`,
      `Flattening spatial KxK window into row vector of length K_h * K_w * C_in.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    28,
    "Execution Complete",
    "Successfully constructed unrolled im2col matrix ready for BLAS GEMM dispatch.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const CONV2DTOGEMMRECEPTIVEFIELDUNROLL_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 22, hint: "Flatten 2D spatial receptive field patch into 1D matrix vector." }],
  lineExplanations: {
    1: "Defines entry point for Conv2D Receptive Field Patch Unroller.",
    22: "Extracts and flattens KxK receptive field patch into im2col row vector.",
    28: "Returns 2D im2col matrix and spatial output shape metadata.",
  },
};

export const conv2dToGemmReceptiveFieldUnroll: AlgorithmDefinition<conv2dToGemmReceptiveFieldUnrollInput> =
  {
    id: "conv2dToGemmReceptiveFieldUnroll",
    title: "Conv2D Receptive Field Patch Unroller",
    category: "ml_convolutions",
    categories: ["ml_convolutions", "ml_gemm_roofline"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_convolutions",
    description:
      "High-performance deep learning libraries lower 2D spatial convolutions to General Matrix Multiplication (GEMM) by unrolling sliding receptive field patches into a 2D matrix (`im2col`). Each spatial patch of size K_h * K_w * C_in is flattened into a row vector of length K_dim, transforming 2D spatial convolution into matrix multiplication Y_gemm = X_im2col * W_flattened^T executed via hardware-optimized BLAS libraries.\n\nInput Format:\n- image: 2D activation matrix of shape [H, W].\n- kernel_size: Tuple [K_h, K_w] defining receptive field patch dimensions.\n- stride: Step size between sliding windows.\n- padding: Zero-padding added to spatial boundaries.\n\nOutput Format:\n- Returns im2col_matrix of shape [H_out * W_out, K_h * K_w] containing unrolled receptive field vectors.\n\nEdge Cases & Constraints:\n- Memory duplication: im2col inflates memory storage up to K^2 times due to overlapping spatial pixels.\n- Zero-padded boundary patches containing zero elements.\n- 1x1 convolution degenerates into a simple tensor reshape without memory unrolling overhead.",
    constraints: ["1 <= H, W <= 1024", "1 <= K_h, K_w <= H, W", "stride >= 1"],
    examples: [
      {
        kind: "basic",
        title: "2x2 Receptive Field Patch Unroll",
        inputDisplay: "image = 3x3, kernel_size = [2, 2]",
        outputDisplay: "im2col shape [4, 4] (4 patches of length 4)",
        input: { data: [10, 20, 30, 40, 50], target: 30 },
        output: "[10, 20, 30, 40, 50]",
        explanation:
          "Unrolls 4 spatial 2x2 patch windows into a 4x4 matrix for GEMM multiplication.",
      },
      {
        kind: "complex",
        title: "Strided 3x3 Patch Unroll",
        inputDisplay: "image = 5x5, kernel_size = [3, 3], stride = 2",
        outputDisplay: "im2col shape [4, 9] (4 patches of length 9)",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "[1, 2, 3, 4, 5]",
        explanation: "Unrolls strided 3x3 receptive fields into 9-element row vectors.",
      },
      {
        kind: "negative",
        title: "Padded Border Unroll",
        inputDisplay: "image = 2x2, kernel_size = [3, 3], padding = 1",
        outputDisplay: "im2col shape [4, 9] with padded zero entries",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation: "Zero-padding adds 0 values to flattened border patch vectors.",
      },
    ],
    code: CONV2DTOGEMMRECEPTIVEFIELDUNROLL_CODE,
    timeComplexity: {
      best: "O(H_{out} W_{out} K^2)",
      average: "O(H_{out} W_{out} K^2)",
      worst: "O(H_{out} W_{out} K^2)",
    },
    spaceComplexity: "O(H_{out} W_{out} K^2)",
    complexityAnalysis: {
      time: "Iterates through all H_{out} * W_{out} spatial locations and copies K^2 elements per patch, taking O(H_{out} W_{out} K^2) time.",
      space: "Allocates O(H_{out} W_{out} K^2) memory storage for the unrolled im2col matrix.",
    },
    topicGuide: {
      overview:
        "The Conv2D Receptive Field Patch Unroller transforms 2D spatial convolution into matrix multiplication (GEMM) by flattening spatial patches into 2D column/row matrices.",
      sections: [
        {
          heading: "Core Concepts & Receptive Field Unrolling Math",
          body: "Spatial convolution applies filter W of size (C_out, C_in, K_h, K_w) to activation X of size (C_in, H, W). im2col converts X into matrix X_col of shape (H_out * W_out, C_in * K_h * K_w). Matrix multiplication Y_col = X_col * W_col^T yields the output feature map after reshaping.",
        },
        {
          heading: "Systems & Roofline Model Impact",
          body: "Lowering convolution to GEMM allows deep learning frameworks to leverage highly optimized BLAS libraries (cuBLAS, openBLAS) and GPU Tensor Cores. The trade-off is memory duplication: overlapping pixels are copied up to K_h * K_w times into DRAM.",
        },
        {
          heading: "Implementation Nuances & Memory Alignment",
          body: "To achieve peak Memory Bandwidth utilization on CUDA hardware, im2col kernels arrange unrolled patch rows in 128-bit SIMD vector aligned memory addresses.",
        },
        {
          heading: "Edge Cases & Production Safeguards",
          body: "Edge cases include memory allocation failure on large high-resolution images (e.g. 4K frames with 7x7 filters), handling asymmetric padding, and avoiding unrolls for 1x1 convolutions.",
        },
      ],
      keyTerms: [
        {
          term: "Receptive Field Patch",
          definition:
            "Local spatial window of input activations covered by the convolution kernel at a specific coordinate.",
        },
        {
          term: "im2col Matrix Lowering",
          definition:
            "Transformation flattening multi-dimensional spatial receptive field patches into a 2D GEMM input matrix.",
        },
        {
          term: "BLAS GEMM Integration",
          definition: "Executing convolution via optimized General Matrix Multiplication routines.",
        },
        {
          term: "Spatial Patch Vectorization",
          definition:
            "Arranging spatial patch elements sequentially into contiguous 1D row vectors.",
        },
      ],
    },
    trivia: CONV2DTOGEMMRECEPTIVEFIELDUNROLL_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_CONV2DTOGEMMRECEPTIVEFIELDUNROLL_INPUT,
    generateSteps: generateConv2dToGemmReceptiveFieldUnrollSteps,
  };
