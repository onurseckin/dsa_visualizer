import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_matrix_svd_pca_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: PCA Variance Maximization & SVD Singular Limits",
  subtitle: "Lagrangian Derivation of PCA and Spectral Norm Bounds",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "PCA Variance Maximization via Rayleigh Quotient & Lagrange Multipliers",
      theorem:
        "Let centered data matrix $X_c \\in \\mathbb{R}^{N \\times D}$ have sample covariance $\\Sigma_X = \\frac{1}{N-1} X_c^T X_c$. The first principal component unit vector $w_1 \\in \\mathbb{R}^D$ maximizing the projected empirical variance $\\text{Var}(X_c w) = w^T \\Sigma_X w$ subject to $\\|w\\|_2^2 = 1$ is the eigenvector of $\\Sigma_X$ corresponding to the largest eigenvalue $\\lambda_1$, and the maximum variance equals $\\lambda_1$.",
      proof:
        "1. We formulate the constrained optimization problem:\n   $$\\max_{w} w^T \\Sigma_X w \\quad \\text{subject to} \\quad w^T w = 1$$\n2. Construct the Lagrangian function $\\mathcal{L}(w, \\lambda)$ with Lagrange multiplier $\\lambda$:\n   $$\\mathcal{L}(w, \\lambda) = w^T \\Sigma_X w - \\lambda (w^T w - 1)$$\n3. Take the gradient with respect to vector $w$ and set it to zero:\n   $$\\nabla_w \\mathcal{L} = 2 \\Sigma_X w - 2 \\lambda w = 0 \\implies \\Sigma_X w = \\lambda w$$\n4. This is precisely the algebraic eigenvalue equation for $\\Sigma_X$. Therefore, any stationary point $w$ must be an eigenvector of $\\Sigma_X$, and $\\lambda$ is its corresponding eigenvalue.\n5. Pre-multiplying by $w^T$ and using $w^T w = 1$:\n   $$w^T \\Sigma_X w = w^T (\\lambda w) = \\lambda (w^T w) = \\lambda$$\n6. To maximize the variance $w^T \\Sigma_X w$, we must select the largest eigenvalue $\\lambda_1 = \\lambda_{\\max}(\\Sigma_X)$, and the optimal projection direction $w_1$ is its associated unit eigenvector.\n7. For subsequent directions $w_k$ ($k > 1$), imposing mutual orthogonality $w_k^T w_j = 0$ for all $j < k$ similarly proves that $w_k$ is the eigenvector corresponding to the $k$-th largest eigenvalue $\\lambda_k$, completing the proof.",
    },
    {
      type: "math_proof",
      title: "Singular Value Relation Between Data Matrix and Covariance",
      theorem:
        "Let centered data matrix $X_c \\in \\mathbb{R}^{N \\times D}$ have SVD $X_c = U \\Sigma V^T$. The eigenvalues $\\lambda_i$ and eigenvectors $v_i$ of sample covariance $\\Sigma_X = \\frac{1}{N-1} X_c^T X_c$ satisfy $\\lambda_i = \\frac{\\sigma_i^2}{N-1}$ and $\\text{col}_i(V) = v_i$ identically.",
      proof:
        "1. Substitute the SVD expansion into the sample covariance definition:\n   $$\\Sigma_X = \\frac{1}{N-1} X_c^T X_c = \\frac{1}{N-1} (U \\Sigma V^T)^T (U \\Sigma V^T) = \\frac{1}{N-1} V \\Sigma^T U^T U \\Sigma V^T$$\n2. Since $U$ is orthogonal, $U^T U = I_N$. Therefore:\n   $$\\Sigma_X = \\frac{1}{N-1} V \\Sigma^T \\Sigma V^T = V \\left( \\frac{\\Sigma^T \\Sigma}{N-1} \\right) V^T$$\n3. Since $\\Sigma$ is diagonal with non-negative entries $\\sigma_1 \\ge \\sigma_2 \\ge \\dots \\ge \\sigma_D$, the product $\\Sigma^T \\Sigma = \\text{diag}(\\sigma_1^2, \\sigma_2^2, \\dots, \\sigma_D^2)$ is diagonal.\n4. By the spectral theorem for symmetric matrices, this is the unique eigendecomposition $\\Sigma_X = V \\Lambda V^T$ where diagonal entries are eigenvalues $\\lambda_i = \\frac{\\sigma_i^2}{N-1}$ and columns of $V$ are the orthonormal eigenvectors.",
    },
  ],
};

export const page2 = page_02_math_proofs;
