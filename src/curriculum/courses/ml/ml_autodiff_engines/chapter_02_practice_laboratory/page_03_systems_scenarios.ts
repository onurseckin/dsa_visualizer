import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_autodiff_engines_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: Autodiff Systems Scenarios & Diagnostics",
  subtitle: "Question Bank Suite: Custom Functions, Rematerialization, and Memory Leaks",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_autodiff_engines",
      title: "Automatic Differentiation & Autograd Systems Suite",
      partA_dsaCoding: [
        {
          title: "Custom PyTorch torch.autograd.Function for Memory-Fused GELU",
          difficulty: "Hard",
          description:
            "Implement a custom autograd Function in Python that saves only the input tensor x in ctx.save_for_backward() and computes both the forward GELU(x) and exact analytical backward pass dL/dx.",
          problemStatement:
            "import torch\n\nclass FusedGELUFunction(torch.autograd.Function):\n    @staticmethod\n    def forward(ctx, x: torch.Tensor) -> torch.Tensor:\n        ctx.save_for_backward(x)\n        # gelu(x) = 0.5 * x * (1 + erf(x / sqrt(2)))\n        pass\n\n    @staticmethod\n    def backward(ctx, grad_output: torch.Tensor) -> torch.Tensor:\n        x, = ctx.saved_tensors\n        pass",
        },
      ],
      partB_mathProofs: [
        {
          title: "RMSNorm Adjoint Gradient Derivation",
          statement:
            "Prove that for RMSNorm y_i = (x_i / rms(x)) * gamma_i where rms(x) = sqrt(1/D sum_j x_j^2 + eps), the backward adjoint gradient is given by dL/dx_i = (gamma_i dL/dy_i) / rms(x) - (x_i / (D rms(x)^3)) * sum_j (gamma_j dL/dy_j x_j).",
          proofOutline:
            "Let s = rms(x). y_i = (x_i / s) gamma_i. dL/dx_i = sum_j (dL/dy_j) (dy_j / dx_i). dy_j / dx_i = (delta_{ij} / s) gamma_j - (x_j gamma_j / s^2) (ds / dx_i). Since ds / dx_i = x_i / (D s), substituting yields the exact two-term expression.",
          engineeringContext:
            "This exact adjoint form is used in FlashAttention and Llama transformer layer normalization kernels to fuse RMSNorm into SRAM.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Activation Checkpointing vs Memory Bandwidth Bottleneck",
          prompt:
            "Why does activation checkpointing reduce peak GPU VRAM by up to 5x while only increasing overall wall-clock training time by ~30%?",
          engineeringContext:
            "Forward pass computation represents roughly 1/3 of total training FLOPs (backward pass requires 2/3). Recomputing forward activations during backward adds only 1x forward pass (33% FLOP overhead). In return, intermediate activations across hundreds of layers do not need to be retained in VRAM, eliminating memory spills to CPU host DRAM.",
        },
      ],
      partD_stressTests: [
        {
          title: "Autograd Graph History Python List Memory Leak Trap",
          scenario:
            "A model developer logs the training loss across 10,000 steps via `loss_history.append(loss)`. After 500 steps, the GPU crashes with OutOfMemoryError.",
          failureMode:
            "Appending the live Tensor `loss` to a Python list retains a reference to the root node of the autograd computation graph (`loss.grad_fn`). Because Python holds the tensor, PyTorch cannot free the gigabytes of intermediate activation tensors allocated during that step. The memory of all 500 backward graphs accumulates until VRAM is exhausted. Appending `loss.item()` or `loss.detach()` fixes the leak.",
        },
      ],
    },
  ],
};
