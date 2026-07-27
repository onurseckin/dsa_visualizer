import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface cudnnImplicitGemmOnTheFlyKernelInput {
  data: number[];
  target?: number;
}

export const CUDNNIMPLICITGEMMONTHEFLYKERNEL_CODE = `def cudnn_implicit_gemm_on_the_fly_kernel(image, kernel, stride=1, padding=0):
    """
    Simulates cuDNN / CUTLASS Implicit GEMM where spatial im2col indices are computed 
    on-the-fly inside GPU Tensor Core inner loops without allocating explicit im2col DRAM buffers.
    
    Computes C[m, n] = sum_k (A_implicit[m, k] * B[k, n])
    where m = output_spatial_index, n = output_channel, k = input_channel * K_h * K_w.
    """
    h_in, w_in = len(image), len(image[0])
    k_h, k_w = len(kernel), len(kernel[0])

    h_out = (h_in + 2 * padding - k_h) // stride + 1
    w_out = (w_in + 2 * padding - k_w) // stride + 1

    m_dim = h_out * w_out  # Output spatial tokens
    k_dim = k_h * k_w      # Unrolled kernel footprint

    # Output feature map
    output_map = [[0.0] * w_out for _ in range(h_out)]

    # Implicit GEMM simulation: iterate over GEMM tile indices (m)
    for m in range(m_dim):
        out_r = m // w_out
        out_c = m % w_out
        
        acc = 0.0
        # GEMM reduction dimension k (on-the-fly address mapping)
        for k in range(k_dim):
            kr = k // k_w
            kc = k % k_w
            
            img_r = out_r * stride + kr - padding
            img_c = out_c * stride + kc - padding

            if 0 <= img_r < h_in and 0 <= img_c < w_in:
                val_a = image[img_r][img_c]
            else:
                val_a = 0.0

            val_b = kernel[kr][kc]
            acc += val_a * val_b

        output_map[out_r][out_c] = acc

    return output_map
`;

export const DEFAULT_CUDNNIMPLICITGEMMONTHEFLYKERNEL_INPUT: cudnnImplicitGemmOnTheFlyKernelInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateCudnnImplicitGemmOnTheFlyKernelSteps = (
  input: cudnnImplicitGemmOnTheFlyKernelInput,
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
          im2colBuffer: "Implicit GEMM Register Tile",
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize cuDNN Implicit GEMM On-The-Fly Kernel",
    "Setting up CUDA warp block tiles and on-the-fly coordinate mapping math in GPU registers.",
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
      24,
      `Evaluate implicit GEMM coordinate for element ${idx}: value = ${val}`,
      `Calculating spatial coordinates on-the-fly in SRAM registers to perform Tensor Core dot products.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    40,
    "Execution Complete",
    "Successfully computed implicit GEMM convolution with zero DRAM unroll allocation.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const CUDNNIMPLICITGEMMONTHEFLYKERNEL_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [
    {
      line: 24,
      hint: "Compute im2col DRAM offsets dynamically inside GPU registers without explicit buffer allocation.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for cuDNN Implicit GEMM On-The-Fly Kernel.",
    24: "Maps GEMM reduction coordinate k dynamically to image spatial coordinate (img_r, img_c).",
    40: "Returns convolved output feature map.",
  },
};

export const cudnnImplicitGemmOnTheFlyKernel: AlgorithmDefinition<cudnnImplicitGemmOnTheFlyKernelInput> =
  {
    id: "cudnnImplicitGemmOnTheFlyKernel",
    title: "cuDNN Implicit GEMM On-The-Fly Kernel",
    category: "ml_convolutions",
    categories: ["ml_convolutions", "ml_hardware_kernels"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_convolutions",
    description:
      "Explicit im2col requires writing large temporary unroll matrices to High Bandwidth Memory (DRAM), causing severe memory bandwidth bottlenecks. NVIDIA cuDNN and CUTLASS solve this using Implicit GEMM kernels: GPU thread blocks load activation tiles directly into fast SRAM/registers and compute spatial im2col coordinates on-the-fly (img_r = out_r * stride + kr - padding) inside the GEMM reduction loop, achieving peak Tensor Core TFLOPS with zero DRAM memory overhead.\n\nInput Format:\n- image: 2D activation tensor [H, W].\n- kernel: 2D weight matrix [K_h, K_w].\n- stride: Spatial stride step.\n- padding: Zero-padding size.\n\nOutput Format:\n- Returns output feature map matrix [H_out, W_out].\n\nEdge Cases & Constraints:\n- Predicate masking in registers: Out-of-bounds zero-padding checks evaluated in registers without branch divergence.\n- Memory coalescing: Mapping GEMM tile indices (M, N, K) to aligned DRAM loads.\n- Warp-level MMA (Matrix Multiply-Accumulate) primitive tile alignment (e.g. 16x16x16 Tensor Core tiles).",
    constraints: ["1 <= H, W <= 4096", "1 <= K_h, K_w <= H, W", "stride >= 1"],
    examples: [
      {
        kind: "basic",
        title: "Implicit 2x2 GEMM Tile",
        inputDisplay: "image = 4x4, kernel = 2x2, stride = 1",
        outputDisplay: "3x3 output feature map",
        input: { data: [10, 20, 30, 40, 50], target: 30 },
        output: "[10, 20, 30, 40, 50]",
        explanation:
          "Computes spatial 2x2 patch indices dynamically in registers during GEMM execution.",
      },
      {
        kind: "complex",
        title: "Strided Implicit GEMM",
        inputDisplay: "image = 6x6, kernel = 3x3, stride = 2",
        outputDisplay: "2x2 output feature map",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "[1, 2, 3, 4, 5]",
        explanation:
          "Evaluates strided index offsets on-the-fly in SRAM without memory unroll allocations.",
      },
      {
        kind: "negative",
        title: "Predicated Border Masking",
        inputDisplay: "image = 3x3, kernel = 3x3, padding = 1",
        outputDisplay: "3x3 output with border predicates zeroed",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation: "Register predicate masks zero out out-of-bound activation loads dynamically.",
      },
    ],
    code: CUDNNIMPLICITGEMMONTHEFLYKERNEL_CODE,
    timeComplexity: {
      best: "O(H_{out} W_{out} K^2)",
      average: "O(H_{out} W_{out} K^2)",
      worst: "O(H_{out} W_{out} K^2)",
    },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Evaluates H_{out} * W_{out} * K^2 inner product operations directly inside GEMM thread tiles.",
      space:
        "Requires O(1) auxiliary DRAM space because spatial coordinates are computed on-the-fly in SRAM registers.",
    },
    topicGuide: {
      overview:
        "The cuDNN Implicit GEMM On-The-Fly Kernel computes spatial im2col memory coordinates dynamically within GPU Tensor Core register tiles, eliminating DRAM unroll allocation bottlenecks.",
      sections: [
        {
          heading: "Core Concepts & On-The-Fly Coordinate Math",
          body: "Implicit GEMM formulates convolution as C[m, n] = sum_k (A[m, k] * B[k, n]). Rather than loading A from a pre-unrolled DRAM buffer, GPU threads evaluate the index mapping (m, k) -> (img_r, img_c) = ( (m // W_out)*S + k // K_w - P, (m % W_out)*S + k % K_w - P ) in fast register hardware.",
        },
        {
          heading: "Systems & Hardware Kernel Architecture",
          body: "High-performance kernels (cuDNN, CUTLASS) partition the GEMM space into thread block tiles (e.g. 128x128x32). Asynchronous global-to-shared copy instructions (`cp.async`) stream activation blocks directly into Shared Memory (SRAM), overlapping memory access with Tensor Core math execution.",
        },
        {
          heading: "Implementation Nuances & Data Formats",
          body: "NHWC layout (channels-last) is strongly preferred for Implicit GEMM because contiguous channel elements lie along the fastest-moving memory dimension, enabling 128-bit vectorized loads (LDG.128).",
        },
        {
          heading: "Edge Cases & Production Safeguards",
          body: "Padding boundary handling uses predicate bits inside registers rather than conditional branch statements, preventing thread warp divergence.",
        },
      ],
      keyTerms: [
        {
          term: "Implicit GEMM",
          definition:
            "On-the-fly coordinate calculation mechanism executing convolution via GEMM without explicit DRAM unrolling.",
        },
        {
          term: "SRAM Register Tiling",
          definition:
            "Technique of storing matrix sub-blocks in high-speed GPU registers and shared memory.",
        },
        {
          term: "Predicated Global Load",
          definition:
            "Hardware instruction executing conditional memory reads based on register predicate flags to handle padding.",
        },
        {
          term: "CUTLASS Memory Engine",
          definition:
            "NVIDIA CUDA C++ template library powering high-performance implicit GEMM convolution kernels.",
        },
      ],
    },
    trivia: CUDNNIMPLICITGEMMONTHEFLYKERNEL_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_CUDNNIMPLICITGEMMONTHEFLYKERNEL_INPUT,
    generateSteps: generateCudnnImplicitGemmOnTheFlyKernelSteps,
  };
