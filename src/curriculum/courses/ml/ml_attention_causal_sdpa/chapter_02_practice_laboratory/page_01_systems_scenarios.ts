import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_attention_causal_sdpa_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: KV Cache Allocation & Memory Footprint",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Exact KV Cache Sizing Equation",
      content:
        "The exact memory consumed by the KV cache for an LLM during autoregressive serving is governed by:\n\n$$\\text{Memory}_{\\text{KV}} = 2 \\times 2 \\times n_{\\text{layers}} \\times n_{\\text{heads}} \\times d_{\\text{head}} \\times \\text{seq\\_len} \\times \\text{batch\\_size} \\times \\text{bytes\\_per\\_elem}$$\n\n- The leading factor of $2$ accounts for storing both **Keys** and **Values**.\n- The second factor of $2$ applies when using FP16 or BF16 (2 bytes per element).\n- For Llama-3-70B ($n_{\\text{layers}} = 80$, $n_{\\text{kv\\_heads}} = 8$, $d_{\\text{head}} = 128$, Grouped-Query Attention):\n$$\\text{Memory}_{\\text{KV}} = 2 \\times 80 \\times 8 \\times 128 \\times 2 = 327{,}680 \\text{ bytes/token} \\approx 0.328 \\text{ MB per token in batch}$$\nFor a batch of 32 requests with a 4,096 context length: $32 \\times 4096 \\times 327{,}680 \\approx 42.95 \\text{ GB}$ of GPU memory is dedicated entirely to the KV cache.",
    },
    {
      type: "problem_checkpoint",
      title: "Interactive Verification: KV Cache Allocation & Overflow Boundary",
      problemId: "causal_masking_verification",
      difficulty: "Hard",
      rationale:
        "Validate understanding of memory bounds by calculating exact tensor strides, cache allocations, and preventing out-of-memory crashes on fixed GPU VRAM limits.",
      starterCode: `/**
 * KV Cache Allocation & Sizing Engine
 */

export function calculateKVCacheBytes(
  numLayers: number,
  numKvHeads: number,
  headDim: number,
  seqLen: number,
  batchSize: number,
  bytesPerElem: number = 2
): number {
  // 2 (Key + Value) * numLayers * numKvHeads * headDim * seqLen * batchSize * bytesPerElem
  return 2 * numLayers * numKvHeads * headDim * seqLen * batchSize * bytesPerElem;
}`,
    },
  ],
};

export const page_01_systems_scenarios = page1;
export const page2 = page1;
