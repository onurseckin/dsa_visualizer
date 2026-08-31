import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_pagedattention_cow_vllm_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic Suite: PagedAttention & vLLM",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_pagedattention_cow_vllm",
      title: "PagedAttention & vLLM Memory Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Radix Tree Prefix Matcher with Automatic Block Binding",
          description:
            "Implement a Radix Tree (compact prefix tree) that indexes previously computed prompt tokens and automatically matches incoming requests against cached physical block IDs, achieving zero-cost KV prefix sharing.",
          problemStatement:
            "Given a list of incoming prompt tokens and the existing radix tree of physical block mappings, find the longest matching prefix, increment its physical block reference counts, and return the allocated block table.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Exact Memory Bound for Multi-Tenant GPU Virtualization",
          prompt:
            "Prove that the total physical memory required by $N$ independent multi-tenant requests in PagedAttention is bounded by $M_{\\text{total}} \\le \\sum_{i=1}^N \\lceil L_i / B \\rceil \\cdot B \\cdot \\text{sizeof}(\\text{KV\\_block})$.",
          statement:
            "Demonstrate how memory allocations strictly grow monotonically with token generation.",
          proofOutline:
            "1. Define individual request allocation as $M_i = \\lceil L_i / B \\rceil \\cdot \\text{block\\_bytes}$.\\n2. Sum across all $N$ active requests: $M_{\\text{total}} = \\sum M_i$.\\n3. Contrast with static reservation $M_{\\text{static}} = N \\cdot L_{\\max} \\cdot \\text{block\\_bytes}$.\\n4. Show that $M_{\\text{total}} / M_{\\text{static}} \\approx \\bar{L} / L_{\\max} \\le 0.35$.",
          engineeringContext:
            "Allows GPU cluster orchestrators to pack 3x more tenants onto fixed hardware nodes.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "TLB / Block Table Overhead in CUDA Attention Kernels",
          prompt:
            "In CUDA PagedAttention kernels, threads must load the physical block ID from the Block Table in Global Memory before loading Key and Value vectors into Shared Memory. How does vLLM store block tables in L2 cache and registers to completely hide this address translation latency?",
          engineeringContext:
            "Ensures virtual memory indirection adds less than 1% overhead relative to contiguous memory access.",
        },
      ],
      partD_stressTests: [
        {
          title: "Reference Count Underflow / Double Free Race Condition",
          scenario:
            "In a multi-threaded parallel decoding engine (e.g. speculative tree verification with branched sampling), two worker threads simultaneously fork and free shared physical blocks. If reference count increments and decrements are not guarded by atomic operations (`atomicAdd` / `atomicSub`), a block's reference count drops to 0 prematurely, returning an actively read block to the free pool and causing silent memory corruption across unrelated user requests.",
          failureMode:
            "Catastrophic cross-request token corruption and non-deterministic generation hallucinations.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
