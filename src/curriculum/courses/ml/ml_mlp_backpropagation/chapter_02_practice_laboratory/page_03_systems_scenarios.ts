import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_mlp_backpropagation_c2_p3",
  pageNumber: 4,
  title: "4-Part Socratic Diagnostic Suite: MLP Backpropagation & Autograd",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_mlp_backpropagation",
      title: "MLP Backpropagation & Autograd Engine Systems Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Custom Reverse-Mode Autograd Tape Engine",
          description:
            "Implement a minimal lightweight computational graph tape that dynamically constructs dynamic DAG nodes during the forward pass and executes topological sort reverse-mode backpropagation.",
          problemStatement:
            "Build a Tensor class supporting add, matmul, relu with automatic backward() execution.",
        },
      ],
      partB_mathProofs: [
        {
          title: "LeakyReLU Non-Zero Dead Neuron Elimination",
          prompt:
            "Prove that replacing standard ReLU ($sigma(z) = max(0, z)$) with LeakyReLU ($sigma(z) = max(alpha z, z)$ where $alpha = 0.01$) guarantees that the expected gradient norm strictly satisfies $mathbb{E}[|\nabla_z mathcal{L}|] > 0$ for all negative pre-activations, completely eliminating the 'Dying ReLU' network freeze catastrophe.",
          statement:
            "Demonstrate how non-zero negative slope maintains continuous gradient propagation.",
          proofOutline:
            "1. For standard ReLU, $sigma'(z) = 0$ for all $z < 0$. If a neuron's weights update such that $z_i < 0$ for all training samples, $delta_i = 0$ permanently, creating an un-trainable dead neuron.\\n2. For LeakyReLU, $sigma'(z) = alpha > 0$ for $z < 0$.\\n3. Gradient backpropagation is $delta = Delta cdot alpha \ne 0$, preserving non-zero gradient flow to update incoming weights back into active positive regimes.",
          engineeringContext:
            "Essential for stabilizing deep discriminator training in Generative Adversarial Networks (GANs).",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "PyTorch Caching Allocator CUDA Memory Overhead",
          prompt:
            "Why does PyTorch's Caching Allocator allocate memory in discrete 2MB and 20MB pools rather than calling `cudaMalloc` directly on every layer allocation? How does allocator fragmentation cause out-of-memory errors during the backward pass even when free memory is reported by nvidia-smi?",
          engineeringContext:
            "Governs memory tuning and garbage collection in large transformer training runs.",
        },
      ],
      partD_stressTests: [
        {
          title: "Silent In-Place Tensor Mutation Autograd Corruption",
          scenario:
            "A developer writes `x += bias` (in-place addition) before passing `x` into an activation layer. During the backward pass, the autograd engine requires the original `x` to compute parameter gradients, but receives the mutated tensor, silently corrupting gradient calculations without throwing an error.",
          failureMode:
            "Silent mathematical gradient error leading to training loss divergence after 1,000 steps.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
