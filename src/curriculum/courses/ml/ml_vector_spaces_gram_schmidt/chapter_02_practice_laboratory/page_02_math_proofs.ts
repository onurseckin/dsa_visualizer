import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_vector_spaces_gram_schmidt_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: QR Uniqueness & Orthogonal Distance Minimization",
  subtitle: "Formal Linear Algebra Theorems and Proofs",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "Uniqueness of QR Factorization for Full-Column-Rank Matrices",
      theorem:
        "Let $A \\in \\mathbb{R}^{m \\times n}$ ($m \\ge n$) have full column rank $n$. There exists a unique pair of matrices $Q \\in \\mathbb{R}^{m \\times n}$ and $R \\in \\mathbb{R}^{n \\times n}$ such that $A = Q R$, where $Q^T Q = I_n$ and $R$ is upper triangular with strictly positive diagonal entries ($R_{ii} > 0$ for all $1 \\le i \\le n$).",
      proof:
        "1. **Existence**: Applying Modified Gram-Schmidt with positive normalization $R_{kk} = \\|v_k\\| > 0$ (which is non-zero because columns of $A$ are linearly independent) constructs such a pair $(Q, R)$.\n2. **Uniqueness**: Suppose there exist two such decompositions $A = Q_1 R_1 = Q_2 R_2$.\n3. Since $A$ has full column rank, $R_1$ and $R_2$ are upper triangular with non-zero diagonal elements, hence invertible. Therefore:\n   $$Q_1 = Q_2 R_2 R_1^{-1}$$\n4. Multiplying both sides by $Q_1^T$ and using $Q_1^T Q_1 = I_n$:\n   $$I_n = Q_1^T Q_1 = (Q_2 R_2 R_1^{-1})^T (Q_2 R_2 R_1^{-1}) = (R_1^{-1})^T R_2^T (Q_2^T Q_2) R_2 R_1^{-1} = (R_1^{-1})^T R_2^T R_2 R_1^{-1}$$\n5. Let $U = R_2 R_1^{-1}$. Then $U^T U = I_n$, meaning $U$ is an orthogonal matrix ($U^{-1} = U^T$).\n6. The product and inverse of upper triangular matrices with positive diagonals is itself an upper triangular matrix with positive diagonals. Thus, $U$ is both upper triangular and orthogonal.\n7. An upper triangular orthogonal matrix must be a diagonal matrix whose diagonal entries squared equal 1 ($u_{ii}^2 = 1$). Since all diagonal entries are positive, $u_{ii} = 1$ for all $i$, which implies $U = I_n$.\n8. Since $U = R_2 R_1^{-1} = I_n$, we have $R_2 = R_1$. Substituting back into $Q_1 = Q_2 R_2 R_1^{-1}$ yields $Q_1 = Q_2$, proving uniqueness.",
    },
    {
      type: "math_proof",
      title: "Orthogonal Projection Minimizes Euclidean Distance (Best Approximation)",
      theorem:
        "Let $\\mathcal{S}$ be a subspace of $\\mathbb{R}^m$ and let $P_{\\mathcal{S}} = Q Q^T$ be the orthogonal projector onto $\\mathcal{S}$, where $Q$ has orthonormal columns. For any vector $b \\in \\mathbb{R}^m$, the projection $\\hat{b} = P_{\\mathcal{S}} b$ is the unique vector in $\\mathcal{S}$ that minimizes the Euclidean distance $\\|b - v\\|_2$ over all $v \\in \\mathcal{S}$.",
      proof:
        "1. Let $v \\in \\mathcal{S}$ be an arbitrary vector. We decompose the error vector:\n   $$b - v = (b - \\hat{b}) + (\\hat{b} - v)$$\n2. By definition of the orthogonal projector, $b - \\hat{b} = (I - P_{\\mathcal{S}}) b \\in \\mathcal{S}^\\perp$.\n3. Since both $\\hat{b} \\in \\mathcal{S}$ and $v \\in \\mathcal{S}$, their difference $\\hat{b} - v \\in \\mathcal{S}$.\n4. Because $\\mathcal{S} \\perp \\mathcal{S}^\\perp$, the inner product $\\langle b - \\hat{b}, \\hat{b} - v \\rangle = 0$.\n5. Applying the Pythagorean theorem in $\\mathbb{R}^m$:\n   $$\\|b - v\\|^2 = \\|(b - \\hat{b}) + (\\hat{b} - v)\\|^2 = \\|b - \\hat{b}\\|^2 + \\|\\hat{b} - v\\|^2$$\n6. Since $\\|\\hat{b} - v\\|^2 \\ge 0$, we have $\\|b - v\\|^2 \\ge \\|b - \\hat{b}\\|^2$ with equality holding if and only if $\\|\\hat{b} - v\\|^2 = 0 \\iff v = \\hat{b}$.\n7. Hence $\\hat{b} = Q Q^T b$ is the unique global minimizer.",
    },
  ],
};

export const page2 = page_02_math_proofs;
