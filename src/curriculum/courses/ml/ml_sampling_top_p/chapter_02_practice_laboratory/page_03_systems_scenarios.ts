import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_sampling_top_p_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: Sampling Systems Diagnostics & GPU Kernels",
  subtitle:
    "Question Bank Suite: Speculative Decoding Verification, Flash-Decoding Sampling, and RNG Desync",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_sampling_top_p",
      title: "Autoregressive Sampling Systems Suite",
      partA_dsaCoding: [
        {
          title: "Min-P Adaptive Truncation Sampler",
          difficulty: "Hard",
          description:
            "Implement a Min-P sampler in Python that dynamically prunes candidate tokens based on the relative probability threshold p_thresh = p_base * max(probs), renormalizing the remaining tokens in O(V) time.",
          problemStatement:
            "def min_p_sample(logits: np.ndarray, min_p_base: float = 0.05, temperature: float = 1.0) -> int:\n    pass",
        },
      ],
      partB_mathProofs: [
        {
          title: "Proof of Speculative Decoding Exact Distribution Match",
          statement:
            "Prove that accepting draft token x with probability min(1, p(x)/q(x)) and recovering from rejection with distribution max(0, p(x) - q(x)) / sum_y max(0, p(y) - q(y)) generates outputs identically distributed according to target model distribution p(x).",
          proofOutline:
            "Evaluate total generation probability P(X = x) = P(drafted x and accepted) + P(rejected draft y and recovered x) = q(x) * min(1, p(x)/q(x)) + (1 - sum_y min(q(y), p(y))) * (p(x) - min(q(x), p(x))) / (1 - sum_y min(q(y), p(y))) = min(q(x), p(x)) + p(x) - min(q(x), p(x)) = p(x).",
          engineeringContext:
            "Leviathan et al. (2023) proven identity guaranteeing 2x-3x LLM inference speedups with zero quality degradation.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Kernel Fusion for High-Throughput LLM Decoding (Flash-Sampling)",
          prompt:
            "In high-throughput vLLM serving, why is evaluating Softmax, Top-P cumsum, and Multinomial sampling in separate PyTorch kernel launches slow, and how does fusing them into a single CUDA warp-level kernel improve throughput by 40%?",
          engineeringContext:
            "Separate launches require writing (Batch, VocabSize) intermediate arrays to high-latency GPU VRAM three times. Fused Flash-Sampling keeps the top candidate heap in shared memory/registers, computes parallel prefix scans using warp shuffles, and directly emits the 4-byte sampled token ID to global memory.",
        },
      ],
      partD_stressTests: [
        {
          title: "RNG Desynchronization Across Tensor-Parallel Worker Ranks",
          scenario:
            "A model is served with Tensor Parallelism TP=4. Temperature sampling is executed independently on all 4 GPUs without setting identical RNG seeds. The model generates grammatically fractured garbage text after 3 tokens.",
          failureMode:
            "Because GPUs drew independent random floats, Rank 0 sampled token ' The' while Rank 1 sampled token ' A'. Subsequent forward passes had mismatched sequence lengths and mismatched KV cache positions across attention heads, causing immediate state corruption. Synchronizing RNG state or broadcasting the chosen token from Rank 0 fixes the desync.",
        },
      ],
    },
  ],
};

export const page3 = page_03_systems_scenarios;
