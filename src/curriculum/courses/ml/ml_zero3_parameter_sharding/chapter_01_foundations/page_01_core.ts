import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_zero3_parameter_sharding_c1_p1",
  pageNumber: 1,
  title: "ZeRO-3 & FSDP: Parameter Sharding & Memory Algebra",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Billion-Parameter Memory Explosion: Why Standard DDP Fails",
      content:
        "In standard Distributed Data Parallelism (**DDP**), every GPU replica maintains a full copy of the entire model. For a model with $\\Phi$ parameters trained in mixed precision (FP16/BF16) with AdamW, memory consumption is dominated by three static components:\\n1. **Model Parameters:** $2\\Phi$ bytes (FP16)\\n2. **Gradients:** $2\\Phi$ bytes (FP16)\\n3. **Optimizer States (AdamW):** $4\\Phi$ (FP32 master weights) $+ 4\\Phi$ (FP32 first momentum $m$) $+ 4\\Phi$ (FP32 second variance $v$) $= 12\\Phi$ bytes.\\n\\nTotal static footprint is $16\\Phi$ bytes per GPU (excluding activations). For Llama-3-70B ($\\Phi = 70 \\times 10^9$), static memory is $16 \\times 70 \\text{ GB} = 1.12 \\text{ TB}$ per GPU—completely exceeding the 80GB VRAM of any single accelerator! **ZeRO (Zero Redundancy Optimizer, Rajbhandari et al., 2020; DeepSpeed; PyTorch FSDP)** completely shatters this barrier by systematically partitioning optimizer states, gradients, and model parameters across all $N_d$ data parallel GPUs.",
    },
    {
      type: "mental_model",
      title: "Mental Model: The 3 Stages of ZeRO Parameter Sharding",
      visualIntuition:
        "Standard DDP:     [ Params: 2*Phi ]  [ Grads: 2*Phi ]  [ AdamW States: 12*Phi ] -> 16*Phi on EVERY GPU!\\nZeRO Stage 1 (P_os): Shards AdamW states -> Memory = 4*Phi + 12*Phi / N_d (4x memory reduction, 0 extra comm!)\\nZeRO Stage 2 (P_g):  Shards Gradients & AdamW -> Memory = 2*Phi + 14*Phi / N_d (8x memory reduction, 0 extra comm!)\\nZeRO Stage 3 (P_p):  Shards Parameters, Grads, & AdamW -> Memory = 16*Phi / N_d (Full linear memory scaling!)",
      invariant:
        "Zero-Redundancy Invariant: In ZeRO-3, no single parameter, gradient, or optimizer state is duplicated across GPUs at rest. Parameters for layer L are dynamically all-gathered into SRAM/HBM immediately before forward/backward compute, and instantly released once execution moves to layer L+1.",
      stateTransitions:
        "Layer L at Rest (Sharded 1/N_d params) -> Pre-Forward Hook (All-Gather full layer L params) -> Compute Forward -> Post-Forward Hook (Free full params) -> Backward Pass: Pre-Backward Hook (All-Gather full params) -> Compute Gradients -> Post-Backward Hook (Reduce-Scatter gradients to sharded partitions and free full params).",
      naiveBottleneck:
        "DDP duplicates 100% of model parameters and optimizer states across every device, making it impossible to train models exceeding 15B parameters without tensor parallelism.",
      optimalInsight:
        "ZeRO-3 reduces memory per GPU to 16*Phi / N_d at the cost of only a 50% communication overhead (1.5x DDP), enabling training 500B+ models across standard clusters.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: ZeRO-3 1.5x Communication Overhead Invariant",
      theorem:
        "Standard Data Parallelism (DDP) transfers $2\\Phi$ bytes per parameter during the backward pass All-Reduce. ZeRO-3 transfers $3\\Phi$ bytes per parameter ($1.5\\times$ DDP communication volume) across the entire training step.",
      proof:
        "1. Standard DDP Communication:\\n- Forward Pass: Zero communication (local parameter copy).\\n- Backward Pass: All-Reduce on gradients of size $\\Phi$ (in FP16, $2\\Phi$ bytes).\\nUsing Ring-AllReduce with $N_d$ GPUs, the volume transferred per GPU is $V_{\\text{DDP}} = 2 \\frac{N_d - 1}{N_d} \\cdot (2\\Phi) \\approx 4\\Phi$ bytes (or $2\\Phi$ elements).\\n\\n2. ZeRO-3 Communication Breakdown:\\n- **Phase 1 (Forward Pass):** Each layer's parameters are sharded across $N_d$ GPUs. Before computing forward activations, an **All-Gather** collects the full parameters of size $\\Phi$:\\n$$V_{\\text{fwd}} = \\frac{N_d - 1}{N_d} \\cdot (2\\Phi) \\approx 2\\Phi \\text{ bytes}$$\\n- **Phase 2 (Backward Pass - Parameter Reconstruction):** To compute activation gradients $\\nabla_X$ and parameter gradients $\\nabla_W$, an **All-Gather** collects the full parameters again:\\n$$V_{\\text{bwd, params}} = \\frac{N_d - 1}{N_d} \\cdot (2\\Phi) \\approx 2\\Phi \\text{ bytes}$$\\n- **Phase 3 (Backward Pass - Gradient Reduction):** Instead of an All-Reduce, gradients are reduced and scattered directly into each GPU's dedicated shard via a **Reduce-Scatter**:\\n$$V_{\\text{bwd, grads}} = \\frac{N_d - 1}{N_d} \\cdot (2\\Phi) \\approx 2\\Phi \\text{ bytes}$$\\n\\n3. Total Communication Ratio:\\n$$V_{\\text{ZeRO-3}} = V_{\\text{fwd}} + V_{\\text{bwd, params}} + V_{\\text{bwd, grads}} = 3 \\cdot \\left( \\frac{N_d - 1}{N_d} \\cdot 2\\Phi \\right) \\approx 6\\Phi \\text{ bytes}$$\\nComparing total communication volumes:\\n$$\\text{Overhead Ratio} = \\frac{V_{\\text{ZeRO-3}}}{V_{\\text{DDP}}} = \\frac{3 \\cdot 2\\Phi}{2 \\cdot 2\\Phi} = \\frac{3}{2} = 1.5\\times$$\\nZeRO-3 eliminates all static memory redundancy at the cost of exactly a $50\\%$ increase in network communication.",
    },
  ],
};
