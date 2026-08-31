import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_parallelism_3d_moe_1f1b_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic Suite: 3D Parallelism & MoE",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_parallelism_3d_moe_1f1b",
      title: "3D Parallelism, Pipeline Scheduling & MoE Scaling Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "DualPipe Bi-Directional Zero-Bubble Pipeline Scheduler",
          description:
            "Implement the DeepSeek-V3 DualPipe scheduler that co-schedules forward and backward passes from both ends of the pipeline simultaneously to eliminate pipeline bubbles down to $< 1\\%$.",
          problemStatement:
            "Generate an execution schedule matrix for P stages and M microbatches running bi-directional 1F1B schedules.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Sequence Parallelism (Ring-Attention / SP) Memory Savings",
          prompt:
            "Prove that Sequence Parallelism (splitting sequence length $S$ across $TP$ GPUs along with Query/Key/Value projections) reduces activation memory from $O(S)$ down to $O(S / TP)$ without introducing any extra collective communication beyond Megatron-LM.",
          statement:
            "Demonstrate how replacing All-Reduce with Reduce-Scatter + All-Gather in Sequence Parallelism achieves zero extra communication overhead.",
          proofOutline:
            "1. In Megatron TP, ColumnParallel outputs are All-Reduced ($2 \\frac{TP-1}{TP} S$ bytes).\\n2. In Sequence Parallelism, replace the All-Reduce with a Reduce-Scatter on the $S$ dimension (cost $\\frac{TP-1}{TP} S$), leaving activations partitioned along sequence length $S/TP$.\\n3. Execute LayerNorm/Dropout on $S/TP$ tokens locally (saving $TP\\times$ activation memory).\\n4. Perform All-Gather on input to next ColumnParallel layer (cost $\\frac{TP-1}{TP} S$).\\n5. Total communication is $\\frac{TP-1}{TP} S + \\frac{TP-1}{TP} S = 2 \\frac{TP-1}{TP} S$, exactly identical to standard TP!",
          engineeringContext:
            "Enables training 128k context lengths in dense transformers without running out of activation memory.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "MoE All-to-All Dispatch Incast & EP Switch Contention",
          prompt:
            "In a cluster with 64 experts across 64 GPUs, when token routing is un-balanced, all 64 GPUs attempt to send their tokens to Expert 7 simultaneously. How does this create an InfiniBand **incast congestion collapse**, and how does hierarchical All-to-All (combining intra-node NVLink with inter-node InfiniBand) prevent buffer exhaustion?",
          engineeringContext:
            "Key architectural design in DeepSeek-V3 and Switch Transformer training clusters.",
        },
      ],
      partD_stressTests: [
        {
          title: "Pipeline Activation Deadlock on Out-of-Order P2P Requests",
          scenario:
            "Stage 1 issues a non-blocking `P2P.recv` on stream 0 for microbatch 5 while Stage 0 is blocked attempting a synchronous `P2P.send` for microbatch 4. Because send/recv tags do not match and queues are serialized, the pipeline permanently deadlocks at step 12.",
          failureMode: "Total pipeline freeze; GPU compute drops to 0% utilization indefinitely.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
