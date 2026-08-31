import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_distributions_covariance_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Covariance Semi-Definiteness & Affine Invariance",
  subtitle: "Spectral Properties and Affine Distributional Stability Theorems",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "Positive Semi-Definiteness of the Population & Sample Covariance Matrix",
      theorem:
        "For any random vector $X \\in \\mathbb{R}^D$ with finite second moments, the population covariance matrix $\\Sigma = \\mathbb{E}[(X - \\mu)(X - \\mu)^T]$ and the sample covariance matrix $\\hat{\\Sigma} = \\frac{1}{N-1} X_c^T X_c$ are positive semi-definite (PSD), meaning $v^T \\Sigma v \\ge 0$ for all vectors $v \\in \\mathbb{R}^D$.",
      proof:
        "1. Let $v \\in \\mathbb{R}^D$ be an arbitrary fixed vector.\n2. Consider the scalar quadratic form $v^T \\Sigma v$:\n   $$v^T \\Sigma v = v^T \\mathbb{E}[(X - \\mu)(X - \\mu)^T] v = \\mathbb{E}\\left[ v^T (X - \\mu)(X - \\mu)^T v \\right]$$\n3. Note that $v^T (X - \\mu)$ is a real scalar. Therefore:\n   $$v^T (X - \\mu)(X - \\mu)^T v = \\left( v^T (X - \\mu) \\right) \\left( (X - \\mu)^T v \\right) = \\left( v^T (X - \\mu) \\right)^2$$\n4. Since the square of any real number is non-negative, $\\left( v^T (X - \\mu) \\right)^2 \\ge 0$ with probability 1.\n5. By monotonicity of mathematical expectation:\n   $$v^T \\Sigma v = \\mathbb{E}\\left[ \\left( v^T (X - \\mu) \\right)^2 \\right] \\ge 0$$\n6. For the sample covariance $\\hat{\\Sigma} = \\frac{1}{N-1} X_c^T X_c$:\n   $$v^T \\hat{\\Sigma} v = \\frac{1}{N-1} v^T X_c^T X_c v = \\frac{1}{N-1} (X_c v)^T (X_c v) = \\frac{1}{N-1} \\|X_c v\\|_2^2 \\ge 0$$\n7. This proves that both population and sample covariance matrices are strictly positive semi-definite with non-negative real eigenvalues.",
    },
    {
      type: "math_proof",
      title: "Affine Stability Theorem of Multivariate Gaussian Random Vectors",
      theorem:
        "Let $X \\sim \\mathcal{N}(\\mu, \\Sigma)$ be a $D$-dimensional normal random vector. For any full-rank matrix $A \\in \\mathbb{R}^{K \\times D}$ and vector $b \\in \\mathbb{R}^K$, the transformed vector $Y = A X + b$ is distributed as $\\mathcal{N}(A \\mu + b, A \\Sigma A^T)$.",
      proof:
        "1. We use the multivariate characteristic function $\\phi_X(t) = \\mathbb{E}\\left[ \\exp(i t^T X) \\right]$.\n2. For $X \\sim \\mathcal{N}(\\mu, \\Sigma)$, the characteristic function is:\n   $$\\phi_X(t) = \\exp\\left( i t^T \\mu - \\frac{1}{2} t^T \\Sigma t \\right)$$\n3. Now evaluate the characteristic function of $Y = A X + b$ for $s \\in \\mathbb{R}^K$:\n   $$\\phi_Y(s) = \\mathbb{E}\\left[ \\exp(i s^T Y) \\right] = \\mathbb{E}\\left[ \\exp(i s^T (A X + b)) \\right] = \\exp(i s^T b) \\mathbb{E}\\left[ \\exp(i (A^T s)^T X) \\right]$$\n4. Let $t = A^T s \\in \\mathbb{R}^D$. Applying the characteristic function of $X$:\n   $$\\phi_Y(s) = \\exp(i s^T b) \\cdot \\exp\\left( i (A^T s)^T \\mu - \\frac{1}{2} (A^T s)^T \\Sigma (A^T s) \\right)$$\n   $$= \\exp\\left( i s^T (A \\mu + b) - \\frac{1}{2} s^T (A \\Sigma A^T) s \\right)$$\n5. By the uniqueness theorem of characteristic functions, this is identically the characteristic function of a multivariate Gaussian with mean $\\mu_Y = A \\mu + b$ and covariance $\\Sigma_Y = A \\Sigma A^T$, completing the proof.",
    },
  ],
};
