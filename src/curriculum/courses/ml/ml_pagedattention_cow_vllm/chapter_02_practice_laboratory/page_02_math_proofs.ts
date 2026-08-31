import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_pagedattention_cow_vllm_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Copy-On-Write Memory Savings & Radix Prefix Sharing",
  sections: [
    {
      type: "math_proof",
      title: "Copy-On-Write Memory Savings in Parallel Sampling",
      theorem:
        "Consider parallel sampling generating $K$ output candidate sequences from a shared prompt of length $P$. Let each candidate generate $G$ output tokens. PagedAttention with Copy-On-Write achieves a fractional memory savings of $S = \\frac{(K-1)P}{K(P + G)}$ relative to naive independent replication. As prompt length $P \\gg G$, the memory savings asymptotically approach $\\frac{K-1}{K} \\to 100\\%$.",
      proof:
        "1. Naive Independent KV Cache Allocation:\\nWithout memory sharing, each of the $K$ candidate streams allocates its own independent copy of the prompt KV cache ($P$ tokens) and private generated tokens ($G$ tokens):\\n$$M_{\\text{naive}} = K \\cdot (P + G) \\cdot \\text{KV\\_size\\_per\\_token}$$\\n\\n2. PagedAttention Copy-On-Write Allocation:\\nUnder PagedAttention, the $P$ prompt tokens are stored in shared physical blocks (with reference count $K$). Each of the $K$ candidates allocates only private blocks for its own $G$ generated tokens:\\n$$M_{\\text{COW}} = (P + K \\cdot G) \\cdot \\text{KV\\_size\\_per\\_token}$$\\n\\n3. Absolute Memory Saved:\\n$$\\Delta M = M_{\\text{naive}} - M_{\\text{COW}} = K(P + G) - (P + KG) = KP + KG - P - KG = (K - 1)P$$\\n\\n4. Fractional Memory Savings:\\n$$S = \\frac{\\Delta M}{M_{\\text{naive}}} = \\frac{(K - 1)P}{K(P + G)} = \\left(1 - \\frac{1}{K}\\right) \\left(\\frac{1}{1 + G/P}\\right)$$\\nFor typical few-shot reasoning / synthetic data generation tasks where $K = 8$ branches, prompt $P = 4{,}000$, and generation $G = 500$:\\n$$S = \\left(1 - \\frac{1}{8}\\right) \\left(\\frac{1}{1 + 500/4000}\\right) = \\frac{7}{8} \\times \\frac{8}{9} = \\frac{7}{9} \\approx 77.78\\%$$\\nOver $77\\%$ of total KV cache memory is reclaimed, allowing serving systems to scale batch throughput by nearly $4.5\\times$.",
    },
    {
      type: "math_proof",
      title: "Radix Tree Prefix Eviction & Optimal Cache Retention",
      theorem:
        "Under Least-Recently-Used (LRU) eviction on a Radix Tree of shared prompt prefixes, if prompt access frequencies follow Zipf's law $p(k) \\propto k^{-\\gamma}$ with skew $\\gamma > 1$, the asymptotic hit rate of retained physical blocks approaches $H = \\frac{\\sum_{k=1}^C k^{-\\gamma}}{\\sum_{k=1}^M k^{-\\gamma}}$ where $C$ is the block cache capacity in prefixes.",
      proof:
        "1. Shared Prefix Organization:\\nCommon system prompts and few-shot examples form a prefix tree (Radix Tree). Each node in the radix tree represents a contiguous sub-sequence of tokens mapped to physical PagedAttention blocks.\\n\\n2. Reference Counting and LRU Cache:\\nWhen a request finishes, blocks corresponding to nodes in the Radix Tree have their reference counts decremented. Instead of returning to the free list immediately, unreferenced nodes enter an LRU cache.\\n\\n3. Zipfian Request Distribution:\\nUnder Zipfian popularity where the $k$-th most popular system prompt has request probability $p_k = \\frac{k^{-\\gamma}}{\\zeta(\\gamma)}$, caching the top $C$ unique prompt subtrees guarantees that the expected fraction of tokens served directly from GPU memory without recomputation is $H = \\sum_{k=1}^C p_k$.\\n\\nFor $\\gamma = 1.4$ and $C = 100$ popular system prompts in an API service, $H > 85\\%$, reducing Time-To-First-Token (TTFT) by over $85\\%$ across the cluster.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
