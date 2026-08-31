import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_tensor_strides_views_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Strides, Invariants, & Broadcasting",
  subtitle: "Algebraic Proofs of Zero-Stride Expansion and Stride Group Invariance",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "NumPy / PyTorch Zero-Stride Broadcasting Correctness Proof",
      theorem:
        "Let tensor $A$ have shape $(d_0, \\dots, d_{k-1}, 1, d_{k+1}, \\dots, d_{n-1})$ with strides $(s_0, \\dots, s_{n-1})$. The expanded tensor $\\tilde{A}$ with shape $(d_0, \\dots, d_{k-1}, M, d_{k+1}, \\dots, d_{n-1})$ and mutated stride $\\tilde{s}_k = 0$ (preserving all other strides $\\tilde{s}_j = s_j$) evaluates $\\tilde{A}[i_0, \\dots, i_{k-1}, m, i_{k+1}, \\dots, i_{n-1}] = A[i_0, \\dots, i_{k-1}, 0, i_{k+1}, \\dots, i_{n-1}]$ for all $m \\in \\{0, 1, \\dots, M-1\\}$ without allocating memory.",
      proof:
        "1. The memory offset of any element in tensor $A$ is given by:\n   $$\\text{Offset}_A(i_0, \\dots, i_{n-1}) = \\text{offset}_{\\text{base}} + \\sum_{j \\ne k} i_j s_j + i_k s_k$$\n2. Since $d_k = 1$, the only valid index for dimension $k$ in tensor $A$ is $i_k = 0$. Thus, $i_k s_k = 0 \\cdot s_k = 0$.\n3. In the expanded tensor $\\tilde{A}$, the stride along dimension $k$ is explicitly defined as $\\tilde{s}_k = 0$. For any arbitrary integer $m \\in \\{0, 1, \\dots, M-1\\}$:\n   $$\\text{Offset}_{\\tilde{A}}(i_0, \\dots, i_{k-1}, m, i_{k+1}, \\dots, i_{n-1}) = \\text{offset}_{\\text{base}} + \\sum_{j \\ne k} i_j s_j + m \\cdot \\tilde{s}_k$$\n4. Since $\\tilde{s}_k = 0$, the term $m \\cdot \\tilde{s}_k = m \\cdot 0 = 0$ for all $m$.\n5. Therefore:\n   $$\\text{Offset}_{\\tilde{A}}(i_0, \\dots, m, \\dots, i_{n-1}) = \\text{Offset}_A(i_0, \\dots, 0, \\dots, i_{n-1})$$\n6. Every coordinate along dimension $k$ maps to the exact same physical byte in storage, producing virtual replication with $0$ bytes of additional memory allocation.",
    },
    {
      type: "math_proof",
      title: "Invariance of Tensor Contraction under Stride Permutation",
      theorem:
        "For any two tensors $A, B$ and any valid coordinate permutation $\\sigma \\in S_D$, the tensor contraction (inner product) $\\sum_{\\mathbf{i}} A_{\\mathbf{i}} B_{\\mathbf{i}}$ evaluates to identical scalar values regardless of the stride ordering of $A$ and $B$, but the FLOP/byte arithmetic intensity is maximized when strides of $A$ and $B$ are identical.",
      proof:
        "1. Addition in the underlying real field $\\mathbb{R}$ is commutative and associative: for any finite index set $\\mathcal{I} = \\prod_{d=0}^{D-1} [0, N_d - 1]$, the sum $\\sum_{\\mathbf{i} \\in \\mathcal{I}} A(\\mathbf{i}) B(\\mathbf{i})$ is algebraically invariant under any bijective reordering $\\pi: \\mathcal{I} \\to \\mathcal{I}$.\n2. When strides $\\mathbf{s}_A = \\mathbf{s}_B$, element $A[\\mathbf{i}]$ and element $B[\\mathbf{i}]$ share synchronized spatial proximity in memory.\n3. When traversed sequentially, both arrays advance across contiguous 64-byte cache lines simultaneously, requiring $\\frac{N E}{L}$ cache line loads for $A$ and $\\frac{N E}{L}$ for $B$.\n4. When $\\mathbf{s}_A \\ne \\mathbf{s}_B$ (e.g., $A$ is row-major and $B$ is column-major), either $A$ or $B$ is accessed with non-unit stride, increasing cache line transfers to $N \\cdot \\frac{E}{L} + N = \\Theta(N)$, degrading memory throughput by a factor of $L/E$.",
    },
  ],
};
