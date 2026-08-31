import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_rope_gqa_attention_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: GQA Throughput Optimizer",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Throughput & Maximum Batch Capacity Scaling",
      content:
        "Consider an 8x NVIDIA H100 GPU cluster (80GB HBM3 per GPU, total 640 GB) serving Llama-3-70B across an 8-way Tensor Parallelism (TP=8) group. Weights occupy ~140 GB in FP16, leaving 500 GB for KV cache.\n\n1. **Under Multi-Head Attention (MHA, $H_{KV} = 64$):**\n   - KV Cache per token across all layers: $2 \\times 80 \\times 64 \\times 128 \\times 2 = 2.621 \\text{ MB/token}$.\n   - At context length 8,192, one request consumes $8192 \\times 2.621 \\text{ MB} \\approx 21.47 \\text{ GB}$.\n   - **Max concurrent requests in 500 GB:** $\\lfloor 500 / 21.47 \\rfloor = 23$ requests.\n\n2. **Under Grouped-Query Attention (GQA, $H_{KV} = 8, G = 8$):**\n   - KV Cache per token across all layers: $2 \\times 80 \\times 8 \\times 128 \\times 2 = 0.327 \\text{ MB/token}$ (8x reduction!).\n   - At context length 8,192, one request consumes only $2.68 \\text{ GB}$.\n   - **Max concurrent requests in 500 GB:** $\\lfloor 500 / 2.68 \\rfloor = 186$ requests (8.1x throughput increase!).",
    },
    {
      type: "problem_checkpoint",
      title: "Interactive Systems Benchmark: GQA Throughput Optimizer",
      problemId: "gqa_throughput_optimizer",
      difficulty: "Hard",
      rationale:
        "Verify system throughput under varying head group configurations ($G \\in \\{1, 2, 4, 8, 16, 32, 64\\}$) and identify the exact crossover point where decode latency transitions from memory-bandwidth bound to Tensor Core compute-bound.",
      starterCode: `/**
 * GQA Memory & Max Batch Size Calculator
 */

export function calculateMaxBatchCapacity(
  availableMemoryBytes: number,
  numLayers: number,
  numKvHeads: number,
  headDim: number,
  contextLength: number,
  bytesPerElem: number = 2
): number {
  const bytesPerToken = 2 * numLayers * numKvHeads * headDim * bytesPerElem;
  const bytesPerRequest = contextLength * bytesPerToken;
  return Math.floor(availableMemoryBytes / bytesPerRequest);
}`,
    },
  ],
};

export const page_01_systems_scenarios = page1;
export const page2 = page1;
