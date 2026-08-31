import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_vector_spaces_gram_schmidt_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: Vector Spaces Systems Suite",
  subtitle:
    "Question Bank Suite: Ill-Conditioned Bases, ScaLAPACK Communication, and Catastrophic Cancellation",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_vector_spaces_gram_schmidt",
      title: "Vector Spaces, Orthogonalization & Numerical Systems Suite",
      partA_dsaCoding: [
        {
          title: "Arnoldi Iteration for Krylov Subspace Generation",
          difficulty: "Hard",
          description:
            "Implement the Arnoldi iteration algorithm using Modified Gram-Schmidt to construct an orthonormal basis for the Krylov subspace K_m(A, b) = span(b, Ab, A^2 b, ..., A^{m-1} b) and output the upper Hessenberg matrix H.",
          problemStatement:
            'def arnoldi_iteration(A: np.ndarray, b: np.ndarray, m: int) -> tuple[np.ndarray, np.ndarray]:\n    """Return orthonormal basis Q (n x m+1) and upper Hessenberg H (m+1 x m)."""\n    pass',
        },
      ],
      partB_mathProofs: [
        {
          title: "Proof of Householder Reflector Determinant and Orthogonality",
          statement:
            "Prove that for any unit vector v with ||v||_2 = 1, the Householder matrix H = I - 2 v v^T is symmetric, orthogonal (H^T H = I), and has determinant det(H) = -1.",
          proofOutline:
            "Symmetry follows from (v v^T)^T = v v^T. Orthogonality: H^T H = (I - 2 v v^T)(I - 2 v v^T) = I - 4 v v^T + 4 v (v^T v) v^T = I - 4 v v^T + 4 v v^T = I. Determinant: v is an eigenvector with eigenvalue -1; any vector orthogonal to v has eigenvalue +1 (multiplicity n-1). Product of eigenvalues is (-1) * 1^{n-1} = -1.",
          engineeringContext:
            "Householder matrices represent geometric hyperplane reflections, preserving Euclidean lengths exactly with zero numerical distortion.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Distributed ScaLAPACK Block QR Factorization Communication",
          prompt:
            "Why is column-by-column Modified Gram-Schmidt completely unsuited for multi-node distributed GPU training clusters compared to Tall-Skinny QR (TSQR)?",
          engineeringContext:
            "MGS requires an AllReduce collective communication after every single column orthogonalization (O(n) latency synchronization barriers). In contrast, TSQR performs local QR decompositions in parallel per GPU node, followed by a binary tree reduction of R factors, reducing inter-node communication latency from O(n) roundtrips to O(log P) steps.",
        },
      ],
      partD_stressTests: [
        {
          title: "Catastrophic Cancellation on Hilbert & Vandermonde Feature Matrices",
          scenario:
            "A model engineer fits a high-degree polynomial regression model using the raw normal equations (X^T X)^{-1} X^T y on a Hilbert matrix H_{ij} = 1/(i+j-1). The solver returns weight values differing by 10^8 between FP32 and FP64.",
          failureMode:
            "The condition number of an 8x8 Hilbert matrix is kappa(H) ~ 1.5 * 10^10. Forming X^T X squares the condition number to 2.25 * 10^20, exceeding the 53-bit mantissa precision of FP64 and completely destroying all significant digits. Switching to QR decomposition solves min ||Ax-b||_2 without squaring kappa.",
        },
      ],
    },
  ],
};

export const page3 = page_03_systems_scenarios;
