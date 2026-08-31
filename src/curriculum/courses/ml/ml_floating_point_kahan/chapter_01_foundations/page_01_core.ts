import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_floating_point_kahan_c1_p1",
  pageNumber: 1,
  title: "Floating-Point Arithmetic: IEEE 754 Formats & Kahan Compensation",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Physical Arithmetic Crisis: Catastrophic Gradient Swallowing",
      content:
        "Modern deep learning hardware balances compute speed against numerical fidelity across a zoo of IEEE 754 and custom floating-point formats: **FP32** (1 sign, 8 exponent, 23 mantissa), **FP16** (1 sign, 5 exponent, 10 mantissa), **BF16** (1 sign, 8 exponent, 7 mantissa), and **FP8** (**E4M3** for activations/weights and **E5M2** for gradients). In half-precision training, accumulating small gradient updates $\\Delta w \\sim 10^{-5}$ into large master weights $W \\sim 1.0$ causes **swallowing** (catastrophic truncation). Because FP16 has only 10 bits of mantissa (machine epsilon $\\epsilon_{\\text{mach}} = 2^{-10} \\approx 9.77 \\times 10^{-4}$), adding any number smaller than $2^{-11} \\times W$ shifts its bits entirely off the right edge of the significand register during alignment, producing $W + \\Delta w = W$. Over thousands of training iterations, optimizer updates are silently destroyed unless compensated summation or FP32 master accumulators are used.",
    },
    {
      type: "mental_model",
      title: "Mental Model: Significand Alignment & The Lost Low-Order Bits",
      visualIntuition:
        "Large Accumulator S (exp 0):  [ 1.0000000000 ] x 2^0\\nSmall Gradient dx  (exp -14): [ 0.0000000000 ] x 2^0  <-- Shifted 14 places right! (All 10 bits lost to truncation)\\nKahan Compensator c: Holds the discarded fractional bits in a separate register, re-injecting them into the next step.",
      invariant:
        "Kahan Conservation Invariant: At every step i, (s_i - c_i) represents the exact mathematical sum \\sum_{k=1}^i x_k up to second-order epsilon terms O(n \\epsilon^2), preventing error growth from scaling linearly with n.",
      stateTransitions:
        "Raw input token gradient -> Compute compensated term y = x - c -> Add to accumulator t = sum + y -> Extract discarded low-order bits c = (t - sum) - y -> Update sum = t.",
      naiveBottleneck:
        "Naive accumulation error grows as O(n \\epsilon), leading to significant drift in AdamW moment calculations and divergence in billion-parameter model training.",
      optimalInsight:
        "Kahan compensation extracts the exact truncation error via a 4-flop algebraic identity, reducing accumulation error from O(n \\epsilon) to O(\\epsilon) + O(n \\epsilon^2).",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Kahan Compensated Summation Error Bound",
      theorem:
        "Let $S_n$ be the result of summing $n$ real numbers $x_1, \\dots, x_n$ using Kahan compensated summation under floating-point arithmetic with machine epsilon $\\epsilon$. The total absolute error satisfies $|S_n - \\sum_{i=1}^n x_i| \\le 2\\epsilon \\sum_{i=1}^n |x_i| + O(n\\epsilon^2)$, whereas naive summation has error bound $n\\epsilon \\sum_{i=1}^n |x_i|$.",
      proof:
        "Let $\\text{fl}(a \\odot b) = (a \\odot b)(1 + \\delta)$ where $|\\delta| \\le \\epsilon$.\\nIn the Kahan algorithm at step $i$:\\n1. $y_i = \\text{fl}(x_i - c_{i-1}) = (x_i - c_{i-1})(1 + \\delta_i)$\\n2. $s_i = \\text{fl}(s_{i-1} + y_i) = (s_{i-1} + y_i)(1 + \\sigma_i)$\\n3. $c_i = \\text{fl}(\\text{fl}(s_i - s_{i-1}) - y_i) = ((s_i - s_{i-1})(1 + \\theta_i) - y_i)(1 + \\phi_i)$\\n\\nBy exact algebraic substitution and applying Sterbenz's Lemma on floating-point subtractions where operands are close in magnitude:\\n$$s_i - s_{i-1} - y_i = s_i - s_{i-1} - (x_i - c_{i-1}) + O(\\epsilon^2)$$\\nThe difference $c_i$ exactly captures the low-order truncation error $-e_i$ incurred during the addition $s_{i-1} + y_i$ to first order in $\\epsilon$:\\n$$c_i = (s_{i-1} + y_i) - s_i + O(\\epsilon^2)$$\\n\\nSumming over all $n$ steps telescopingly:\\n$$S_n - \\sum_{i=1}^n x_i = -c_n + O(n\\epsilon^2) \\sum_{i=1}^n |x_i|$$\\nSince $|c_n| \\le 2\\epsilon \\sum_{i=1}^n |x_i|$, taking absolute values yields:\\n$$|S_n - \\sum_{i=1}^n x_i| \\le 2\\epsilon \\sum_{i=1}^n |x_i| + O(n\\epsilon^2)$$\\nThe accumulation error is independent of sequence length $n$ to first order in $\\epsilon$, completely eliminating long-sequence summation drift.",
    },
  ],
};
