import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_flashattention_sram_tiling_c1_p1",
  pageNumber: 1,
  title: "FlashAttention: SRAM Tiling & Online Softmax Mechanics",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Physical Memory Hierarchy Crisis",
      content:
        "On modern AI accelerators (NVIDIA A100/H100), compute throughput outpaces High Bandwidth Memory (HBM) bandwidth by over 100x. An H100 provides 989 TFLOP/s of FP16 Tensor Core compute, but only 3.35 TB/s of HBM3 bandwidth, requiring an arithmetic intensity of at least $I = \\frac{989 \\times 10^{12}}{3.35 \\times 10^{12}} \\approx 295 \\text{ FLOPs/byte}$ to saturate compute units. Standard attention computes $S = QK^T$, writes $S$ ($N \\times N$) to HBM, reads $S$ to compute $P = \\text{softmax}(S)$, writes $P$ to HBM, and reads $P$ to compute $O = PV$. For sequence length $N = 16{,}384$, standard attention reads and writes over 1 GB of intermediate scores per head, achieving an arithmetic intensity of only $\\approx 2.0 \\text{ FLOPs/byte}$ and stalling the GPU on memory bus latency. FlashAttention resolves this crisis by tiling computation across fast on-chip SRAM (192KB-228KB per Streaming Multiprocessor, 33 TB/s aggregate) in a single fused pass.",
    },
    {
      type: "mental_model",
      title: "Mental Model: Two-Level SRAM Block Tiling & Online Rescaling",
      visualIntuition:
        "[ HBM Q, K, V Tensors ]\\n  |-- Load Q Tile (B_r x d) into On-Chip SRAM (Registers)\\n  |-- Inner Loop over K, V Tiles (B_c x d) in SRAM\\n       |-- Compute local tile scores: S_tile = Q_tile @ K_tile^T\\n       |-- Update running max m_new = max(m_prev, max(S_tile))\\n       |-- Rescale running partition function: l_new = exp(m_prev - m_new) * l_prev + sum(exp(S_tile - m_new))\\n       |-- Rescale running output: O_new = exp(m_prev - m_new) * O_prev + exp(S_tile - m_new) @ V_tile\\n  \\--> Write final normalized O = O_new / l_new directly to HBM",
      invariant:
        "Online Softmax Invariant: At any block step k, the accumulated output O^{(k)} and normalizer l^{(k)} satisfy O^{(k)} / l^{(k)} = \\text{softmax}(Q K_{:k}^T) V_{:k} exactly, guaranteeing zero numerical drift relative to global two-pass softmax.",
      stateTransitions:
        "State 0: Q tile in SRAM -> State 1: Stream K_j, V_j tile from HBM to SRAM -> State 2: GEMM S_tile in Tensor Cores -> State 3: Online stats update (m, l) in registers -> State 4: Rescale accumulator O and accumulate V_j -> State 5: Final division by l and writeback to HBM.",
      naiveBottleneck:
        "Materializing the full N x N matrix forces O(N^2) HBM read/write roundtrips, causing catastrophic memory bus thrashing and OOM on long sequences.",
      optimalInsight:
        "By decomposing the softmax normalizer across block tiles and maintaining running scale factors in registers, FlashAttention completely eliminates the N x N HBM footprint, reducing memory IO from O(N^2) to O(N d).",
    },
    {
      type: "math_proof",
      title: "Mathematical Derivation: Online Softmax Rescaling",
      theorem:
        "Let a vector $x \\in \\mathbb{R}^N$ be partitioned into two subvectors $x = [x^{(1)}, x^{(2)}]$. Let $m_1 = \\max(x^{(1)})$ and $l_1 = \\sum_i e^{x_i^{(1)} - m_1}$. When appending $x^{(2)}$ with local max $m_2 = \\max(x^{(2)})$ and local sum $l_2 = \\sum_j e^{x_j^{(2)} - m_2}$, the global softmax statistics $m = \\max(x)$ and $l = \\sum_k e^{x_k - m}$ are computed in $O(1)$ without re-evaluating $x^{(1)}$.",
      proof:
        "1. Global Maximum Update:\\n$$m = \\max(m_1, m_2)$$\\n\\n2. Partition Function Update:\\n$$\\begin{aligned} l &= \\sum_{i} e^{x_i^{(1)} - m} + \\sum_{j} e^{x_j^{(2)} - m} \\\\ &= \\sum_{i} e^{x_i^{(1)} - m_1 + m_1 - m} + \\sum_{j} e^{x_j^{(2)} - m_2 + m_2 - m} \\\\ &= e^{m_1 - m} \\sum_{i} e^{x_i^{(1)} - m_1} + e^{m_2 - m} \\sum_{j} e^{x_j^{(2)} - m_2} \\\\ &= e^{m_1 - m} l_1 + e^{m_2 - m} l_2 \\end{aligned}$$\\n\\n3. Output Vector Accumulation Update:\\nLet $O_1 = \\sum_i e^{x_i^{(1)} - m_1} v_i^{(1)}$ and $O_2 = \\sum_j e^{x_j^{(2)} - m_2} v_j^{(2)}$. Then the merged unnormalized context output is:\\n$$O = e^{m_1 - m} O_1 + e^{m_2 - m} O_2$$\\n\\n4. Final Normalized Output:\\n$$\\text{Output} = \\frac{O}{l} = \\frac{e^{m_1 - m} O_1 + e^{m_2 - m} O_2}{e^{m_1 - m} l_1 + e^{m_2 - m} l_2} = \\frac{\\sum_{k=1}^N e^{x_k - m} v_k}{\\sum_{k=1}^N e^{x_k - m}} = \\text{softmax}(x) V$$\\nThis proves exact algebraic equivalence to standard global two-pass softmax.",
    },
  ],
};
