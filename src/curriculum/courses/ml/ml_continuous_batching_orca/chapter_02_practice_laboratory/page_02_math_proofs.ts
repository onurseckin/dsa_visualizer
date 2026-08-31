import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_continuous_batching_orca_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Continuous Batching Dynamics & Tail Latency",
  sections: [
    {
      type: "math_proof",
      title: "Throughput Superiority Under Pareto-Distributed Request Lengths",
      theorem:
        "When generation sequence lengths $L$ follow a bounded Pareto distribution $f(L) = \\frac{\\alpha L_{\\min}^\\alpha}{1 - (L_{\\min}/L_{\\max})^\\alpha} L^{-(\\alpha + 1)}$ with shape $\\alpha \\in (1, 2)$, the ratio of static batching latency to continuous batching latency scales as $\\Theta(B^{\\frac{1}{\\alpha} - 1}) \\to \\infty$ as batch size $B$ grows.",
      proof:
        "1. Static Batching Makespan:\\nIn static batching, the makespan of a batch of size $B$ is determined by the maximum order statistic $M_B = \\max(L_1, L_2, \\dots, L_B)$.\\nFor a Pareto distribution with tail index $\\alpha$, the expected maximum of $B$ independent samples scales asymptotically as:\\n$$\\mathbb{E}[M_B] = \\Theta\\left(L_{\\min} B^{\\frac{1}{\\alpha}}\\right)$$\\nThus, the average processing time per request under static batching is:\\n$$T_{\\text{static}} = \\frac{\\mathbb{E}[M_B]}{B} = \\Theta\\left(B^{\\frac{1}{\\alpha} - 1}\\right)$$\\n\\n2. Continuous Batching Makespan:\\nContinuous batching dynamically fills every completed slot immediately with a newly arrived request from the queue. Under steady-state queueing conditions (M/G/1-processor sharing equivalent), the average time per request depends strictly on the empirical mean $\\mu = \\mathbb{E}[L] = \\frac{\\alpha L_{\\min}}{\\alpha - 1}$ (for $\\alpha > 1$), completely independent of $B$:\\n$$T_{\\text{continuous}} = \\frac{\\mu}{B} = \\Theta(B^{-1})$$\\n\\n3. Throughput Ratio:\\n$$\\frac{\\text{Throughput}_{\\text{continuous}}}{\\text{Throughput}_{\\text{static}}} = \\frac{\\mathbb{E}[M_B]}{\\mu} = \\Theta\\left(B^{\\frac{1}{\\alpha}}\\right)$$\\nFor $\\alpha = 1.2$ (typical heavy-tailed empirical NLP workloads) and batch size $B = 64$, $B^{1/1.2} = 64^{0.833} \\approx 32$, demonstrating an order-of-magnitude reduction in queueing latency and a dramatic increase in token service rate.",
    },
    {
      type: "math_proof",
      title: "Chunked Prefill Inter-Token Latency (ITL) Bound",
      theorem:
        "Let prompt prefill sequence length be $N_{\\text{prompt}}$ and chunk size be $C$. By partitioning the prefill pass into $\\lceil N_{\\text{prompt}} / C \\rceil$ consecutive chunks of size at most $C$, the maximum execution delay $\\Delta t_{\\text{delay}}$ experienced by concurrent decode requests is bounded by $\\Delta t_{\\text{delay}} \\le \\frac{2 C d_{\\text{model}}^2 + 4 C^2 d_{\\text{model}}}{\\text{TFLOP}_{\\text{hardware}}}$.",
      proof:
        "1. Monolithic Prefill Delay:\\nWithout chunking, executing a prompt of length $N_{\\text{prompt}} = 4{,}096$ in a single forward pass requires $W = 2 N_{\\text{prompt}} d_{\\text{model}}^2 + 4 N_{\\text{prompt}}^2 d_{\\text{model}}$ FLOPs per layer. On an accelerator with compute capability $\\text{TFLOP}_{\\text{hardware}}$, this monopolizes the GPU for duration $T_{\\text{mono}} = \\frac{W}{\\text{TFLOP}_{\\text{hardware}}}$, during which all decode streams are completely stalled.\\n\\n2. Chunked Prefill Execution:\\nBy fixing maximum chunk size $C \\ll N_{\\text{prompt}}$ (e.g. $C = 512$), each iteration processes at most $C$ prompt tokens alongside active decode requests. The FLOPs contributed by the prefill chunk in one iteration is $W_{\\text{chunk}} = 2 C d_{\\text{model}}^2 + 4 C^2 d_{\\text{model}}$.\\n\\n3. Bounded Decode Interruption:\\nThe execution time of an iteration with a chunked prefill is strictly bounded by $\\Delta t_{\\text{delay}} = \\frac{W_{\\text{chunk}}}{\\text{TFLOP}_{\\text{hardware}}}$. For an NVIDIA H100 GPU and $C = 512, d_{\\text{model}} = 4096$, $\\Delta t_{\\text{delay}} \\approx 8.5 \\text{ ms}$, ensuring deterministic SLA compliance for real-time conversational streaming.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
