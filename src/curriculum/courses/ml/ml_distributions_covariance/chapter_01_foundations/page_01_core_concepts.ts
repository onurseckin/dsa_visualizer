import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_distributions_covariance_c1_p1",
  pageNumber: 1,
  title: "Multivariate Distributions, Covariance, & Mahalanobis Geometry",
  subtitle: "Multivariate Gaussians, Precision Matrices, and Maximum Likelihood Derivations",
  estimatedMinutes: 30,
  sections: [
    {
      type: "prose",
      title: "The Geometry of the Multivariate Gaussian Distribution",
      content:
        "The Multivariate Normal (Gaussian) distribution is the cornerstone of continuous probabilistic modeling and Bayesian inference (MIT 18.065 / Stanford CS229). A random vector $X \\in \\mathbb{R}^D$ follows a multivariate normal distribution $\\mathcal{N}(\\mu, \\Sigma)$ with mean vector $\\mu \\in \\mathbb{R}^D$ and symmetric positive-definite covariance matrix $\\Sigma \\in \\mathbb{R}^{D \\times D}$ ($\\Sigma \\succ 0$) if its probability density function is:\n\n$$p(x; \\mu, \\Sigma) = \\frac{1}{(2\\pi)^{D/2} \\det(\\Sigma)^{1/2}} \\exp\\left( -\\frac{1}{2} (x - \\mu)^T \\Sigma^{-1} (x - \\mu) \\right)$$\n\nKey geometric and algebraic properties:\n1. **Mahalanobis Distance**: The quadratic form in the exponent defines the squared Mahalanobis distance:\n   $$D_M^2(x, \\mu) = (x - \\mu)^T \\Sigma^{-1} (x - \\mu)$$\n   Iso-density level curves $p(x) = c$ form $D$-dimensional hyper-ellipsoids centered at $\\mu$.\n2. **Spectral Geometry**: The eigendecomposition $\\Sigma = Q \\Lambda Q^T$ (where $Q$ is orthogonal and $\\Lambda = \\text{diag}(\\lambda_1, \\dots, \\lambda_D)$) aligns the principal axes of the hyper-ellipsoid with eigenvectors $q_i$, with semi-axis lengths proportional to $\\sqrt{\\lambda_i}$.\n3. **Precision Matrix (Concentration Matrix)**: $\\Theta = \\Sigma^{-1}$. In Gaussian Graphical Models, the entry $\\Theta_{ij} = 0$ if and only if random variables $X_i$ and $X_j$ are conditionally independent given all other variables ($X_i \\perp X_j \\mid X_{\\setminus \\{i, j\\}}$).\n4. **Affine Stability**: For any matrix $A \\in \\mathbb{R}^{K \\times D}$ and vector $b \\in \\mathbb{R}^K$, the linear transformation $Y = A X + b$ is Gaussian: $Y \\sim \\mathcal{N}(A \\mu + b, A \\Sigma A^T)$.",
    },
    {
      type: "mental_model",
      title: "Covariance Decorrelation & Cholesky Whitening",
      visualIntuition:
        "Raw Correlated Gaussian X ~ N(mu, Sigma):\n          y ^         +----+\n            |        /  /  /  <-- Anisotropic, tilted ellipse (rho != 0)\n            |       /  /  /\n            |      +----+\n            +-----------------> x\n\nCholesky Whitening Transform: z = L^{-1} (x - mu) where Sigma = L L^T\n          y ^         ***\n            |        *   *     <-- Standard Isotropic Spherical Normal z ~ N(0, I_D)\n            |         ***\n            +-----------------> x\n\nReparameterization Sampling Trick: x = mu + L @ z (where z ~ N(0, I))\n  Generates exact correlated multivariate samples using 1D standard Gaussians!",
      invariant:
        "Positive Semi-Definite Invariant: For any non-zero v in R^D, v^T Sigma v >= 0. Covariance determinant det(Sigma) = prod(lambda_i) > 0.",
      stateTransitions:
        "Standard Normal Noise z ~ N(0, I) -> Scale by Cholesky Factor L -> Translate by Mean mu -> Correlated Sample x = mu + L z.",
      naiveBottleneck:
        "Inverting D x D covariance matrix directly via np.linalg.inv(Sigma) suffers from O(D^3) instability and explodes when Sigma is ill-conditioned.",
      optimalInsight:
        "Compute Cholesky factorization Sigma = L L^T. Evaluate quadratic form via forward triangular substitution (L v = x - mu => D_M^2 = ||v||_2^2) with 2x speedup and pristine numerical stability.",
    },
    {
      type: "math_proof",
      title: "Maximum Likelihood Estimation (MLE) of Multivariate Gaussian Parameters",
      theorem:
        "Given $N$ independent and identically distributed observations $\\{x_1, x_2, \\dots, x_N\\} \\subset \\mathbb{R}^D$, the Maximum Likelihood Estimators for mean $\\mu$ and covariance $\\Sigma$ are:\n$$\\hat{\\mu}_{\\text{MLE}} = \\frac{1}{N} \\sum_{i=1}^N x_i, \\quad \\hat{\\Sigma}_{\\text{MLE}} = \\frac{1}{N} \\sum_{i=1}^N (x_i - \\hat{\\mu})(x_i - \\hat{\\mu})^T$$",
      proof:
        "1. Write the log-likelihood function $\\ell(\\mu, \\Sigma) = \\sum_{i=1}^N \\ln p(x_i; \\mu, \\Sigma)$:\n   $$\\ell(\\mu, \\Sigma) = -\\frac{N D}{2} \\ln(2\\pi) - \\frac{N}{2} \\ln \\det(\\Sigma) - \\frac{1}{2} \\sum_{i=1}^N (x_i - \\mu)^T \\Sigma^{-1} (x_i - \\mu)$$\n2. To find $\\hat{\\mu}$, take the derivative with respect to vector $\\mu$ and set to zero:\n   $$\\nabla_\\mu \\ell(\\mu, \\Sigma) = \\sum_{i=1}^N \\Sigma^{-1} (x_i - \\mu) = \\Sigma^{-1} \\left( \\sum_{i=1}^N x_i - N \\mu \\right) = 0$$\n   Since $\\Sigma^{-1}$ is non-singular, we have $\\sum_{i=1}^N x_i - N \\mu = 0 \\implies \\hat{\\mu} = \\frac{1}{N} \\sum_{i=1}^N x_i$.\n3. To find $\\hat{\\Sigma}$, express the sum using the trace operator:\n   $$\\sum_{i=1}^N (x_i - \\mu)^T \\Sigma^{-1} (x_i - \\mu) = \\text{Tr}\\left( \\Sigma^{-1} \\sum_{i=1}^N (x_i - \\mu)(x_i - \\mu)^T \\right) = \\text{Tr}\\left( \\Sigma^{-1} S \\right)$$\n   where $S = \\sum_{i=1}^N (x_i - \\hat{\\mu})(x_i - \\hat{\\mu})^T$.\n4. Rewrite log-likelihood in terms of precision matrix $\\Theta = \\Sigma^{-1}$:\n   $$\\ell(\\Theta) = \\text{const} + \\frac{N}{2} \\ln \\det(\\Theta) - \\frac{1}{2} \\text{Tr}(\\Theta S)$$\n5. Differentiating with respect to matrix $\\Theta$ using $\\nabla_\\Theta \\ln \\det(\\Theta) = \\Theta^{-T} = \\Sigma$:\n   $$\\nabla_\\Theta \\ell = \\frac{N}{2} \\Sigma - \\frac{1}{2} S = 0 \\implies N \\Sigma = S \\implies \\hat{\\Sigma} = \\frac{1}{N} S = \\frac{1}{N} \\sum_{i=1}^N (x_i - \\hat{\\mu})(x_i - \\hat{\\mu})^T$$\n6. This establishes the exact analytical closed-form for the multivariate Gaussian MLE.",
    },
  ],
};
