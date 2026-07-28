import type { AlgorithmDefinition, AlgorithmStep, GridCellNode } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface cudnnImplicitGemmOnTheFlyKernelInput {
  image?: number[][];
  kernel?: number[][];
  stride?: number;
  padding?: number;
  data?: number[];
  target?: number;
}

export const CUDNNIMPLICITGEMMONTHEFLYKERNEL_CODE = `def cudnn_implicit_gemm_on_the_fly_kernel(image, kernel, stride=1, padding=0):
    h_in, w_in = len(image), len(image[0])
    k_h, k_w = len(kernel), len(kernel[0])

    h_out = (h_in + 2 * padding - k_h) // stride + 1
    w_out = (w_in + 2 * padding - k_w) // stride + 1

    m_dim = h_out * w_out
    k_dim = k_h * k_w

    output_map = [[0.0] * w_out for _ in range(h_out)]

    for m in range(m_dim):
        out_r = m // w_out
        out_c = m % w_out

        acc = 0.0
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

    return output_map`;

export const DEFAULT_CUDNNIMPLICITGEMMONTHEFLYKERNEL_INPUT: cudnnImplicitGemmOnTheFlyKernelInput = {
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
  padding: 0,
};

export const generateCudnnImplicitGemmOnTheFlyKernelSteps = (
  input: cudnnImplicitGemmOnTheFlyKernelInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const image = input.image || [
    [1, 2, 3, 0],
    [0, 1, 2, 3],
    [3, 0, 1, 2],
    [2, 3, 0, 1],
  ];

  const kernel = input.kernel || [
    [2, 0],
    [0, -1],
  ];

  const stride = input.stride ?? 1;
  const padding = input.padding ?? 0;

  const hIn = image.length;
  const wIn = image[0].length;
  const kH = kernel.length;
  const kW = kernel[0].length;

  const hOut = Math.floor((hIn + 2 * padding - kH) / stride) + 1;
  const wOut = Math.floor((wIn + 2 * padding - kW) / stride) + 1;

  const mDim = hOut * wOut;
  const kDim = kH * kW;

  const outputMap: number[][] = Array.from({ length: hOut }, () => Array(wOut).fill(0));

  const createGrid = (activeOutR: number = -1, activeOutC: number = -1): GridCellNode[][] => {
    return outputMap.map((row, r) =>
      row.map((val, c) => {
        let state: "default" | "active" | "compare" | "visited" = "default";
        if (r === activeOutR && c === activeOutC) {
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
    activeOutR: number = -1,
    activeOutC: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "grid",
        grid: createGrid(activeOutR, activeOutC),
      },
      auxiliaryState: {
        customState: {
          Algorithm: "cuDNN / CUTLASS Implicit GEMM",
          "GEMM Tile m_dim": `${mDim} (Spatial Tokens)`,
          "GEMM Reduction k_dim": `${kDim} (Kernel Footprint)`,
          "DRAM Storage Allocated": "0 Bytes (Im2col computed in SRAM registers)",
          "Output Matrix": `[${outputMap.map((r) => `[${r.map((v) => v.toFixed(1)).join(", ")}]`).join(", ")}]`,
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "cuDNN Implicit GEMM On-The-Fly Kernel Entry",
    `Started cuDNN CUTLASS implicit GEMM kernel simulation on ${hIn}x${wIn} image and ${kH}x${kW} kernel with stride=${stride}, padding=${padding}.`,
    { hIn, wIn, kH, kW, stride, padding },
  );

  // Step 2: Measure input
  addStep(
    2,
    "Measure Input Spatial Dimensions h_in, w_in",
    `Input spatial dimensions: h_in = ${hIn}, w_in = ${wIn}.`,
    { hIn, wIn },
  );

  // Step 3: Measure kernel
  addStep(
    3,
    "Measure Kernel Filter Dimensions k_h, k_w",
    `Convolution filter kernel dimensions: k_h = ${kH}, k_w = ${kW}.`,
    { kH, kW },
  );

  // Step 4: Calculate h_out
  addStep(
    5,
    "Calculate Spatial Output Height h_out",
    `Output feature height h_out = (${hIn} + 2 * ${padding} - ${kH}) // ${stride} + 1 = ${hOut}.`,
    { hOut, hIn, kH, stride, padding },
  );

  // Step 5: Calculate w_out
  addStep(
    6,
    "Calculate Spatial Output Width w_out",
    `Output feature width w_out = (${wIn} + 2 * ${padding} - ${kW}) // ${stride} + 1 = ${wOut}.`,
    { wOut, wIn, kW, stride, padding },
  );

  // Step 6: Define m_dim
  addStep(
    8,
    "Define GEMM Spatial Token Dimension m_dim",
    `GEMM M dimension (number of spatial output tokens): m_dim = ${hOut} * ${wOut} = ${mDim}.`,
    { mDim, hOut, wOut },
  );

  // Step 7: Define k_dim
  addStep(
    9,
    "Define GEMM Reduction Footprint Dimension k_dim",
    `GEMM K reduction dimension (unrolled kernel size): k_dim = ${kH} * ${kW} = ${kDim}.`,
    { kDim, kH, kW },
  );

  // Step 8: Allocate output map
  addStep(
    11,
    "Initialize Output Matrix Buffer",
    `Allocated ${hOut}x${wOut} output feature map filled with 0.0 floats.`,
    { hOut, wOut },
  );

  // Implicit GEMM Simulation Loop
  for (let m = 0; m < mDim; m++) {
    addStep(
      13,
      `Outer GEMM Token Loop: m = ${m}`,
      `Processing GEMM spatial token index m = ${m} of ${mDim - 1}.`,
      { m, mDim },
    );

    const outR = Math.floor(m / wOut);
    addStep(
      14,
      `On-The-Fly Decode Output Row: out_r = ${outR}`,
      `Decoded spatial output row: out_r = m // w_out = ${m} // ${wOut} = ${outR}.`,
      { m, wOut, outR },
      outR,
    );

    const outC = m % wOut;
    addStep(
      15,
      `On-The-Fly Decode Output Col: out_c = ${outC}`,
      `Decoded spatial output col: out_c = m % w_out = ${m} % ${wOut} = ${outC}.`,
      { m, wOut, outC },
      outR,
      outC,
    );

    let acc = 0.0;
    addStep(
      17,
      `Reset Tensor Core Accumulator: acc = 0.0`,
      `Initialized Systolic Array accumulator acc = 0.0 for token m = ${m} at (${outR}, ${outC}).`,
      { m, outR, outC, acc },
      outR,
      outC,
    );

    for (let k = 0; k < kDim; k++) {
      addStep(
        18,
        `GEMM K-Reduction Loop: k = ${k}`,
        `Scanning GEMM reduction tap k = ${k} of ${kDim - 1}.`,
        { m, k, kDim },
        outR,
        outC,
      );

      const kr = Math.floor(k / kW);
      addStep(
        19,
        `Decode Kernel Row: kr = ${kr}`,
        `Decoded kernel row: kr = k // k_w = ${k} // ${kW} = ${kr}.`,
        { k, kW, kr },
        outR,
        outC,
      );

      const kc = k % kW;
      addStep(
        20,
        `Decode Kernel Col: kc = ${kc}`,
        `Decoded kernel col: kc = k % k_w = ${k} % ${kW} = ${kc}.`,
        { k, kW, kc },
        outR,
        outC,
      );

      const imgR = outR * stride + kr - padding;
      addStep(
        22,
        `Implicit On-The-Fly Image Row Address: img_r = ${imgR}`,
        `Evaluated img_r = out_r * stride + kr - padding = ${outR} * ${stride} + ${kr} - ${padding} = ${imgR}.`,
        { outR, stride, kr, padding, imgR },
        outR,
        outC,
      );

      const imgC = outC * stride + kc - padding;
      addStep(
        23,
        `Implicit On-The-Fly Image Col Address: img_c = ${imgC}`,
        `Evaluated img_c = out_c * stride + kc - padding = ${outC} * ${stride} + ${kc} - ${padding} = ${imgC}.`,
        { outC, stride, kc, padding, imgC },
        outR,
        outC,
      );

      const inside = imgR >= 0 && imgR < hIn && imgC >= 0 && imgC < wIn;
      const valA = inside ? image[imgR][imgC] : 0.0;
      addStep(
        inside ? 26 : 28,
        `Fetch Implicit Activation val_a = ${valA}`,
        `Fetched val_a = ${valA} directly from DRAM image coordinate (${imgR}, ${imgC}) without im2col buffer allocation.`,
        { imgR, imgC, hIn, wIn, valA },
        outR,
        outC,
      );

      const valB = kernel[kr][kc];
      addStep(
        30,
        `Fetch Kernel Weight val_b = ${valB}`,
        `Fetched filter weight val_b = ${valB} at kernel position (${kr}, ${kc}).`,
        { kr, kc, valB },
        outR,
        outC,
      );

      const prod = valA * valB;
      acc += prod;
      addStep(
        31,
        `Accumulate FMA: acc += ${valA} * ${valB} = ${prod}`,
        `Executed FMA (Fused Multiply-Add) on GPU Tensor Core. Updated acc = ${acc.toFixed(1)}.`,
        { m, k, valA, valB, prod, acc },
        outR,
        outC,
      );
    }

    outputMap[outR][outC] = acc;
    addStep(
      33,
      `Store Final Spatial Token: output_map[${outR}][${outC}] = ${acc.toFixed(1)}`,
      `Wrote completed dot product ${acc.toFixed(1)} into output grid at (${outR}, ${outC}).`,
      { outR, outC, "output_map[out_r][out_c]": acc },
      outR,
      outC,
    );
  }

  // Step final
  addStep(
    35,
    "Execution Complete",
    `Successfully completed cuDNN Implicit GEMM On-The-Fly Kernel execution. Zero DRAM im2col memory buffer allocated.`,
    { completed: true, mDim, kDim },
  );

  return steps;
};

const CUDNNIMPLICITGEMMONTHEFLYKERNEL_TRIVIA: TriviaMeta = {
  skipLines: [4, 7, 10, 12, 16, 21, 24, 29, 32, 34],
  distractors: [
    "im2col_buf = allocate_dram(m_dim * k_dim)",
    "out_r = m % w_out",
    "kr = k * k_w",
    "acc *= val_a * val_b",
  ],
  hints: [
    {
      line: 14,
      hint: "On-the-fly decode GEMM index m into spatial output row out_r = m // w_out and col out_c = m % w_out.",
    },
    {
      line: 22,
      hint: "Compute image row address implicitly inside inner CUDA warp loop: img_r = out_r * stride + kr - padding.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for cuDNN implicit GEMM on-the-fly kernel function.",
    2: "Unpacks height h_in and width w_in of input image matrix.",
    3: "Unpacks height k_h and width k_w of filter weight kernel.",
    4: "Blank line before output dimension calculation.",
    5: "Calculates spatial output height h_out using integer division floor.",
    6: "Calculates spatial output width w_out using integer division floor.",
    7: "Blank line before GEMM dimension definition.",
    8: "Calculates GEMM M dimension m_dim = h_out * w_out representing spatial output tokens.",
    9: "Calculates GEMM K reduction dimension k_dim = k_h * k_w representing unrolled kernel footprint.",
    10: "Blank line before output matrix allocation.",
    11: "Allocates output feature map matrix of shape h_out x w_out filled with zero floats.",
    12: "Blank line before implicit GEMM simulation loop.",
    13: "Iterates over GEMM spatial token index m from 0 to m_dim - 1.",
    14: "Decodes spatial output row coordinate out_r = m // w_out.",
    15: "Decodes spatial output column coordinate out_c = m % w_out.",
    16: "Blank line before accumulator initialization.",
    17: "Resets Systolic Array accumulator scalar acc to 0.0 for token m.",
    18: "Iterates over GEMM reduction tap index k from 0 to k_dim - 1.",
    19: "Decodes filter kernel row index kr = k // k_w.",
    20: "Decodes filter kernel column index kc = k % k_w.",
    21: "Blank line before implicit address calculation.",
    22: "Calculates spatial image row index img_r = out_r * stride + kr - padding on-the-fly.",
    23: "Calculates spatial image column index img_c = out_c * stride + kc - padding on-the-fly.",
    24: "Blank line before boundary check.",
    25: "Checks if spatial image coordinate (img_r, img_c) is inside valid input image bounds.",
    26: "Fetches activation val_a = image[img_r][img_c] directly from DRAM without im2col memory buffer.",
    27: "Branch executed when coordinate is out of bounds.",
    28: "Sets val_a = 0.0 for zero-padding.",
    29: "Blank line before kernel weight fetch.",
    30: "Loads filter weight val_b = kernel[kr][kc].",
    31: "Executes FMA (Fused Multiply-Add) accumulating val_a * val_b into acc.",
    32: "Blank line separating inner reduction loop from output store.",
    33: "Stores completed dot product accumulation acc into output_map[out_r][out_c].",
    34: "Blank line separating GEMM token loop from return statement.",
    35: "Returns final 2D feature map matrix output_map.",
  },
};

export const cudnnImplicitGemmOnTheFlyKernel: AlgorithmDefinition<cudnnImplicitGemmOnTheFlyKernelInput> =
  {
    id: "cudnn-implicit-gemm-on-the-fly-kernel",
    title: "cuDNN Implicit GEMM On-The-Fly Kernel",
    topicIds: ["ml_convolutions", "ml_gemm_roofline"],
    difficulty: "Medium",
    description:
      "cuDNN and CUTLASS **Implicit GEMM** kernels execute 2D spatial convolutions at peak Tensor Core FLOPS by calculating `im2col` spatial memory addresses **on-the-fly** inside GPU CUDA warp register loops. Instead of allocating massive explicit DRAM memory buffers for unrolled $X_{col}$ matrices, Implicit GEMM maps GEMM matrix indices $(m, k)$ directly to 4D input tensor coordinates $(b, ci, ir, ic)$ using integer arithmetic instructions inside GPU register files.\n\n### Why It Exists\nExplicit `im2col` unrolling allocates $O(K_h \\cdot K_w \\cdot N \\cdot H_{out} \\cdot W_{out})$ DRAM memory, incurring severe memory bandwidth overhead ($50\\%+$ of GPU time spent moving bytes to/from DRAM). Implicit GEMM achieves zero extra DRAM memory allocations while feeding GPU Systolic Array Tensor Cores at full compute throughput.\n\n### Mathematical Formulation\nStandard convolution is formulated as a 2D GEMM matrix multiplication $C[m, n] = \\sum_{k=0}^{K-1} A_{implicit}[m, k] \\cdot B[k, n]$, where:\n\n$$m = r \\cdot W_{out} + c \\quad (\\text{Output Spatial Token Index})$$\n\n$$k = ci \\cdot K_h K_w + kr \\cdot K_w + kc \\quad (\\text{Reduction Footprint Index})$$\n\n$$n = co \\quad (\\text{Output Channel Index})$$\n\nOn-the-fly address generation decodes $(m, k)$ directly in GPU registers:\n\n$$out\\_r = m // W_{out}, \\quad out\\_c = m \\% W_{out}$$\n\n$$kr = k // K_w, \\quad kc = k \\% K_w$$\n\n$$img\\_r = out\\_r \\cdot S + kr - P, \\quad img\\_c = out\\_c \\cdot S + kc - P$$\n\n$$A_{implicit}[m, k] = \\begin{cases} X[ci, img\\_r, img\\_c] & \\text{if } 0 \\le img\\_r < H_{in} \\text{ and } 0 \\le img\\_c < W_{in} \\\\ 0.0 & \\text{otherwise} \\end{cases}$$\n\n### Step-by-Step Intuition\n1. **GEMM Grid Dispatch**: Dispatch GPU thread blocks across 2D GEMM tile dimensions $M \\times N$ ($M = H_{out}W_{out}$, $N = C_{out}$).\n2. **Index Decoding**: Inside CUDA thread registers, decode thread token index $m$ to spatial coordinates $(out\\_r, out\\_c)$.\n3. **On-The-Fly Address Generation**: For each reduction step $k$, compute image row $img\\_r$ and col $img\\_c$ using fast SIMD integer instructions.\n4. **Direct DRAM Read**: Load activation scalar directly from $X[img\\_r, img\\_c]$ into GPU L1/SRAM registers.\n5. **Tensor Core FMA**: Pass registers directly into Tensor Core MMA (Matrix Multiply Accumulate) instructions.\n\n### Key Trade-Offs & Hardware Execution\n- **Zero Memory Overhead**: Saves gigabytes of GPU VRAM in large LLM vision backbones (CLIP, LLaVA).\n- **Integer Arithmetic Overhead**: Requires GPU ALUs to compute integer division and modulo (`//` and `%`) on every reduction step. Compiler optimizations (CUTLASS fast integer division via magic multiplication constants) eliminate division latency.",
    constraints: ["1 <= H_in, W_in <= 1024", "1 <= K_h, K_w <= 11", "stride >= 1", "padding >= 0"],
    examples: [
      {
        kind: "basic",
        title: "Standard 4x4 Image Implicit GEMM Execution",
        inputDisplay: "Image 4x4, Kernel 2x2, Stride 1",
        outputDisplay: "Output 3x3 matrix",
        input: DEFAULT_CUDNNIMPLICITGEMMONTHEFLYKERNEL_INPUT,
        output: "3x3 spatial output feature map",
        explanation: "Decodes 9 spatial GEMM tokens on-the-fly without DRAM im2col memory buffer.",
      },
    ],
    code: CUDNNIMPLICITGEMMONTHEFLYKERNEL_CODE,
    timeComplexity: {
      best: "O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
      average: "O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
      worst: "O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
    },
    spaceComplexity: "O(H_{out} \\cdot W_{out})",
    complexityAnalysis: {
      time: "Evaluates $K_h \\cdot K_w$ reduction steps for each of the $H_{out} \\cdot W_{out}$ spatial tokens, executing at peak Tensor Core TFLOPS.",
      space:
        "Requires $O(H_{out} \\cdot W_{out})$ memory for output feature map storage; zero extra memory allocated for im2col unrolling.",
    },
    topicGuide: {
      overview:
        "The **cuDNN Implicit GEMM On-The-Fly Kernel** computes spatial im2col memory addresses dynamically inside GPU register loops, eliminating DRAM buffer allocations.",
      sections: [
        {
          heading: "1. Core Concept & Implicit GEMM Address Generation",
          body: "Implicit GEMM simulates matrix multiplication $C[m, n] = \\sum_k A_{implicit}[m, k] \\cdot B[k, n]$. Instead of pre-building $A_{implicit}$ in DRAM, CUDA thread blocks compute $A_{implicit}[m, k]$ by decoding $m \\to (out\\_r, out\\_c)$ and $k \\to (kr, kc)$ in registers.",
        },
        {
          heading: "2. Systems & Memory Hierarchy Advantages",
          body: "Explicit `im2col` inflates DRAM memory footprint by $K_h \\cdot K_w$ times. Implicit GEMM executes with 0 Bytes of extra DRAM memory allocation, keeping memory traffic limited to original input activation reads and output feature writes.",
        },
        {
          heading: "3. CUTLASS & Fast Integer Division",
          body: "Evaluating integer division ($m // W_{out}$) and modulo ($m \\% W_{out}$) on GPU ALUs can introduce instruction latency. Libraries like CUTLASS use magic multiplication constants (`fast_divmod`) to evaluate division using high-speed integer multiplications.",
        },
        {
          heading: "4. Edge Case Analysis & Padding Handling",
          body: "Boundary zero-padding is handled via register predicates: if $0 \\le img\\_r < H_{in}$ and $0 \\le img\\_c < W_{in}$ load input activation, else load 0.0 float.",
        },
      ],
      keyTerms: [
        {
          term: "Implicit GEMM",
          definition:
            "GPU convolution kernel evaluating im2col indices on-the-fly in SRAM registers without DRAM buffer allocations.",
        },
        {
          term: "On-The-Fly Address Generation",
          definition:
            "Decoding 2D GEMM matrix indices (m, k) to 4D spatial tensor coordinates inside CUDA registers.",
        },
        {
          term: "Register Predicate Masking",
          definition:
            "Evaluating spatial boundary checks in registers to inject 0.0 zero-padding without extra memory branches.",
        },
        {
          term: "Fast Divmod Optimization",
          definition:
            "Replacing GPU integer division instructions with magic constant multiplication for index decoding.",
        },
      ],
    },
    trivia: CUDNNIMPLICITGEMMONTHEFLYKERNEL_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_CUDNNIMPLICITGEMMONTHEFLYKERNEL_INPUT,
    generateSteps: generateCudnnImplicitGemmOnTheFlyKernelSteps,
  };
