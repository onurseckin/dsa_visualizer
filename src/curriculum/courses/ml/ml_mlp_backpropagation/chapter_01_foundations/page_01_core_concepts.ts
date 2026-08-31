import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_mlp_backpropagation_c1_p1_concepts",
  pageNumber: 2,
  title: "Core Concepts: Universal Approximation & Activation Memory Accounting",
  sections: [
    {
      type: "prose",
      title: "The Universal Approximation Theorem: Density in Function Space",
      content:
        "The **Universal Approximation Theorem (Cybenko, 1989; Hornik, 1991)** establishes the theoretical foundation of deep learning: a single-hidden-layer feedforward network with a finite number of neurons and non-polynomial continuous activation function $\\sigma$ can approximate any continuous function $f \\in C(K)$ on a compact subset $K \\subset \\mathbb{R}^D$ to arbitrary precision $\\epsilon > 0$. While single-layer networks possess universal representational capacity in the limit of infinite width $M \\to \\infty$, deep networks ($L \\ge 2$) exponentially compress the required parameter count for compositional and hierarchical functions.",
    },
    {
      type: "mental_model",
      title: "Mental Model: Activation Memory Footprint vs. Model Parameters",
      visualIntuition:
        "Static Model Weights:  [ W^(1) (4 MB) ][ W^(2) (4 MB) ] ... [ W^(L) (4 MB) ] (Static, fixed size)\\nDynamic Stashed Activations: [ Batch B=64 x Seq S=4096 x D=4096 ] per layer!\\n                             = 4 GB per layer! (128 GB across 32 layers!)\\nIn training, activation memory outgrows weight parameters by 10x-50x!",
      invariant:
        "Activation Memory Invariant: To compute parameter gradient dL/dW^(l) = (A^(l-1))^T delta^(l), the forward activation tensor A^(l-1) MUST remain resident in GPU memory throughout the entire forward pass until layer l is reached during the backward pass.",
      stateTransitions:
        "Standard Training: Retain all L activations in VRAM -> Peak Memory = O(L * B * D).\\nActivation Checkpointing: Retain only 1 activation every sqrt(L) layers -> Recompute intermediate layers during backward -> Peak Memory = O(sqrt(L) * B * D).",
      naiveBottleneck:
        "Storing full uncompressed FP32 activations for every intermediate layer triggers GPU Out-Of-Memory (OOM) crashes even on small batch sizes.",
      optimalInsight:
        "Activation checkpointing (rematerialization) trades 33% extra compute (one additional forward pass) for a 5x-10x reduction in peak VRAM consumption.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Universal Approximation Theorem (Cybenko 1989 Outline)",
      theorem:
        "Let $\\sigma: \\mathbb{R} \\to \\mathbb{R}$ be any continuous discriminatory sigmoidal function ($\\lim_{t \\to -\\infty} \\sigma(t) = 0$ and $\\lim_{t \\to +\\infty} \\sigma(t) = 1$). The set of functions $F(x) = \\sum_{j=1}^M \\alpha_j \\sigma(w_j^T x + b_j)$ is dense in $C(I_n)$ on the compact unit hypercube $I_n = [0, 1]^n$ under the supremum norm $\\|f - F\\|_\\infty < \\epsilon$.",
      proof:
        "1. Functional Analytic Setup & Hahn-Banach Theorem:\\nBy the Hahn-Banach and Riesz Representation Theorems, a linear subspace $S \\subset C(I_n)$ is dense in $C(I_n)$ if and only if the only bounded signed regular Borel measure $\\mu$ on $I_n$ that annihilates $S$ (i.e. $\\int_{I_n} g(x) d\\mu(x) = 0$ for all $g \\in S$) is the zero measure $\\mu = 0$.\\n\\n2. Annihilation Condition:\\nSuppose there exists a measure $\\mu$ such that for all $w \\in \\mathbb{R}^n$ and $b \\in \\mathbb{R}$:\\n$$\\int_{I_n} \\sigma(w^T x + b) d\\mu(x) = 0$$\\n\\n3. Reduction to Fourier Transform:\\nConsider bounded measurable function $h_w(t) = \\int_{I_n} \\sigma(w^T x + b) d\\mu(x)$. By scaling $b$ and using the sigmoidal step limits, as $\\lambda \\to \\infty$, $\\sigma(\\lambda(w^T x + b)) \\to \\mathbf{1}_{\\{w^T x + b > 0\\}}$.\\nThus, the measure of all half-spaces $\\mu(\\{x : w^T x + b > 0\\}) = 0$.\\n\\n4. Uniqueness of Fourier Inversion:\\nThe Fourier-Stieltjes transform of measure $\\mu$ is $\\hat{\\mu}(w) = \\int_{I_n} e^{-i w^T x} d\\mu(x) = 0$ for all $w \\in \\mathbb{R}^n$.\\nBy the uniqueness theorem of Fourier transforms, $\\hat{\\mu}(w) = 0 \\implies \\mu = 0$ identically.\\n\\n5. Conclusion:\\nNo non-zero measure annihilates the span of single-hidden-layer networks. Therefore, the span of $\\sigma(w^T x + b)$ is dense in $C(I_n)$, proving universal approximation.",
    },
  ],
};
