import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_continuous_batching_orca_c1_p1",
  pageNumber: 1,
  title: "Continuous Batching & Orca: Iteration-Level Scheduling",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Physical Crisis: Static Batching & The Bubble Tragedy",
      content:
        "Traditional deep learning inference systems operate on **Static Batches**: $B$ requests are grouped together and executed until every request in the batch completes generation. However, LLM workloads exhibit extreme variance in sequence length—one request may generate 5 tokens while a neighboring request generates 1,024 tokens. Under static batching, the completed request's execution slot remains idle for 1,019 iterations, wasting GPU compute on redundant padding tokens (the 'bubble overhead'). In production traces, static batching wastes over 60-80% of theoretical GPU compute capacity. Continuous Batching (Orca, Yu et al., OSDI 2022) resolves this by scheduling execution at the granularity of individual forward-pass **iterations** (token-level steps) rather than full request lifecycles.",
    },
    {
      type: "mental_model",
      title: "Mental Model: Iteration-Level Scheduling State Machine",
      visualIntuition:
        "Iteration t=0: [Req A: Prefill (len 128)] + [Req B: Decode step 15] + [Req C: Decode step 89]\\nIteration t=1: [Req A: Decode step 1] + [Req B: Decode step 16] + [Req C: EOS -> Evicted! Slot freed]\\nIteration t=2: [Req A: Decode step 2] + [Req B: Decode step 17] + [Req D: Admitted -> Prefill (len 64)]",
      invariant:
        "Iteration-Level Progress Invariant: At every discrete forward pass step t, all active non-terminated requests advance by exactly one token. Terminated requests (<EOS> or max_tokens) are instantly evicted at step boundary t -> t+1, admitting pending requests without pipeline bubbles.",
      stateTransitions:
        "Request Lifecycle: QUEUED (in waiting priority pool) -> ADMITTED -> PREFILLING (compute-bound prompt ingestion) -> DECODING (memory-bandwidth-bound single-token step) -> FINISHED (emitted EOS) -> EVICTED (KV memory freed).",
      naiveBottleneck:
        "Static batching pads all sequences to the batch maximum length (max_seq_len), materializing billions of zero-attention operations and blocking incoming requests until the slowest straggler finishes.",
      optimalInsight:
        "Continuous batching recycles execution slots and physical KV memory immediately at the iteration boundary, packing active tokens into ragged tensors and driving GPU resource utilization near 100%.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Static vs. Continuous Batching Throughput",
      theorem:
        "Let a batch of $B$ independent requests have generation lengths $L_1, L_2, \\dots, L_B$ drawn from a distribution with mean $\\mu$ and maximum $L_{\\max} = \\max_i L_i$. Static batching requires $B \\cdot L_{\\max}$ token evaluation slots, whereas continuous batching requires exactly $\\sum_{i=1}^B L_i = B \\cdot \\mu$ slots. The theoretical throughput improvement ratio is $\\frac{L_{\\max}}{\\mu} > 1$.",
      proof:
        "1. Static Batching Compute Cost:\\nIn static batching, all requests are synchronized to the maximum length $L_{\\max}$. The total number of token-step evaluations performed by the GPU is:\\n$$W_{\\text{static}} = \\sum_{i=1}^B L_{\\max} = B \\cdot L_{\\max}$$\\nThe useful work performed is $W_{\\text{useful}} = \\sum_{i=1}^B L_i = B \\cdot \\mu$. The wasted bubble work is:\\n$$W_{\\text{bubble}} = \\sum_{i=1}^B (L_{\\max} - L_i) = B \\cdot (L_{\\max} - \\mu)$$\\n\\n2. Continuous Batching Compute Cost:\\nContinuous batching terminates request $i$ immediately after $L_i$ steps and admits new waiting tokens. The total token evaluations performed to complete the $B$ requests is strictly:\\n$$W_{\\text{continuous}} = \\sum_{i=1}^B L_i = B \\cdot \\mu$$\\n\\n3. Speedup Ratio:\\nAssuming constant batch execution cost per iteration, the serving throughput speedup $S$ is:\\n$$S = \\frac{W_{\\text{static}}}{W_{\\text{continuous}}} = \\frac{B \\cdot L_{\\max}}{B \\cdot \\mu} = \\frac{L_{\\max}}{\\mu}$$\\nFor typical heavy-tailed Poisson or Pareto request length distributions where $L_{\\max} \\approx 1024$ and $\\mu \\approx 200$, $S = \\frac{1024}{200} \\approx 5.12\\times$, yielding over a $500\\%$ increase in serving throughput.",
    },
  ],
};
