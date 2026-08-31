import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_linear_logistic_regression_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Hat Matrix Idempotence & Logistic Strict Convexity",
  subtitle: "Orthogonal Projectors and Hessian Positive Definiteness Theorems",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "Orthogonal Projection & Idempotence of the OLS Hat Matrix",
      theorem:
        "Let $X \\in \\mathbb{R}^{N \\times D}$ have full column rank $D < N$. The Hat Matrix $P = X (X^T X)^{-1} X^T$ is an orthogonal projection matrix onto the column space $\\text{col}(X)$, satisfying symmetry $P^T = P$, idempotence $P^2 = P$, and residual orthogonality $(I - P) X = 0$.",
      proof:
        "1. **Symmetry**:\n   $$P^T = \\left( X (X^T X)^{-1} X^T \\right)^T = (X^T)^T \\left( (X^T X)^{-1} \\right)^T X^T = X (X^T X)^{-1} X^T = P$$\n2. **Idempotence**:\n   $$P^2 = P \\cdot P = \\left( X (X^T X)^{-1} X^T \\right) \\left( X (X^T X)^{-1} X^T \\right)$$\n   $$= X (X^T X)^{-1} (X^T X) (X^T X)^{-1} X^T = X I_D (X^T X)^{-1} X^T = X (X^T X)^{-1} X^T = P$$\n3. **Orthogonal Residual Projector**:\n   Let $M = I_N - P$. Then:\n   $$M X = (I_N - P) X = X - P X = X - X (X^T X)^{-1} (X^T X) = X - X = 0$$\n4. For any target $y$, the residual vector $e = y - \\hat{y} = (I - P)y$ satisfies $X^T e = X^T (I - P)y = ((I - P)X)^T y = 0^T y = 0$.\n5. Therefore, the residual $e$ is strictly orthogonal to every feature vector in the column space of $X$, and the fitted values $\\hat{y} = P y$ represent the unique closest point in $\\text{col}(X)$ to $y$ under Euclidean norm.",
    },
    {
      type: "math_proof",
      title: "Strict Convexity of the Binary Logistic Regression Loss",
      theorem:
        "For binary logistic regression with full-rank feature matrix $X \\in \\mathbb{R}^{N \\times D}$, the negative log-likelihood $\\mathcal{L}(w) = -\\sum_{i=1}^N \\left[ y_i \\ln \\sigma(w^T x_i) + (1 - y_i) \\ln(1 - \\sigma(w^T x_i)) \\right]$ is strictly convex, and its Hessian $H(w) = X^T W X$ is strictly positive definite ($H \\succ 0$).",
      proof:
        "1. Let $p_i = \\sigma(w^T x_i) = \\frac{1}{1 + e^{-w^T x_i}}$. Note that $\\frac{\\partial p_i}{\\partial w} = p_i (1 - p_i) x_i$.\n2. The gradient of the negative log-likelihood is:\n   $$\\nabla \\mathcal{L}(w) = \\sum_{i=1}^N (p_i - y_i) x_i = X^T (p - y)$$\n3. Differentiating the gradient to obtain the $D \\times D$ Hessian matrix:\n   $$H(w) = \\nabla^2 \\mathcal{L}(w) = \\sum_{i=1}^N x_i \\left( \\frac{\\partial p_i}{\\partial w} \\right)^T = \\sum_{i=1}^N p_i (1 - p_i) x_i x_i^T = X^T W X$$\n   where $W = \\text{diag}(p_1(1-p_1), \\dots, p_N(1-p_N))$.\n4. Since the sigmoid function satisfies $0 < p_i < 1$ for all finite $w^T x_i$, the variance terms $p_i(1-p_i) > 0$ strictly. Therefore, $W$ is a diagonal matrix with strictly positive real entries ($W \\succ 0$).\n5. For any non-zero vector $v \\in \\mathbb{R}^D$ ($v \\ne 0$):\n   $$v^T H(w) v = v^T X^T W X v = (X v)^T W (X v) = \\sum_{i=1}^N p_i(1 - p_i) (x_i^T v)^2$$\n6. Because $X$ has full column rank, $X v \\ne 0$, so there exists at least one $i$ where $x_i^T v \\ne 0$.\n7. Since all terms in the sum are non-negative and at least one is strictly positive: $v^T H(w) v > 0$.\n8. Thus $H(w) \\succ 0$ everywhere, proving $\\mathcal{L}(w)$ is strictly convex with a unique global minimum.",
    },
  ],
};
