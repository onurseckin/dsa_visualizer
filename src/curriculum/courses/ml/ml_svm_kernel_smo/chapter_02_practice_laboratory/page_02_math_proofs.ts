import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_svm_kernel_smo_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Mercer RBF Kernel & Maximum Margin Equivalence",
  subtitle: "Positive Semi-Definiteness and Mercer RKHS Inner Product Theorems",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "Positive Definiteness of the Gaussian RBF Kernel (Mercer's Condition)",
      theorem:
        "The Gaussian Radial Basis Function (RBF) kernel $K(x, z) = \\exp(-\\gamma \\|x - z\\|_2^2)$ (for $\\gamma > 0$) is a strictly positive definite Mercer kernel, corresponding to an inner product $\\langle \\phi(x), \\phi(z) \\rangle$ in an infinite-dimensional Hilbert space.",
      proof:
        "1. Expand the squared Euclidean distance in the exponent:\n   $$\\|x - z\\|_2^2 = \\|x\\|^2 + \\|z\\|^2 - 2 x^T z$$\n2. Substitute into the RBF definition:\n   $$K(x, z) = \\exp(-\\gamma \\|x\\|^2) \\exp(-\\gamma \\|z\\|^2) \\exp(2\\gamma x^T z)$$\n3. Expand the exponential of the dot product $\\exp(2\\gamma x^T z)$ using its Maclaurin Taylor series:\n   $$\\exp(2\\gamma x^T z) = \\sum_{n=0}^\\infty \\frac{(2\\gamma)^n}{n!} (x^T z)^n$$\n4. Note that for any $n \\ge 0$, the polynomial kernel $(x^T z)^n$ is a valid positive semi-definite kernel (representing all $n$-th order monomial feature combinations $\\phi_n(x)^T \\phi_n(z)$).\n5. Since the product of positive constants $\\frac{(2\\gamma)^n}{n!} > 0$ and valid kernels is a valid kernel, and the infinite sum of PSD kernels converges to a PSD kernel:\n   $$\\sum_{n=0}^\\infty \\frac{(2\\gamma)^n}{n!} (x^T z)^n = \\langle \\Phi(x), \\Phi(z) \\rangle$$\n6. Multiplying by positive scaling functions $g(x) = \\exp(-\\gamma \\|x\\|^2)$ and $g(z) = \\exp(-\\gamma \\|z\\|^2)$ scales feature mapping $\\phi(x) = g(x) \\Phi(x)$ without altering positive definiteness.\n7. Therefore, for any non-zero coefficient vector $c \\in \\mathbb{R}^N$ and distinct points $\\{x_1, \\dots, x_N\\}$:\n   $$\\sum_{i=1}^N \\sum_{j=1}^N c_i c_j K(x_i, x_j) = \\left\\| \\sum_{i=1}^N c_i \\phi(x_i) \\right\\|^2 > 0$$\n8. This proves that the Gaussian RBF kernel satisfies Mercer's theorem and spans an infinite-dimensional RKHS.",
    },
    {
      type: "math_proof",
      title: "Derivation of the Margin Width 2 / ||w||",
      theorem:
        "Let the two bounding support hyperplanes be defined by $w^T x + b = +1$ and $w^T x + b = -1$. The geometric Euclidean distance (margin) between the two bounding hyperplanes is precisely $\\gamma = \\frac{2}{\\|w\\|_2}$.",
      proof:
        "1. Let $x_+$ lie on the positive bounding plane: $w^T x_+ + b = 1$.\n2. Let $x_-$ lie on the negative bounding plane: $w^T x_- + b = -1$.\n3. The normal vector perpendicular to both hyperplanes is the unit vector $\\hat{w} = \\frac{w}{\\|w\\|_2}$.\n4. The geometric margin $\\gamma$ is the orthogonal projection of vector $(x_+ - x_-)$ onto the unit normal vector $\\hat{w}$:\n   $$\\gamma = \\hat{w}^T (x_+ - x_-) = \\frac{w^T (x_+ - x_-)}{\\|w\\|_2} = \\frac{w^T x_+ - w^T x_-}{\\|w\\|_2}$$\n5. From the hyperplane equations: $w^T x_+ = 1 - b$ and $w^T x_- = -1 - b$.\n6. Substitute these into the margin formula:\n   $$\\gamma = \\frac{(1 - b) - (-1 - b)}{\\|w\\|_2} = \\frac{1 - b + 1 + b}{\\|w\\|_2} = \\frac{2}{\\|w\\|_2}$$\n7. Maximizing the geometric margin $\\frac{2}{\\|w\\|}$ is equivalent to minimizing $\\frac{1}{2} \\|w\\|_2^2$, forming the quadratic objective of the SVM primal problem.",
    },
  ],
};
