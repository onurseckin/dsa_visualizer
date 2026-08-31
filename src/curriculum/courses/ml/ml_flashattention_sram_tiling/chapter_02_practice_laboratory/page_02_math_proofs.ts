import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_flashattention_sram_tiling_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: FlashAttention IO Complexity & Softmax Invariance",
  sections: [
    {
      type: "math_proof",
      title: "Proof of FlashAttention IO Complexity Upper Bound",
      theorem:
        "Let $N$ be sequence length, $d$ head dimension, and $M$ GPU fast on-chip SRAM capacity (with $d \\le M < 4Nd$). Standard attention requires $\\Theta(N d + N^2)$ HBM accesses. FlashAttention requires $\\Theta\\left(\\frac{N^2 d^2}{M}\\right)$ HBM accesses, an asymptotic reduction by a factor of $\\frac{M}{d}$.",
      proof:
        "1. Standard Attention Memory IO:\\n- Computing $S = QK^T$: Reads $Q, K$ ($2Nd$ elements), writes $S$ ($N^2$ elements) to HBM.\\n- Computing $P = \\text{softmax}(S)$: Reads $S$ ($N^2$ elements), writes $P$ ($N^2$ elements) to HBM.\\n- Computing $O = PV$: Reads $P$ ($N^2$ elements) and $V$ ($Nd$ elements), writes $O$ ($Nd$ elements) to HBM.\\nTotal HBM data transferred: $4Nd + 3N^2 = \\Theta(Nd + N^2)$ elements.\\n\\n2. FlashAttention Memory IO:\\nLet tile sizes be $B_r = \\Theta(M/d)$ and $B_c = \\Theta(M/d)$ so that $B_r d + B_c d \\le M$.\\nThe number of row blocks is $T_r = N / B_r = \\Theta\\left(\\frac{Nd}{M}\\right)$, and column blocks $T_c = N / B_c = \\Theta\\left(\\frac{Nd}{M}\\right)$.\\n\\nIn FlashAttention-2 (outer loop over $T_r$ blocks of $Q$, inner loop over $T_c$ blocks of $K, V$):\\n- For each $Q_i$ block ($T_r$ iterations):\\n  - Reads $Q_i$ from HBM once: $T_r \\times (B_r d) = Nd$ elements.\\n  - Reads each $K_j, V_j$ block ($T_c$ iterations): $T_r \\times T_c \\times (2 B_c d) = T_r \\times 2Nd = \\Theta\\left(\\frac{Nd}{M} \\cdot 2Nd\\right) = \\Theta\\left(\\frac{N^2 d^2}{M}\\right)$ elements.\\n  - Writes final $O_i$ block back to HBM once: $T_r \\times (B_r d) = Nd$ elements.\\n\\n3. Total HBM Data Transferred:\\n$$\\text{Total IO} = 2Nd + \\Theta\\left(\\frac{N^2 d^2}{M}\\right) = \\Theta\\left(\\frac{N^2 d^2}{M}\\right)$$\\nSince $M$ typically ranges from 100 KB to 228 KB per SM and $d \\approx 64\\text{-}128$, $\\frac{M}{d} \\approx 1000\\times$, reducing HBM traffic by multiple orders of magnitude.",
    },
    {
      type: "math_proof",
      title: "Online Softmax Normalizer Inductive Invariance",
      theorem:
        "For any sequence of row blocks $S^{(1)}, S^{(2)}, \\dots, S^{(T_c)}$, the online recursive state update $(m^{(k)}, l^{(k)}, O^{(k)})$ preserves the global softmax identity at step $k$: $\\frac{O^{(k)}}{l^{(k)}} = \\text{softmax}\\left([S^{(1)}, \\dots, S^{(k)}]\\right) [V^{(1)}; \\dots; V^{(k)}]$.",
      proof:
        "We proceed by induction on the block index $k$.\\n\\n**Base Case ($k=1$):**\\n$m^{(1)} = \\max(S^{(1)})$, $l^{(1)} = \\sum_j e^{S_j^{(1)} - m^{(1)}}$, $O^{(1)} = \\sum_j e^{S_j^{(1)} - m^{(1)}} V_j^{(1)}$.\\nThen $\\frac{O^{(1)}}{l^{(1)}} = \\frac{\\sum_j e^{S_j^{(1)} - m^{(1)}} V_j^{(1)}}{\\sum_j e^{S_j^{(1)} - m^{(1)}}} = \\frac{\\sum_j e^{S_j^{(1)}} V_j^{(1)}}{\\sum_j e^{S_j^{(1)}}} = \\text{softmax}(S^{(1)}) V^{(1)}$, which holds.\\n\\n**Inductive Step:**\\nAssume the identity holds for step $k-1$. At step $k$, let $m_{\\text{curr}} = \\max(S^{(k)})$, $m^{(k)} = \\max(m^{(k-1)}, m_{\\text{curr}})$.\\nBy definition of the update rules:\\n$$l^{(k)} = e^{m^{(k-1)} - m^{(k)}} l^{(k-1)} + \\sum_{j} e^{S_j^{(k)} - m^{(k)}} = \\sum_{j=1}^{\\text{total}_k} e^{S_j - m^{(k)}}$$\\n$$O^{(k)} = e^{m^{(k-1)} - m^{(k)}} O^{(k-1)} + \\sum_{j} e^{S_j^{(k)} - m^{(k)}} V_j^{(k)} = \\sum_{j=1}^{\\text{total}_k} e^{S_j - m^{(k)}} V_j$$\\nTaking the ratio:\\n$$\\frac{O^{(k)}}{l^{(k)}} = \\frac{\\sum_{j=1}^{\\text{total}_k} e^{S_j - m^{(k)}} V_j}{\\sum_{j=1}^{\\text{total}_k} e^{S_j - m^{(k)}}} = \\frac{\\sum_{j=1}^{\\text{total}_k} e^{S_j} V_j}{\\sum_{j=1}^{\\text{total}_k} e^{S_j}} = \\text{softmax}(S_{1:k}) V_{1:k}$$\\nBy mathematical induction, the invariant holds for all $k \\in \\{1, \\dots, T_c\\}$.",
    },
  ],
};

export const page_02_math_proofs = page2;
