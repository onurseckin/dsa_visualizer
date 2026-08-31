import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_compiler_fusion_liveness_c1_p1",
  pageNumber: 1,
  title: "Compiler Optimization: Operator Fusion & Liveness Analysis",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Unfused Kernel Crisis: Kernel Launch Overhead & Memory Round-Trips",
      content:
        "In eager-mode deep learning frameworks (e.g. PyTorch eager), executing a simple sequence of operations like `y = dropout(gelu(bias_add(x, b)))` launches three distinct GPU kernels sequentially. Each kernel incurs: (1) a **3-10 microsecond CPU driver launch overhead**, (2) reading inputs from slow global HBM, (3) writing intermediate activations back to HBM, and (4) allocating temporary memory buffers. For elementwise and normalization operators, arithmetic intensity is $< 1.0 \\text{ FLOP/byte}$, meaning 95% of execution time is wasted waiting for HBM roundtrips. Deep learning compilers (**TorchInductor / PyTorch 2.0, Triton, XLA, TVM**) eliminate this waste through **Operator Fusion** and **Liveness Interval Memory Allocation**.",
    },
    {
      type: "mental_model",
      title: "Mental Model: Kernel Fusion & Interval Graph Memory Arenas",
      visualIntuition:
        "Unfused: [Input] --(Kernel 1)--> [HBM Buf 1] --(Kernel 2)--> [HBM Buf 2] --(Kernel 3)--> [Output]\\nFused:   [Input] --(Single Fused Kernel: Registers Bias+GELU+Dropout)--> [Output]\\n\\nMemory Arena Allocation (Liveness Intervals):\\nTensor A: [ t=0 ====== t=3 ]  --> Memory Offset 0x0000\\nTensor B: [ t=1 ====== t=2 ]  --> Memory Offset 0x1000\\nTensor C:         [ t=3 ====== t=5 ]  --> Reuses Memory Offset 0x1000! (Tensor B is dead)",
      invariant:
        "Liveness Interval Invariant: Two tensors can share the exact same physical memory arena address if and only if their liveness intervals [t_def, t_last_use] are completely disjoint (intersection is empty).",
      stateTransitions:
        "Eager FX/TorchScript Graph -> Fusion Clustering (identify elementwise & reduction subgraphs) -> Liveness Interval Analysis -> Interval Graph Coloring -> Physical Memory Arena Assignment -> Codegen optimized C++/Triton kernel.",
      naiveBottleneck:
        "Allocating new GPU memory for every intermediate activation exhausts VRAM and triggers frequent expensive CUDA allocator memory defragmentation pauses.",
      optimalInsight:
        "By fusing elementwise pipelines into single kernels and allocating intermediate buffers in a compact memory arena, compilers reduce peak memory by 40-70% and accelerate execution by 2x-4x.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Interval Graph Perfect Coloring Theorem",
      theorem:
        "Let $G = (V, E)$ be the interference graph of tensor liveness intervals $I_v = [s_v, e_v]$ for $v \\in V$, where $(u, v) \\in E \\iff I_u \\cap I_v \\ne \\emptyset$. The minimum number of memory buffer slots $\\chi(G)$ required to schedule all tensors without memory conflict is exactly equal to the maximum clique size $\\omega(G) = \\max_t |\\{v \\in V : t \\in I_v\\}|$.",
      proof:
        "1. Lower Bound:\\nLet $t^*$ be the point in time where the maximum number of tensors are simultaneously live: $k = \\omega(G) = |\\{v \\in V : t^* \\in I_v\\}|$. Since all $k$ tensors are simultaneously active at time $t^*$, they pairwise interfere with each other and form a clique of size $k$. Any valid memory assignment must assign mutually distinct memory slots to all $k$ tensors, so $\\chi(G) \\ge \\omega(G)$.\\n\\n2. Upper Bound via Greedy Interval Coloring:\\nSort the intervals in ascending order of their start times $s_1 \\le s_2 \\le \\dots \\le s_{|V|}$. Assign colors (memory offsets) greedily: for each interval $I_i$, assign the lowest available color not currently used by any active overlapping interval.\\nWhen processing interval $I_i$, the number of currently active intervals that overlap with $s_i$ is at most $\\omega(G) - 1$.\\nTherefore, a free color from the set $\\{1, 2, \\dots, \\omega(G)\\}$ is always available.\\n\\n3. Conclusion:\\nGreedy interval scheduling uses at most $\\omega(G)$ colors. Thus $\\chi(G) \\le \\omega(G)$.\\nCombining bounds yields $\\chi(G) = \\omega(G)$, proving that the maximum number of simultaneously live tensors strictly determines the minimum physical memory footprint, computable in $O(|V| \\log |V|)$ time.",
    },
  ],
};
