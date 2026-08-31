import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_interconnect_alpha_beta_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Optimal Message Chunking & Pipelined Networks",
  sections: [
    {
      type: "math_proof",
      title: "Optimal Pipelined Message Chunking Theorem",
      theorem:
        "When transferring a message of size $M$ bytes over a pipeline of $H$ network hops with link latency $\\alpha$ and inverse bandwidth $\\beta = 1/B$, partitioning the message into $k$ equal chunks minimizes total transmission time when $k^* = \\sqrt{\\frac{(H - 1) M \\beta}{\\alpha}}$.",
      proof:
        "1. Formulation of Pipelined Latency:\\nLet the message of size $M$ be split into $k$ uniform chunks of size $m = M/k$. The time to transmit a single chunk across one link is $t_{\\text{chunk}} = \\alpha + \\beta \\frac{M}{k}$.\\n\\n2. Pipeline Delay Across $H$ Hops:\\n- The first chunk takes $H \\cdot t_{\\text{chunk}}$ to traverse all $H$ hops to the destination.\\n- Each subsequent chunk arrives at intervals of $t_{\\text{chunk}}$.\\n- Total latency to deliver all $k$ chunks is:\\n$$T(k) = (H - 1) t_{\\text{chunk}} + k \\cdot t_{\\text{chunk}} = (H + k - 1) \\left( \\alpha + \\frac{M \\beta}{k} \\right)$$\\n\\n3. Algebraic Expansion:\\n$$T(k) = (H - 1)\\alpha + k\\alpha + \\frac{(H - 1) M \\beta}{k} + M \\beta$$\\n\\n4. Minimizing with Respect to $k$:\\nTaking the derivative $\\frac{dT}{dk}$ and equating to zero:\\n$$\\frac{dT}{dk} = \\alpha - \\frac{(H - 1) M \\beta}{k^2} = 0 \\implies k^2 = \\frac{(H - 1) M \\beta}{\\alpha} \\implies k^* = \\sqrt{\\frac{(H - 1) M \\beta}{\\alpha}}$$\\n\\n5. Second Derivative Verification:\\n$$\\frac{d^2 T}{dk^2} = \\frac{2 (H - 1) M \\beta}{k^3} > 0 \\quad (\\text{strictly convex global minimum})$$\\nThis proves the fundamental formula used in NCCL and MPI collective communication engines to tune packet bucket chunking.",
    },
    {
      type: "math_proof",
      title: "Dragonfly+ Topology Bisection Bandwidth Invariant",
      theorem:
        "In a Dragonfly+ network topology with $g$ groups, $a$ routers per group, and $p$ hosts per router, if inter-group links $h$ are provisioned such that $a \\cdot h = g - 1$, the global network achieves 100% full bisection bandwidth for worst-case adversarial traffic patterns under Valiant's Randomized Routing (VLB).",
      proof:
        "1. Worst-case Traffic Permutation:\\nUnder direct shortest-path routing, adversarial traffic (e.g. all nodes in group 1 communicating exclusively with group 2) creates a massive hotspot on the single direct link between group 1 and group 2, causing bandwidth to collapse to $1 / (g-1)$ of line rate.\\n\\n2. Valiant's Load Balancing (VLB):\\nVLB routes every packet in two phases: first from source router to a uniformly random intermediate group $r \\in \\{1, \\dots, g\\}$, and then from group $r$ to the true destination.\\n\\n3. Uniform Load Distribution:\\nBecause the intermediate group is chosen uniformly at random, traffic across all inter-group links is perfectly balanced at expected rate $\\frac{1}{g-1}$ of total injection bandwidth. When $a \\cdot h \\ge g - 1$, all inter-group channels operate below saturation, guaranteeing 100% sustained throughput regardless of communication traffic matrix.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
