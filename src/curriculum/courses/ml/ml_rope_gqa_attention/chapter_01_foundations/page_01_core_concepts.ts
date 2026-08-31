import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "page_01_core_concepts",
  pageNumber: 1,
  title: "RoPE & Grouped-Query Attention: Mathematical Foundations",
  sections: [
    {
      type: "prose",
      title: "Rotary Position Embeddings (RoPE) Formulation",
      content:
        "Unlike additive positional encodings that inject absolute vectors into the token representation ($x_m + p_m$), Rotary Position Embedding (RoPE) applies a multiplicative orthogonal transformation directly to the Query and Key projections. By partitioning the $d$-dimensional embedding space into $d/2$ orthogonal two-dimensional planes and rotating each 2D subvector by an angle proportional to the absolute token index $m$, RoPE naturally endows the dot product with pure relative positional semantics.",
    },
    {
      type: "math_proof",
      title: "RoPE Orthogonal Invariance & Relative Inner Product Proof",
      theorem:
        "Let $R_{\\Theta, m}^d \\in \\mathbb{R}^{d \\times d}$ be the block-diagonal rotation matrix for position $m$, where each $2 \\times 2$ diagonal block is $R_{\\theta_i, m} = \\begin{pmatrix} \\cos(m\\theta_i) & -\\sin(m\\theta_i) \\\\ \\sin(m\\theta_i) & \\cos(m\\theta_i) \\end{pmatrix}$ with $\\theta_i = \\theta_{\\text{base}}^{-2(i-1)/d}$. Then the attention inner product $\\langle R_{\\Theta, m}^d q, R_{\\Theta, n}^d k \\rangle$ depends solely on the relative distance $m - n$.",
      proof:
        "1. Block Decomposition:\\nBecause $R_{\\Theta, m}^d = \\text{diag}(R_{\\theta_1, m}, R_{\\theta_2, m}, \\dots, R_{\\theta_{d/2}, m})$ is block-diagonal, the full inner product decomposes into the sum of 2D block inner products:\\n$$\\langle R_{\\Theta, m}^d q, R_{\\Theta, n}^d k \\rangle = \\sum_{i=1}^{d/2} (R_{\\theta_i, m} q^{(i)})^T (R_{\\theta_i, n} k^{(i)})$$\\nwhere $q^{(i)} = \\begin{pmatrix} q_{2i-1} \\\\ q_{2i} \\end{pmatrix}$ and $k^{(i)} = \\begin{pmatrix} k_{2i-1} \\\\ k_{2i} \\end{pmatrix}$.\\n\\n2. Orthogonality and Group Property of 2D Rotations:\\nEach 2D rotation matrix satisfies $R_{\\theta_i, m}^T = R_{\\theta_i, -m}$. Multiplying two rotation matrices yields:\\n$$R_{\\theta_i, m}^T R_{\\theta_i, n} = R_{\\theta_i, -m} R_{\\theta_i, n} = R_{\\theta_i, n - m}$$\\n\\n3. Inner Product Expansion:\\n$$\\begin{aligned} (R_{\\theta_i, m} q^{(i)})^T (R_{\\theta_i, n} k^{(i)}) &= (q^{(i)})^T R_{\\theta_i, m}^T R_{\\theta_i, n} k^{(i)} \\\\ &= (q^{(i)})^T R_{\\theta_i, n - m} k^{(i)} \\\\ &= (q^{(i)})^T \\begin{pmatrix} \\cos((n-m)\\theta_i) & -\\sin((n-m)\\theta_i) \\\\ \\sin((n-m)\\theta_i) & \\cos((n-m)\\theta_i) \\end{pmatrix} k^{(i)} \\\\ &= (q_{2i-1} k_{2i-1} + q_{2i} k_{2i}) \\cos((m-n)\\theta_i) + (q_{2i-1} k_{2i} - q_{2i} k_{2i-1}) \\sin((m-n)\\theta_i) \\end{aligned}$$\\n\\n4. Conclusion:\\nThe resulting expression is a strict function of $(q, k, m - n)$. Positional information enters entirely as a relative angular offset $\\Delta \\theta = (m - n)\\theta_i$, ensuring complete translational invariance across sequence positions.",
    },
    {
      type: "mental_model",
      title: "Grouped-Query Attention (GQA) Head Topology",
      visualIntuition:
        "MHA (H_Q = 32, H_KV = 32): 1-to-1 ratio (Heavy KV Cache).\\nMQA (H_Q = 32, H_KV = 1): 32-to-1 ratio (Extreme compression, potential capacity loss).\\nGQA (H_Q = 32, H_KV = 8): 4-to-1 ratio (Optimal Pareto frontier: 75% memory reduction with MHA quality).",
      invariant:
        "Group Slicing Invariant: Query head h in {0, ..., H_Q - 1} attends to KV head floor(h / G), where G = H_Q / H_KV.",
      stateTransitions:
        "Linear Projection (Q: [B, H_Q, N, d], K,V: [B, H_KV, N, d]) -> Apply RoPE to Q and K -> Expand/View K,V to match H_Q groups -> Compute group-wise SDPA -> Concatenate and project.",
      naiveBottleneck:
        "Physical duplication of KV heads via `torch.repeat_interleave` creates temporary HBM allocations that waste memory bandwidth.",
      optimalInsight:
        "Using strided views `k.view(B, H_KV, 1, N, d).expand(B, H_KV, G, N, d)` creates zero memory overhead, broadcasting directly inside the SRAM registers during fused kernel execution.",
    },
  ],
};
