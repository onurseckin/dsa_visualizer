import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_parallelism_3d_moe_1f1b_c1_p1",
  pageNumber: 1,
  title: "3D Parallelism & MoE: Megatron TP, 1F1B Pipeline & Expert Routing",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Trillion-Parameter Scaling Frontier: 4D Distributed Synthesis",
      content:
        "Training frontier trillion-parameter models (e.g. DeepSeek-V3 671B, Llama-3-405B, GPT-4) requires orchestrating tens of thousands of GPUs across four orthogonal dimensions of parallelism: **Tensor Parallelism (TP)**, **Pipeline Parallelism (PP)**, **Data Parallelism (DP / ZeRO)**, and **Expert Parallelism (EP)** ($N_{\\text{total}} = TP \\times PP \\times DP \\times EP$). Megatron-LM partitions individual weight matrices across fast intra-node NVLink links using complementary Column-Row GEMM splits. Pipeline Parallelism partitions layers sequentially across nodes, using the **1F1B (One-Forward-One-Backward)** schedule to slash activation memory bubbles. Mixture-of-Experts (**MoE**) activates sparse parameter sub-networks per token, routing representations via global **All-to-All** collective fabrics with capacity-factor throttling.",
    },
    {
      type: "mental_model",
      title: "Mental Model: Megatron TP Dual Decomposition & 1F1B Pipeline Grid",
      visualIntuition:
        "Megatron MLP Layer:\\n[ Input X ] --( Broadcast )--> [ GPU 0: ColSplit W_1,1 ] and [ GPU 1: ColSplit W_1,2 ]\\n    \\--> [ GPU 0: GeLU(X W_1,1) ] and [ GPU 1: GeLU(X W_1,2) ]\\n    \\--> [ GPU 0: RowSplit W_2,1 ] and [ GPU 1: RowSplit W_2,2 ]\\n    \\--> [ All-Reduce SUM across TP group ] ==> [ Output Y = X W_1 W_2 ] (Only 1 All-Reduce per layer!)\\n\\n1F1B Pipeline Schedule (Stage 0 to Stage P-1):\\nWarmup Phase (P-1 forward microbatches) -> Steady State (Alternate 1 Forward, 1 Backward) -> Cooldown Phase",
      invariant:
        "1F1B Activation Peak Invariant: At steady state, the maximum number of in-flight un-freed activation microbatches resident on any GPU is strictly bounded by P (the pipeline depth), preventing memory explosion.",
      stateTransitions:
        "Token Batch -> Microbatch Partitioning -> Stage 0 Forward -> P2P Send Activation to Stage 1 -> ... -> Stage P-1 Loss Compute -> Stage P-1 Backward -> P2P Send Gradient to Stage P-2 -> Optimizer Step.",
      naiveBottleneck:
        "Naive pipeline schedules (GPipe) run all M forward microbatches before any backward pass, requiring O(M) activation memory and suffering from 50%+ pipeline bubble idle time.",
      optimalInsight:
        "1F1B schedules immediately trigger backward passes as soon as the final pipeline stage completes, keeping memory bounded by O(P) and reducing bubble idle time to F = (P - 1) / (M + P - 1).",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: 1F1B Pipeline Bubble Overhead Fraction",
      theorem:
        "For a pipeline of depth $P$ processing $M$ microbatches ($M \\ge P$) where each microbatch forward pass takes time $t_f$ and backward pass takes time $t_b = 2 t_f$, the fraction of total GPU time wasted in idle bubbles under the 1F1B schedule is $F_{\\text{bubble}} = \\frac{P - 1}{M + P - 1}$. As $M \\gg P$, $F_{\\text{bubble}} \\to 0$.",
      proof:
        "1. Warmup and Cooldown Timing:\\n- Stage 0 executes $P - 1$ warmup forward passes before receiving its first backward activation gradient from Stage $P-1$.\\n- Total time elapsed during warmup: $T_{\\text{warmup}} = (P - 1) t_f$.\\n- At the end of execution, Stage 0 finishes its backward passes while downstream stages execute their remaining $(P - 1)$ backward passes (cooldown phase): $T_{\\text{cooldown}} = (P - 1) t_b$.\\n\\n2. Ideal Non-Idle Compute Time:\\nEach microbatch requires 1 forward pass ($t_f$) and 1 backward pass ($t_b = 2 t_f$) across all $P$ stages. The total useful work per stage is:\\n$$T_{\\text{useful}} = M (t_f + t_b) = 3 M t_f$$\\n\\n3. Total Makespan of Pipeline:\\n$$T_{\\text{total}} = T_{\\text{warmup}} + T_{\\text{useful}} + T_{\\text{cooldown}} = (P - 1) t_f + M (t_f + t_b) + (P - 1) t_b = (M + P - 1)(t_f + t_b)$$\\n\\n4. Idle Bubble Fraction:\\n$$F_{\\text{bubble}} = \\frac{T_{\\text{total}} - T_{\\text{useful}}}{T_{\\text{total}}} = \\frac{(M + P - 1)(t_f + t_b) - M(t_f + t_b)}{(M + P - 1)(t_f + t_b)} = \\frac{P - 1}{M + P - 1}$$\\nFor $P = 8$ pipeline stages and $M = 64$ microbatches, $F_{\\text{bubble}} = \\frac{7}{71} \\approx 9.85\\%$, proving that increasing microbatch count $M$ drives pipeline efficiency toward 100%.",
    },
  ],
};
