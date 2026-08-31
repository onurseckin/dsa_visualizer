import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_vector_spaces_gram_schmidt_c1_p1",
  pageNumber: 1,
  title: "Vector Spaces, Orthogonality, & Gram-Schmidt",
  subtitle:
    "Inner Product Spaces, Subspace Projections, and the Numerical Crisis of Orthogonalization",
  estimatedMinutes: 30,
  sections: [
    {
      type: "prose",
      title: "Inner Product Spaces & Orthogonal Projections",
      content:
        "In linear algebra and machine learning foundations (MIT 18.065 / Stanford CS229), a real vector space $\\mathcal{V} = \\mathbb{R}^m$ endowed with standard Euclidean inner product $\\langle u, v \\rangle = u^T v = \\sum_{i=1}^m u_i v_i$ forms a Hilbert space. Two vectors are **orthogonal** ($u \\perp v$) if and only if $\\langle u, v \\rangle = 0$.\n\nGiven a set of linearly independent column vectors $\\{a_1, a_2, \\dots, a_n\\} \\subset \\mathbb{R}^m$ ($m \\ge n$) spanning subspace $\\mathcal{S} = \\text{span}(a_1, \\dots, a_n)$, we seek an **orthonormal basis** $\\{q_1, q_2, \\dots, q_n\\}$ such that:\n1. $\\langle q_i, q_j \\rangle = \\delta_{ij} = \\begin{cases} 1 & \\text{if } i = j \\\\ 0 & \\text{if } i \\ne j \\end{cases}$\n2. $\\text{span}(q_1, \\dots, q_k) = \\text{span}(a_1, \\dots, a_k)$ for all $1 \\le k \\le n$.\n\nThis construction directly yields the fundamental **QR Factorization** of matrix $A = [a_1, \\dots, a_n] \\in \\mathbb{R}^{m \\times n}$:\n$$A = Q R$$\nwhere $Q = [q_1, \\dots, q_n] \\in \\mathbb{R}^{m \\times n}$ has orthonormal columns ($Q^T Q = I_n$), and $R \\in \\mathbb{R}^{n \\times n}$ is upper triangular with $R_{ij} = \\langle q_i, a_j \\rangle$.\n\nThe orthogonal projection of any vector $v$ onto the subspace $\\text{span}(u)$ is:\n$$\\text{proj}_u(v) = \\frac{\\langle v, u \\rangle}{\\|u\\|^2} u$$\nand the orthogonal projection operator onto the entire subspace $\\text{col}(Q)$ is $P = Q Q^T$.",
    },
    {
      type: "mental_model",
      title: "Classical (CGS) vs Modified Gram-Schmidt (MGS) Mechanics",
      visualIntuition:
        "Original Vector a_k in 3D Space:\n        ^\n       /|\\  a_k\n      / | \\\n     /  |  \\\n    /   |   \\  v_k (orthogonalized residual vector)\n   /    |    \\\n  +-----+-----> Subspace spanned by {q_1, ..., q_{k-1}}\n     proj(a_k)\n\nClassical Gram-Schmidt (CGS):\n  Projects a_k against ALL original q_1..q_{k-1} simultaneously:\n  v_k = a_k - (q_1^T a_k)q_1 - (q_2^T a_k)q_2 - ... - (q_{k-1}^T a_k)q_{k-1}\n  --> In floating point, errors in early components compound, causing severe loss of orthogonality!\n\nModified Gram-Schmidt (MGS):\n  Sequentially projects updated intermediate residuals:\n  v_k^{(1)} = a_k\n  v_k^{(2)} = v_k^{(1)} - (q_1^T v_k^{(1)})q_1\n  v_k^{(3)} = v_k^{(2)} - (q_2^T v_k^{(2)})q_2\n  ... v_k^{(k)} = v_k^{(k-1)} - (q_{k-1}^T v_k^{(k-1)})q_{k-1}\n  --> Numerically stable: errors introduced in step j are automatically scrubbed out in subsequent projections!",
      invariant:
        "Q matrix orthonormality: Q^T Q = I_n. Upper triangular R contains coordinates: R[i, j] = q_i^T a_j for i <= j, R[i, j] = 0 for i > j.",
      stateTransitions:
        "Raw Column a_k -> Project out q_1 -> Project out q_2 -> ... -> Residual v_k -> Normalize q_k = v_k / ||v_k||.",
      naiveBottleneck:
        "CGS suffers from catastrophic cancellation in FP32/FP64 when subtracting large nearly parallel vectors, causing ||Q^T Q - I|| to explode.",
      optimalInsight:
        "MGS sequentially strips orthogonal components from intermediate residuals, guaranteeing numerical orthogonality bounded by epsilon * kappa(A).",
    },
    {
      type: "math_proof",
      title: "Orthogonality Error Bounds: CGS vs MGS",
      theorem:
        "Let $A \\in \\mathbb{R}^{m \\times n}$ have condition number $\\kappa(A) = \\sigma_{\\max}(A) / \\sigma_{\\min}(A)$, and let machine precision be $\\epsilon_{\\text{mach}}$. In floating-point arithmetic:\n1. Classical Gram-Schmidt (CGS) computes $\\hat{Q}$ with loss of orthogonality bounded by:\n   $$\\|\\hat{Q}^T \\hat{Q} - I\\|_2 = \\mathcal{O}\\left(\\epsilon_{\\text{mach}} \\cdot \\kappa(A)^2\\right)$$\n2. Modified Gram-Schmidt (MGS) computes $\\hat{Q}$ with loss of orthogonality bounded by:\n   $$\\|\\hat{Q}^T \\hat{Q} - I\\|_2 = \\mathcal{O}\\left(\\epsilon_{\\text{mach}} \\cdot \\kappa(A)\\right)$$",
      proof:
        "1. In CGS, the inner products $\\rho_j = \\hat{q}_j^T a_k$ are evaluated using the raw vector $a_k$. In floating point arithmetic, let $\\hat{v}_k = a_k - \\sum_{j=1}^{k-1} \\rho_j \\hat{q}_j + \\delta_k$, where $\\delta_k$ represents roundoff perturbations of order $\\epsilon_{\\text{mach}} \\|a_k\\|$.\n2. When columns of $A$ are nearly linearly dependent (large $\\kappa(A)$), $\\|\\hat{v}_k\\| \\ll \\|a_k\\|$. The normalized vector is $\\hat{q}_k = \\hat{v}_k / \\|\\hat{v}_k\\|$.\n3. The relative perturbation in $\\hat{q}_k$ is $\\frac{\\delta_k}{\\|\\hat{v}_k\\|} = \\frac{\\mathcal{O}(\\epsilon_{\\text{mach}} \\|a_k\\|)}{\\|\\hat{v}_k\\|} \\approx \\mathcal{O}(\\epsilon_{\\text{mach}} \\kappa(A))$. When this vector is subsequently used in inner products with other nearly dependent vectors, the error squares, yielding $\\mathcal{O}(\\epsilon_{\\text{mach}} \\kappa(A)^2)$. If $\\kappa(A) > 1/\\sqrt{\\epsilon_{\\text{mach}}}$, CGS completely loses orthogonality ($\\hat{Q}^T \\hat{Q} \\not\\approx I$).\n4. In MGS, each projection step computes $\\hat{v}_k^{(j+1)} = \\hat{v}_k^{(j)} - (\\hat{q}_j^T \\hat{v}_k^{(j)})\\hat{q}_j$. Any roundoff error from step $j$ that has a component along $\\hat{q}_j$ is explicitly projected out by the subsequent step $j+1$ because projection is applied to the already diminished intermediate vector $\\hat{v}_k^{(j)}$ rather than the full-magnitude $a_k$.\n5. Applying Björck's backward error analysis (1967), the computed $\\hat{Q}$ satisfies $(A + \\Delta A) = \\hat{Q} \\hat{R}$ with $\\|\\Delta A\\| \\le c \\epsilon_{\\text{mach}} \\|A\\|$, resulting in a linear loss of orthogonality $\\|\\hat{Q}^T \\hat{Q} - I\\|_2 \\le c' \\epsilon_{\\text{mach}} \\kappa(A)$, proving superior numerical stability.",
    },
  ],
};
