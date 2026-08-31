import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_matrix_svd_pca_c1_p1",
  pageNumber: 1,
  title: "Singular Value Decomposition (SVD) & Principal Component Analysis (PCA)",
  subtitle: "Spectral Geometry, Eckart-Young Low-Rank Optimality, and Covariance Dualities",
  estimatedMinutes: 30,
  sections: [
    {
      type: "prose",
      title: "The Geometry of Singular Value Decomposition",
      content:
        "Singular Value Decomposition (SVD) is the foundational theorem of matrix factorization (MIT 18.065 / Stanford CS229). Any real matrix $A \\in \\mathbb{R}^{m \\times n}$ of rank $r \\le \\min(m, n)$ can be factored into:\n\n$$A = U \\Sigma V^T = \\sum_{i=1}^r \\sigma_i u_i v_i^T$$\n\nwhere:\n- $U = [u_1, \\dots, u_m] \\in \\mathbb{R}^{m \\times m}$ is an orthogonal matrix ($U^T U = I_m$) whose columns are the **left singular vectors** (eigenvectors of $A A^T$).\n- $V = [v_1, \\dots, v_n] \\in \\mathbb{R}^{n \\times n}$ is an orthogonal matrix ($V^T V = I_n$) whose columns are the **right singular vectors** (eigenvectors of $A^T A$).\n- $\\Sigma \\in \\mathbb{R}^{m \\times n}$ is a rectangular diagonal matrix with singular values $\\sigma_1 \\ge \\sigma_2 \\ge \\dots \\ge \\sigma_r > 0$ along the main diagonal, where $\\sigma_i = \\sqrt{\\lambda_i(A^T A)}$.\n\n**Geometric Interpretation**: Any linear transformation $x \\mapsto A x$ maps the unit sphere in $\\mathbb{R}^n$ into an $r$-dimensional hyper-ellipsoid in $\\mathbb{R}^{m}$. The right singular vectors $v_i$ define the principal orthogonal axes in the input space, the singular values $\\sigma_i$ are the semi-axis lengths, and the left singular vectors $u_i$ define the principal directions of the resulting ellipsoid in the output space.",
    },
    {
      type: "mental_model",
      title: "PCA as SVD on Centered Data",
      visualIntuition:
        "Data Matrix X (N samples x D features):\n1. Mean Center: X_c = X - 1 * mu^T  (mu = mean along samples)\n2. Sample Covariance: Sigma_X = (1 / (N - 1)) * X_c^T X_c\n\nDirect Eigendecomposition vs Direct SVD:\n  Approach A (Naive): Compute Sigma_X = (X_c^T X_c)/(N-1) -> Eigendecompose Sigma_X = V Lambda V^T\n  --> Flaw: Forming X_c^T X_c SQUARES the condition number: kappa(X_c^T X_c) = kappa(X_c)^2. Floats underflow!\n\n  Approach B (Optimal SVD): Factorize X_c = U Sigma V^T directly!\n  --> Then X_c^T X_c = V Sigma U^T U Sigma V^T = V Sigma^2 V^T\n  --> Right singular vectors V are EXACTLY the principal directions!\n  --> Eigenvalues Lambda = Sigma^2 / (N - 1)\n  --> Projected Principal Scores Z = X_c @ V = U @ Sigma (Computed with ZERO matrix squaring!)",
      invariant:
        "Covariance Eigendecomposition and Data SVD share identical right singular vectors V. Total variance = sum(sigma_i^2) / (N - 1).",
      stateTransitions:
        "Raw Data X -> Compute Mean Vector mu -> Center Data X_c -> Compute SVD(X_c) = U Sigma V^T -> Select Top k Components -> Project Z_k = X_c V_k.",
      naiveBottleneck:
        "Computing the D x D covariance matrix explicitly requires O(N D^2) FLOPs and catastrophic floating-point squaring.",
      optimalInsight:
        "Applying SVD directly to X_c avoids matrix multiplication, retains full numerical precision, and computes principal scores via Z = U_k Sigma_k in O(N D k) time.",
    },
    {
      type: "math_proof",
      title: "Eckart-Young-Mirsky Low-Rank Approximation Theorem",
      theorem:
        "Let $A = \\sum_{i=1}^r \\sigma_i u_i v_i^T$ be the SVD of $A \\in \\mathbb{R}^{m \\times n}$ with $\\sigma_1 \\ge \\dots \\ge \\sigma_r > 0$. For any integer $k < r$, the truncated SVD matrix $A_k = \\sum_{i=1}^k \\sigma_i u_i v_i^T$ of rank $k$ is the optimal rank-$k$ approximation of $A$ under both the Frobenius norm and the Spectral norm:\n$$\\min_{\\text{rank}(B) \\le k} \\|A - B\\|_F^2 = \\|A - A_k\\|_F^2 = \\sum_{i=k+1}^r \\sigma_i^2$$\n$$\\min_{\\text{rank}(B) \\le k} \\|A - B\\|_2 = \\|A - A_k\\|_2 = \\sigma_{k+1}$$",
      proof:
        "1. **Frobenius Norm Bound**: Let $B$ be an arbitrary matrix with $\\text{rank}(B) \\le k$. Since the Frobenius norm is unitarily invariant, $\\|A - B\\|_F^2 = \\|U^T (A - B) V\\|_F^2 = \\|\\Sigma - U^T B V\\|_F^2$.\n2. Let $M = U^T B V$. Since $\\text{rank}(M) = \\text{rank}(B) \\le k$, we minimize $\\|\\Sigma - M\\|_F^2 = \\sum_{i=1}^{\\min(m, n)} (\\Sigma_{ii} - M_{ii})^2 + \\sum_{i \\ne j} M_{ij}^2$.\n3. To minimize this sum, we must set all off-diagonal entries $M_{ij} = 0$ for $i \\ne j$, and choose the diagonal entries $M_{ii}$ to match $\\Sigma_{ii}$ on at most $k$ non-zero indices.\n4. To minimize the remaining sum of squared errors $\\sum_{i \\notin \\text{selected}} \\sigma_i^2$, the optimal choice is to select the $k$ largest singular values $\\sigma_1, \\dots, \\sigma_k$.\n5. Hence, $M^* = \\text{diag}(\\sigma_1, \\dots, \\sigma_k, 0, \\dots, 0)$, which corresponds to $B^* = U M^* V^T = A_k$.\n6. The residual error is precisely $\\|A - A_k\\|_F^2 = \\sum_{i=k+1}^r \\sigma_i^2$.\n7. **Spectral Norm Bound**: For $A_k$, $\\|A - A_k\\|_2 = \\|\\sum_{i=k+1}^r \\sigma_i u_i v_i^T\\|_2 = \\sigma_{k+1}$.\n8. Suppose there exists $B$ with $\\text{rank}(B) \\le k$ such that $\\|A - B\\|_2 < \\sigma_{k+1}$. The null space $\\text{null}(B)$ has dimension at least $n - k$.\n9. The subspace spanned by the first $k+1$ right singular vectors $W = \\text{span}(v_1, \\dots, v_{k+1})$ has dimension $k+1$.\n10. By the dimension theorem, $\\dim(\\text{null}(B) \\cap W) \\ge (n - k) + (k + 1) - n = 1$. Thus, there exists a unit vector $z \\in \\text{null}(B) \\cap W$ with $\\|z\\|_2 = 1$.\n11. Because $z \\in \\text{null}(B)$, $B z = 0$. Therefore:\n    $$\\|(A - B) z\\|_2^2 = \\|A z\\|_2^2 = \\left\\| \\sum_{i=1}^{k+1} \\sigma_i u_i (v_i^T z) \\right\\|_2^2 = \\sum_{i=1}^{k+1} \\sigma_i^2 (v_i^T z)^2 \\ge \\sigma_{k+1}^2 \\sum_{i=1}^{k+1} (v_i^T z)^2 = \\sigma_{k+1}^2 \\|z\\|_2^2 = \\sigma_{k+1}^2$$\n12. Hence $\\|A - B\\|_2 \\ge \\|(A - B) z\\|_2 \\ge \\sigma_{k+1}$, which contradicts $\\|A - B\\|_2 < \\sigma_{k+1}$. Thus $A_k$ is strictly optimal.",
    },
  ],
};
