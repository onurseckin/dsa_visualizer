import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_floating_point_kahan_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Neumaier Compensation & Sterbenz Lemma",
  sections: [
    {
      type: "math_proof",
      title: "Sterbenz Lemma and Exact Subtraction Theorem",
      theorem:
        "Let $x, y$ be floating-point numbers in the same format with base $\\beta$ and precision $p$. If $\\frac{y}{2} \\le x \\le 2y$, then the subtraction $x - y$ is computed exactly with zero roundoff error: $\\text{fl}(x - y) = x - y$.",
      proof:
        "1. Assume without loss of generality that $y \\le x \\le 2y$. Let $y = m_y \\beta^{e_y}$ and $x = m_x \\beta^{e_x}$ where $1 \\le m_x, m_y < \\beta$ and $e_x, e_y \\in \\mathbb{Z}$.\\n\\n2. Since $y \\le x \\le 2y$, the exponents $e_x$ and $e_y$ can differ by at most 1:\\n- **Case 1 ($e_x = e_y = e$):**\\n  $x - y = (m_x - m_y) \\beta^e$. Since $m_x, m_y$ are $p$-digit base-$\\beta$ significands, their difference $m_x - m_y$ requires at most $p$ digits of precision. No truncation or rounding occurs.\\n\\n- **Case 2 ($e_x = e_y + 1$):**\\n  Aligning exponents: $y = (m_y / \\beta) \\beta^{e_x}$.\\n  Since $x \\le 2y$, we have $m_x \\le 2 (m_y / \\beta)$. The difference $x - y = (m_x - m_y / \\beta) \\beta^{e_x} < m_x \\beta^{e_x} \\le \\beta^{e_x}$.\\n  When normalized, the significand shifts left by at least one position, canceling the fractional digit and fitting perfectly within $p$ bits.\\n\\n3. Conclusion:\\nIn both cases, no low-order bits are lost during significand alignment or normalization. Hence $\\text{fl}(x - y) = x - y$ exactly. This fundamental theorem guarantees that in the Kahan/Neumaier algorithms, the residual calculation $c = (s - t) + x$ evaluates the discarded rounding error with exact arithmetic.",
    },
    {
      type: "math_proof",
      title: "Neumaier Modified Summation Proof for Arbitrary Mixed Magnitudes",
      theorem:
        "Standard Kahan summation assumes that the running sum $|s|$ is always greater than or equal to the incoming term $|x|$. Neumaier's modification branches when $|x| > |s|$, ensuring that Sterbenz's lemma applies symmetrically regardless of operand scale.",
      proof:
        "1. Standard Kahan computes $t = s + x$ and extracts $c = (s - t) + x$.\\nIf $|x| > |s|$, the addition $s + x$ aligns $s$ to the larger exponent of $x$. The bits discarded during alignment belong to $s$, not $x$.\\n\\n2. In that scenario, $s - t = s - (s + x) \\approx -x$. The calculation $(s - t) + x$ suffers from roundoff error rather than exact extraction.\\n\\n3. Neumaier replaces the compensation branch with:\\n$$\\text{If } |s| < |x|: \\quad c = (x - t) + s$$\\nBecause $x$ is the dominant term, $x - t = x - (x + s)$ aligns $s$ to $x$. By Sterbenz's Lemma, $(x - t)$ is exact, and adding $s$ recovers the exact low-order bits of $s$ that were shifted off the register.\\n\\n4. Thus, Neumaier's algorithm satisfies $|S_n - \\sum x_i| \\le 2\\epsilon \\sum |x_i| + O(n\\epsilon^2)$ unconditionally for any arbitrary permutation of input magnitudes.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
