import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_dense_gemm_tiling_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic Suite: Dense GEMM & Tensor Cores",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_dense_gemm_tiling",
      title: "Dense GEMM & GPU Tensor Core Systems Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "XOR Shared Memory Swizzle Address Resolver",
          description:
            "Implement a zero-overhead bitwise XOR swizzling function `swizzle_address(row, col, pitch, bank_bits=5)` that remaps 2D tile coordinates to eliminate shared memory bank conflicts on 32-way GPU memory controllers.",
          problemStatement:
            "Given row and col indices in an SRAM tile, compute the swizzled 1D memory offset and verify that no two threads in a warp map to the same bank.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Roofline Knee-Point Derivation for Hopper H100",
          prompt:
            "Given an NVIDIA H100 SXM5 GPU with peak FP16 Tensor Core compute $P_{\\text{compute}} = 989 \\times 10^{12} \\text{ FLOP/s}$ and HBM3 memory bandwidth $B_{\\text{mem}} = 3.35 \\times 10^{12} \\text{ Bytes/s}$, derive the exact arithmetic intensity threshold $I^*$ required to achieve at least 90% of peak theoretical compute.",
          statement: "Calculate $I^* = 0.90 \\times \\frac{P_{\\text{compute}}}{B_{\\text{mem}}}$.",
          proofOutline:
            "1. By the Roofline model, attainable performance is $P(I) = \\min(P_{\\text{compute}}, I \\times B_{\\text{mem}})$.\\n2. In the memory-bound regime, $P(I) = I \\times B_{\\text{mem}}$.\\n3. To reach $0.90 P_{\\text{compute}}$, $I \\times B_{\\text{mem}} \\ge 0.90 P_{\\text{compute}} \\implies I^* = 0.90 \\frac{989}{3.35} \\approx 265.25 \\text{ FLOPs/byte}$.\\n4. Conclude that batch sizes and tile dimensions must maintain $I > 265$ to avoid memory bus starvation.",
          engineeringContext:
            "Governs minimum batch sizing across distributed inference and training clusters.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Tensor Memory Accelerator (TMA) vs. Legacy cp.async",
          prompt:
            "How does Hopper's hardware Tensor Memory Accelerator (TMA) decouple address generation from CUDA execution cores, allowing 5D tensor coordinates to be transferred directly between HBM and Shared Memory via hardware DMA without consuming register file bandwidth?",
          engineeringContext:
            "Frees up 30% more registers for arithmetic accumulators, enabling larger $T_M \\times T_N$ thread tiles.",
        },
      ],
      partD_stressTests: [
        {
          title: "Tail Tile Straggler & Wave Quantization Disaster",
          scenario:
            "When matrix dimension $M = 1025$ and block size $B_M = 128$, the GPU allocates 9 thread blocks along the M dimension. The first 8 blocks process 128 rows, but the 9th block processes only 1 row, while consuming an entire SM and wasting 99.2% of its ALUs (tail-effect waste). If the total number of blocks is slightly larger than the total SM count (e.g. 133 blocks on 132 SMs), the last single block runs in a lonely 'tail wave', doubling total kernel execution time (Wave Quantization effect).",
          failureMode:
            "Severe 50% drop in kernel compute throughput due to non-divisible tile matrix dimensions.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
