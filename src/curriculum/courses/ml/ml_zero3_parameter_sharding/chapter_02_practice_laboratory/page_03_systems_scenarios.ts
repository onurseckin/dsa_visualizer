import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_zero3_parameter_sharding_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic Suite: ZeRO-3 & FSDP",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_zero3_parameter_sharding",
      title: "ZeRO-3 & FSDP Distributed Scaling Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "FSDP Forward/Backward Hook Execution Graph",
          description:
            "Implement a PyTorch-style computational graph wrapper that intercepts forward and backward passes to attach pre-forward, post-forward, pre-backward, and post-backward hooks for automatic All-Gather and Reduce-Scatter parameter lifecycle management.",
          problemStatement:
            "Given a nested Module hierarchy, recursively register forward and backward hooks that dynamically allocate full weights and free un-needed buffers.",
        },
      ],
      partB_mathProofs: [
        {
          title: "ZeRO-Offload PCIe Bandwidth Requirement Proof",
          prompt:
            "Derive the minimum PCIe bandwidth $B_{\\text{PCIe}}$ required to offload AdamW optimizer states to CPU Host RAM without bottlenecking GPU compute throughput.",
          statement:
            "Prove that offloading optimizer states requires streaming $2\\Phi$ bytes of gradients to host and $2\\Phi$ bytes of updated weights back per training step.",
          proofOutline:
            "1. At step boundary, GPU transfers sharded gradients to CPU Host RAM via PCIe DMA: $2\\Phi$ bytes.\\n2. CPU executes 8-FLOP/element AdamW update in Host RAM.\\n3. CPU transfers updated sharded FP16 master weights back to GPU: $2\\Phi$ bytes.\\n4. Total PCIe transfer: $4\\Phi$ bytes per step. For step time $\\Delta t$, required bandwidth is $B_{\\text{PCIe}} \\ge \\frac{4\\Phi}{\\Delta t}$.",
          engineeringContext:
            "Enables training 13B+ parameter models on a single consumer GPU by utilizing 512GB Host DDR5 RAM.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Activation Checkpointing vs. ZeRO-3 Memory Synergy",
          prompt:
            "Why is Activation Checkpointing (recomputing activations during backward pass rather than saving them) fundamentally synergistic with ZeRO-3? How does activation memory dominate total memory once static weights and optimizer states are sharded across 1,024 GPUs?",
          engineeringContext:
            "Permits scaling sequence lengths from 2k to 128k during distributed pretraining.",
        },
      ],
      partD_stressTests: [
        {
          title: "CUDA Stream Race Condition in Parameter Deallocation",
          scenario:
            "A developer frees the full parameter tensor `del full_weight` on the main CPU thread immediately after launching an asynchronous `torch.matmul` kernel on CUDA stream 0. If PyTorch's caching allocator re-assigns the underlying memory buffer to an All-Gather operation on CUDA stream 1 before the matrix multiplication kernel completes on stream 0, weights are overwritten mid-computation.",
          failureMode:
            "Silent numeric corruption of forward activations leading to NaN loss explosion 50 steps later.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
