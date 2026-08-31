import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_zero3_parameter_sharding_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: ZeRO Stage Memory Scaling & Communication Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Asymptotic Memory Scaling Across ZeRO Stages",
      theorem:
        "For a model with $\\Phi$ parameters trained with AdamW mixed precision across $N_d$ data parallel GPUs, the static memory consumed per GPU under ZeRO-1 ($M_1$), ZeRO-2 ($M_2$), and ZeRO-3 ($M_3$) satisfies $M_1 = 4\\Phi + \\frac{12\\Phi}{N_d}$, $M_2 = 2\\Phi + \\frac{14\\Phi}{N_d}$, and $M_3 = \\frac{16\\Phi}{N_d}$. As $N_d \\to \\infty$, $M_3 \\to 0$.",
      proof:
        "1. Parameter and State Memory Accounting:\\n- Parameters: $2\\Phi$ bytes (FP16)\\n- Gradients: $2\\Phi$ bytes (FP16)\\n- AdamW Master Weights: $4\\Phi$ bytes (FP32)\\n- AdamW First Momentum $m$: $4\\Phi$ bytes (FP32)\\n- AdamW Second Variance $v$: $4\\Phi$ bytes (FP32)\\n- Total Optimizer States: $12\\Phi$ bytes.\\n\\n2. Stage 1 (Optimizer State Partitioning):\\nParameters ($2\\Phi$) and Gradients ($2\\Phi$) are replicated on every GPU. The $12\\Phi$ optimizer states are divided equally across $N_d$ GPUs:\\n$$M_1 = 2\\Phi + 2\\Phi + \\frac{12\\Phi}{N_d} = 4\\Phi + \\frac{12\\Phi}{N_d}$$\\nFor $N_d \\gg 1$, $M_1 \\approx 4\\Phi$ (a $4\\times$ memory reduction from standard DDP's $16\\Phi$).\\n\\n3. Stage 2 (Gradient Partitioning):\\nParameters ($2\\Phi$) are replicated. Gradients ($2\\Phi$) and Optimizer States ($12\\Phi$) are partitioned:\\n$$M_2 = 2\\Phi + \\frac{2\\Phi + 12\\Phi}{N_d} = 2\\Phi + \\frac{14\\Phi}{N_d}$$\\nFor $N_d \\gg 1$, $M_2 \\approx 2\\Phi$ (an $8\\times$ memory reduction).\\n\\n4. Stage 3 (Parameter Partitioning):\\nParameters ($2\\Phi$), Gradients ($2\\Phi$), and Optimizer States ($12\\Phi$) are all strictly partitioned:\\n$$M_3 = \\frac{2\\Phi + 2\\Phi + 12\\Phi}{N_d} = \\frac{16\\Phi}{N_d}$$\\nAs $N_d \\to \\infty$, $\\lim_{N_d \\to \\infty} M_3 = 0$, achieving perfect linear memory scaling.",
    },
    {
      type: "math_proof",
      title: "Proof of Hook-Based Prefetching Overlap Lower Bound",
      theorem:
        "Let layer $L$ have forward execution time $T_{\\text{compute}}(L)$ and parameter transfer time $T_{\\text{comm}}(L) = \\frac{N_d - 1}{N_d} \\frac{2\\Phi_L}{B_{\\text{interconnect}}}$. The communication overhead is 100% hidden if and only if for all layers $L$, $T_{\\text{compute}}(L) \\ge T_{\\text{comm}}(L+1)$.",
      proof:
        "1. In a dual-stream architecture, the communication stream issues the All-Gather for layer $L+1$ at the exact moment layer $L$ begins compute on the main stream.\\n2. The total time elapsed before layer $L+1$ can begin execution is $\\max(T_{\\text{compute}}(L), T_{\\text{comm}}(L+1))$.\\n3. If $T_{\\text{compute}}(L) \\ge T_{\\text{comm}}(L+1)$, the parameters for layer $L+1$ arrive in GPU HBM before or at the moment layer $L$ completes.\\n4. Summing across all $N_{\\text{layers}}$:\\n$$T_{\\text{total}} = T_{\\text{comm}}(0) + \\sum_{L=0}^{N_{\\text{layers}}-1} T_{\\text{compute}}(L)$$\\nThe only exposed communication is the initial prefetch of Layer 0, proving that ZeRO-3 incurs zero steady-state throughput penalty when network bandwidth exceeds the compute-to-communication threshold.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
