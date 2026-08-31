import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_compiler_fusion_liveness_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic Suite: Compiler Fusion & IR Optimization",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_compiler_fusion_liveness",
      title: "Compiler Optimization & Kernel Fusion Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "TorchInductor Pattern-Matching Rewriter",
          description:
            "Implement a Graph IR pattern matcher that identifies `(x * sigmoid(x))` subgraphs and automatically replaces them with a single fused SiLU / Swish operator node.",
          problemStatement:
            "Given a computation graph represented as an adjacency list of nodes and op-types, replace all occurrences of the SiLU pattern with a fused primitive.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Reduction Fusion Boundary Proof (Tree Reduction vs. Elementwise)",
          prompt:
            "Prove why fusing a global reduction (e.g. `sum(X, dim=-1)`) with subsequent elementwise operations requires a thread-block synchronization barrier `__syncthreads()` or warp shuffle, and derive the maximum tile size $B_{\\max}$ that can be reduced within a single GPU SM.",
          statement: "Demonstrate how reduction dependencies partition fusion boundaries.",
          proofOutline:
            "1. Elementwise operations operate embarrassingly parallel on disjoint indices: $y_i = f(x_i)$.\\n2. Reduction operations compute $s = \\sum_i x_i$, creating an all-to-one data dependency.\\n3. A single SM has max shared memory $M_{\\text{SRAM}}$ and max threads $T_{\\max} = 1024$. A block reduction can reduce at most $T_{\\max}$ elements per step without global memory barriers.\\n4. Conclude that reductions spanning dimensions $> 1024$ require split-k multi-block reductions with global synchronization.",
          engineeringContext:
            "Governs fusion heuristics in TorchInductor and Triton code generators.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Triton JIT Autotuning & Caching Architecture",
          prompt:
            "How does the Triton JIT compiler autotune block sizes (`BLOCK_M`, `BLOCK_N`, `num_warps`, `num_stages`), and how does disk-based compilation caching eliminate startup latency during multi-node production training runs?",
          engineeringContext:
            "Prevents JIT compilation storms from causing multi-minute cluster deadlocks upon job startup.",
        },
      ],
      partD_stressTests: [
        {
          title: "Graph Memory Arena Stride Misalignment Crash",
          scenario:
            "A custom compiler memory allocator assigns memory offsets based on byte size but ignores GPU 128-byte DRAM alignment constraints (assigning offset 0x1004 instead of 0x1080). When a fused vectorized FP16 `float4` (64-bit) load is issued on an unaligned memory address, the GPU triggers an unrecoverable CUDA illegal memory access exception.",
          failureMode:
            "Fatal hardware exception `CUDA error: misaligned address` crashing the training process.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
