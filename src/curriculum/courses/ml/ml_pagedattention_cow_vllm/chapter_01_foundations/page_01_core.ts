import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_pagedattention_cow_vllm_c1_p1",
  pageNumber: 1,
  title: "PagedAttention & vLLM: Virtual Memory & Copy-On-Write Mechanics",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Physical Memory Fragmentation Crisis",
      content:
        "Prior to PagedAttention, LLM serving engines allocated KV cache memory as large, contiguous tensors in GPU High Bandwidth Memory. Because request generation lengths are unpredictable a priori, engines were forced to reserve contiguous memory for the maximum possible sequence length (e.g. 2,048 or 8,192 tokens) upfront. This caused severe **Internal Fragmentation** (memory reserved for future tokens that are never generated), **External Fragmentation** (memory allocators like 'cudaMalloc' leaving un-allocatable memory gaps), and **Reservation Waste** (memory allocated for inactive requests). In production workloads, over 60-80% of total GPU memory was completely wasted on unused pre-allocations! PagedAttention (vLLM, Kwon et al., SOSP 2023) resolves this physical crisis by adopting the principles of Operating System Virtual Memory Paging.",
    },
    {
      type: "mental_model",
      title: "Mental Model: Block Tables, Non-Contiguous Physical Memory & Copy-On-Write",
      visualIntuition:
        "[ Logical KV Cache: Tokens 0 .. 47 ]\\n       |\\n  Logical Block 0 (Tok 0-15)  --> Physical Block #7  [ref_count: 2] (Shared Prefix)\\n  Logical Block 1 (Tok 16-31) --> Physical Block #12 [ref_count: 2] (Shared Prefix)\\n  Logical Block 2 (Tok 32-47) --> Physical Block #3  [ref_count: 1] (Branch A Private)\\n                               \\--> Branch B forks: Writes to Block 2 triggers COW -> Allocates Physical Block #19!",
      invariant:
        "Virtual Address Translation Invariant: Physical address of token i in request R is given by Base(PhysicalBlockPool) + BlockTable[R][floor(i / B)] * B * Stride + (i mod B) * Stride. Copy-On-Write Invariant: A physical block with ref_count > 1 is strictly immutable; writing to it forces allocation of a new private physical block with ref_count = 1.",
      stateTransitions:
        "Token Arrival -> Map token index to logical block -> Lookup Block Table -> If block full, allocate new block from Free List -> If writing to shared block (ref_count > 1), trigger COW -> Write Key and Value -> On request completion, decrement ref_counts and return blocks with ref_count = 0 to Free List.",
      naiveBottleneck:
        "Requiring contiguous physical memory for the entire sequence forces over-allocation and prevents parallel decoding paths (beam search, parallel sampling) from sharing common prefix memory.",
      optimalInsight:
        "Decoupling logical sequence continuity from non-contiguous physical block storage slashes memory fragmentation to < 4%, allowing serving systems to increase batch sizes and throughput by 2x-4x.",
    },
    {
      type: "math_proof",
      title: "Mathematical Bound: PagedAttention Memory Fragmentation",
      theorem:
        "For a fixed block size $B$ (tokens per block) and a sequence of length $L$, PagedAttention eliminates all external fragmentation and bounds internal memory fragmentation waste to at most $\\frac{B-1}{L} \\times 100\\%$.",
      proof:
        "1. External Fragmentation:\\nBecause all physical memory allocations occur in uniform, fixed-size chunks of $B$ tokens, any free physical block can satisfy any request's next block allocation. Hence, external fragmentation is strictly $0\\%$.\\n\\n2. Internal Fragmentation:\\nFor a sequence of length $L$, the number of allocated logical blocks is $N_{\\text{blocks}} = \\lceil L / B \\rceil$. The total allocated capacity is $C = \\lceil L / B \\rceil \\cdot B$ token slots.\\nThe internal fragmentation (wasted allocated slots in the final block) is:\\n$$W = C - L = \\left\\lceil \\frac{L}{B} \\right\\rceil B - L = (B - (L \\bmod B)) \\bmod B$$\\nThe maximum number of wasted slots occurs when $L \\equiv 1 \\pmod B$, yielding $W_{\\max} = B - 1$ slots.\\n\\n3. Waste Fraction:\\n$$\\text{Fraction}_{\\text{waste}} = \\frac{W}{L} \\le \\frac{B - 1}{L}$$\\nFor standard block size $B = 16$ and an average sequence length $L = 512$ tokens, the maximum internal fragmentation is $\\frac{15}{512} \\approx 2.93\\%$, while for $L = 2048$, it drops to $\\frac{15}{2048} \\approx 0.73\\%$. The system achieves $>97\\text{-}99\\%$ physical memory utilization.",
    },
  ],
};
